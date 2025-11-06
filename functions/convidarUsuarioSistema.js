import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔵 Iniciando função convidarUsuarioSistema');
    
    try {
        const base44 = createClientFromRequest(req);
        const userAdmin = await base44.auth.me();
        
        console.log('👤 Usuário autenticado:', userAdmin?.email);
        
        if (!userAdmin) {
            console.log('❌ Não autenticado');
            return Response.json({ 
                success: false,
                error: 'Não autenticado' 
            }, { status: 401 });
        }

        const body = await req.json();
        console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
        
        const { email, nome_completo, tipo_acesso, grupo_id, imobiliaria_id, telefone, cargo } = body;

        if (!email || !nome_completo || !tipo_acesso) {
            console.log('❌ Campos obrigatórios faltando');
            return Response.json({ 
                success: false,
                error: 'Email, nome completo e tipo de acesso são obrigatórios' 
            }, { status: 400 });
        }

        console.log('🔍 Verificando se email já existe...');
        const usuariosExistentes = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
        console.log('✅ Usuários encontrados:', usuariosExistentes.length);
        
        if (usuariosExistentes.length > 0) {
            console.log('❌ Email já cadastrado');
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado no sistema' 
            }, { status: 400 });
        }

        if (tipo_acesso === 'imobiliaria' && !imobiliaria_id) {
            return Response.json({ 
                success: false,
                error: 'Selecione uma imobiliária para vincular' 
            }, { status: 400 });
        }

        console.log('🔑 Gerando senha temporária...');
        const senhaTemporaria = crypto.randomUUID().slice(0, 12).toUpperCase();
        console.log('✅ Senha gerada');

        console.log('💾 Criando registro na tabela User...');
        const dadosUsuario = {
            email: email.toLowerCase(),
            full_name: nome_completo,
            role: tipo_acesso === 'admin' ? 'admin' : 'user',
            tipo_acesso: tipo_acesso,
            telefone: telefone || '',
            cargo: cargo || '',
            ativo: true
        };

        if (grupo_id) dadosUsuario.grupo_id = grupo_id;
        if (imobiliaria_id) dadosUsuario.imobiliaria_id = imobiliaria_id;

        console.log('📝 Dados do usuário:', JSON.stringify(dadosUsuario, null, 2));

        // Criar o usuário na tabela User
        const novoUsuario = await base44.asServiceRole.entities.User.create(dadosUsuario);
        console.log('✅ Usuário criado na tabela User:', novoUsuario.id);

        console.log('✅ SUCESSO - Usuário cadastrado!');

        return Response.json({
            success: true,
            message: `✅ Usuário ${nome_completo} pré-cadastrado com sucesso!`,
            detalhes: `
📋 PRÓXIMOS PASSOS IMPORTANTES:

1️⃣ Acesse o Dashboard do Base44
2️⃣ Vá em Settings → Users → Invite User
3️⃣ Convide o email: ${email}
4️⃣ O usuário receberá email do Base44 para criar senha
5️⃣ Senha temporária de backup: ${senhaTemporaria}

⚠️ O usuário só poderá fazer login após ser convidado através do Dashboard do Base44.

Os dados já foram salvos no sistema e serão associados automaticamente quando o convite for aceito.
            `.trim(),
            usuario: {
                id: novoUsuario.id,
                nome: nome_completo,
                email: email,
                tipo_acesso: tipo_acesso,
                senha_temporaria: senhaTemporaria
            },
            requer_convite_dashboard: true
        });

    } catch (error) {
        console.error('❌ ERRO:', error);
        console.error('Stack:', error.stack);
        return Response.json({ 
            success: false,
            error: 'Erro ao processar: ' + error.message
        }, { status: 500 });
    }
});