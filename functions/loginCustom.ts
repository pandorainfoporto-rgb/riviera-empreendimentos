import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, senha } = await req.json();

        if (!email || !senha) {
            return Response.json({ 
                success: false, 
                error: 'Email e senha são obrigatórios' 
            }, { status: 400 });
        }

        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim()
        });

        if (!usuarios || usuarios.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        const usuario = usuarios[0];

        const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);

        if (!senhaValida) {
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        const dadosUsuarios = await base44.asServiceRole.entities.DadosUsuario.filter({
            usuario_id: usuario.id
        });

        const dadosUsuario = dadosUsuarios?.[0] || { 
            nome: 'Usuário', 
            tipo_acesso: 'colaborador',
            ativo: true 
        };

        const token = crypto.randomUUID();

        return Response.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: dadosUsuario.nome,
                tipo_acesso: dadosUsuario.tipo_acesso,
                cliente_id: dadosUsuario.cliente_id
            }
        });

    } catch (error) {
        return Response.json({ 
            success: false, 
            error: 'Erro ao processar login'
        }, { status: 500 });
    }
});