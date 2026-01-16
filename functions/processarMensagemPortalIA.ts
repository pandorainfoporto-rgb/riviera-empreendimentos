import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { tipo, mensagem_id } = await req.json();

    if (tipo === 'cliente') {
      await processarMensagemCliente(base44, mensagem_id);
    } else if (tipo === 'imobiliaria') {
      await processarMensagemImobiliaria(base44, mensagem_id);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processarMensagemCliente(base44, mensagemId) {
  const mensagem = await base44.asServiceRole.entities.Mensagem.get(mensagemId);
  const cliente = await base44.asServiceRole.entities.Cliente.get(mensagem.cliente_id);

  // Buscar histórico de mensagens
  const historico = await base44.asServiceRole.entities.Mensagem.filter({
    cliente_id: cliente.id
  }, '-created_date', 10);

  // Buscar contexto do cliente
  const negociacoes = await base44.asServiceRole.entities.Negociacao.filter({ cliente_id: cliente.id });
  const unidades = await base44.asServiceRole.entities.Unidade.filter({ cliente_id: cliente.id });
  const pagamentos = await base44.asServiceRole.entities.PagamentoCliente.filter({ 
    cliente_id: cliente.id,
    status: { $in: ['pendente', 'atrasado'] }
  });

  const contextoCliente = `
DADOS DO CLIENTE:
- Nome: ${cliente.nome}
- Telefone: ${cliente.telefone}
- Email: ${cliente.email || 'Não informado'}
- Cliente desde: ${new Date(cliente.created_date).toLocaleDateString()}
- Negociações: ${negociacoes.length}
- Unidades: ${unidades.length}
- Pagamentos Pendentes: ${pagamentos.length}

UNIDADES:
${unidades.map(u => `- ${u.nome || u.tipo}: ${u.status}`).join('\n')}

PAGAMENTOS PENDENTES:
${pagamentos.map(p => `- R$ ${p.valor.toFixed(2)} - Vencimento: ${p.data_vencimento}`).join('\n')}
`;

  const baseConhecimento = `
Você é o assistente virtual da Riviera Incorporadora atendendo um CLIENTE EXISTENTE via Portal do Cliente.

CONTEXTO DO CLIENTE:
${contextoCliente}

TIPOS DE SOLICITAÇÃO COMUNS:
- Dúvidas sobre pagamentos
- Consulta de cronograma de obra
- Solicitação de documentos
- Agendamento de visita
- Segunda via de boleto
- Alteração de dados cadastrais

HISTÓRICO DA CONVERSA:
${historico.map(h => `${h.remetente_tipo === 'cliente' ? 'Cliente' : 'Atendente'}: ${h.mensagem}`).join('\n')}

ÚLTIMA MENSAGEM DO CLIENTE:
${mensagem.mensagem}

INSTRUÇÕES:
1. Use o contexto do cliente para personalizar a resposta
2. Se o cliente perguntar sobre pagamentos, liste os pagamentos pendentes
3. Se solicitar segunda via de boleto, informe que irá gerar
4. Para alterações cadastrais, colete os dados necessários
5. Se não puder resolver, indique que um atendente irá ajudar
6. Seja empático e profissional

Responda em JSON:
{
  "resposta": "sua resposta ao cliente",
  "acao_necessaria": "gerar_boleto|agendar_visita|transferir_humano|nenhuma",
  "urgencia": "baixa|media|alta",
  "assunto": "pagamento|obra|documento|cadastro|outro",
  "requer_humano": true|false
}`;

  const respostaIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: baseConhecimento,
    response_json_schema: {
      type: "object",
      properties: {
        resposta: { type: "string" },
        acao_necessaria: { type: "string" },
        urgencia: { type: "string" },
        assunto: { type: "string" },
        requer_humano: { type: "boolean" }
      }
    }
  });

  // Enviar resposta
  await base44.asServiceRole.entities.Mensagem.create({
    cliente_id: cliente.id,
    remetente_tipo: 'sistema',
    mensagem: respostaIA.resposta,
    assunto: respostaIA.assunto,
    lida: false,
  });

  // Marcar mensagem original como lida
  await base44.asServiceRole.entities.Mensagem.update(mensagemId, { lida: true });

  // Executar ações específicas
  if (respostaIA.acao_necessaria === 'gerar_boleto' && pagamentos.length > 0) {
    // Criar tarefa para gerar boleto
    await base44.asServiceRole.entities.TarefaFollowUp.create({
      cliente_id: cliente.id,
      tipo: 'follow_up',
      titulo: `Gerar segunda via de boleto - ${cliente.nome}`,
      descricao: `Cliente solicitou segunda via via Portal. Pagamentos pendentes: ${pagamentos.length}`,
      status: 'pendente',
      prioridade: 'alta',
      data_vencimento: new Date().toISOString().split('T')[0],
    });
  }

  if (respostaIA.requer_humano) {
    // Criar notificação
    const usuarios = await base44.asServiceRole.entities.User.list();
    const admins = usuarios.filter(u => u.role === 'admin');
    
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notificacao.create({
        user_id: admin.id,
        tipo: 'cliente',
        titulo: `Cliente ${cliente.nome} precisa de atendimento`,
        mensagem: `Assunto: ${respostaIA.assunto}. Urgência: ${respostaIA.urgencia}`,
        lida: false,
        data_hora: new Date().toISOString(),
      });
    }
  }
}

async function processarMensagemImobiliaria(base44, mensagemId) {
  const mensagem = await base44.asServiceRole.entities.MensagemImobiliaria.get(mensagemId);
  const imobiliaria = await base44.asServiceRole.entities.Imobiliaria.get(mensagem.imobiliaria_id);

  // Buscar histórico
  const historico = await base44.asServiceRole.entities.MensagemImobiliaria.filter({
    imobiliaria_id: imobiliaria.id
  }, '-created_date', 10);

  // Buscar leads da imobiliária
  const leads = await base44.asServiceRole.entities.LeadPreVenda.filter({ 
    imobiliaria_id: imobiliaria.id,
    status: { $in: ['novo', 'em_atendimento'] }
  });

  const contextoImobiliaria = `
DADOS DA IMOBILIÁRIA:
- Nome: ${imobiliaria.nome_fantasia}
- CNPJ: ${imobiliaria.cnpj}
- Email: ${imobiliaria.email}
- Leads Ativos: ${leads.length}
- Comissão: ${imobiliaria.percentual_comissao || 0}%
`;

  const baseConhecimento = `
Você é o assistente virtual da Riviera Incorporadora atendendo uma IMOBILIÁRIA PARCEIRA via Portal.

CONTEXTO DA IMOBILIÁRIA:
${contextoImobiliaria}

TIPOS DE SOLICITAÇÃO COMUNS:
- Consulta de lotes disponíveis
- Informações sobre comissões
- Status de leads enviados
- Materiais de divulgação
- Agendamento de visitas em grupo
- Valores e condições de pagamento

HISTÓRICO DA CONVERSA:
${historico.map(h => `${h.remetente_tipo === 'imobiliaria' ? 'Imobiliária' : 'Atendente'}: ${h.mensagem}`).join('\n')}

ÚLTIMA MENSAGEM:
${mensagem.mensagem}

INSTRUÇÕES:
1. Trate como parceiro comercial
2. Forneça informações sobre disponibilidade de lotes
3. Explique condições de comissão
4. Se solicitar material, indique que será enviado
5. Para visitas em grupo, colete informações
6. Seja profissional e focado em negócios

Responda em JSON:
{
  "resposta": "sua resposta",
  "tipo_solicitacao": "disponibilidade|comissao|material|visita|outro",
  "urgencia": "baixa|media|alta",
  "requer_humano": true|false,
  "oportunidade_vendas": true|false
}`;

  const respostaIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: baseConhecimento,
    response_json_schema: {
      type: "object",
      properties: {
        resposta: { type: "string" },
        tipo_solicitacao: { type: "string" },
        urgencia: { type: "string" },
        requer_humano: { type: "boolean" },
        oportunidade_vendas: { type: "boolean" }
      }
    }
  });

  // Enviar resposta
  await base44.asServiceRole.entities.MensagemImobiliaria.create({
    imobiliaria_id: imobiliaria.id,
    remetente_tipo: 'sistema',
    mensagem: respostaIA.resposta,
    assunto: respostaIA.tipo_solicitacao,
    lida: false,
  });

  // Marcar mensagem original como lida
  await base44.asServiceRole.entities.MensagemImobiliaria.update(mensagemId, { lida: true });

  // Se for oportunidade de vendas, criar tarefa
  if (respostaIA.oportunidade_vendas) {
    await base44.asServiceRole.entities.TarefaFollowUp.create({
      tipo: 'follow_up',
      titulo: `Oportunidade de vendas - ${imobiliaria.nome_fantasia}`,
      descricao: `Imobiliária demonstrou interesse via Portal.\nTipo: ${respostaIA.tipo_solicitacao}\nUrgência: ${respostaIA.urgencia}`,
      status: 'pendente',
      prioridade: respostaIA.urgencia === 'alta' ? 'alta' : 'normal',
      data_vencimento: new Date().toISOString().split('T')[0],
    });
  }

  if (respostaIA.requer_humano) {
    const usuarios = await base44.asServiceRole.entities.User.list();
    const admins = usuarios.filter(u => u.role === 'admin');
    
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notificacao.create({
        user_id: admin.id,
        tipo: 'imobiliaria',
        titulo: `Imobiliária ${imobiliaria.nome_fantasia} precisa de atendimento`,
        mensagem: `Solicitação: ${respostaIA.tipo_solicitacao}. Urgência: ${respostaIA.urgencia}`,
        lida: false,
        data_hora: new Date().toISOString(),
      });
    }
  }
}