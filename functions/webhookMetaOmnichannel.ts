import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

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

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Webhook recebido:', JSON.stringify(body, null, 2));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return Response.json({ status: 'no_value' });
      }

      let tipoCanal = 'whatsapp';
      if (value.messaging) tipoCanal = 'instagram';
      if (value.messages) tipoCanal = 'whatsapp';

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

      if (tipoCanal === 'whatsapp' && value.messages) {
        for (const message of value.messages) {
          await processarMensagemWhatsApp(base44, canal, message, value.contacts?.[0]);
        }
      }

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
  
  let conversas = await base44.asServiceRole.entities.ConversaOmnichannel.filter({
    canal_id: canal.id,
    contato_id_externo: contatoIdExterno,
    status: { $in: ['aguardando', 'em_atendimento', 'atendido_ia'] }
  });

  let conversa = conversas[0];

  if (!conversa) {
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

  await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
    data_ultimo_contato: new Date().toISOString(),
    lida: false,
  });

  if (canal.ia_habilitada) {
    await processarRespostaIA(base44, conversa, conteudo);
  }
}

async function processarMensagemInstagram(base44, canal, messaging) {
  const contatoIdExterno = messaging.sender.id;
  const mensagem = messaging.message;
  
  if (!mensagem) return;

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
    // 1. BUSCAR DADOS COMPLETOS DO CRM
    const dadosCRM = await buscarDadosCompletoCRM(base44, conversa);
    
    // 2. BUSCAR HISTÓRICO COMPLETO DE TODAS CONVERSAS
    const historicoCompleto = await buscarHistoricoCompleto(base44, conversa);
    
    // 3. BUSCAR LOTEAMENTOS E PRODUTOS DISPONÍVEIS
    const produtosDisponiveis = await buscarProdutosDisponiveis(base44);

    const mensagensConversa = await base44.asServiceRole.entities.MensagemOmnichannel.filter({
      conversa_id: conversa.id
    }, 'data_hora', 20);

    const historicoConversa = mensagensConversa.map(m => 
      `${m.remetente_tipo === 'contato' ? 'Cliente' : 'Assistente'}: ${m.conteudo}`
    ).join('\n');

    const prompt = `
Você é o assistente virtual INTELIGENTE da Riviera Incorporadora.

CONTEXTO COMPLETO DO CLIENTE:
${dadosCRM}

HISTÓRICO DE TODAS AS INTERAÇÕES:
${historicoCompleto}

PRODUTOS DISPONÍVEIS:
${produtosDisponiveis}

CONVERSA ATUAL:
${historicoConversa}

ÚLTIMA MENSAGEM:
${mensagemUsuario}

ANÁLISE AVANÇADA DE INTENÇÃO:
Analise profundamente a mensagem, o histórico e o contexto do cliente para identificar:

1. INTENÇÃO PRIMÁRIA:
   - pesquisa_inicial: Apenas explorando, fazendo perguntas gerais
   - interesse_qualificado: Demonstra interesse real, faz perguntas específicas
   - pronto_comprar: Quer valores, condições, está decidido
   - pos_venda: Já é cliente, tem dúvidas sobre compra/obra
   - suporte: Precisa de ajuda técnica ou documentação
   - reclamacao: Insatisfeito, precisa atenção imediata

2. AÇÕES PROATIVAS A SUGERIR:
   - agendar_visita: Cliente demonstra interesse em conhecer
   - enviar_proposta: Cliente quer valores e condições formais
   - simular_financiamento: Cliente pergunta sobre formas de pagamento
   - transferir_vendedor: Negociação avançada, precisa de especialista
   - criar_lead_crm: Novo contato qualificado, capturar no funil
   - gerar_segunda_via: Cliente precisa de boleto/documento
   - atualizar_cadastro: Cliente quer alterar dados
   - nenhuma: Apenas responder à dúvida

3. PERSONALIZAÇÃO MÁXIMA:
   - Use nome do cliente
   - Mencione negociações ou compras anteriores
   - Considere histórico de pagamentos
   - Seja empático com situações específicas
   - Retome conversas anteriores se relevante

4. COLETA DE INFORMAÇÕES:
   - Nome completo (se ainda não tem)
   - Telefone/Email para contato
   - Interesse específico (tipo de imóvel, localização)
   - Orçamento disponível
   - Prazo desejado
   - Data/horário para visita

Responda em JSON:
{
  "resposta": "resposta completamente personalizada",
  "intencao_identificada": "string",
  "nivel_confianca_intencao": 0-100,
  "acao_proativa_sugerida": "string",
  "urgencia": "baixa|media|alta|urgente",
  "informacoes_coletadas": {
    "nome": "string ou null",
    "telefone": "string ou null", 
    "email": "string ou null",
    "interesse_produto": "string ou null",
    "localizacao_desejada": "string ou null",
    "orcamento": "string ou null",
    "prazo": "string ou null",
    "data_visita": "string ou null",
    "horario_visita": "string ou null"
  },
  "analise_comportamental": {
    "perfil": "impulsivo|analitico|indeciso|urgente",
    "probabilidade_conversao": 0-100,
    "objecoes_identificadas": ["array de strings"],
    "gatilhos_interesse": ["array de strings"]
  },
  "proximos_passos_recomendados": "string detalhada",
  "requer_humano": true|false,
  "motivo_requer_humano": "string",
  "tags_sugeridas": ["array de strings"]
}`;

    const respostaIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          resposta: { type: "string" },
          intencao_identificada: { type: "string" },
          nivel_confianca_intencao: { type: "number" },
          acao_proativa_sugerida: { type: "string" },
          urgencia: { type: "string" },
          informacoes_coletadas: { 
            type: "object",
            properties: {
              nome: { type: "string" },
              telefone: { type: "string" },
              email: { type: "string" },
              interesse_produto: { type: "string" },
              localizacao_desejada: { type: "string" },
              orcamento: { type: "string" },
              prazo: { type: "string" },
              data_visita: { type: "string" },
              horario_visita: { type: "string" }
            }
          },
          analise_comportamental: {
            type: "object",
            properties: {
              perfil: { type: "string" },
              probabilidade_conversao: { type: "number" },
              objecoes_identificadas: { type: "array", items: { type: "string" } },
              gatilhos_interesse: { type: "array", items: { type: "string" } }
            }
          },
          proximos_passos_recomendados: { type: "string" },
          requer_humano: { type: "boolean" },
          motivo_requer_humano: { type: "string" },
          tags_sugeridas: { type: "array", items: { type: "string" } }
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

    // Atualizar conversa com análise detalhada
    const tagsAtuais = conversa.tags || [];
    const novasTags = [...new Set([...tagsAtuais, ...(respostaIA.tags_sugeridas || [])])];

    await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
      status: respostaIA.requer_humano ? 'transferido_humano' : 'atendido_ia',
      atendido_por_ia: true,
      requer_humano: respostaIA.requer_humano,
      prioridade: respostaIA.urgencia === 'urgente' ? 'urgente' : 
                   respostaIA.urgencia === 'alta' ? 'alta' : 'normal',
      tags: novasTags,
      analise_ia: {
        intencao: respostaIA.intencao_identificada,
        urgencia: respostaIA.urgencia,
        interesse_produto: respostaIA.informacoes_coletadas?.interesse_produto,
        resumo: respostaIA.proximos_passos_recomendados,
        perfil_comportamental: respostaIA.analise_comportamental?.perfil,
        probabilidade_conversao: respostaIA.analise_comportamental?.probabilidade_conversao,
        objecoes: respostaIA.analise_comportamental?.objecoes_identificadas,
      }
    });

    // Atualizar dados coletados
    if (respostaIA.informacoes_coletadas) {
      const info = respostaIA.informacoes_coletadas;
      const updates = {};
      
      if (info.nome) updates.contato_nome = info.nome;
      if (info.telefone) updates.contato_telefone = info.telefone;
      if (info.email) updates.contato_email = info.email;
      
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, updates);
      }
    }

    // EXECUTAR AÇÕES PROATIVAS
    await executarAcoesProativas(base44, conversa, respostaIA);

  } catch (error) {
    console.error('Erro ao processar IA:', error);
  }
}

async function buscarDadosCompletoCRM(base44, conversa) {
  let dados = 'NOVO CONTATO - Sem histórico no sistema\n';

  try {
    if (conversa.cliente_id) {
      const cliente = await base44.asServiceRole.entities.Cliente.get(conversa.cliente_id);
      const [negociacoes, pagamentos, unidades, mensagens] = await Promise.all([
        base44.asServiceRole.entities.Negociacao.filter({ cliente_id: cliente.id }),
        base44.asServiceRole.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
        base44.asServiceRole.entities.Unidade.filter({ cliente_id: cliente.id }),
        base44.asServiceRole.entities.Mensagem.filter({ cliente_id: cliente.id }, '-created_date', 10),
      ]);

      const pendentes = pagamentos.filter(p => p.status === 'pendente');
      const atrasados = pagamentos.filter(p => p.status === 'atrasado');

      dados = `
🆔 CLIENTE IDENTIFICADO: ${cliente.nome}
📞 Telefone: ${cliente.telefone}
📧 Email: ${cliente.email || 'Não informado'}
📅 Cliente desde: ${new Date(cliente.created_date).toLocaleDateString()}
🏠 Unidades: ${unidades.length}

💼 NEGOCIAÇÕES (${negociacoes.length}):
${negociacoes.map(n => 
  `- Status: ${n.status} | Valor: R$ ${n.valor_total?.toLocaleString('pt-BR')} | Data: ${new Date(n.data_inicio).toLocaleDateString()}`
).join('\n')}

💰 SITUAÇÃO FINANCEIRA:
- Pagamentos Pendentes: ${pendentes.length} (R$ ${pendentes.reduce((s, p) => s + p.valor, 0).toFixed(2)})
- Pagamentos Atrasados: ${atrasados.length} (R$ ${atrasados.reduce((s, p) => s + p.valor, 0).toFixed(2)})
- Pagos: ${pagamentos.filter(p => p.status === 'pago').length}

📨 HISTÓRICO MENSAGENS PORTAL:
${mensagens.map(m => `[${new Date(m.created_date).toLocaleDateString()}] ${m.assunto}: ${m.mensagem.substring(0, 100)}...`).join('\n')}
`;
    } else if (conversa.lead_id) {
      const lead = await base44.asServiceRole.entities.LeadPreVenda.get(conversa.lead_id);
      const atividades = await base44.asServiceRole.entities.AtividadeLead.filter({ 
        lead_id: lead.id 
      }, '-created_date', 15);

      dados = `
🎯 LEAD IDENTIFICADO: ${lead.nome}
📞 Telefone: ${lead.telefone}
📧 Email: ${lead.email || 'Não informado'}
📍 Origem: ${lead.origem}
📊 Status: ${lead.status}
💡 Interesse: ${lead.interesse || 'Não especificado'}
💵 Orçamento: ${lead.orcamento ? `R$ ${lead.orcamento.toLocaleString('pt-BR')}` : 'Não informado'}

📋 ATIVIDADES RECENTES (${atividades.length}):
${atividades.map(a => 
  `[${new Date(a.created_date).toLocaleDateString()}] ${a.tipo}: ${a.descricao?.substring(0, 80)}...`
).join('\n')}
`;
    }
  } catch (error) {
    console.log('Erro ao buscar CRM:', error);
  }

  return dados;
}

async function buscarHistoricoCompleto(base44, conversa) {
  let historico = '';

  try {
    const conversasAnteriores = await base44.asServiceRole.entities.ConversaOmnichannel.filter({
      contato_id_externo: conversa.contato_id_externo
    }, '-created_date', 10);

    if (conversasAnteriores.length > 1) {
      historico = '\n📜 HISTÓRICO DE CONVERSAS ANTERIORES:\n';
      
      for (const conv of conversasAnteriores) {
        if (conv.id === conversa.id) continue;
        
        const msgs = await base44.asServiceRole.entities.MensagemOmnichannel.filter({
          conversa_id: conv.id
        }, 'data_hora', 15);

        historico += `\n[${new Date(conv.created_date).toLocaleDateString()}] Assunto: ${conv.assunto || 'Geral'}\n`;
        historico += `Status: ${conv.status} | Atendido por IA: ${conv.atendido_por_ia ? 'Sim' : 'Não'}\n`;
        
        if (conv.analise_ia) {
          historico += `Intenção identificada: ${conv.analise_ia.intencao}\n`;
        }
        
        historico += msgs.slice(0, 5).map(m => 
          `  ${m.remetente_tipo === 'contato' ? '👤' : '🤖'} ${m.conteudo.substring(0, 100)}`
        ).join('\n');
        historico += '\n---\n';
      }
    }
  } catch (error) {
    console.log('Erro ao buscar histórico:', error);
  }

  return historico;
}

async function buscarProdutosDisponiveis(base44) {
  try {
    const loteamentos = await base44.asServiceRole.entities.Loteamento.filter({ ativo: true });
    
    return `
🏘️ LOTEAMENTOS DISPONÍVEIS (${loteamentos.length}):
${loteamentos.slice(0, 5).map(l => `
- ${l.nome}
  📍 ${l.cidade}/${l.estado}
  📏 Lotes de ${l.area_minima_lote}m² a ${l.area_maxima_lote}m²
  💰 A partir de R$ ${(l.valor_minimo_lote || 0).toLocaleString('pt-BR')}
  ✅ Disponíveis: ${(l.total_lotes || 0) - (l.lotes_vendidos || 0)} lotes
`).join('\n')}

Use essas informações para responder com precisão sobre disponibilidade e valores.
`;
  } catch (error) {
    return 'Produtos em carregamento...';
  }
}

async function executarAcoesProativas(base44, conversa, respostaIA) {
  try {
    const acao = respostaIA.acao_proativa_sugerida;
    const info = respostaIA.informacoes_coletadas || {};

    // CRIAR LEAD NO CRM
    if (acao === 'criar_lead_crm' && !conversa.lead_id && info.nome) {
      const lead = await base44.asServiceRole.entities.LeadPreVenda.create({
        nome: info.nome,
        telefone: info.telefone || conversa.contato_telefone,
        email: info.email,
        origem: 'omnichannel',
        interesse: info.interesse_produto || 'Não especificado',
        status: 'novo',
        orcamento: info.orcamento,
        observacoes: `Lead criado automaticamente via IA Omnichannel.\nIntenção: ${respostaIA.intencao_identificada}\nPerfil: ${respostaIA.analise_comportamental?.perfil}\nProbabilidade conversão: ${respostaIA.analise_comportamental?.probabilidade_conversao}%`,
      });

      await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
        lead_id: lead.id,
        tipo_contato: 'lead'
      });

      // Registrar atividade
      await base44.asServiceRole.entities.AtividadeLead.create({
        lead_id: lead.id,
        tipo: 'nota',
        descricao: `Lead capturado via IA. ${respostaIA.proximos_passos_recomendados}`,
      });
    }

    // AGENDAR VISITA/DEMONSTRAÇÃO
    if (acao === 'agendar_visita') {
      await base44.asServiceRole.entities.TarefaFollowUp.create({
        cliente_id: conversa.cliente_id,
        lead_id: conversa.lead_id,
        tipo: 'visita',
        titulo: `🏠 Agendar visita - ${conversa.contato_nome}`,
        descricao: `
Visita solicitada via Omnichannel
Data preferida: ${info.data_visita || 'A definir'}
Horário: ${info.horario_visita || 'A definir'}
Interesse: ${info.interesse_produto || 'Geral'}
Localização desejada: ${info.localizacao_desejada || 'Qualquer'}
Orçamento: ${info.orcamento || 'Não informado'}

Perfil: ${respostaIA.analise_comportamental?.perfil}
Probabilidade de conversão: ${respostaIA.analise_comportamental?.probabilidade_conversao}%
        `,
        data_vencimento: info.data_visita || new Date().toISOString().split('T')[0],
        status: 'pendente',
        prioridade: respostaIA.urgencia === 'urgente' ? 'alta' : 'normal',
      });

      notificarEquipe(base44, conversa, respostaIA, 'visita');
    }

    // ENVIAR PROPOSTA PERSONALIZADA
    if (acao === 'enviar_proposta') {
      const proposta = await gerarPropostaPersonalizada(base44, conversa, info);
      
      await base44.asServiceRole.entities.TarefaFollowUp.create({
        cliente_id: conversa.cliente_id,
        lead_id: conversa.lead_id,
        tipo: 'proposta',
        titulo: `📋 Enviar proposta - ${conversa.contato_nome}`,
        descricao: `${proposta}\n\n${respostaIA.proximos_passos_recomendados}`,
        status: 'pendente',
        prioridade: 'alta',
        data_vencimento: new Date().toISOString().split('T')[0],
      });

      notificarEquipe(base44, conversa, respostaIA, 'proposta');
    }

    // SIMULAR FINANCIAMENTO
    if (acao === 'simular_financiamento' && info.orcamento) {
      const simulacao = gerarSimulacaoFinanciamento(info.orcamento);
      
      setTimeout(async () => {
        await base44.asServiceRole.entities.MensagemOmnichannel.create({
          conversa_id: conversa.id,
          remetente_tipo: 'ia',
          remetente_nome: 'Assistente Virtual',
          conteudo: `${simulacao}\n\n✨ Gostaria de agendar uma visita para conhecer as opções disponíveis?`,
          tipo_conteudo: 'texto',
          resposta_automatica: true,
          status_entrega: 'enviada',
          data_hora: new Date().toISOString(),
        });
      }, 3000);
    }

    // Executar automações de fluxo
    const automacoes = await base44.asServiceRole.entities.AutomacaoFluxo.filter({ ativo: true });
    for (const automacao of automacoes) {
      if (deveExecutarAutomacao(automacao, conversa, respostaIA)) {
        await base44.asServiceRole.functions.invoke('executarAutomacao', {
          automacao_id: automacao.id,
          contexto: {
            conversa_id: conversa.id,
            cliente_id: conversa.cliente_id,
            lead_id: conversa.lead_id,
            telefone: conversa.contato_telefone,
            email: conversa.contato_email,
            analise_ia: respostaIA,
          }
        });
      }
    }

  } catch (error) {
    console.error('Erro ao executar ações proativas:', error);
  }
}

function deveExecutarAutomacao(automacao, conversa, analiseIA) {
  const gatilho = automacao.gatilho;
  
  if (gatilho === 'mensagem_recebida') return true;
  if (gatilho === 'novo_lead' && conversa.tipo_contato === 'lead') return true;
  if (gatilho === 'conversa_iniciada' && !conversa.atendido_por_ia) return true;
  
  return false;
}

async function notificarEquipe(base44, conversa, analiseIA, tipoAcao) {
  const usuarios = await base44.asServiceRole.entities.User.list();
  const equipe = usuarios.filter(u => u.role === 'admin');

  const titulos = {
    visita: `🎯 Oportunidade: Visita agendada`,
    proposta: `💼 Oportunidade: Enviar proposta`,
  };

  for (const membro of equipe) {
    await base44.asServiceRole.entities.Notificacao.create({
      user_id: membro.id,
      tipo: 'oportunidade',
      titulo: `${titulos[tipoAcao] || 'Ação necessária'} - ${conversa.contato_nome}`,
      mensagem: `
Intenção: ${analiseIA.intencao_identificada}
Urgência: ${analiseIA.urgencia}
Probabilidade conversão: ${analiseIA.analise_comportamental?.probabilidade_conversao}%
Perfil: ${analiseIA.analise_comportamental?.perfil}

${analiseIA.proximos_passos_recomendados}
      `,
      lida: false,
      data_hora: new Date().toISOString(),
    });
  }
}

async function gerarPropostaPersonalizada(base44, conversa, info) {
  const loteamentos = await base44.asServiceRole.entities.Loteamento.filter({ ativo: true });
  
  const orcamento = info.orcamento ? parseFloat(info.orcamento.replace(/[^\d]/g, '')) : null;
  
  let lotesRecomendados = loteamentos;
  if (orcamento) {
    lotesRecomendados = loteamentos.filter(l => 
      (l.valor_minimo_lote || 0) <= orcamento * 1.2
    );
  }

  return `
📋 PROPOSTA PERSONALIZADA - RIVIERA INCORPORADORA

Cliente: ${conversa.contato_nome}
Interesse: ${info.interesse_produto || 'Loteamento'}
Orçamento: ${info.orcamento || 'A definir'}
Localização desejada: ${info.localizacao_desejada || 'Qualquer'}

🏘️ OPÇÕES SELECIONADAS PARA VOCÊ:
${lotesRecomendados.slice(0, 3).map(l => `
✨ ${l.nome}
📍 ${l.cidade}/${l.estado}
📏 Lotes de ${l.area_minima_lote}m² a ${l.area_maxima_lote}m²
💰 A partir de R$ ${(l.valor_minimo_lote || 0).toLocaleString('pt-BR')}
✅ ${(l.total_lotes || 0) - (l.lotes_vendidos || 0)} lotes disponíveis
`).join('\n')}

💳 CONDIÇÕES DE PAGAMENTO:
• Entrada facilitada (a partir de 20%)
• Financiamento direto em até 120 meses
• Parcelas fixas ou corrigidas
• Sem análise de crédito bancário

🎁 INCLUSO:
• Infraestrutura completa
• Projeto arquitetônico personalizado
• Portal do cliente
• Acompanhamento de obra

📅 PRÓXIMO PASSO: Agende sua visita!
`;
}

function gerarSimulacaoFinanciamento(orcamento) {
  const valor = parseFloat(orcamento.replace(/[^\d]/g, ''));
  
  const opcoes = [
    { entrada: 20, parcelas: 120 },
    { entrada: 30, parcelas: 100 },
    { entrada: 40, parcelas: 80 },
  ];

  let simulacao = '💰 SIMULAÇÕES DE FINANCIAMENTO\n\n';
  simulacao += `Valor do Imóvel: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;

  opcoes.forEach((op, idx) => {
    const entradaValor = valor * (op.entrada / 100);
    const saldo = valor - entradaValor;
    const parcela = saldo / op.parcelas;

    simulacao += `📊 OPÇÃO ${idx + 1}:\n`;
    simulacao += `• Entrada ${op.entrada}%: R$ ${entradaValor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n`;
    simulacao += `• ${op.parcelas}x de R$ ${parcela.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;
  });

  simulacao += `✅ Financiamento direto\n✅ Sem burocracia bancária\n✅ Aprovação em 48h`;

  return simulacao;
}