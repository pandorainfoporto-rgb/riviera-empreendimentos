import { createClient } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClient();

        console.log('🔧 Iniciando correção do usuário admin...');

        // Email e senha fixos para o admin
        const email = 'atendimento@pandorainternet.net';
        const senha = '123456';
        const nome = 'Admin Sistema';

        // Buscar usuário existente
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim() 
        });

        console.log('👤 Usuários encontrados:', usuarios.length);

        // Gerar hash correto da senha
        const senhaHash = bcrypt.hashSync(senha, 10);
        console.log('🔐 Hash gerado:', senhaHash.substring(0, 20) + '...');

        if (usuarios && usuarios.length > 0) {
            // Atualizar usuário existente
            const usuario = usuarios[0];
            console.log('📝 Atualizando usuário existente:', usuario.id);

            await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
                senha_hash: senhaHash,
                nome: nome,
                tipo_acesso: 'admin',
                ativo: true,
                primeiro_acesso: false,
                ultimo_acesso: null,
                token_sessao: null
            });

            console.log('✅ Usuário atualizado com sucesso!');

            return Response.json({
                success: true,
                message: '✅ Usuário admin corrigido com sucesso!',
                detalhes: {
                    email: email,
                    nome: nome,
                    senha: senha,
                    hash_antigo: usuarios[0].senha_hash?.substring(0, 20),
                    hash_novo: senhaHash.substring(0, 20)
                }
            });
        } else {
            // Criar novo usuário
            console.log('➕ Criando novo usuário admin...');

            const novoUsuario = await base44.asServiceRole.entities.UsuarioCustom.create({
                email: email.toLowerCase().trim(),
                senha_hash: senhaHash,
                nome: nome,
                tipo_acesso: 'admin',
                ativo: true,
                primeiro_acesso: false
            });

            console.log('✅ Usuário criado com sucesso!');

            return Response.json({
                success: true,
                message: '✅ Usuário admin criado com sucesso!',
                detalhes: {
                    id: novoUsuario.id,
                    email: email,
                    nome: nome,
                    senha: senha
                }
            });
        }

    } catch (error) {
        console.error('💥 Erro ao corrigir usuário:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao corrigir usuário: ' + error.message,
            stack: error.stack
        }, { status: 500 });
    }
});