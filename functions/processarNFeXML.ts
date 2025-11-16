import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const xmlContent = formData.get('xml_content');

    if (!xmlContent) {
      return Response.json({ success: false, message: 'Conteúdo XML não fornecido' }, { status: 400 });
    }

    // Usar IA para extrair dados do XML da NF-e
    const prompt = `Você é um especialista em análise de notas fiscais eletrônicas (NF-e) brasileiras.

Analise o XML abaixo e extraia TODOS os dados importantes em um formato JSON estruturado.

XML DA NF-e:
${xmlContent}

IMPORTANTE:
1. Extraia dados do emitente (fornecedor): CNPJ, razão social, nome fantasia
2. Extraia dados da nota: número, série, chave de acesso, data de emissão
3. Extraia valores: total produtos, frete, seguro, desconto, outras despesas, total nota
4. Extraia TODOS os itens/produtos com: código, descrição, NCM, CFOP, unidade, quantidade, valor unitário, valor total
5. Se houver impostos (ICMS, IPI, PIS, COFINS), extraia também
6. Retorne os valores numéricos como números, não como strings
7. Formate datas no padrão YYYY-MM-DD

Retorne um JSON completo e estruturado.`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          numero_nota: { type: "string" },
          serie: { type: "string" },
          chave_acesso: { type: "string" },
          data_emissao: { type: "string" },
          cnpj_fornecedor: { type: "string" },
          nome_fornecedor: { type: "string" },
          razao_social_fornecedor: { type: "string" },
          valor_produtos: { type: "number" },
          valor_frete: { type: "number" },
          valor_seguro: { type: "number" },
          valor_desconto: { type: "number" },
          valor_outras_despesas: { type: "number" },
          valor_total: { type: "number" },
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                numero_item: { type: "number" },
                codigo_produto: { type: "string" },
                descricao: { type: "string" },
                ncm: { type: "string" },
                cfop: { type: "string" },
                unidade_medida: { type: "string" },
                quantidade: { type: "number" },
                valor_unitario: { type: "number" },
                valor_total: { type: "number" },
              }
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      dados: resultado
    });

  } catch (error) {
    console.error('Erro ao processar XML:', error);
    return Response.json({ 
      success: false,
      message: error.message || 'Erro ao processar XML',
      detalhes: error.stack
    }, { status: 500 });
  }
});