import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'URL do arquivo é obrigatória' }, { status: 400 });
    }

    // Usar IA para extrair dados do contrato
    const prompt = `
Analise este documento de contrato e extraia as seguintes informações em formato JSON:

1. numero_contrato: número do contrato
2. tipo: tipo do contrato (compra_venda, locacao, prestacao_servicos, fornecimento, parceria, empreitada, consorcio, outros)
3. partes_envolvidas: array com nome, tipo (contratante/contratado), cpf_cnpj de cada parte
4. valor_total: valor total do contrato em número
5. data_assinatura: data de assinatura (formato YYYY-MM-DD)
6. data_inicio_vigencia: data de início da vigência (formato YYYY-MM-DD)
7. data_fim_vigencia: data de fim da vigência (formato YYYY-MM-DD)
8. prazo_meses: prazo em meses (número)
9. clausulas_principais: array com as 5 cláusulas mais importantes (titulo, descricao, numero)
10. forma_pagamento: forma de pagamento acordada
11. objeto_contrato: descrição do objeto do contrato

Retorne apenas o JSON válido, sem explicações adicionais.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          numero_contrato: { type: "string" },
          tipo: { type: "string" },
          partes_envolvidas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                tipo: { type: "string" },
                cpf_cnpj: { type: "string" }
              }
            }
          },
          valor_total: { type: "number" },
          data_assinatura: { type: "string" },
          data_inicio_vigencia: { type: "string" },
          data_fim_vigencia: { type: "string" },
          prazo_meses: { type: "number" },
          clausulas_principais: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                descricao: { type: "string" },
                numero: { type: "string" }
              }
            }
          },
          forma_pagamento: { type: "string" },
          objeto_contrato: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      dados_extraidos: response
    });

  } catch (error) {
    console.error('Erro ao extrair dados do contrato:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});