import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { token } = await req.json();

        if (!token) {
            return Response.json({ 
                success: false, 
                error: 'Token não fornecido' 
            }, { status: 400 });
        }

        // Buscar convite usando query direto
        const { data: convites, error } = await base44.asServiceRole.client
            .from('ConviteUsuario')
            .select('*')
            .eq('token', token)
            .limit(1);

        if (error || !convites || convites.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Convite não encontrado' 
            });
        }

        const convite = convites[0];

        // Verificar se já foi aceito
        if (convite.aceito) {
            return Response.json({ 
                success: false,
                error: 'Este convite já foi utilizado. Faça login no sistema.' 
            });
        }

        // Verificar expiração
        const agora = new Date();
        const dataExpiracao = new Date(convite.data_expiracao);
        
        if (agora > dataExpiracao) {
            return Response.json({ 
                success: false,
                error: 'Este convite expirou. Solicite um novo convite.' 
            });
        }

        return Response.json({ 
            success: true,
            convite: {
                email: convite.email,
                full_name: convite.full_name,
                tipo_acesso: convite.tipo_acesso,
                cargo: convite.cargo
            }
        });

    } catch (error) {
        console.error('Erro ao validar convite:', error);
        return Response.json({ 
            success: false,
            error: 'Erro ao validar convite' 
        }, { status: 500 });
    }
});