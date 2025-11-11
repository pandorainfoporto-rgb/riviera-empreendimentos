import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🏛️ CONSULTA RECEITA FEDERAL
 * Valida e busca dados de CNPJ automaticamente
 * Integração com Brasil API e Receita.ws
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { cnpj } = await req.json();

        if (!cnpj) {
            return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
        }

        const cnpjLimpo = cnpj.replace(/\D/g, '');

        if (cnpjLimpo.length !== 14) {
            return Response.json({ error: 'CNPJ inválido' }, { status: 400 });
        }

        console.log(`🔍 Consultando CNPJ: ${cnpjLimpo}`);

        // TENTATIVA 1: Brasil API (mais rápida e confiável)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
            
            if (response.ok) {
                const dados = await response.json();
                
                console.log('✅ Dados obtidos via BrasilAPI');
                
                return Response.json({
                    success: true,
                    fonte: 'BrasilAPI',
                    dados: {
                        cnpj: dados.cnpj,
                        razao_social: dados.razao_social,
                        nome_fantasia: dados.nome_fantasia,
                        data_abertura: dados.data_inicio_atividade,
                        situacao: dados.descricao_situacao_cadastral,
                        tipo: dados.descricao_tipo_logradouro,
                        logradouro: dados.logradouro,
                        numero: dados.numero,
                        complemento: dados.complemento,
                        bairro: dados.bairro,
                        cidade: dados.municipio,
                        uf: dados.uf,
                        cep: dados.cep,
                        telefone: dados.ddd_telefone_1,
                        email: dados.email,
                        atividade_principal: dados.cnae_fiscal_descricao,
                        capital_social: dados.capital_social,
                        porte: dados.porte,
                        natureza_juridica: dados.natureza_juridica,
                        socios: dados.qsa?.map(s => ({
                            nome: s.nome_socio,
                            qualificacao: s.qualificacao_socio,
                        })) || [],
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ BrasilAPI falhou, tentando Receita.ws...', error.message);
        }

        // TENTATIVA 2: Receita.ws (backup)
        try {
            const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
            
            if (response.ok) {
                const dados = await response.json();
                
                if (dados.status === 'ERROR') {
                    throw new Error(dados.message);
                }
                
                console.log('✅ Dados obtidos via Receita.ws');
                
                return Response.json({
                    success: true,
                    fonte: 'ReceitaWS',
                    dados: {
                        cnpj: dados.cnpj,
                        razao_social: dados.nome,
                        nome_fantasia: dados.fantasia,
                        data_abertura: dados.abertura,
                        situacao: dados.situacao,
                        tipo: dados.tipo,
                        logradouro: dados.logradouro,
                        numero: dados.numero,
                        complemento: dados.complemento,
                        bairro: dados.bairro,
                        cidade: dados.municipio,
                        uf: dados.uf,
                        cep: dados.cep,
                        telefone: dados.telefone,
                        email: dados.email,
                        atividade_principal: dados.atividade_principal?.[0]?.text,
                        capital_social: dados.capital_social,
                        porte: dados.porte,
                        natureza_juridica: dados.natureza_juridica,
                        socios: dados.qsa?.map(s => ({
                            nome: s.nome,
                            qualificacao: s.qual,
                        })) || [],
                    }
                });
            }
        } catch (error) {
            console.error('❌ Receita.ws também falhou:', error.message);
        }

        // Se ambas falharam
        return Response.json({
            success: false,
            error: 'Não foi possível consultar o CNPJ nas APIs disponíveis',
            dica: 'Tente novamente em alguns minutos ou verifique se o CNPJ está correto',
        }, { status: 503 });

    } catch (error) {
        console.error('❌ Erro na consulta Receita Federal:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});