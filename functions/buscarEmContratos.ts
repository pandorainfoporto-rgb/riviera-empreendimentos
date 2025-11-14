import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { termo_busca, contratos_ids } = await req.json();

    if (!termo_busca || !contratos_ids || !Array.isArray(contratos_ids)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    // Buscar contratos
    const contratos = await base44.asServiceRole.entities.Contrato.filter({
      id: { $in: contratos_ids }
    });

    // Para cada contrato, usar IA para buscar o termo no PDF
    const resultados = [];

    for (const contrato of contratos) {
      if (!contrato.arquivo_pdf_url) continue;

      const prompt = `
Analise este documento de contrato e procure por referências ao seguinte termo: "${termo_busca}".

Retorne:
1. encontrado: boolean (true se o termo foi encontrado)
2. ocorrencias: número de vezes que aparece
3. contextos: array com até 3 trechos relevantes onde o termo aparece (máximo 200 caracteres cada)
4. relevancia: "alta", "media" ou "baixa"
`;

      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          file_urls: [contrato.arquivo_pdf_url],
          response_json_schema: {
            type: "object",
            properties: {
              encontrado: { type: "boolean" },
              ocorrencias: { type: "number" },
              contextos: { 
                type: "array",
                items: { type: "string" }
              },
              relevancia: { type: "string" }
            }
          }
        });

        if (response.encontrado) {
          resultados.push({
            contrato_id: contrato.id,
            numero_contrato: contrato.numero_contrato,
            titulo: contrato.titulo,
            ...response
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar no contrato ${contrato.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      resultados,
      total_encontrados: resultados.length
    });

  } catch (error) {
    console.error('Erro ao buscar em contratos:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});