import { createClient } from 'npm:@base44/sdk@0.8.4';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClient();

        console.log('🔧 Iniciando correção do usuário admin...');

        // Email e senha fixos para o admin
        const email = 'atendimento@pandorainternet.net';
        const senha = '123456';
        const nome = 'Admin Sistema';

        // Gerar hash correto da senha
        console.log('🔐 Gerando hash da senha...');
        const senhaHash = await bcrypt.hash(senha);
        console.log('✅ Hash gerado:', senhaHash.substring(0, 30) + '...');

        // Buscar usuário existente
        console.log('🔍 Buscando usuário...');
        const usuarios = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim() 
        });

        console.log('👤 Usuários encontrados:', usuarios.length);

        if (usuarios && usuarios.length > 0) {
            // Atualizar usuário existente
            const usuario = usuarios[0];
            console.log('📝 Atualizando usuário:', usuario.id);
            console.log('🔑 Hash antigo:', usuario.senha_hash?.substring(0, 30));

            const atualizado = await base44.asServiceRole.entities.UsuarioCustom.update(usuario.id, {
                senha_hash: senhaHash,
                nome: nome,
                tipo_acesso: 'admin',
                ativo: true,
                primeiro_acesso: false
            });

            console.log('✅ Usuário atualizado!');

            return Response.json({
                success: true,
                message: '✅ Usuário admin corrigido com sucesso!',
                detalhes: {
                    id: atualizado.id,
                    email: email,
                    nome: nome,
                    senha: senha,
                    hash_preview: senhaHash.substring(0, 30) + '...'
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

            console.log('✅ Usuário criado!');

            return Response.json({
                success: true,
                message: '✅ Usuário admin criado com sucesso!',
                detalhes: {
                    id: novoUsuario.id,
                    email: email,
                    nome: nome,
                    senha: senha,
                    hash_preview: senhaHash.substring(0, 30) + '...'
                }
            });
        }

    } catch (error) {
        console.error('💥 Erro completo:', error);
        console.error('📋 Stack:', error.stack);
        
        return Response.json({ 
            success: false, 
            error: error.message,
            tipo: error.name,
            detalhes: error.stack
        }, { status: 500 });
    }
});