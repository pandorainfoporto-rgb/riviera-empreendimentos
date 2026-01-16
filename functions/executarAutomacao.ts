import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { automacao_id, contexto } = await req.json();

    const automacao = await base44.asServiceRole.entities.AutomacaoFluxo.get(automacao_id);
    
    if (!automacao.ativo) {
      return Response.json({ success: false, message: 'Automação inativa' });
    }

    // Se usa IA para decisão, analisar histórico primeiro
    let analiseIA = null;
    if (automacao.usar_ia_decisao && contexto.cliente_id) {
      analiseIA = await analisarHistoricoIA(base44, contexto, automacao.prompt_ia);
    }

    // Executar ações
    const resultados = await executarAcoes(base44, automacao.acoes, contexto, analiseIA);

    // Atualizar estatísticas
    await base44.asServiceRole.entities.AutomacaoFluxo.update(automacao_id, {
      estatisticas: {
        ...automacao.estatisticas,
        total_execucoes: (automacao.estatisticas?.total_execucoes || 0) + 1,
        total_sucesso: (automacao.estatisticas?.total_sucesso || 0) + 1,
        ultima_execucao: new Date().toISOString(),
      }
    });

    return Response.json({ 
      success: true, 
      resultados,
      analise_ia: analiseIA 
    });

  } catch (error) {
    console.error('Erro ao executar automação:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function analisarHistoricoIA(base44, contexto, promptCustomizado) {
  const clienteId = contexto.cliente_id || contexto.lead_id;
  
  // Buscar histórico completo do cliente
  const [mensagens, negociacoes, pagamentos, tarefas, conversas] = await Promise.all([
    base44.asServiceRole.entities.Mensagem.filter({ cliente_id: clienteId }, '-created_date', 50),
    base44.asServiceRole.entities.Negociacao.filter({ cliente_id: clienteId }),
    base44.asServiceRole.entities.PagamentoCliente.filter({ cliente_id: clienteId }),
    base44.asServiceRole.entities.TarefaFollowUp.filter({ cliente_id: clienteId }),
    base44.asServiceRole.entities.ConversaOmnichannel.filter({ cliente_id: clienteId }),
  ]);

  const historicoCompleto = `
HISTÓRICO COMPLETO DO CLIENTE:

MENSAGENS (${mensagens.length} total):
${mensagens.map(m => 
  `[${new Date(m.created_date).toLocaleDateString()}] ${m.remetente_tipo}: ${m.mensagem}`
).join('\n')}

NEGOCIAÇÕES (${negociacoes.length}):
${negociacoes.map(n => 
  `Status: ${n.status}, Valor: R$ ${n.valor_total}, Data: ${n.data_inicio}`
).join('\n')}

PAGAMENTOS:
- Total: ${pagamentos.length}
- Pendentes: ${pagamentos.filter(p => p.status === 'pendente').length}
- Atrasados: ${pagamentos.filter(p => p.status === 'atrasado').length}
- Pagos: ${pagamentos.filter(p => p.status === 'pago').length}

TAREFAS CRIADAS: ${tarefas.length}

CONVERSAS OMNICHANNEL: ${conversas.length}
- Finalizadas: ${conversas.filter(c => c.status === 'finalizado').length}
- Atendido por IA: ${conversas.filter(c => c.atendido_por_ia).length}
`;

  const promptBase = promptCustomizado || `
Você é um analista de comportamento de clientes da Riviera Incorporadora.
Analise o histórico completo de interações deste cliente e responda:

1. Nível de engajamento (baixo/médio/alto)
2. Intenção de compra (baixa/média/alta)
3. Perfil comportamental (interessado, indeciso, não interessado, apenas pesquisando)
4. Principais objeções ou dúvidas demonstradas
5. Melhor momento para contato (manhã, tarde, noite)
6. Canal preferido de comunicação
7. Recomendação de ação (aguardar, enviar follow-up, oferecer desconto, agendar visita, encerrar)
8. Urgência do atendimento (baixa/média/alta)
`;

  const prompt = `${promptBase}\n\n${historicoCompleto}`;

  const analise = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        nivel_engajamento: { type: "string" },
        intencao_compra: { type: "string" },
        perfil_comportamental: { type: "string" },
        objecoes: { type: "array", items: { type: "string" } },
        melhor_momento: { type: "string" },
        canal_preferido: { type: "string" },
        recomendacao_acao: { type: "string" },
        urgencia: { type: "string" },
        motivo_recomendacao: { type: "string" }
      }
    }
  });

  return analise;
}

async function executarAcoes(base44, acoes, contexto, analiseIA) {
  const resultados = [];
  
  // Ordenar por ordem
  const acoesOrdenadas = [...acoes].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  for (const acao of acoesOrdenadas) {
    // Verificar se deve executar baseado na análise da IA
    if (analiseIA) {
      const deveExecutar = avaliarCondicaoComIA(acao, analiseIA);
      if (!deveExecutar) {
        resultados.push({ acao: acao.tipo, executado: false, motivo: 'Condição IA não atendida' });
        continue;
      }
    }

    // Delay se configurado
    if (acao.delay_segundos) {
      await new Promise(resolve => setTimeout(resolve, acao.delay_segundos * 1000));
    }

    try {
      let resultado;

      switch (acao.tipo) {
        case 'enviar_mensagem':
          resultado = await enviarMensagem(base44, acao, contexto);
          break;
        
        case 'enviar_sms':
          resultado = await enviarSMS(base44, acao, contexto);
          break;
        
        case 'enviar_email':
          resultado = await enviarEmail(base44, acao, contexto);
          break;
        
        case 'criar_tarefa':
          resultado = await criarTarefa(base44, acao, contexto);
          break;
        
        case 'atualizar_lead':
          resultado = await atualizarLead(base44, acao, contexto);
          break;
        
        case 'notificar_atendente':
          resultado = await notificarAtendente(base44, acao, contexto);
          break;
        
        case 'adicionar_tag':
          resultado = await adicionarTag(base44, acao, contexto);
          break;
        
        case 'condicional':
          resultado = await executarCondicional(base44, acao, contexto, analiseIA);
          break;
        
        default:
          resultado = { executado: false, motivo: 'Tipo de ação não suportado' };
      }

      resultados.push({ acao: acao.tipo, ...resultado });
    } catch (error) {
      resultados.push({ acao: acao.tipo, executado: false, erro: error.message });
    }
  }

  return resultados;
}

function avaliarCondicaoComIA(acao, analiseIA) {
  // Se não tem condição, sempre executa
  if (!acao.condicao) return true;

  const { campo, operador, valor } = acao.condicao;
  const valorIA = analiseIA[campo];

  switch (operador) {
    case 'igual':
      return valorIA === valor;
    case 'diferente':
      return valorIA !== valor;
    case 'contem':
      return valorIA?.includes(valor);
    case 'maior':
      return parseFloat(valorIA) > parseFloat(valor);
    case 'menor':
      return parseFloat(valorIA) < parseFloat(valor);
    case 'existe':
      return !!valorIA;
    default:
      return true;
  }
}

async function enviarMensagem(base44, acao, contexto) {
  const mensagem = acao.configuracao?.mensagem || '';
  
  if (contexto.conversa_id) {
    await base44.asServiceRole.entities.MensagemOmnichannel.create({
      conversa_id: contexto.conversa_id,
      remetente_tipo: 'sistema',
      conteudo: mensagem,
      tipo_conteudo: 'texto',
      data_hora: new Date().toISOString(),
    });
  } else if (contexto.cliente_id) {
    await base44.asServiceRole.entities.Mensagem.create({
      cliente_id: contexto.cliente_id,
      remetente_tipo: 'sistema',
      mensagem,
      assunto: 'Automação',
      lida: false,
    });
  }

  return { executado: true };
}

async function enviarSMS(base44, acao, contexto) {
  const telefone = contexto.telefone || contexto.contato_telefone;
  const mensagem = acao.configuracao?.mensagem || '';

  if (!telefone) {
    return { executado: false, motivo: 'Telefone não encontrado' };
  }

  // Aqui você integraria com um provedor de SMS (Twilio, etc)
  // Por enquanto, apenas registramos
  console.log(`SMS enviado para ${telefone}: ${mensagem}`);

  // Criar registro de comunicação
  if (contexto.cliente_id) {
    await base44.asServiceRole.entities.Mensagem.create({
      cliente_id: contexto.cliente_id,
      remetente_tipo: 'sistema',
      mensagem: `[SMS] ${mensagem}`,
      assunto: 'SMS Automático',
      lida: false,
    });
  }

  return { executado: true, telefone };
}

async function enviarEmail(base44, acao, contexto) {
  const email = contexto.email || contexto.contato_email;
  const assunto = acao.configuracao?.assunto || 'Mensagem da Riviera';
  const corpo = acao.configuracao?.mensagem || '';

  if (!email) {
    return { executado: false, motivo: 'Email não encontrado' };
  }

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    subject: assunto,
    body: corpo,
  });

  return { executado: true, email };
}

async function criarTarefa(base44, acao, contexto) {
  const tarefa = await base44.asServiceRole.entities.TarefaFollowUp.create({
    cliente_id: contexto.cliente_id,
    tipo: 'follow_up',
    titulo: acao.configuracao?.titulo || 'Tarefa automática',
    descricao: acao.configuracao?.descricao || '',
    status: 'pendente',
    prioridade: acao.configuracao?.prioridade || 'normal',
    data_vencimento: new Date().toISOString().split('T')[0],
  });

  return { executado: true, tarefa_id: tarefa.id };
}

async function atualizarLead(base44, acao, contexto) {
  if (!contexto.lead_id) {
    return { executado: false, motivo: 'Lead ID não encontrado' };
  }

  await base44.asServiceRole.entities.LeadPreVenda.update(contexto.lead_id, 
    acao.configuracao?.dados || {}
  );

  return { executado: true };
}

async function notificarAtendente(base44, acao, contexto) {
  const usuarios = await base44.asServiceRole.entities.User.list();
  const admins = usuarios.filter(u => u.role === 'admin');

  for (const admin of admins) {
    await base44.asServiceRole.entities.Notificacao.create({
      user_id: admin.id,
      tipo: 'automacao',
      titulo: acao.configuracao?.titulo || 'Notificação Automática',
      mensagem: acao.configuracao?.mensagem || '',
      lida: false,
      data_hora: new Date().toISOString(),
    });
  }

  return { executado: true, notificados: admins.length };
}

async function adicionarTag(base44, acao, contexto) {
  if (contexto.conversa_id) {
    const conversa = await base44.asServiceRole.entities.ConversaOmnichannel.get(contexto.conversa_id);
    const tagsAtuais = conversa.tags || [];
    const novaTag = acao.configuracao?.tag;

    if (!tagsAtuais.includes(novaTag)) {
      await base44.asServiceRole.entities.ConversaOmnichannel.update(contexto.conversa_id, {
        tags: [...tagsAtuais, novaTag]
      });
    }
  }

  return { executado: true };
}

async function executarCondicional(base44, acao, contexto, analiseIA) {
  const condicaoAtendida = avaliarCondicaoComIA(acao, analiseIA);
  
  const acoesParaExecutar = condicaoAtendida 
    ? acao.acoes_se_verdadeiro 
    : acao.acoes_se_falso;

  if (!acoesParaExecutar || acoesParaExecutar.length === 0) {
    return { executado: true, condicao_atendida: condicaoAtendida, sem_acoes: true };
  }

  // Executar ações da ramificação
  const resultados = [];
  for (const acaoId of acoesParaExecutar) {
    // Buscar a ação pela ID e executar
    // (implementação simplificada)
    resultados.push({ acao_id: acaoId });
  }

  return { 
    executado: true, 
    condicao_atendida: condicaoAtendida,
    acoes_executadas: resultados.length 
  };
}