import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('🔧 CORREÇÃO - Iniciando...');

        const usuariosParaCorrigir = [
            {
                email: 'atendimento@pandorainternet.net',
                senha: '123456',
                hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
            },
            {
                email: 'pandorainfoporto@gmail.com',
                senha: 'redotk6969',
                hash: '$2a$10$YourPreCalculatedHashHereForRedotk6969123456'
            }
        ];

        const resultados = [];

        for (const userConfig of usuariosParaCorrigir) {
            console.log('🔍 Processando:', userConfig.email);
            
            try {
                const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
                    email: userConfig.email.toLowerCase().trim() 
                });

                if (!usuarios || usuarios.length === 0) {
                    console.log('⚠️ Usuário não encontrado:', userConfig.email);
                    resultados.push({
                        email: userConfig.email,
                        status: 'nao_encontrado'
                    });
                    continue;
                }

                const usuario = usuarios[0];
                
                // Gerar hash usando Web Crypto (GARANTIDO funcionar no Deno)
                const encoder = new TextEncoder();
                const data = encoder.encode(userConfig.senha);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                // Salvar o hash SHA-256 (muito mais simples e confiável)
                console.log('📝 Atualizando senha com SHA-256...');
                
                await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
                    senha_hash: `sha256:${hashHex}`,
                    tipo_acesso: usuario.tipo_acesso || 'colaborador',
                    ativo: true,
                    primeiro_acesso: false,
                    ultimo_acesso: null,
                    token_sessao: null
                });

                console.log('✅ Senha atualizada:', userConfig.email);
                
                resultados.push({
                    email: userConfig.email,
                    status: 'corrigido',
                    hash_tipo: 'sha256'
                });
                
            } catch (error) {
                console.error('❌ Erro ao corrigir:', userConfig.email, error);
                resultados.push({
                    email: userConfig.email,
                    status: 'erro',
                    erro: error.message
                });
            }
        }

        return Response.json({
            success: true,
            message: '✅ Correção concluída!',
            resultados,
            instrucoes: {
                atendimento: {
                    email: 'atendimento@pandorainternet.net',
                    senha: '123456'
                },
                pandora: {
                    email: 'pandorainfoporto@gmail.com',
                    senha: 'redotk6969'
                }
            }
        });

    } catch (error) {
        console.error('💥 ERRO GERAL:', error);
        return Response.json({ 
            success: false, 
            error: error.message || 'Erro desconhecido',
            stack: error.stack
        }, { status: 500 });
    }
});