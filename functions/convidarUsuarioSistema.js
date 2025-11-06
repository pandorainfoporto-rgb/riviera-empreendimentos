import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const userAdmin = await base44.auth.me();
        
        if (!userAdmin) {
            return Response.json({ 
                success: false,
                error: 'Não autenticado' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { email, nome_completo, tipo_acesso, grupo_id, imobiliaria_id, telefone, cargo } = body;

        if (!email || !nome_completo || !tipo_acesso) {
            return Response.json({ 
                success: false,
                error: 'Campos obrigatórios faltando' 
            }, { status: 400 });
        }

        // Verificar se já existe
        const usuariosExistentes = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
        
        if (usuariosExistentes.length > 0) {
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado' 
            }, { status: 400 });
        }

        // Role do Base44
        const roleBase44 = tipo_acesso === 'admin' ? 'admin' : 'user';

        // PASSO 1: Convidar via API do Base44 (cria usuário E envia email automaticamente)
        const APP_ID = Deno.env.get('BASE44_APP_ID');
        const authHeader = req.headers.get('Authorization');

        const inviteResponse = await fetch(`https://base44.app/api/apps/${APP_ID}/users/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                full_name: nome_completo,
                role: roleBase44
            })
        });

        if (!inviteResponse.ok) {
            const errorText = await inviteResponse.text();
            console.error('Erro ao convidar:', errorText);
            return Response.json({ 
                success: false,
                error: 'Erro ao convidar usuário: ' + errorText
            }, { status: 500 });
        }

        const inviteData = await inviteResponse.json();
        console.log('✅ Usuário convidado, ID:', inviteData.user?.id);

        // PASSO 2: Atualizar com campos customizados
        if (inviteData.user?.id) {
            const updateData = {
                tipo_acesso: tipo_acesso,
                telefone: telefone || '',
                cargo: cargo || '',
                ativo: true
            };

            if (grupo_id) updateData.grupo_id = grupo_id;
            if (imobiliaria_id) updateData.imobiliaria_id = imobiliaria_id;

            // Aguardar 2 segundos para o usuário ser criado
            await new Promise(resolve => setTimeout(resolve, 2000));

            await base44.asServiceRole.entities.User.update(inviteData.user.id, updateData);
            console.log('✅ Campos customizados atualizados');
        }

        return Response.json({
            success: true,
            message: `✅ Usuário ${nome_completo} convidado com sucesso!`,
            detalhes: `Um email foi enviado para ${email} com instruções para criar senha e acessar o sistema.`,
            usuario: {
                id: inviteData.user?.id,
                nome: nome_completo,
                email: email,
                tipo_acesso: tipo_acesso
            }
        });

    } catch (error) {
        console.error('Erro:', error);
        return Response.json({ 
            success: false,
            error: 'Erro: ' + error.message
        }, { status: 500 });
    }
});