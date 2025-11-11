import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Integração com API Bradesco
 * Endpoints: OAuth, Registro de Boleto, Consulta Status, Baixa
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, integracao_id, boleto_data } = await req.json();

        // Buscar configuração da integração
        const integracao = await base44.asServiceRole.entities.IntegracaoBancaria.get(integracao_id);

        if (!integracao || integracao.banco !== 'bradesco') {
            return Response.json({ error: 'Integração Bradesco não encontrada' }, { status: 400 });
        }

        const baseURL = integracao.ambiente === 'producao'
            ? 'https://cobranca.bradesconetempresa.b.br/ibpjpp'
            : 'https://cobranca.bradesconetempresa.b.br/ibpjpp/homolog';

        // 1. GERAR TOKEN OAUTH
        if (action === 'gerarToken') {
            console.log('🔐 Gerando token OAuth Bradesco...');

            const tokenResponse = await fetch(`${baseURL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: integracao.client_id,
                    client_secret: integracao.client_secret,
                }),
            });

            if (!tokenResponse.ok) {
                const error = await tokenResponse.json();
                throw new Error(`Erro OAuth Bradesco: ${error.error_description || error.error}`);
            }

            const tokenData = await tokenResponse.json();

            // Salvar token na integração
            const expiraEm = new Date();
            expiraEm.setSeconds(expiraEm.getSeconds() + tokenData.expires_in);

            await base44.asServiceRole.entities.IntegracaoBancaria.update(integracao_id, {
                token_acesso: tokenData.access_token,
                token_expiracao: expiraEm.toISOString(),
            });

            console.log('✅ Token gerado com sucesso');

            return Response.json({
                success: true,
                access_token: tokenData.access_token,
                expires_in: tokenData.expires_in,
            });
        }

        // 2. REGISTRAR BOLETO
        if (action === 'registrarBoleto') {
            console.log('📄 Registrando boleto no Bradesco...');

            // Verificar se token está válido
            let accessToken = integracao.token_acesso;
            const now = new Date();
            const expiry = new Date(integracao.token_expiracao);

            if (!accessToken || now >= expiry) {
                console.log('⏰ Token expirado, renovando...');
                const renewResponse = await base44.asServiceRole.functions.invoke('bancoBradescoAPI', {
                    action: 'gerarToken',
                    integracao_id,
                });
                accessToken = renewResponse.data.access_token;
            }

            // Calcular nosso número
            const proximoNosso = (integracao.numero_remessa || 1) + 1;
            const nossoNumero = String(proximoNosso).padStart(11, '0');

            // Montar requisição de registro
            const boletoRequest = {
                numeroTitulo: boleto_data.numero_documento || nossoNumero,
                nossoNumero: nossoNumero,
                valorTitulo: boleto_data.valor_nominal,
                dataVencimento: boleto_data.data_vencimento.replace(/-/g, ''),
                sacado: {
                    nome: boleto_data.sacado_nome,
                    cpfCnpj: boleto_data.sacado_cpf_cnpj.replace(/\D/g, ''),
                    endereco: boleto_data.sacado_endereco,
                    cidade: boleto_data.sacado_cidade,
                    uf: boleto_data.sacado_uf,
                    cep: boleto_data.sacado_cep.replace(/\D/g, ''),
                },
                especieTitulo: integracao.especie_documento || 'DM',
                instrucoes: boleto_data.instrucoes || integracao.instrucoes_padrao || [],
                juros: {
                    tipo: 1, // Percentual ao dia
                    percentual: boleto_data.percentual_juros_mora || integracao.juros_mora_percentual,
                },
                multa: {
                    tipo: 2, // Percentual
                    percentual: boleto_data.percentual_multa || integracao.multa_atraso_percentual,
                },
            };

            const registroResponse = await fetch(`${baseURL}/api/v1/boleto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(boletoRequest),
            });

            if (!registroResponse.ok) {
                const error = await registroResponse.json();
                throw new Error(`Erro ao registrar boleto: ${error.message || JSON.stringify(error)}`);
            }

            const boletoRegistrado = await registroResponse.json();

            // Atualizar número de remessa
            await base44.asServiceRole.entities.IntegracaoBancaria.update(integracao_id, {
                numero_remessa: proximoNosso,
            });

            console.log('✅ Boleto registrado:', boletoRegistrado.nossoNumero);

            return Response.json({
                success: true,
                nosso_numero: boletoRegistrado.nossoNumero,
                linha_digitavel: boletoRegistrado.linhaDigitavel,
                codigo_barras: boletoRegistrado.codigoBarras,
                url_boleto: boletoRegistrado.urlBoleto,
                id_banco: boletoRegistrado.idBoleto,
            });
        }

        // 3. CONSULTAR STATUS
        if (action === 'consultarStatus') {
            console.log('🔍 Consultando status do boleto...');

            let accessToken = integracao.token_acesso;
            const now = new Date();
            const expiry = new Date(integracao.token_expiracao);

            if (!accessToken || now >= expiry) {
                const renewResponse = await base44.asServiceRole.functions.invoke('bancoBradescoAPI', {
                    action: 'gerarToken',
                    integracao_id,
                });
                accessToken = renewResponse.data.access_token;
            }

            const statusResponse = await fetch(`${baseURL}/api/v1/boleto/${boleto_data.nosso_numero}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!statusResponse.ok) {
                const error = await statusResponse.json();
                throw new Error(`Erro ao consultar status: ${error.message || JSON.stringify(error)}`);
            }

            const statusData = await statusResponse.json();

            return Response.json({
                success: true,
                status: statusData.situacao,
                data_pagamento: statusData.dataPagamento,
                valor_pago: statusData.valorPago,
                detalhes: statusData,
            });
        }

        // 4. BAIXAR BOLETO
        if (action === 'baixarBoleto') {
            console.log('❌ Baixando boleto no Bradesco...');

            let accessToken = integracao.token_acesso;

            const baixaResponse = await fetch(`${baseURL}/api/v1/boleto/${boleto_data.nosso_numero}/baixa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    motivo: 'PEDIDO_BENEFICIARIO',
                }),
            });

            if (!baixaResponse.ok) {
                const error = await baixaResponse.json();
                throw new Error(`Erro ao baixar boleto: ${error.message}`);
            }

            return Response.json({ success: true, message: 'Boleto baixado com sucesso' });
        }

        return Response.json({ error: 'Ação não suportada' }, { status: 400 });

    } catch (error) {
        console.error('❌ Erro Bradesco API:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});