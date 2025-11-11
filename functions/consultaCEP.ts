import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 📮 CONSULTA CEP
 * Busca endereço completo via ViaCEP e BrasilAPI
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { cep } = await req.json();

        if (!cep) {
            return Response.json({ error: 'CEP é obrigatório' }, { status: 400 });
        }

        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            return Response.json({ error: 'CEP inválido' }, { status: 400 });
        }

        console.log(`📮 Consultando CEP: ${cepLimpo}`);

        // TENTATIVA 1: ViaCEP (mais tradicional e estável)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            
            if (response.ok) {
                const dados = await response.json();
                
                if (dados.erro) {
                    throw new Error('CEP não encontrado');
                }
                
                console.log('✅ Endereço obtido via ViaCEP');
                
                return Response.json({
                    success: true,
                    fonte: 'ViaCEP',
                    dados: {
                        cep: dados.cep,
                        logradouro: dados.logradouro,
                        complemento: dados.complemento,
                        bairro: dados.bairro,
                        cidade: dados.localidade,
                        uf: dados.uf,
                        ibge: dados.ibge,
                        gia: dados.gia,
                        ddd: dados.ddd,
                        siafi: dados.siafi,
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ ViaCEP falhou, tentando BrasilAPI...', error.message);
        }

        // TENTATIVA 2: BrasilAPI (backup)
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
            
            if (response.ok) {
                const dados = await response.json();
                
                console.log('✅ Endereço obtido via BrasilAPI');
                
                return Response.json({
                    success: true,
                    fonte: 'BrasilAPI',
                    dados: {
                        cep: dados.cep,
                        logradouro: dados.street,
                        complemento: '',
                        bairro: dados.neighborhood,
                        cidade: dados.city,
                        uf: dados.state,
                        ibge: '',
                        gia: '',
                        ddd: '',
                        siafi: '',
                    }
                });
            }
        } catch (error) {
            console.error('❌ BrasilAPI também falhou:', error.message);
        }

        // Se ambas falharam
        return Response.json({
            success: false,
            error: 'CEP não encontrado em nenhuma API disponível',
            dica: 'Verifique se o CEP está correto',
        }, { status: 404 });

    } catch (error) {
        console.error('❌ Erro na consulta de CEP:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});