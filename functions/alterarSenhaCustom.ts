import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { usuario_id, senha_atual, senha_nova } = await req.json();

        if (!usuario_id || !senha_atual || !senha_nova) {
            return Response.json({ 
                success: false, 
                error: 'Todos os campos são obrigatórios' 
            }, { status: 400 });
        }

        if (senha_nova.length < 6) {
            return Response.json({ 
                success: false, 
                error: 'A nova senha deve ter no mínimo 6 caracteres' 
            }, { status: 400 });
        }

        // Buscar usuário
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            id: usuario_id 
        });

        if (!usuarios || usuarios.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            }, { status: 404 });
        }

        const usuario = usuarios[0];

        // Verificar senha atual
        const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);

        if (!senhaValida) {
            return Response.json({ 
                success: false, 
                error: 'Senha atual incorreta' 
            }, { status: 401 });
        }

        // Hash da nova senha
        const novaSenhaHash = await bcrypt.hash(senha_nova, 10);

        // Atualizar senha
        await base44.asServiceRole.entities.UsuarioCustom.update(usuario_id, {
            senha_hash: novaSenhaHash,
            primeiro_acesso: false
        });

        return Response.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao alterar senha' 
        }, { status: 500 });
    }
});