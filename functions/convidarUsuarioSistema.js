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

        console.log('🔍 Verificando se email já existe...');
        
        const usuariosExistentes = await base44.asServiceRole.entities.UsuarioSistema.filter({ email: email.toLowerCase() });
        console.log('✅ Verificação UsuarioSistema OK. Encontrados:', usuariosExistentes?.length || 0);
        
        if (usuariosExistentes && usuariosExistentes.length > 0) {
            console.log('❌ Email já existe em UsuarioSistema');
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado como Usuário do Sistema' 
            }, { status: 400 });
        }

        console.log('🔍 Verificando UserClient...');
        
        const clientesExistentes = await base44.asServiceRole.entities.UserClient.filter({ email: email.toLowerCase() });
        console.log('✅ Verificação UserClient OK. Encontrados:', clientesExistentes?.length || 0);
        
        if (clientesExistentes && clientesExistentes.length > 0) {
            console.log('❌ Email já existe em UserClient');
            return Response.json({ 
                success: false,
                error: 'Este email já está cadastrado no Portal do Cliente' 
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

        console.log('💾 Tentando criar usuário...');

        const novoUsuario = await base44.asServiceRole.entities.UsuarioSistema.create(dadosUsuario);
        console.log('✅ Usuário criado com sucesso! ID:', novoUsuario?.id);

        let emailEnviado = false;

        console.log('📧 Tentando enviar email...');
        
        try {
            const appOrigin = req.headers.get('origin') || 'https://app.base44.com';
            const linkAcesso = tipo_acesso === 'imobiliaria' 
                ? `${appOrigin}/#/PortalImobiliariaLogin`
                : `${appOrigin}/#/LoginSistema`;

            console.log('📧 Link de acesso:', linkAcesso);
            console.log('📧 Chamando integrations.Core.SendEmail (SEM SERVICE ROLE)...');
            
            const emailResult = await base44.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: email,
                subject: 'Bem-vindo à Riviera Incorporadora',
                body: `Olá ${nome_completo}!

Você foi convidado para acessar o sistema da Riviera Incorporadora.

Login: ${email}
Senha Temporária: ${senhaTemporaria}

⚠️ Importante: Altere sua senha no primeiro acesso!

Acesse: ${linkAcesso}

Riviera Incorporadora © ${new Date().getFullYear()}`
            });
            
            console.log('✅ SendEmail retornou:', JSON.stringify(emailResult));
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
            console.error('Código:', emailError.code);
            console.error('Response:', emailError.response);
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