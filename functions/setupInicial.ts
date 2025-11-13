import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Deletar todos os registros antigos
        const usuariosAntigos = await base44.asServiceRole.entities.UsuarioCustom.list();
        for (const user of usuariosAntigos) {
            await base44.asServiceRole.entities.UsuarioCustom.delete(user.id);
        }

        const dadosAntigos = await base44.asServiceRole.entities.DadosUsuario.list();
        for (const dados of dadosAntigos) {
            await base44.asServiceRole.entities.DadosUsuario.delete(dados.id);
        }

        // Criar usuários do zero
        const usuarios = [
            {
                email: 'atendimento@pandorainternet.net',
                senha: '123456',
                nome: 'Admin Sistema',
                tipo_acesso: 'admin'
            },
            {
                email: 'pandorainfoporto@gmail.com',
                senha: 'redotk6969',
                nome: 'Cliente Teste',
                tipo_acesso: 'cliente',
                cliente_id: '69134a320d00f447094e2b07'
            }
        ];

        const criados = [];

        for (const userConfig of usuarios) {
            const senhaHash = bcrypt.hashSync(userConfig.senha, 10);

            const usuario = await base44.asServiceRole.entities.UsuarioCustom.create({
                email: userConfig.email.toLowerCase().trim(),
                senha_hash: senhaHash
            });

            await base44.asServiceRole.entities.DadosUsuario.create({
                usuario_id: usuario.id,
                nome: userConfig.nome,
                tipo_acesso: userConfig.tipo_acesso,
                cliente_id: userConfig.cliente_id || null,
                ativo: true
            });

            criados.push({
                email: userConfig.email,
                nome: userConfig.nome,
                tipo: userConfig.tipo_acesso
            });
        }

        return Response.json({
            success: true,
            message: 'Setup concluído com sucesso!',
            usuarios_criados: criados
        });

    } catch (error) {
        return Response.json({ 
            success: false, 
            error: error.message
        }, { status: 500 });
    }
});