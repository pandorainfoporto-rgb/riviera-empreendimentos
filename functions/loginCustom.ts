import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Função para comparar senha com hash SHA-256
async function compararSenhaSHA256(senha, hashArmazenado) {
    try {
        // Remover prefixo se existir
        const hashLimpo = hashArmazenado.replace('sha256:', '');
        
        // Gerar hash da senha fornecida
        const encoder = new TextEncoder();
        const data = encoder.encode(senha);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        console.log('🔍 DEBUG SHA-256:');
        console.log('  Senha digitada:', senha);
        console.log('  Hash gerado:', hashHex);
        console.log('  Hash armazenado:', hashLimpo);
        console.log('  Match:', hashHex === hashLimpo);
        
        return hashHex === hashLimpo;
    } catch (error) {
        console.error('Erro ao comparar SHA-256:', error);
        return false;
    }
}

// Função para comparar senha com bcrypt (fallback)
async function compararSenhaBcrypt(senha, hash) {
    try {
        const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
        return await bcrypt.compare(senha, hash);
    } catch (error) {
        console.error('Erro ao comparar bcrypt:', error);
        return false;
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, senha } = await req.json();

        console.log('🔐 LOGIN - Email:', email);
        console.log('🔐 LOGIN - Senha recebida:', senha);

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
        console.log('🔑 Hash completo:', usuario.senha_hash);

        // Validar se tem hash
        if (!usuario.senha_hash) {
            console.log('⚠️ SEM HASH!');
            return Response.json({ 
                success: false, 
                error: '⚠️ Senha não configurada!\n\nClique em "🔧 Corrigir Usuário Admin"' 
            }, { status: 401 });
        }

        // Verificar senha baseado no tipo de hash
        console.log('🔐 Verificando senha...');
        let senhaValida = false;

        if (usuario.senha_hash.startsWith('sha256:')) {
            // Hash SHA-256
            console.log('📝 Usando SHA-256...');
            senhaValida = await compararSenhaSHA256(senha, usuario.senha_hash);
            console.log('📝 Resultado SHA-256:', senhaValida);
        } else if (usuario.senha_hash.startsWith('$2')) {
            // Hash bcrypt
            console.log('📝 Usando bcrypt...');
            senhaValida = await compararSenhaBcrypt(senha, usuario.senha_hash);
            console.log('📝 Resultado bcrypt:', senhaValida);
        } else {
            console.log('❌ Formato de hash desconhecido:', usuario.senha_hash);
            return Response.json({ 
                success: false, 
                error: '⚠️ Formato de senha inválido!\n\nClique em "🔧 Corrigir Usuário Admin"' 
            }, { status: 401 });
        }

        if (!senhaValida) {
            console.log('❌ Senha incorreta - comparação falhou');
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
            error: error.message || 'Erro ao processar login',
            stack: error.stack
        }, { status: 500 });
    }
});