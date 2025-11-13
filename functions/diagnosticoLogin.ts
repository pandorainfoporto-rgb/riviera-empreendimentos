import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email } = await req.json();

        if (!email) {
            return Response.json({ 
                success: false, 
                error: 'Email é obrigatório' 
            }, { status: 400 });
        }

        // Buscar usuário
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim()
        });

        if (!usuarios || usuarios.length === 0) {
            return Response.json({
                success: false,
                mensagem: '❌ Usuário não encontrado',
                email_buscado: email.toLowerCase().trim()
            });
        }

        // Mostrar todos os usuários encontrados
        const detalhes = usuarios.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            tipo_acesso: u.tipo_acesso,
            ativo: u.ativo,
            senha_hash: u.senha_hash,
            hash_tipo: u.senha_hash?.startsWith('sha256:') ? 'SHA-256' : 
                       u.senha_hash?.startsWith('$2') ? 'bcrypt' : 'desconhecido',
            hash_preview: u.senha_hash?.substring(0, 50) + '...',
            created_date: u.created_date,
            updated_date: u.updated_date
        }));

        return Response.json({
            success: true,
            total_usuarios: usuarios.length,
            usuarios: detalhes,
            usuario_mais_recente: detalhes[0]
        });

    } catch (error) {
        console.error('💥 ERRO:', error);
        return Response.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});