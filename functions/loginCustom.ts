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

        // Buscar usuário
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

        // Verificar se está ativo
        if (!usuario.ativo) {
            return Response.json({ 
                success: false, 
                error: 'Usuário desativado. Entre em contato com o administrador.' 
            }, { status: 403 });
        }

        // Verificar senha
        const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);

        if (!senhaValida) {
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        // Gerar token de sessão
        const token = crypto.randomUUID();

        // Atualizar último acesso e token
        await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
            ultimo_acesso: new Date().toISOString(),
            token_sessao: token
        });

        return Response.json({
            success: true,
            token,
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
        console.error('Erro no login:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao processar login' 
        }, { status: 500 });
    }
});