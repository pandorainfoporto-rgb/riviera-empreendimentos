import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const userAdmin = await base44.auth.me();
        
        if (!userAdmin || userAdmin.role !== 'admin') {
            return Response.json({ 
                success: false,
                error: 'Apenas administradores podem convidar usuários' 
            }, { status: 403 });
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
        const usuariosExistentes = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
        
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

        // Definir role do Base44
        const roleBase44 = tipo_acesso === 'admin' ? 'admin' : 'user';

        // Dados do usuário
        const dadosUsuario = {
            email: email.toLowerCase(),
            full_name: nome_completo,
            role: roleBase44,
            tipo_acesso: tipo_acesso,
            telefone: telefone || '',
            cargo: cargo || '',
            ativo: true
        };

        if (grupo_id) dadosUsuario.grupo_id = grupo_id;
        if (imobiliaria_id) dadosUsuario.imobiliaria_id = imobiliaria_id;

        // Criar usuário usando inviteUser (cria na tabela User e envia email automático do Base44)
        console.log('📧 Convidando usuário via Base44...');
        
        const conviteResult = await fetch(`https://base44.app/api/apps/${Deno.env.get('BASE44_APP_ID')}/users/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization')
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                full_name: nome_completo,
                role: roleBase44
            })
        });

        if (!conviteResult.ok) {
            const errorText = await conviteResult.text();
            console.error('Erro ao convidar:', errorText);
            return Response.json({ 
                success: false,
                error: 'Erro ao criar usuário: ' + errorText
            }, { status: 500 });
        }

        const conviteData = await conviteResult.json();
        console.log('✅ Usuário convidado:', conviteData);

        // Atualizar com dados adicionais
        if (conviteData.user && conviteData.user.id) {
            await base44.asServiceRole.entities.User.update(conviteData.user.id, dadosUsuario);
            console.log('✅ Dados adicionais salvos');
        }

        return Response.json({
            success: true,
            message: `Usuário ${nome_completo} convidado com sucesso! Um email foi enviado para ${email} com instruções de acesso.`,
            usuario: {
                id: conviteData.user?.id,
                nome: nome_completo,
                email: email,
                role: roleBase44,
                tipo_acesso: tipo_acesso
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Erro desconhecido'
        }, { status: 500 });
    }
});