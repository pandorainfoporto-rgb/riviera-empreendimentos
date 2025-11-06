import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔵 ============ INÍCIO FUNÇÃO ===========');
    
    try {
        const base44 = createClientFromRequest(req);
        console.log('✅ Base44 client criado');
        
        const user = await base44.auth.me();
        console.log('✅ Auth me executado:', user?.email);
        
        if (!user) {
            console.log('❌ Usuário não autenticado');
            return Response.json({ 
                success: false,
                error: 'Usuário não autenticado' 
            }, { status: 401 });
        }

        const body = await req.json();
        console.log('✅ Body recebido:', JSON.stringify(body));

        const { email, nome_completo, tipo_acesso, grupo_id, imobiliaria_id, telefone, cargo } = body;

        if (!email || !nome_completo || !tipo_acesso) {
            console.log('❌ Campos obrigatórios faltando');
            return Response.json({ 
                success: false,
                error: 'Email, nome e tipo de acesso são obrigatórios' 
            }, { status: 400 });
        }

        console.log('🔍 Verificando se email já existe em UsuarioSistema...');
        const usuariosExistentes = await base44.asServiceRole.entities.UsuarioSistema.filter({ email: email.toLowerCase() });
        console.log('✅ Verificação UsuarioSistema OK. Encontrados:', usuariosExistentes?.length || 0);
        
        if (usuariosExistentes && usuariosExistentes.length > 0) {
            console.log('❌ Email já existe em UsuarioSistema');
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado como Usuário do Sistema' 
            }, { status: 400 });
        }

        console.log('🔍 Verificando se email já existe em UserClient...');
        const clientesExistentes = await base44.asServiceRole.entities.UserClient.filter({ email: email.toLowerCase() });
        console.log('✅ Verificação UserClient OK. Encontrados:', clientesExistentes?.length || 0);
        
        if (clientesExistentes && clientesExistentes.length > 0) {
            console.log('❌ Email já existe em UserClient');
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado no Portal do Cliente' 
            }, { status: 400 });
        }

        console.log('🔍 Verificando se email já existe na tabela User...');
        const usuariosAuth = await base44.asServiceRole.entities.User.filter({ email: email.toLowerCase() });
        console.log('✅ Verificação User OK. Encontrados:', usuariosAuth?.length || 0);
        
        if (usuariosAuth && usuariosAuth.length > 0) {
            console.log('❌ Email já existe na tabela User');
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
        const senhaTemporaria = crypto.randomUUID().slice(0, 10).toUpperCase();
        console.log('✅ Senha gerada');

        // 1. Primeiro criar usuário no sistema de autenticação
        console.log('👤 Criando usuário no sistema de autenticação...');
        let authData;
        try {
            const { data: authResponse, error: authError } = await base44.asServiceRole.client.auth.admin.createUser({
                email: email.toLowerCase(),
                password: senhaTemporaria,
                email_confirm: true,
                user_metadata: { 
                    full_name: nome_completo,
                    tipo_acesso: tipo_acesso
                }
            });

            if (authError || !authResponse?.user) {
                console.error('❌ Erro ao criar usuário no auth:', authError);
                return Response.json({ 
                    success: false,
                    error: 'Erro ao criar usuário no sistema de autenticação: ' + (authError?.message || 'Erro desconhecido')
                }, { status: 500 });
            }

            authData = authResponse;
            console.log('✅ Usuário criado no auth com ID:', authData.user.id);

        } catch (authError) {
            console.error('❌ Erro ao criar usuário no auth:', authError.message);
            return Response.json({ 
                success: false,
                error: 'Erro ao criar usuário no sistema de autenticação: ' + authError.message
            }, { status: 500 });
        }

        // 2. Atualizar tabela User com informações adicionais
        console.log('📝 Atualizando tabela User...');
        try {
            const updateData = {
                tipo_acesso: tipo_acesso,
                ativo: true,
            };

            if (telefone) updateData.telefone = telefone;
            if (cargo) updateData.cargo = cargo;
            if (grupo_id) updateData.grupo_id = grupo_id;
            if (imobiliaria_id) updateData.imobiliaria_id = imobiliaria_id;

            await base44.asServiceRole.client
                .from('User')
                .update(updateData)
                .eq('id', authData.user.id);

            console.log('✅ Tabela User atualizada');
        } catch (updateError) {
            console.error('⚠️ Erro ao atualizar User:', updateError.message);
        }

        // 3. Criar registro em UsuarioSistema
        console.log('💾 Criando registro em UsuarioSistema...');
        const dadosUsuario = {
            email: email.toLowerCase(),
            nome_completo,
            tipo_acesso,
            senha_temporaria: senhaTemporaria,
            senha_definida: false,
            primeiro_acesso: true,
            ativo: true,
            convite_enviado: false,
            data_convite: new Date().toISOString(),
        };

        if (telefone) dadosUsuario.telefone = telefone;
        if (cargo) dadosUsuario.cargo = cargo;
        if (grupo_id) dadosUsuario.grupo_id = grupo_id;
        if (imobiliaria_id) dadosUsuario.imobiliaria_id = imobiliaria_id;

        const novoUsuario = await base44.asServiceRole.entities.UsuarioSistema.create(dadosUsuario);
        console.log('✅ UsuarioSistema criado com ID:', novoUsuario?.id);

        // 4. Enviar email de boas-vindas
        let emailEnviado = false;
        console.log('📧 Tentando enviar email...');
        
        try {
            const appOrigin = req.headers.get('origin') || 'https://app.base44.com';
            const linkAcesso = tipo_acesso === 'imobiliaria' 
                ? `${appOrigin}/#/PortalImobiliariaLogin`
                : `${appOrigin}/#/LoginSistema`;

            console.log('📧 Link de acesso:', linkAcesso);
            console.log('📧 Enviando email via Core.SendEmail...');
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: email,
                subject: 'Bem-vindo à Riviera Incorporadora',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #922B3E;">Olá ${nome_completo}!</h2>
                        <p>Você foi convidado para acessar o sistema da Riviera Incorporadora.</p>
                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                            <p><strong>Login:</strong> ${email}</p>
                            <p><strong>Senha Temporária:</strong> <span style="font-size: 18px; color: #922B3E; font-weight: bold;">${senhaTemporaria}</span></p>
                        </div>
                        <p style="color: #d97706;">⚠️ <strong>Importante:</strong> Altere sua senha no primeiro acesso!</p>
                        <p><a href="${linkAcesso}" style="display: inline-block; background: #922B3E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">ACESSAR SISTEMA</a></p>
                        <p style="margin-top: 20px; font-size: 12px; color: #888;">Riviera Incorporadora © ${new Date().getFullYear()}</p>
                    </div>
                `
            });
            
            emailEnviado = true;
            console.log('✅ Email enviado com sucesso');

            await base44.asServiceRole.entities.UsuarioSistema.update(novoUsuario.id, {
                convite_enviado: true
            });

        } catch (emailError) {
            console.error('⚠️ Erro ao enviar email:');
            console.error('Tipo do erro:', emailError.constructor.name);
            console.error('Mensagem:', emailError.message);
            console.error('Stack:', emailError.stack);
        }

        console.log('✅ ========== FIM FUNÇÃO (SUCESSO) ==========');

        return Response.json({
            success: true,
            message: 'Usuário criado' + (emailEnviado ? ' e email enviado!' : ', mas email não foi enviado.'),
            usuario_id: novoUsuario.id,
            email_enviado: emailEnviado,
            senha_temporaria: senhaTemporaria
        });

    } catch (error) {
        console.error('❌❌❌ ERRO GERAL NÃO CAPTURADO:', error);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('Nome:', error.name);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Erro desconhecido',
            tipo: error.name,
            stack: error.stack
        }, { status: 500 });
    }
});