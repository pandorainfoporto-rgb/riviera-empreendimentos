import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modulo, funcionalidade } = await req.json();

    if (!modulo || !funcionalidade) {
      return Response.json({ error: 'Módulo e funcionalidade são obrigatórios' }, { status: 400 });
    }

    // Gerar script de tutorial com IA
    const prompt = `
Você é uma instrutora experiente do Sistema Riviera, um ERP para incorporadoras imobiliárias.

Crie um tutorial em vídeo detalhado sobre: "${funcionalidade}" no módulo "${modulo}".

O tutorial deve ter:
1. **Narração em voz feminina profissional** (escreva como se estivesse falando)
2. **Legendas descritivas** de cada ação
3. **Passo a passo claro e objetivo**
4. **Tempo estimado para cada etapa**

Formato de resposta JSON:
{
  "titulo": "título do tutorial",
  "duracao_estimada": "tempo em minutos",
  "introducao": {
    "narracao": "texto da narração introdutória",
    "legenda": "legenda curta da intro"
  },
  "passos": [
    {
      "numero": 1,
      "titulo": "Nome do passo",
      "tempo": "tempo em segundos",
      "narracao": "texto completo da narração feminina explicando o que fazer",
      "legenda": "legenda curta da ação (ex: 'Clique em Novo Loteamento')",
      "acao": "descrição técnica da ação no sistema",
      "dica": "dica opcional para o usuário"
    }
  ],
  "conclusao": {
    "narracao": "texto da narração de conclusão",
    "legenda": "legenda da conclusão"
  }
}

Use linguagem clara, didática e amigável. A narração deve soar natural, como se uma pessoa estivesse explicando pessoalmente.

Exemplos de narração:
- "Olá! Neste tutorial vamos aprender como..."
- "Primeiro, vamos clicar no menu lateral esquerdo..."
- "Perfeito! Agora que já cadastramos..."
- "E pronto! Você acabou de..."

Crie um tutorial completo e detalhado.
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          duracao_estimada: { type: "string" },
          introducao: {
            type: "object",
            properties: {
              narracao: { type: "string" },
              legenda: { type: "string" }
            }
          },
          passos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                numero: { type: "number" },
                titulo: { type: "string" },
                tempo: { type: "string" },
                narracao: { type: "string" },
                legenda: { type: "string" },
                acao: { type: "string" },
                dica: { type: "string" }
              }
            }
          },
          conclusao: {
            type: "object",
            properties: {
              narracao: { type: "string" },
              legenda: { type: "string" }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      tutorial: resultado,
      modulo,
      funcionalidade,
      data_geracao: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar tutorial:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});