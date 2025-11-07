import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Analisa uma mensagem recebida e sugere templates relevantes usando IA
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mensagem_id, conteudo_mensagem } = await req.json();

    if (!mensagem_id || !conteudo_mensagem) {
      return Response.json({ 
        error: 'mensagem_id e conteudo_mensagem são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar todos os templates ativos
    const templates = await base44.entities.RespostaTemplate.filter({ ativo: true });

    // Criar prompt para IA analisar
    const prompt = `
Você é um assistente especializado em atendimento ao cliente.

MENSAGEM RECEBIDA DO CLIENTE:
"${conteudo_mensagem}"

TEMPLATES DISPONÍVEIS:
${templates.map((t, idx) => `
${idx + 1}. ${t.nome} (${t.categoria})
   Código: ${t.codigo}
   Conteúdo: ${t.conteudo.substring(0, 200)}...
`).join('\n')}

TAREFA:
1. Analise o sentimento da mensagem (positivo, neutro, negativo)
2. Identifique a categoria principal (duvida, reclamacao, elogio, solicitacao, informacao, urgente, outros)
3. Sugira até 3 templates mais relevantes para responder esta mensagem
4. Identifique palavras-chave/tags relevantes
5. Determine se é urgente

Retorne um JSON com:
{
  "sentimento": "positivo|neutro|negativo",
  "categoria": "categoria identificada",
  "eh_urgente": true/false,
  "tags_sugeridas": ["tag1", "tag2", "tag3"],
  "templates_sugeridos": [
    {
      "template_id": "id do template",
      "nome": "nome do template",
      "relevancia_score": 0-100,
      "motivo": "por que este template é relevante"
    }
  ],
  "resumo_analise": "breve resumo do que o cliente está perguntando/solicitando"
}
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          sentimento: { type: "string" },
          categoria: { type: "string" },
          eh_urgente: { type: "boolean" },
          tags_sugeridas: { type: "array", items: { type: "string" } },
          templates_sugeridos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                template_id: { type: "string" },
                nome: { type: "string" },
                relevancia_score: { type: "number" },
                motivo: { type: "string" }
              }
            }
          },
          resumo_analise: { type: "string" }
        }
      }
    });

    // Atualizar mensagem com análise
    const mensagens = await base44.entities.Mensagem.filter({ id: mensagem_id });
    if (mensagens && mensagens.length > 0) {
      const mensagem = mensagens[0];
      
      await base44.entities.Mensagem.update(mensagem_id, {
        sentimento: resultado.sentimento,
        categoria: resultado.categoria,
        tags: resultado.tags_sugeridas,
        template_sugerido_id: resultado.templates_sugeridos[0]?.template_id || null,
        prioridade: resultado.eh_urgente ? 'urgente' : mensagem.prioridade
      });
    }

    return Response.json({
      sucesso: true,
      analise: resultado,
      mensagem_atualizada: true
    });

  } catch (error) {
    console.error('Erro ao analisar mensagem:', error);
    return Response.json({ 
      error: error.message || 'Erro ao analisar mensagem'
    }, { status: 500 });
  }
});