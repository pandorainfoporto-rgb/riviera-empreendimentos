import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { mensagem, conversa_id } = await req.json();

    // Buscar conversa e histórico
    const conversa = await base44.entities.ConversaOmnichannel.get(conversa_id);
    const mensagens = await base44.entities.MensagemOmnichannel.filter({
      conversa_id: conversa_id
    }, '-created_date', 10);

    // Buscar respostas rápidas e funções disponíveis
    const respostasRapidas = await base44.entities.RespostaRapidaChat.filter({ ativo: true });
    const funcoes = await base44.entities.FuncaoChat.filter({ ativo: true });

    // Criar contexto para IA
    const historicoTexto = mensagens
      .slice(-5)
      .map(m => `${m.remetente_tipo}: ${m.conteudo}`)
      .join('\n');

    const respostasDisponiveis = respostasRapidas
      .map(r => `${r.atalho}: ${r.titulo} - ${r.mensagem.substring(0, 50)}...`)
      .join('\n');

    const funcoesDisponiveis = funcoes
      .map(f => `#${f.atalho}: ${f.titulo} - ${f.descricao}`)
      .join('\n');

    // Analisar com IA
    const prompt = `Você é um assistente de análise de atendimento ao cliente.

MENSAGEM RECEBIDA: "${mensagem}"

HISTÓRICO RECENTE:
${historicoTexto}

RESPOSTAS RÁPIDAS DISPONÍVEIS:
${respostasDisponiveis}

FUNÇÕES DISPONÍVEIS:
${funcoesDisponiveis}

Analise a mensagem e forneça:
1. Urgência (baixa, media, alta, urgente)
2. Sentimento do cliente (positivo, neutro, negativo)
3. Intenção principal (duvida, reclamacao, pagamento, agendamento, outros)
4. Sugestão de resposta rápida (atalho) ou função (#atalho) mais adequada
5. Prioridade de atendimento (1-5)
6. Resumo da necessidade do cliente (1 frase)

Retorne apenas JSON válido.`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          urgencia: { type: "string" },
          sentimento: { type: "string" },
          intencao: { type: "string" },
          sugestao_resposta: { type: "string" },
          prioridade: { type: "number" },
          resumo: { type: "string" },
          tags_sugeridas: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Atualizar conversa com análise
    await base44.entities.ConversaOmnichannel.update(conversa_id, {
      analise_ia: {
        ...conversa.analise_ia,
        ultima_analise: resultado,
        urgencia: resultado.urgencia,
        sentimento: resultado.sentimento,
        intencao: resultado.intencao,
      },
      prioridade: resultado.urgencia === 'urgente' ? 'urgente' : 
                   resultado.urgencia === 'alta' ? 'alta' : 'normal',
    });

    return Response.json({
      sucesso: true,
      analise: resultado,
      sugestao: resultado.sugestao_resposta,
    });

  } catch (error) {
    console.error('Erro ao analisar mensagem:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});