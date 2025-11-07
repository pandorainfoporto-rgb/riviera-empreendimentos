import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { token } = await req.json();

        if (!token) {
            return Response.json({ 
                success: false, 
                error: 'Token é obrigatório' 
            }, { status: 400 });
        }

        // Buscar usuário pelo token usando service role
        const { data: usuarios, error } = await base44.asServiceRole.client
            .from('User')
            .select('*')
            .eq('convite_token', token)
            .limit(1);

        if (error || !usuarios || usuarios.length === 0) {
            return Response.json({ 
                success: false,
                valido: false,
                error: 'Convite não encontrado ou inválido' 
            });
        }

        const usuario = usuarios[0];

        // Verificar se já foi aceito
        if (usuario.convite_aceito) {
            return Response.json({ 
                success: false,
                valido: false,
                error: 'Este convite já foi utilizado. Faça login no sistema.' 
            });
        }

        // Verificar expiração (7 dias)
        if (usuario.convite_data_envio) {
            const dataEnvio = new Date(usuario.convite_data_envio);
            const agora = new Date();
            const diasPassados = (agora - dataEnvio) / (1000 * 60 * 60 * 24);
            
            if (diasPassados > 7) {
                return Response.json({ 
                    success: false,
                    valido: false,
                    error: 'Este convite expirou. Solicite um novo convite.' 
                });
            }
        }

        return Response.json({ 
            success: true,
            valido: true,
            dados: {
                nome: usuario.full_name,
                email: usuario.email,
                tipo_acesso: usuario.tipo_acesso,
                cargo: usuario.cargo
            }
        });

    } catch (error) {
        console.error('Erro ao verificar token:', error);
        return Response.json({ 
            success: false,
            error: 'Erro ao verificar convite' 
        }, { status: 500 });
    }
});