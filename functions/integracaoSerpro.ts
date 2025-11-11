import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🏛️ INTEGRAÇÃO SERPRO (Governo Federal)
 * Consulta CPF, Situação Fiscal, Certidões Negativas
 * Datavalid para validação de dados cadastrais
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            action, 
            consumer_key, 
            consumer_secret, 
            cpf, 
            data_nascimento 
        } = await req.json();

        const SERPRO_BASE = 'https://gateway.apiserpro.serpro.gov.br';

        // 1. GERAR TOKEN OAUTH
        const gerarToken = async () => {
            const authString = btoa(`${consumer_key}:${consumer_secret}`);
            
            const response = await fetch(`${SERPRO_BASE}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authString}`,
                },
                body: 'grant_type=client_credentials',
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar token SERPRO');
            }

            const data = await response.json();
            return data.access_token;
        };

        // 2. CONSULTAR CPF (DATAVALID)
        if (action === 'consultarCPF') {
            console.log(`🔍 Consultando CPF no SERPRO: ${cpf}`);

            const token = await gerarToken();
            const cpfLimpo = cpf.replace(/\D/g, '');

            const payload = {
                key: {
                    cpf: cpfLimpo
                },
                answer: {
                    data_nascimento: data_nascimento // formato: DD/MM/YYYY
                }
            };

            const response = await fetch(`${SERPRO_BASE}/consulta-cpf-df/v1/cpf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro SERPRO: ${error.message || 'Consulta falhou'}`);
            }

            const dados = await response.json();

            console.log('✅ CPF consultado com sucesso');

            return Response.json({
                success: true,
                valido: dados.situacao_cpf === 'REGULAR',
                dados: {
                    cpf: dados.ni,
                    nome: dados.nome,
                    data_nascimento: dados.nascimento,
                    situacao: dados.situacao_cpf,
                    data_inscricao: dados.data_inscricao,
                    idade: dados.idade,
                }
            });
        }

        // 3. VALIDAR BIOMETRIA FACIAL (DATAVALID)
        if (action === 'validarBiometria') {
            console.log('📸 Validando biometria facial no SERPRO...');

            const token = await gerarToken();

            const payload = {
                key: {
                    cpf: cpf.replace(/\D/g, '')
                },
                answer: {
                    biometria_face: midia_base64 // Base64 da foto
                }
            };

            const response = await fetch(`${SERPRO_BASE}/datavalid/v3/validate/pf-face`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Erro na validação biométrica');
            }

            const resultado = await response.json();

            return Response.json({
                success: true,
                biometria_valida: resultado.biometria_face,
                similarity_score: resultado.similarity,
                cpf_valido: resultado.cpf_disponivel,
            });
        }

        // 4. CONSULTAR SITUAÇÃO FISCAL (Regularidade)
        if (action === 'consultarSituacaoFiscal') {
            console.log('📋 Consultando situação fiscal no SERPRO...');

            const token = await gerarToken();
            const cpfLimpo = cpf.replace(/\D/g, '');

            const response = await fetch(
                `${SERPRO_BASE}/consulta-cpf-df/v1/cpf/${cpfLimpo}`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Erro ao consultar situação fiscal');
            }

            const dados = await response.json();

            return Response.json({
                success: true,
                regular: dados.situacao_cpf === 'REGULAR',
                situacao: dados.situacao_cpf,
                dados_completos: dados,
            });
        }

        return Response.json({ error: 'Ação não suportada' }, { status: 400 });

    } catch (error) {
        console.error('❌ Erro SERPRO:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});