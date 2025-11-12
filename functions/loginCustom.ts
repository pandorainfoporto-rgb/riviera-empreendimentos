import { createClient } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        // IMPORTANTE: Usar createClient diretamente (sem autenticação prévia)
        // porque esta é a função de LOGIN - o usuário ainda NÃO está autenticado
        const base44 = createClient();
        
        const { email, senha } = await req.json();

        console.log('🔐 Tentativa de login:', email);

        if (!email || !senha) {
            return Response.json({ 
                success: false, 
                error: 'Email e senha são obrigatórios' 
            }, { status: 400 });
        }

        // Buscar usuário usando service role (sem autenticação)
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim(),
            ativo: true
        });

        console.log('👤 Usuários encontrados:', usuarios.length);

        if (!usuarios || usuarios.length === 0) {
            console.log('❌ Nenhum usuário encontrado');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        const usuario = usuarios[0];
        console.log('✅ Usuário encontrado:', usuario.nome);

        // Verificar se está ativo
        if (!usuario.ativo) {
            console.log('⛔ Usuário inativo');
            return Response.json({ 
                success: false, 
                error: 'Usuário desativado. Entre em contato com o administrador.' 
            }, { status: 403 });
        }

        // Verificar senha
        console.log('🔑 Verificando senha...');
        const senhaValida = bcrypt.compareSync(senha, usuario.senha_hash);

        if (!senhaValida) {
            console.log('❌ Senha inválida');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        console.log('✅ Senha válida!');

        // Gerar token de sessão
        const token = crypto.randomUUID();
        console.log('🎫 Token gerado:', token.substring(0, 8) + '...');

        // Atualizar último acesso e token
        await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
            ultimo_acesso: new Date().toISOString(),
            token_sessao: token
        });

        console.log('💾 Sessão atualizada com sucesso');

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
        console.error('💥 Erro no login:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao processar login: ' + error.message 
        }, { status: 500 });
    }
});