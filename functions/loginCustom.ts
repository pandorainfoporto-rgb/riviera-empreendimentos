import { createClient } from 'npm:@base44/sdk@0.8.4';

// Função auxiliar para comparar senha com hash (bcrypt simplificado)
async function compararSenha(senha, hash) {
    try {
        // Importar bcrypt dinamicamente
        const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
        return await bcrypt.compare(senha, hash);
    } catch (error) {
        console.error('Erro ao comparar senha:', error);
        return false;
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClient();
        const { email, senha } = await req.json();

        console.log('🔐 LOGIN - Email:', email);

        if (!email || !senha) {
            return Response.json({ 
                success: false, 
                error: 'Email e senha são obrigatórios' 
            }, { status: 400 });
        }

        // Buscar usuário
        console.log('🔍 Buscando usuário...');
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim(),
            ativo: true
        });

        if (!usuarios || usuarios.length === 0) {
            console.log('❌ Usuário não encontrado');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        const usuario = usuarios[0];
        console.log('✅ Usuário encontrado:', usuario.nome);
        console.log('🔑 Hash:', usuario.senha_hash?.substring(0, 30));

        // Validar formato do hash
        if (!usuario.senha_hash || !usuario.senha_hash.startsWith('$2')) {
            console.log('⚠️ HASH INVÁLIDO!');
            console.log('Hash recebido:', usuario.senha_hash);
            return Response.json({ 
                success: false, 
                error: '⚠️ Senha não está configurada corretamente!\n\nClique no botão "🔧 Corrigir Usuário Admin" antes de fazer login.' 
            }, { status: 401 });
        }

        // Verificar senha
        console.log('🔐 Verificando senha...');
        const senhaValida = await compararSenha(senha, usuario.senha_hash);

        if (!senhaValida) {
            console.log('❌ Senha incorreta');
            return Response.json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            }, { status: 401 });
        }

        console.log('✅ Senha válida!');

        // Gerar token
        const token = crypto.randomUUID();

        // Atualizar sessão
        await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
            ultimo_acesso: new Date().toISOString(),
            token_sessao: token
        });

        console.log('✅ LOGIN CONCLUÍDO');

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
        console.error('💥 ERRO LOGIN:', error);
        return Response.json({ 
            success: false, 
            error: error.message || 'Erro ao processar login'
        }, { status: 500 });
    }
});