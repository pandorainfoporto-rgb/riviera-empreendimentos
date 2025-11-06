import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { email, nome_completo, tipo_acesso, grupo_id, imobiliaria_id, telefone, cargo } = body;

        if (!email || !nome_completo || !tipo_acesso) {
            return Response.json({ 
                success: false,
                error: 'Email, nome e tipo de acesso são obrigatórios' 
            }, { status: 400 });
        }

        // Verificar se já existe
        const usuariosExistentes = await base44.asServiceRole.entities.UsuarioSistema.filter({ email: email.toLowerCase() });
        
        if (usuariosExistentes && usuariosExistentes.length > 0) {
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado' 
            }, { status: 400 });
        }

        if (tipo_acesso === 'imobiliaria' && !imobiliaria_id) {
            return Response.json({ 
                success: false,
                error: 'Selecione uma imobiliária para vincular' 
            }, { status: 400 });
        }

        // Gerar senha temporária
        const senhaTemporaria = crypto.randomUUID().slice(0, 10).toUpperCase();

        const dadosUsuario = {
            email: email.toLowerCase(),
            nome_completo,
            tipo_acesso,
            senha_temporaria: senhaTemporaria,
            senha_definida: false,
            primeiro_acesso: true,
            ativo: true,
            convite_enviado: true,
            data_convite: new Date().toISOString(),
        };

        if (telefone) dadosUsuario.telefone = telefone;
        if (cargo) dadosUsuario.cargo = cargo;
        if (grupo_id) dadosUsuario.grupo_id = grupo_id;
        if (imobiliaria_id) dadosUsuario.imobiliaria_id = imobiliaria_id;

        const novoUsuario = await base44.asServiceRole.entities.UsuarioSistema.create(dadosUsuario);

        return Response.json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            usuario: {
                id: novoUsuario.id,
                nome: nome_completo,
                email: email,
                senha_temporaria: senhaTemporaria,
                telefone: telefone || '',
            },
            instrucoes: `Envie as seguintes informações ao novo usuário:\n\nOlá ${nome_completo}!\n\nSeu acesso ao sistema Riviera foi criado:\n\nEmail: ${email}\nSenha Temporária: ${senhaTemporaria}\n\nLink de acesso: ${req.headers.get('origin') || 'https://app.base44.com'}/#/LoginSistema\n\n⚠️ Importante: Altere sua senha no primeiro acesso!`
        });

    } catch (error) {
        console.error('Erro:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Erro desconhecido'
        }, { status: 500 });
    }
});