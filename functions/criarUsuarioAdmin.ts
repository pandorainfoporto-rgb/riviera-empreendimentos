import { createClient } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClient();
        const { email, senha, nome } = await req.json();

        console.log('👤 Criando usuário admin:', email);

        if (!email || !senha || !nome) {
            return Response.json({ 
                success: false, 
                error: 'Email, senha e nome são obrigatórios' 
            }, { status: 400 });
        }

        // Verificar se já existe
        const existentes = await base44.asServiceRole.entities.UsuarioCustom.filter({ 
            email: email.toLowerCase().trim() 
        });

        if (existentes && existentes.length > 0) {
            // Atualizar senha do existente
            console.log('📝 Usuário já existe, atualizando senha...');
            const senhaHash = bcrypt.hashSync(senha, 10);
            
            await base44.asServiceRole.entities.UsuarioCustom.update(existentes[0].id, {
                senha_hash: senhaHash,
                nome: nome,
                tipo_acesso: 'admin',
                ativo: true
            });

            console.log('✅ Senha atualizada com sucesso!');
            
            return Response.json({
                success: true,
                message: 'Usuário admin atualizado com sucesso!',
                usuario: {
                    id: existentes[0].id,
                    email: email,
                    nome: nome
                }
            });
        }

        // Criar novo usuário
        console.log('➕ Criando novo usuário...');
        const senhaHash = bcrypt.hashSync(senha, 10);

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
            message: 'Usuário admin criado com sucesso!',
            usuario: {
                id: novoUsuario.id,
                email: novoUsuario.email,
                nome: novoUsuario.nome
            }
        });

    } catch (error) {
        console.error('💥 Erro ao criar usuário:', error);
        return Response.json({ 
            success: false, 
            error: 'Erro ao criar usuário: ' + error.message 
        }, { status: 500 });
    }
});