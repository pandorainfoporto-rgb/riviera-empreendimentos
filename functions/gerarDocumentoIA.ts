import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      template_id,
      cliente_id,
      unidade_id,
      loteamento_id,
      negociacao_id,
      fornecedor_id,
      locacao_id,
      dados_adicionais
    } = await req.json();

    if (!template_id) {
      return Response.json({ success: false, message: 'template_id é obrigatório' }, { status: 400 });
    }

    // Buscar template
    const template = await base44.entities.DocumentoTemplate.filter({ id: template_id });
    if (!template || template.length === 0) {
      return Response.json({ success: false, message: 'Template não encontrado' }, { status: 404 });
    }
    const templateData = template[0];

    // Buscar dados relacionados
    const dadosDocumento = {
      cliente: null,
      unidade: null,
      loteamento: null,
      negociacao: null,
      fornecedor: null,
      locacao: null
    };

    if (cliente_id) {
      const clientes = await base44.entities.Cliente.filter({ id: cliente_id });
      dadosDocumento.cliente = clientes[0] || null;
    }

    if (unidade_id) {
      const unidades = await base44.entities.Unidade.filter({ id: unidade_id });
      dadosDocumento.unidade = unidades[0] || null;
    }

    if (loteamento_id) {
      const loteamentos = await base44.entities.Loteamento.filter({ id: loteamento_id });
      dadosDocumento.loteamento = loteamentos[0] || null;
    }

    if (negociacao_id) {
      const negociacoes = await base44.entities.Negociacao.filter({ id: negociacao_id });
      dadosDocumento.negociacao = negociacoes[0] || null;
    }

    if (fornecedor_id) {
      const fornecedores = await base44.entities.Fornecedor.filter({ id: fornecedor_id });
      dadosDocumento.fornecedor = fornecedores[0] || null;
    }

    if (locacao_id) {
      const locacoes = await base44.entities.Locacao.filter({ id: locacao_id });
      dadosDocumento.locacao = locacoes[0] || null;
    }

    // Construir prompt para a IA
    const prompt = `
Você é um assistente especializado em gerar documentos jurídicos e comerciais imobiliários.

TIPO DE DOCUMENTO: ${templateData.tipo}
CATEGORIA: ${templateData.categoria}

TEMPLATE BASE:
${templateData.conteudo_template}

INSTRUÇÕES ESPECÍFICAS:
${templateData.instrucoes_ia || 'Gerar documento profissional e completo seguindo as melhores práticas jurídicas.'}

DADOS PARA PREENCHER O DOCUMENTO:

${dadosDocumento.cliente ? `
CLIENTE:
- Nome: ${dadosDocumento.cliente.nome}
- CPF/CNPJ: ${dadosDocumento.cliente.cpf_cnpj}
- Telefone: ${dadosDocumento.cliente.telefone || 'Não informado'}
- Email: ${dadosDocumento.cliente.email || 'Não informado'}
- Endereço: ${dadosDocumento.cliente.logradouro || ''} ${dadosDocumento.cliente.numero || ''}, ${dadosDocumento.cliente.bairro || ''}, ${dadosDocumento.cliente.cidade || ''}-${dadosDocumento.cliente.estado || ''}
- CEP: ${dadosDocumento.cliente.cep || 'Não informado'}
` : ''}

${dadosDocumento.unidade ? `
UNIDADE/IMÓVEL:
- Código: ${dadosDocumento.unidade.codigo}
- Tipo: ${dadosDocumento.unidade.tipo}
- Área Total: ${dadosDocumento.unidade.area_total} m²
- Área Construída: ${dadosDocumento.unidade.area_construida || 'N/A'} m²
- Quartos: ${dadosDocumento.unidade.quartos || 'N/A'}
- Banheiros: ${dadosDocumento.unidade.banheiros || 'N/A'}
- Vagas de Garagem: ${dadosDocumento.unidade.vagas_garagem || 'N/A'}
- Endereço: ${dadosDocumento.unidade.endereco || 'A definir'}
- Matrícula: ${dadosDocumento.unidade.matricula || 'A definir'}
- Valor de Venda: R$ ${(dadosDocumento.unidade.valor_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}

${dadosDocumento.loteamento ? `
LOTEAMENTO:
- Nome: ${dadosDocumento.loteamento.nome}
- Localização: ${dadosDocumento.loteamento.endereco || ''}, ${dadosDocumento.loteamento.cidade || ''}-${dadosDocumento.loteamento.estado || ''}
- Área Total: ${dadosDocumento.loteamento.area_total || 'N/A'} m²
- Registro: ${dadosDocumento.loteamento.numero_registro || 'A definir'}
` : ''}

${dadosDocumento.negociacao ? `
NEGOCIAÇÃO:
- Valor Total: R$ ${(dadosDocumento.negociacao.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Entrada: R$ ${(dadosDocumento.negociacao.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Parcelas Mensais: ${dadosDocumento.negociacao.quantidade_parcelas_mensais || 0}x de R$ ${(dadosDocumento.negociacao.valor_parcela_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Data de Início: ${dadosDocumento.negociacao.data_inicio || 'A definir'}
- Dia de Vencimento: ${dadosDocumento.negociacao.dia_vencimento || 10}
- Índice de Reajuste: ${dadosDocumento.negociacao.tabela_correcao || 'Não aplicável'}
` : ''}

${dadosDocumento.locacao ? `
LOCAÇÃO:
- Valor Aluguel: R$ ${(dadosDocumento.locacao.valor_aluguel || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Valor Condomínio: R$ ${(dadosDocumento.locacao.valor_condominio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Prazo: ${dadosDocumento.locacao.prazo_meses || 0} meses
- Data Início: ${dadosDocumento.locacao.data_inicio || 'A definir'}
- Garantia: ${dadosDocumento.locacao.garantia_tipo || 'Não especificada'}
- Dia Vencimento: ${dadosDocumento.locacao.dia_vencimento || 10}
` : ''}

${dados_adicionais ? `
DADOS ADICIONAIS:
${JSON.stringify(dados_adicionais, null, 2)}
` : ''}

TAREFA:
1. Gere um documento COMPLETO e PROFISSIONAL do tipo "${templateData.tipo}"
2. Use TODOS os dados fornecidos acima para preencher o documento
3. Inclua TODAS as cláusulas necessárias conforme o tipo de documento
4. Use linguagem jurídica apropriada e formal
5. Estruture o documento de forma clara com títulos, seções e numeração
6. Inclua campos para assinaturas ao final
7. Inclua data e local no início do documento
8. Se houver cláusulas padrão no template, incorpore-as
9. Retorne APENAS o conteúdo do documento em HTML formatado

IMPORTANTE: O documento deve estar 100% pronto para uso, sem placeholders ou campos em branco.
Data do documento: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
Local: ${dadosDocumento.loteamento?.cidade || dadosDocumento.unidade?.endereco?.split(',')[1]?.trim() || 'São Paulo'}, ${dadosDocumento.loteamento?.estado || 'SP'}
`;

    // Chamar IA para gerar documento
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    const conteudoGerado = resultado;

    // Gerar número do documento
    const timestamp = Date.now();
    const numeroDocumento = `DOC-${templateData.tipo.toUpperCase().substring(0, 3)}-${timestamp}`;

    // Criar documento gerado
    const documentoGerado = await base44.asServiceRole.entities.DocumentoGerado.create({
      template_id: template_id,
      numero_documento: numeroDocumento,
      tipo: templateData.tipo,
      titulo: `${templateData.nome} - ${dadosDocumento.cliente?.nome || dadosDocumento.fornecedor?.nome || 'Documento'}`,
      cliente_id: cliente_id || null,
      unidade_id: unidade_id || null,
      loteamento_id: loteamento_id || null,
      negociacao_id: negociacao_id || null,
      fornecedor_id: fornecedor_id || null,
      locacao_id: locacao_id || null,
      conteudo_original_ia: conteudoGerado,
      conteudo_atual: conteudoGerado,
      dados_utilizados: {
        cliente: dadosDocumento.cliente,
        unidade: dadosDocumento.unidade,
        loteamento: dadosDocumento.loteamento,
        negociacao: dadosDocumento.negociacao,
        locacao: dadosDocumento.locacao,
        outros: dados_adicionais
      },
      versao_documento: 1,
      status: 'rascunho',
      data_geracao: new Date().toISOString()
    });

    // Atualizar contador de usos do template
    await base44.asServiceRole.entities.DocumentoTemplate.update(template_id, {
      total_usos: (templateData.total_usos || 0) + 1
    });

    return Response.json({
      success: true,
      documento_id: documentoGerado.id,
      numero_documento: numeroDocumento,
      conteudo: conteudoGerado
    });

  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    return Response.json({ 
      success: false,
      message: error.message || 'Erro ao gerar documento',
      detalhes: error.stack
    }, { status: 500 });
  }
});