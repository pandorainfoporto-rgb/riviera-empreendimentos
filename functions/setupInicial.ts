import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        console.log('🚀 SETUP INICIAL - Iniciando...');

        // 1. Limpar tudo primeiro
        console.log('🧹 Limpando registros antigos...');
        
        const usuariosExistentes = await base44.asServiceRole.entities.UsuarioCustom.filter({});
        for (const user of usuariosExistentes) {
            await base44.asServiceRole.entities.UsuarioCustom.delete(user.id);
        }

        const dadosExistentes = await base44.asServiceRole.entities.DadosUsuario.filter({});
        for (const dado of dadosExistentes) {
            await base44.asServiceRole.entities.DadosUsuario.delete(dado.id);
        }

        console.log('✅ Registros antigos limpos!');

        // 2. Criar usuários com bcrypt
        console.log('👤 Criando usuários com bcrypt...');

        // Admin
        const hashAdmin = bcrypt.hashSync('123456', 10);
        console.log('🔐 Hash Admin gerado:', hashAdmin.substring(0, 20) + '...');
        
        const usuarioAdmin = await base44.asServiceRole.entities.UsuarioCustom.create({
            email: 'atendimento@pandorainternet.net',
            senha_hash: hashAdmin
        });

        await base44.asServiceRole.entities.DadosUsuario.create({
            usuario_id: usuarioAdmin.id,
            nome: 'Administrador Sistema',
            tipo_acesso: 'admin',
            ativo: true
        });

        console.log('✅ Admin criado:', usuarioAdmin.email);

        // Cliente
        const hashCliente = bcrypt.hashSync('redotk6969', 10);
        console.log('🔐 Hash Cliente gerado:', hashCliente.substring(0, 20) + '...');
        
        const usuarioCliente = await base44.asServiceRole.entities.UsuarioCustom.create({
            email: 'pandorainfoporto@gmail.com',
            senha_hash: hashCliente
        });

        await base44.asServiceRole.entities.DadosUsuario.create({
            usuario_id: usuarioCliente.id,
            nome: 'Cliente Porto',
            tipo_acesso: 'cliente',
            cliente_id: '69134a320d00f447094e2b07',
            ativo: true
        });

        console.log('✅ Cliente criado:', usuarioCliente.email);

        console.log('🎉 SETUP CONCLUÍDO COM SUCESSO!');

        return Response.json({
            success: true,
            message: 'Sistema inicializado com sucesso!',
            usuarios_criados: [
                {
                    email: usuarioAdmin.email,
                    tipo: 'admin',
                    senha: '123456'
                },
                {
                    email: usuarioCliente.email,
                    tipo: 'cliente',
                    senha: 'redotk6969'
                }
            ]
        });

    } catch (error) {
        console.error('💥 ERRO NO SETUP:', error);
        return Response.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});