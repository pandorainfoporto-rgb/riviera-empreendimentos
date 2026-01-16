import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    // Verificação do webhook (Meta requer isso)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Buscar canal para verificar token
      const canais = await base44.asServiceRole.entities.CanalAtendimento.list();
      const canalValido = canais.find(c => 
        c.configuracao?.webhook_verify_token === token
      );

      if (mode === 'subscribe' && canalValido) {
        console.log('Webhook verificado com sucesso');
        return new Response(challenge, { status: 200 });
      }
      
      return new Response('Token inválido', { status: 403 });
    }

    // Processar mensagens recebidas
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Webhook recebido:', JSON.stringify(body, null, 2));

      // Estrutura do webhook Meta
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return Response.json({ status: 'no_value' });
      }

      // Identificar tipo de canal pela estrutura
      let tipoCanal = 'whatsapp';
      if (value.messaging) tipoCanal = 'instagram'; // Instagram/Facebook Messenger
      if (value.messages) tipoCanal = 'whatsapp';

      // Buscar canal correspondente
      const canais = await base44.asServiceRole.entities.CanalAtendimento.list();
      const canal = canais.find(c => {
        if (tipoCanal === 'whatsapp') {
          return c.tipo === 'whatsapp' && 
                 c.configuracao?.phone_number_id === value.metadata?.phone_number_id;
        }
        if (tipoCanal === 'instagram') {
          return c.tipo === 'instagram' &&
                 c.configuracao?.instagram_account_id === entry?.id;
        }
        return false;
      });

      if (!canal) {
        console.log('Canal não encontrado para este webhook');
        return Response.json({ status: 'canal_nao_encontrado' });
      }

      // Processar mensagens do WhatsApp
      if (tipoCanal === 'whatsapp' && value.messages) {
        for (const message of value.messages) {
          await processarMensagemWhatsApp(base44, canal, message, value.contacts?.[0]);
        }
      }

      // Processar mensagens do Instagram/Facebook
      if (tipoCanal === 'instagram' && value.messaging) {
        for (const messaging of value.messaging) {
          await processarMensagemInstagram(base44, canal, messaging);
        }
      }

      return Response.json({ status: 'success' });
    }

    return new Response('Método não suportado', { status: 405 });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processarMensagemWhatsApp(base44, canal, message, contact) {
  const contatoIdExterno = message.from;
  const contatoNome = contact?.profile?.name || message.from;
  
  // Buscar ou criar conversa
  let conversas = await base44.asServiceRole.entities.ConversaOmnichannel.filter({
    canal_id: canal.id,
    contato_id_externo: contatoIdExterno,
    status: { $in: ['aguardando', 'em_atendimento', 'atendido_ia'] }
  });

  let conversa = conversas[0];

  if (!conversa) {
    // Verificar se é cliente existente
    const clientes = await base44.asServiceRole.entities.Cliente.filter({
      telefone: { $regex: contatoIdExterno.replace(/\D/g, '') }
    });

    const tipoContato = clientes.length > 0 ? 'cliente' : 'novo';
    const clienteId = clientes[0]?.id;

    conversa = await base44.asServiceRole.entities.ConversaOmnichannel.create({
      canal_id: canal.id,
      contato_nome: contatoNome,
      contato_telefone: contatoIdExterno,
      contato_id_externo: contatoIdExterno,
      cliente_id: clienteId,
      tipo_contato: tipoContato,
      status: 'aguardando',
      data_ultimo_contato: new Date().toISOString(),
      lida: false,
    });

    // Enviar mensagem de boas-vindas
    if (canal.mensagem_boas_vindas) {
      await base44.asServiceRole.entities.MensagemOmnichannel.create({
        conversa_id: conversa.id,
        remetente_tipo: 'sistema',
        remetente_id: 'sistema',
        remetente_nome: 'Sistema',
        conteudo: canal.mensagem_boas_vindas,
        tipo_conteudo: 'texto',
        status_entrega: 'enviada',
        data_hora: new Date().toISOString(),
      });
    }
  }

  // Salvar mensagem recebida
  const conteudo = message.text?.body || message.caption || '[Mídia]';
  
  await base44.asServiceRole.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'contato',
    remetente_id: contatoIdExterno,
    remetente_nome: contatoNome,
    conteudo,
    tipo_conteudo: message.type,
    mensagem_id_externo: message.id,
    status_entrega: 'entregue',
    data_hora: new Date(parseInt(message.timestamp) * 1000).toISOString(),
  });

  // Atualizar conversa
  await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
    data_ultimo_contato: new Date().toISOString(),
    lida: false,
  });

  // Se IA habilitada, processar resposta automática
  if (canal.ia_habilitada) {
    await processarRespostaIA(base44, conversa, conteudo);
  }
}

async function processarMensagemInstagram(base44, canal, messaging) {
  const contatoIdExterno = messaging.sender.id;
  const mensagem = messaging.message;
  
  if (!mensagem) return;

  // Buscar ou criar conversa
  let conversas = await base44.asServiceRole.entities.ConversaOmnichannel.filter({
    canal_id: canal.id,
    contato_id_externo: contatoIdExterno,
    status: { $in: ['aguardando', 'em_atendimento', 'atendido_ia'] }
  });

  let conversa = conversas[0];

  if (!conversa) {
    conversa = await base44.asServiceRole.entities.ConversaOmnichannel.create({
      canal_id: canal.id,
      contato_nome: contatoIdExterno,
      contato_id_externo: contatoIdExterno,
      tipo_contato: 'novo',
      status: 'aguardando',
      data_ultimo_contato: new Date().toISOString(),
      lida: false,
    });

    if (canal.mensagem_boas_vindas) {
      await base44.asServiceRole.entities.MensagemOmnichannel.create({
        conversa_id: conversa.id,
        remetente_tipo: 'sistema',
        remetente_id: 'sistema',
        remetente_nome: 'Sistema',
        conteudo: canal.mensagem_boas_vindas,
        tipo_conteudo: 'texto',
        status_entrega: 'enviada',
        data_hora: new Date().toISOString(),
      });
    }
  }

  // Salvar mensagem
  const conteudo = mensagem.text || '[Mídia]';
  
  await base44.asServiceRole.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'contato',
    remetente_id: contatoIdExterno,
    remetente_nome: contatoIdExterno,
    conteudo,
    tipo_conteudo: mensagem.text ? 'texto' : 'imagem',
    mensagem_id_externo: mensagem.mid,
    status_entrega: 'entregue',
    data_hora: new Date(messaging.timestamp).toISOString(),
  });

  await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
    data_ultimo_contato: new Date().toISOString(),
    lida: false,
  });

  if (canal.ia_habilitada) {
    await processarRespostaIA(base44, conversa, conteudo);
  }
}

async function processarRespostaIA(base44, conversa, mensagemUsuario) {
  try {
    // Buscar dados do cliente/lead se existir
    let contextoCliente = '';
    if (conversa.cliente_id) {
      const cliente = await base44.asServiceRole.entities.Cliente.get(conversa.cliente_id);
      contextoCliente = `
DADOS DO CLIENTE:
- Nome: ${cliente.nome}
- Telefone: ${cliente.telefone}
- Email: ${cliente.email || 'Não informado'}
- Cliente desde: ${new Date(cliente.created_date).toLocaleDateString()}
`;
      
      // Buscar negociações do cliente
      const negociacoes = await base44.asServiceRole.entities.Negociacao.filter({ cliente_id: cliente.id });
      if (negociacoes.length > 0) {
        contextoCliente += `\nNegociações: ${negociacoes.length} negociação(ões) em andamento\n`;
      }
    } else if (conversa.lead_id) {
      const lead = await base44.asServiceRole.entities.LeadPreVenda.get(conversa.lead_id);
      contextoCliente = `
DADOS DO LEAD:
- Nome: ${lead.nome}
- Status: ${lead.status}
- Interesse: ${lead.interesse || 'Não especificado'}
- Origem: ${lead.origem}
`;
    }

    // Buscar base de conhecimento do sistema
    const baseConhecimento = `
Você é um assistente virtual da Riviera Incorporadora.

INFORMAÇÕES DA EMPRESA:
- Somos uma incorporadora especializada em loteamentos residenciais
- Oferecemos terrenos prontos para construir
- Temos equipe própria de construção
- Fazemos projetos personalizados
- Financiamento próprio facilitado

PRODUTOS:
- Loteamentos com infraestrutura completa
- Terrenos de diversos tamanhos
- Construção de casas personalizadas
- Projetos arquitetônicos inclusos

DIFERENCIAIS:
- Localização privilegiada
- Infraestrutura completa (água, luz, asfalto)
- Financiamento próprio sem burocracia
- Acompanhamento de obra em tempo real
- Portal do cliente para acompanhamento

COMO RESPONDER:
- Seja cordial e profissional
- Responda de forma clara e objetiva
- Se não souber algo, indique que um atendente humano vai ajudar
- Para visitas e valores específicos, sempre sugira conversar com um consultor
- Identifique a intenção: comprar, tirar dúvidas, agendar visita, etc
`;

    // Buscar histórico da conversa
    const mensagens = await base44.asServiceRole.entities.MensagemOmnichannel.filter({
      conversa_id: conversa.id
    }, 'data_hora', 10);

    const historico = mensagens.map(m => 
      `${m.remetente_tipo === 'contato' ? 'Cliente' : 'Atendente'}: ${m.conteudo}`
    ).join('\n');

    // Chamar IA para gerar resposta
    const prompt = `${baseConhecimento}

${contextoCliente}

HISTÓRICO DA CONVERSA:
${historico}

ÚLTIMA MENSAGEM DO CLIENTE:
${mensagemUsuario}

INSTRUÇÕES:
1. Analise a intenção do cliente
2. Use os dados do cliente/lead para personalizar a resposta se disponível
3. Se o cliente demonstrar interesse em visita, ofereça agendar e colete dados (nome, data preferida, horário)
4. Se a pergunta requer informações específicas (valores, disponibilidade), sugira falar com consultor
5. Seja empático e útil
6. Se identificar oportunidade de negócio, colete informações relevantes

Responda em JSON:
{
  "resposta": "sua resposta aqui",
  "intencao": "comprar|duvida|visita|reclamacao|outros",
  "sentimento": "positivo|neutro|negativo",
  "urgencia": "baixa|media|alta",
  "requer_humano": true|false,
  "interesse_produto": "loteamento|construcao|financiamento|outros",
  "quer_agendar_visita": true|false,
  "dados_coletados": {
    "nome_completo": "string ou null",
    "data_visita_preferida": "string ou null",
    "horario_visita": "string ou null",
    "interesse_especifico": "string ou null"
  }
}`;

    const respostaIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          resposta: { type: "string" },
          intencao: { type: "string" },
          sentimento: { type: "string" },
          urgencia: { type: "string" },
          requer_humano: { type: "boolean" },
          interesse_produto: { type: "string" }
        }
      }
    });

    // Salvar mensagem da IA
    await base44.asServiceRole.entities.MensagemOmnichannel.create({
      conversa_id: conversa.id,
      remetente_tipo: 'ia',
      remetente_id: 'ia',
      remetente_nome: 'Assistente Virtual',
      conteudo: respostaIA.resposta,
      tipo_conteudo: 'texto',
      status_entrega: 'enviada',
      resposta_automatica: true,
      contexto_ia: respostaIA,
      data_hora: new Date().toISOString(),
    });

    // Atualizar análise da conversa
    await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
      status: respostaIA.requer_humano ? 'aguardando' : 'atendido_ia',
      atendido_por_ia: true,
      requer_humano: respostaIA.requer_humano,
      analise_ia: {
        intencao: respostaIA.intencao,
        sentimento: respostaIA.sentimento,
        urgencia: respostaIA.urgencia,
        interesse_produto: respostaIA.interesse_produto,
        resumo: `Cliente demonstra interesse em ${respostaIA.interesse_produto}. Intenção: ${respostaIA.intencao}.`
      }
    });

    // Se identificou como lead, criar no CRM
    if (conversa.tipo_contato === 'novo' && respostaIA.intencao === 'comprar') {
      const lead = await base44.asServiceRole.entities.LeadPreVenda.create({
        nome: conversa.contato_nome,
        telefone: conversa.contato_telefone,
        email: conversa.contato_email,
        origem: 'omnichannel',
        interesse: respostaIA.interesse_produto,
        status: 'novo',
        observacoes: `Lead gerado automaticamente via omnichannel. ${respostaIA.resumo || ''}`,
      });

      await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
        lead_id: lead.id,
        tipo_contato: 'lead',
      });
    }

    // Se quer agendar visita e coletou dados
    if (respostaIA.quer_agendar_visita && respostaIA.dados_coletados) {
      const dados = respostaIA.dados_coletados;
      
      // Criar tarefa de follow-up
      if (dados.data_visita_preferida) {
        await base44.asServiceRole.entities.TarefaFollowUp.create({
          lead_id: conversa.lead_id || null,
          cliente_id: conversa.cliente_id || null,
          tipo: 'visita',
          titulo: `Visita agendada - ${conversa.contato_nome}`,
          descricao: `Visita solicitada via omnichannel.\nData: ${dados.data_visita_preferida}\nHorário: ${dados.horario_visita || 'A definir'}\nInteresse: ${dados.interesse_especifico || respostaIA.interesse_produto}`,
          data_vencimento: dados.data_visita_preferida,
          status: 'pendente',
          prioridade: 'alta',
        });
      }
    }

    // Executar automações
    const automacoes = await base44.asServiceRole.entities.AutomacaoFluxo.filter({ ativo: true });
    for (const automacao of automacoes) {
      if (automacao.gatilho === 'mensagem_recebida' || 
          (automacao.gatilho === 'novo_lead' && conversa.tipo_contato === 'lead')) {
        await executarAutomacao(base44, automacao, conversa, respostaIA);
      }
    }

  } catch (error) {
    console.error('Erro ao processar IA:', error);
  }
}