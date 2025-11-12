import { createClient } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClient();
        const { email, senha } = await req.json();

        console.log('🔐 Tentativa de login:', email);

        if (!email || !senha) {
            return Response.json({ 
                success: false, 
                error: 'Email e senha são obrigatórios' 
            }, { status: 400 });
        }

        // Buscar usuário
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim(),
            ativo: true
        });

        console.log('👤 Usuários encontrados:', usuarios.length);

        if (!usuarios || usuarios.length === 0) {
            console.log('❌ Usuário não encontrado');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        const usuario = usuarios[0];
        console.log('✅ Usuário encontrado:', usuario.nome);
        console.log('🔑 Hash da senha:', usuario.senha_hash?.substring(0, 30) + '...');

        // Verificar se o hash está no formato correto
        if (!usuario.senha_hash || !usuario.senha_hash.startsWith('$2')) {
            console.log('⚠️ Hash inválido! Formato:', usuario.senha_hash?.substring(0, 20));
            return Response.json({ 
                success: false, 
                error: 'Senha não configurada corretamente. Clique em "Corrigir Usuário Admin"' 
            }, { status: 401 });
        }

        // Verificar senha
        console.log('🔑 Verificando senha...');
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            console.log('❌ Senha inválida');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        console.log('✅ Senha válida!');

        // Gerar token
        const token = crypto.randomUUID();
        console.log('🎫 Token gerado');

        // Atualizar sessão
        await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
            ultimo_acesso: new Date().toISOString(),
            token_sessao: token
        });

        console.log('💾 Sessão atualizada');

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
        console.error('📋 Stack:', error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message,
            tipo: error.name
        }, { status: 500 });
    }
});