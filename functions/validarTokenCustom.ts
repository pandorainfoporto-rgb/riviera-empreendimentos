import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        // Buscar usuário pelo token
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            token_sessao: token,
            ativo: true
        });

        if (!usuarios || usuarios.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'Token inválido ou expirado' 
            }, { status: 401 });
        }

        const usuario = usuarios[0];

        return Response.json({
            success: true,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                tipo_acesso: usuario.tipo_acesso,
                cliente_id: usuario.cliente_id,
                primeiro_acesso: usuario.primeiro_acesso
            }
        });

    } catch (error) {
        console.error('Erro ao validar token:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao validar token' 
        }, { status: 500 });
    }
});