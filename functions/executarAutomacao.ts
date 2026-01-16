import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { automacao_id, conversa_id } = await req.json();

    const automacao = await base44.entities.AutomacaoFluxo.get(automacao_id);
    const conversa = await base44.entities.ConversaOmnichannel.get(conversa_id);

    await executarAutomacao(base44, automacao, conversa);

    return Response.json({ success: true });

  } catch (error) {
    console.error('Erro ao executar automação:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executarAutomacao(base44, automacao, conversa, contexto = {}) {
  try {
    console.log(`Executando automação: ${automacao.nome}`);

    // Ordenar ações
    const acoes = (automacao.acoes || []).sort((a, b) => a.ordem - b.ordem);

    for (const acao of acoes) {
      // Aguardar delay se configurado
      if (acao.delay_segundos > 0) {
        await new Promise(resolve => setTimeout(resolve, acao.delay_segundos * 1000));
      }

      try {
        switch (acao.tipo) {
          case 'enviar_mensagem':
            await base44.asServiceRole.entities.MensagemOmnichannel.create({
              conversa_id: conversa.id,
              remetente_tipo: 'sistema',
              remetente_id: 'automacao',
              remetente_nome: 'Sistema',
              conteudo: acao.configuracao.mensagem || 'Mensagem automática',
              tipo_conteudo: 'texto',
              status_entrega: 'enviada',
              resposta_automatica: true,
              data_hora: new Date().toISOString(),
            });
            break;

          case 'criar_tarefa':
            await base44.asServiceRole.entities.TarefaFollowUp.create({
              lead_id: conversa.lead_id,
              cliente_id: conversa.cliente_id,
              tipo: 'follow_up',
              titulo: acao.configuracao.titulo || 'Tarefa automática',
              descricao: acao.configuracao.descricao || `Criada automaticamente pela automação: ${automacao.nome}`,
              status: 'pendente',
              prioridade: acao.configuracao.prioridade || 'normal',
              data_vencimento: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
            });
            break;

          case 'atualizar_lead':
            if (conversa.lead_id) {
              await base44.asServiceRole.entities.LeadPreVenda.update(conversa.lead_id, {
                status: acao.configuracao.novo_status || 'em_atendimento',
              });
            }
            break;

          case 'notificar_atendente':
            // Criar notificação para atendentes
            const usuarios = await base44.asServiceRole.entities.User.list();
            const admins = usuarios.filter(u => u.role === 'admin');
            
            for (const admin of admins) {
              await base44.asServiceRole.entities.Notificacao.create({
                user_id: admin.id,
                tipo: 'omnichannel',
                titulo: acao.configuracao.titulo || 'Nova conversa omnichannel',
                mensagem: acao.configuracao.mensagem || `Nova conversa de ${conversa.contato_nome}`,
                lida: false,
                data_hora: new Date().toISOString(),
              });
            }
            break;

          case 'enviar_email':
            if (conversa.contato_email) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: conversa.contato_email,
                subject: acao.configuracao.assunto || 'Riviera Incorporadora',
                body: acao.configuracao.corpo || 'Email automático',
              });
            }
            break;

          case 'adicionar_tag':
            const tagsAtuais = conversa.tags || [];
            const novaTag = acao.configuracao.tag;
            if (novaTag && !tagsAtuais.includes(novaTag)) {
              await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
                tags: [...tagsAtuais, novaTag]
              });
            }
            break;

          case 'criar_lead':
            if (conversa.tipo_contato === 'novo' && !conversa.lead_id) {
              const lead = await base44.asServiceRole.entities.LeadPreVenda.create({
                nome: conversa.contato_nome,
                telefone: conversa.contato_telefone,
                email: conversa.contato_email,
                origem: 'omnichannel_automacao',
                interesse: acao.configuracao.interesse || 'geral',
                status: 'novo',
                observacoes: `Lead criado automaticamente pela automação: ${automacao.nome}`,
              });

              await base44.asServiceRole.entities.ConversaOmnichannel.update(conversa.id, {
                lead_id: lead.id,
                tipo_contato: 'lead',
              });
            }
            break;
        }

        console.log(`Ação executada: ${acao.tipo}`);

      } catch (errorAcao) {
        console.error(`Erro ao executar ação ${acao.tipo}:`, errorAcao);
        
        // Atualizar estatísticas de erro
        await base44.asServiceRole.entities.AutomacaoFluxo.update(automacao.id, {
          estatisticas: {
            ...automacao.estatisticas,
            total_execucoes: (automacao.estatisticas?.total_execucoes || 0) + 1,
            total_erro: (automacao.estatisticas?.total_erro || 0) + 1,
            ultima_execucao: new Date().toISOString(),
          }
        });
        
        throw errorAcao;
      }
    }

    // Atualizar estatísticas de sucesso
    await base44.asServiceRole.entities.AutomacaoFluxo.update(automacao.id, {
      estatisticas: {
        ...automacao.estatisticas,
        total_execucoes: (automacao.estatisticas?.total_execucoes || 0) + 1,
        total_sucesso: (automacao.estatisticas?.total_sucesso || 0) + 1,
        ultima_execucao: new Date().toISOString(),
      }
    });

    console.log(`Automação ${automacao.nome} executada com sucesso`);

  } catch (error) {
    console.error('Erro ao executar automação:', error);
    throw error;
  }
}