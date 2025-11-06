import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Processa arquivos de retorno CNAB (240 ou 400)
 * Matching inteligente com fuzzy logic e sugestões de conciliação
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { integracao_id, conta_bancaria_id, caixa_id, arquivo_url } = await req.json();

        if (!integracao_id || !caixa_id || !arquivo_url) {
            return Response.json({ 
                error: 'integracao_id, caixa_id e arquivo_url são obrigatórios' 
            }, { status: 400 });
        }

        console.log('📥 Processando arquivo de retorno CNAB com fuzzy matching...');

        const integracao = await base44.asServiceRole.entities.IntegracaoBancaria.get(integracao_id);
        
        if (!integracao) {
            return Response.json({ error: 'Integração não encontrada' }, { status: 400 });
        }

        const arquivoResponse = await fetch(arquivo_url);
        const conteudoArquivo = await arquivoResponse.text();
        const linhas = conteudoArquivo.split('\n').map(l => l.trim()).filter(l => l);

        console.log(`📄 Arquivo com ${linhas.length} linhas`);

        let layout = 'cnab400';
        if (linhas[0]?.length >= 240) {
            layout = 'cnab240';
        }

        console.log(`📋 Layout detectado: ${layout}`);

        // Buscar todos os boletos pendentes ou com pagamento parcial
        const boletosCandidatos = await base44.asServiceRole.entities.Boleto.filter({
            status: { $in: ['emitido', 'registrado', 'pago_parcial'] },
        });

        console.log(`🔍 ${boletosCandidatos.length} boletos candidatos para matching`);

        const movimentos = [];
        const boletosAtualizados = [];
        let quantidadeConciliados = 0;
        let quantidadePendentes = 0;
        let quantidadeDivergencias = 0;
        let quantidadeSugestoes = 0;

        for (const linha of linhas) {
            if (!linha || linha.length < 100) continue;

            const tipoRegistro = linha[0];

            if (layout === 'cnab400' && tipoRegistro === '1') {
                const nossoNumero = linha.substring(62, 73).trim();
                const codigoOcorrencia = linha.substring(108, 110);
                const valorPago = parseInt(linha.substring(252, 265)) / 100;
                const dataPagamento = linha.substring(110, 116);
                const dataCredito = linha.substring(175, 181);

                console.log(`🔍 Processando: Nosso=${nossoNumero}, Valor=${valorPago}, Ocorrência=${codigoOcorrencia}`);

                // ESTRATÉGIA DE MATCHING MULTI-NÍVEL
                let resultado = await matchBoleto(nossoNumero, valorPago, dataCredito || dataPagamento, boletosCandidatos);

                if (resultado.tipo === 'match_exato') {
                    // Match exato - conciliar automaticamente
                    console.log(`✅ Match exato! Boleto: ${resultado.boleto.id}`);
                    
                    await processarPagamentoBoleto(
                        base44,
                        resultado.boleto,
                        codigoOcorrencia,
                        valorPago,
                        dataCredito || dataPagamento,
                        caixa_id,
                        user
                    );

                    boletosAtualizados.push(resultado.boleto.id);
                    quantidadeConciliados++;

                    movimentos.push({
                        data_movimento: converterDataCNAB(dataCredito || dataPagamento),
                        tipo: 'credito',
                        valor: valorPago,
                        descricao: `Boleto ${nossoNumero} - ${resultado.boleto.sacado_nome}`,
                        nosso_numero: nossoNumero,
                        status_conciliacao: 'conciliado',
                        boleto_id: resultado.boleto.id,
                        score_match: 100,
                        data_conciliacao: new Date().toISOString(),
                    });

                } else if (resultado.tipo === 'match_fuzzy' || resultado.tipo === 'sugestoes') {
                    // Fuzzy match ou múltiplas sugestões - flaggar para revisão manual
                    console.log(`🎯 ${resultado.tipo === 'match_fuzzy' ? 'Fuzzy match' : 'Múltiplas sugestões'} (score: ${resultado.score})`);
                    
                    quantidadeSugestoes++;

                    movimentos.push({
                        data_movimento: converterDataCNAB(dataCredito || dataPagamento),
                        tipo: 'credito',
                        valor: valorPago,
                        descricao: `Boleto ${nossoNumero} - ${resultado.sugestoes?.length || 0} sugestão(ões)`,
                        nosso_numero: nossoNumero,
                        status_conciliacao: 'sugestao_match',
                        score_match: resultado.score,
                        sugestoes_match: resultado.sugestoes,
                    });

                } else {
                    // Sem match - divergência
                    console.warn(`⚠️ Boleto não encontrado: ${nossoNumero}`);
                    quantidadeDivergencias++;

                    movimentos.push({
                        data_movimento: converterDataCNAB(dataCredito || dataPagamento),
                        tipo: 'credito',
                        valor: valorPago,
                        descricao: `Boleto ${nossoNumero} - NÃO ENCONTRADO`,
                        nosso_numero: nossoNumero,
                        status_conciliacao: 'divergente',
                        divergencia_motivo: 'Boleto não encontrado no sistema após fuzzy matching',
                    });
                }
            }
        }

        // Criar registro de conciliação
        const conciliacao = await base44.asServiceRole.entities.ConciliacaoBancaria.create({
            integracao_bancaria_id: integracao_id,
            conta_bancaria_id: conta_bancaria_id || null,
            caixa_id,
            tipo_arquivo: layout === 'cnab240' ? 'retorno_cnab240' : 'retorno_cnab400',
            arquivo_url,
            data_processamento: new Date().toISOString(),
            quantidade_registros: movimentos.length,
            quantidade_conciliados: quantidadeConciliados,
            quantidade_pendentes: quantidadeSugestoes,
            quantidade_divergencias: quantidadeDivergencias,
            movimentos,
            status: quantidadeSugestoes > 0 ? 'aguardando_revisao' : 
                    quantidadeDivergencias > 0 ? 'parcialmente_conciliado' : 'concluido',
        });

        console.log('✅ Arquivo processado com sucesso');
        console.log(`✅ ${quantidadeConciliados} conciliados, ${quantidadeSugestoes} com sugestões, ${quantidadeDivergencias} divergências`);

        return Response.json({
            success: true,
            conciliacao_id: conciliacao.id,
            layout_detectado: layout,
            quantidade_registros: movimentos.length,
            quantidade_conciliados: quantidadeConciliados,
            quantidade_sugestoes: quantidadeSugestoes,
            quantidade_divergencias: quantidadeDivergencias,
            boletos_atualizados: boletosAtualizados.length,
        });

    } catch (error) {
        console.error('❌ Erro ao processar retorno:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// FUZZY MATCHING INTELIGENTE
async function matchBoleto(nossoNumero, valorPago, dataCNAB, boletosCandidatos) {
    // Nível 1: Match exato por nosso número
    const matchExato = boletosCandidatos.find(b => b.nosso_numero === nossoNumero);
    
    if (matchExato) {
        return { tipo: 'match_exato', boleto: matchExato, score: 100 };
    }

    // Nível 2: Fuzzy matching com múltiplos critérios
    const dataMovimento = converterDataCNAB(dataCNAB);
    const toleranciaValor = 0.03; // 3%
    const toleranciaDias = 7; // 7 dias

    const sugestoes = [];

    for (const boleto of boletosCandidatos) {
        let score = 0;
        const diferencas = {
            valor_diferenca: Math.abs(boleto.valor_nominal - valorPago),
            dias_diferenca: 999,
            nosso_numero_match: false,
        };

        // Critério 1: Match parcial de nosso número (últimos dígitos)
        if (nossoNumero && boleto.nosso_numero) {
            const ultimos6Nosso = nossoNumero.slice(-6);
            const ultimos6Boleto = boleto.nosso_numero.slice(-6);
            if (ultimos6Nosso === ultimos6Boleto) {
                score += 40;
                diferencas.nosso_numero_match = true;
            }
        }

        // Critério 2: Match por valor (com tolerância)
        const diferencaValor = Math.abs(boleto.valor_nominal - valorPago);
        const percentualDiferenca = diferencaValor / boleto.valor_nominal;
        
        if (percentualDiferenca <= 0.001) { // 0.1% - praticamente igual
            score += 40;
        } else if (percentualDiferenca <= 0.01) { // 1%
            score += 30;
        } else if (percentualDiferenca <= toleranciaValor) { // 3%
            score += 20;
        }

        // Critério 3: Match por data (com tolerância)
        if (dataMovimento && boleto.data_vencimento) {
            try {
                const diasDiferenca = Math.abs(
                    (new Date(dataMovimento) - new Date(boleto.data_vencimento)) / (1000 * 60 * 60 * 24)
                );
                diferencas.dias_diferenca = Math.round(diasDiferenca);

                if (diasDiferenca === 0) {
                    score += 20;
                } else if (diasDiferenca <= 3) {
                    score += 15;
                } else if (diasDiferenca <= toleranciaDias) {
                    score += 10;
                }
            } catch {}
        }

        if (score >= 50) { // Threshold mínimo para sugestão
            sugestoes.push({
                boleto_id: boleto.id,
                boleto: boleto,
                score,
                motivo_match: `Score: ${score}% - ` +
                    (diferencas.nosso_numero_match ? 'Nosso número parcial ✓, ' : '') +
                    `Diferença valor: R$ ${diferencas.valor_diferenca.toFixed(2)}, ` +
                    `Diferença data: ${diferencas.dias_diferenca} dias`,
                diferencas,
            });
        }
    }

    // Ordenar sugestões por score
    sugestoes.sort((a, b) => b.score - a.score);

    if (sugestoes.length === 0) {
        return { tipo: 'sem_match', sugestoes: [] };
    }

    // Se temos um match com score muito alto (>= 90), considerar fuzzy match
    if (sugestoes[0].score >= 90) {
        return { 
            tipo: 'match_fuzzy', 
            boleto: sugestoes[0].boleto, 
            score: sugestoes[0].score,
            sugestoes: sugestoes.map(s => ({
                boleto_id: s.boleto_id,
                score: s.score,
                motivo_match: s.motivo_match,
                diferencas: s.diferencas,
            }))
        };
    }

    // Múltiplas sugestões ou score baixo - requerer revisão manual
    return { 
        tipo: 'sugestoes', 
        score: sugestoes[0].score,
        sugestoes: sugestoes.slice(0, 5).map(s => ({
            boleto_id: s.boleto_id,
            score: s.score,
            motivo_match: s.motivo_match,
            diferencas: s.diferencas,
        }))
    };
}

// Processar pagamento do boleto
async function processarPagamentoBoleto(base44, boleto, codigoOcorrencia, valorPago, dataCNAB, caixaId, user) {
    const statusMap = {
        '02': 'registrado',
        '06': 'pago',
        '09': 'baixado',
        '10': 'baixado',
        '17': 'pago',
        '05': 'pago_parcial',
    };

    const novoStatus = statusMap[codigoOcorrencia] || 'registrado';
    const valorJaPago = boleto.valor_pago_parcial || 0;
    const isPagamentoParcial = (valorJaPago + valorPago) < boleto.valor_nominal;

    // Adicionar ao histórico
    const historicoAtual = boleto.historico_pagamentos || [];
    const novoPagamento = {
        data_pagamento: converterDataCNAB(dataCNAB),
        valor_pago: valorPago,
        forma_pagamento: 'boleto',
        origem: 'cnab_retorno',
        codigo_ocorrencia_cnab: codigoOcorrencia,
        observacoes: `Código ${codigoOcorrencia} - ${isPagamentoParcial ? 'Pagamento parcial' : 'Pagamento total'}`,
        registrado_por: 'Sistema - CNAB',
        data_registro: new Date().toISOString(),
    };

    historicoAtual.push(novoPagamento);

    const updateData = {
        status: isPagamentoParcial ? 'pago_parcial' : novoStatus,
        status_banco: codigoOcorrencia,
        processado_retorno: true,
        data_processamento_retorno: new Date().toISOString(),
        historico_pagamentos: historicoAtual,
        valor_pago_parcial: valorJaPago + valorPago,
        historico_status: [
            ...(boleto.historico_status || []),
            {
                data: new Date().toISOString(),
                status_anterior: boleto.status,
                status_novo: isPagamentoParcial ? 'pago_parcial' : novoStatus,
                descricao: `Retorno CNAB - Ocorrência ${codigoOcorrencia}`,
                origem: 'cnab_retorno',
                usuario: user.email,
            }
        ],
    };

    if (novoStatus === 'pago' && !isPagamentoParcial) {
        updateData.valor_pago = valorJaPago + valorPago;
        updateData.data_pagamento = converterDataCNAB(dataCNAB);
    }

    await base44.asServiceRole.entities.Boleto.update(boleto.id, updateData);

    // Criar movimentação de caixa
    if ((novoStatus === 'pago' || novoStatus === 'pago_parcial') && valorPago > 0) {
        await base44.asServiceRole.entities.MovimentacaoCaixa.create({
            caixa_id: caixaId,
            tipo: 'entrada',
            categoria: 'recebimento_cliente',
            valor: valorPago,
            data_movimentacao: converterDataCNAB(dataCNAB),
            descricao: `${isPagamentoParcial ? 'Pagamento parcial' : 'Recebimento'} boleto - ${boleto.sacado_nome}`,
            automatico: true,
        });
    }
}

function converterDataCNAB(dataCNAB) {
    if (!dataCNAB || dataCNAB.length !== 6) return null;
    
    const dia = dataCNAB.substring(0, 2);
    const mes = dataCNAB.substring(2, 4);
    const ano = '20' + dataCNAB.substring(4, 6);
    
    return `${ano}-${mes}-${dia}`;
}