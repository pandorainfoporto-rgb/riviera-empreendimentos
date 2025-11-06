import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Sincroniza extratos bancários via API
 * Busca movimentações automaticamente para conciliação
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { integracao_id, caixa_id, data_inicio, data_fim } = await req.json();

        if (!integracao_id || !caixa_id) {
            return Response.json({ 
                error: 'integracao_id e caixa_id são obrigatórios' 
            }, { status: 400 });
        }

        const integracao = await base44.asServiceRole.entities.IntegracaoBancaria.get(integracao_id);

        if (!integracao) {
            return Response.json({ error: 'Integração não encontrada' }, { status: 400 });
        }

        console.log(`🔄 Sincronizando extrato: ${integracao.banco}`);

        // Definir datas padrão se não fornecidas
        const dataFim = data_fim || new Date().toISOString().split('T')[0];
        const dataInicio = data_inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        let resultado;

        // Chamar função específica do banco
        if (integracao.banco === 'banco_brasil' && integracao.tipo_integracao === 'api') {
            const response = await base44.asServiceRole.functions.invoke('bancoBrasilAPI', {
                action: 'buscarExtrato',
                integracao_id,
                boleto_data: { data_inicio: dataInicio, data_fim: dataFim },
            });

            if (!response.data?.success) {
                throw new Error(response.data?.error || 'Erro ao buscar extrato BB');
            }

            resultado = response.data;

            // Processar movimentos e criar conciliação
            const movimentos = resultado.movimentos.map(mov => ({
                data_movimento: mov.dataMovimento,
                tipo: mov.tipo === 'C' ? 'credito' : 'debito',
                valor: parseFloat(mov.valorMovimento),
                descricao: mov.descricaoHistorico,
                documento: mov.numeroDocumento,
                status_conciliacao: 'pendente',
            }));

            // Criar registro de conciliação
            const conciliacao = await base44.asServiceRole.entities.ConciliacaoBancaria.create({
                integracao_bancaria_id: integracao_id,
                caixa_id,
                tipo_arquivo: 'api',
                data_processamento: new Date().toISOString(),
                data_movimento_inicio: dataInicio,
                data_movimento_fim: dataFim,
                quantidade_registros: movimentos.length,
                quantidade_conciliados: 0,
                quantidade_pendentes: movimentos.length,
                quantidade_divergencias: 0,
                movimentos,
                saldo_inicial_banco: resultado.saldo_inicial,
                saldo_final_banco: resultado.saldo_final,
                status: 'concluido',
            });

            console.log('✅ Extrato sincronizado via API');

            return Response.json({
                success: true,
                conciliacao_id: conciliacao.id,
                quantidade_movimentos: movimentos.length,
                metodo: 'api',
            });

        } else {
            // Para outros bancos ou CNAB, retornar mensagem
            return Response.json({
                success: false,
                message: `Sincronização via API não disponível para ${integracao.banco}. Use arquivo CNAB.`,
                integracao: integracao.nome_configuracao,
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Erro ao sincronizar extrato:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});