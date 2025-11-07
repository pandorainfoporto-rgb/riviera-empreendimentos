import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || (user.role !== 'admin' && user.tipo_acesso !== 'admin')) {
            return Response.json({ 
                success: false,
                error: 'Apenas administradores podem convidar usuários' 
            }, { status: 403 });
        }

        const { 
            email, 
            full_name, 
            tipo_acesso, 
            grupo_id,
            cliente_id,
            imobiliaria_id,
            telefone,
            cargo 
        } = await req.json();

        if (!email || !full_name || !tipo_acesso) {
            return Response.json({ 
                success: false,
                error: 'Email, nome e tipo de acesso são obrigatórios' 
            }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return Response.json({ 
                success: false,
                error: 'Email inválido' 
            }, { status: 400 });
        }

        // Verificar se já existe usuário com este email
        const { data: usuariosExistentes } = await base44.asServiceRole.client
            .from('User')
            .select('*')
            .eq('email', email.toLowerCase())
            .limit(1);

        if (usuariosExistentes && usuariosExistentes.length > 0) {
            return Response.json({ 
                success: false,
                error: 'Já existe um usuário com este email' 
            }, { status: 400 });
        }

        if (tipo_acesso === 'cliente' && !cliente_id) {
            return Response.json({ 
                success: false,
                error: 'Selecione um cliente para vincular' 
            }, { status: 400 });
        }

        if (tipo_acesso === 'imobiliaria' && !imobiliaria_id) {
            return Response.json({ 
                success: false,
                error: 'Selecione uma imobiliária para vincular' 
            }, { status: 400 });
        }

        // Gerar token único para convite
        const token = crypto.randomUUID();

        // Criar usuário temporário no auth (senha será definida no aceite)
        const senhaTemporaria = crypto.randomUUID();
        
        const { data: authData, error: authError } = await base44.asServiceRole.client.auth.admin.createUser({
            email: email.toLowerCase(),
            password: senhaTemporaria,
            email_confirm: true,
            user_metadata: { 
                full_name: full_name,
                tipo_acesso: tipo_acesso
            }
        });

        if (authError || !authData?.user) {
            console.error('Erro ao criar usuário:', authError);
            return Response.json({ 
                success: false,
                error: authError?.message || 'Erro ao criar usuário no sistema de autenticação' 
            }, { status: 500 });
        }

        // Atualizar User com dados do convite
        const updateData = {
            tipo_acesso: tipo_acesso,
            telefone: telefone || null,
            cargo: cargo || null,
            ativo: false, // Inativo até aceitar convite
            convite_token: token,
            convite_enviado: true,
            convite_aceito: false,
            convite_data_envio: new Date().toISOString(),
            primeiro_acesso: true,
        };

        if (grupo_id) updateData.grupo_id = grupo_id;
        if (cliente_id) updateData.cliente_id = cliente_id;
        if (imobiliaria_id) updateData.imobiliaria_id = imobiliaria_id;

        const { error: updateError } = await base44.asServiceRole.client
            .from('User')
            .update(updateData)
            .eq('id', authData.user.id);

        if (updateError) {
            console.error('Erro ao atualizar dados do usuário:', updateError);
            return Response.json({ 
                success: false,
                error: 'Erro ao configurar dados do usuário' 
            }, { status: 500 });
        }

        // Obter a URL correta da aplicação
        const appOrigin = req.headers.get('origin') || req.headers.get('referer')?.split('/#/')[0] || 'https://app.base44.com';
        const conviteUrl = `${appOrigin}/#/AceitarConvite?token=${token}`;

        console.log('URL do convite gerada:', conviteUrl);
        console.log('Origin:', req.headers.get('origin'));
        console.log('Referer:', req.headers.get('referer'));

        // Definir conteúdo do email baseado no tipo de acesso
        let assuntoEmail = '';
        let mensagemEmail = '';
        let descricaoAcesso = '';

        switch (tipo_acesso) {
            case 'admin':
                assuntoEmail = 'Convite - Acesso Administrativo - Riviera Incorporadora';
                descricaoAcesso = `
                    <p>Você foi convidado para fazer parte da equipe da <strong>Riviera Incorporadora</strong> como <strong>Administrador</strong>.</p>
                    <p><strong>Com seu acesso você terá:</strong></p>
                    <ul>
                        <li>✅ Controle total sobre o sistema</li>
                        <li>✅ Acesso a todos os módulos e funcionalidades</li>
                        <li>✅ Gerenciamento de usuários e permissões</li>
                        <li>✅ Relatórios e dashboards executivos</li>
                    </ul>
                `;
                break;
            case 'usuario':
                assuntoEmail = 'Convite - Acesso ao Sistema - Riviera Incorporadora';
                descricaoAcesso = `
                    <p>Você foi convidado para fazer parte da equipe da <strong>Riviera Incorporadora</strong>.</p>
                    <p><strong>Dados do seu acesso:</strong></p>
                    <ul>
                        <li><strong>Cargo:</strong> ${cargo || 'Usuário Operacional'}</li>
                        <li><strong>Email:</strong> ${email}</li>
                    </ul>
                `;
                break;
            case 'cliente':
                assuntoEmail = 'Bem-vindo ao Portal do Cliente - Riviera Incorporadora';
                descricaoAcesso = `
                    <p>Seja bem-vindo(a) ao <strong>Portal do Cliente</strong> da Riviera Incorporadora!</p>
                    <p>No portal você poderá acompanhar sua unidade, consultar pagamentos, ver o andamento da obra e muito mais.</p>
                `;
                break;
            case 'imobiliaria':
                assuntoEmail = 'Bem-vindo ao Portal da Imobiliária - Riviera Incorporadora';
                descricaoAcesso = `
                    <p>Seja bem-vindo(a) ao <strong>Portal da Imobiliária</strong> da Riviera Incorporadora!</p>
                    <p>No portal você poderá visualizar lotes, cadastrar leads e gerenciar comissões.</p>
                `;
                break;
        }

        mensagemEmail = `
            <h2 style="color: #922B3E;">Olá ${full_name}!</h2>
            ${descricaoAcesso}
            
            <p><strong>Para ativar seu acesso, clique no botão abaixo e crie sua senha:</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${conviteUrl}" 
                   style="background-color: #922B3E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    CRIAR MINHA SENHA DE ACESSO
                </a>
            </div>
            
            <p style="font-size: 13px; color: #666; background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all;">
                <strong>📎 Ou copie e cole este link no navegador:</strong><br/>
                ${conviteUrl}
            </p>
        `;

        // Enviar email
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: email,
                subject: assuntoEmail,
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); border-radius: 10px;">
                            <div style="background: white; width: 80px; height: 80px; margin: 0 auto; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <span style="color: #922B3E; font-size: 40px; font-weight: bold;">R</span>
                            </div>
                            <h1 style="color: white; margin-top: 20px; font-size: 24px;">Riviera Incorporadora</h1>
                        </div>
                        
                        ${mensagemEmail}
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 30px; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; font-size: 14px; color: #856404;">
                                <strong>⚠️ Importante:</strong> Este convite expira em 7 dias. Após criar sua senha, você poderá acessar o sistema imediatamente.
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid #ddd; margin-top: 40px; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p>Este é um email automático, por favor não responda.</p>
                            <p>© ${new Date().getFullYear()} Riviera Incorporadora. Todos os direitos reservados.</p>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
            // Mesmo com erro no email, considerar sucesso pois o usuário foi criado
            return Response.json({
                success: true,
                message: 'Usuário criado mas houve erro ao enviar email. Reenvie o convite.',
                usuario_id: authData.user.id,
                email_enviado: false,
                warning: 'Email não foi enviado'
            });
        }

        return Response.json({
            success: true,
            message: 'Convite enviado com sucesso!',
            usuario_id: authData.user.id,
            email_enviado: true,
            convite_url: conviteUrl
        });

    } catch (error) {
        console.error('Erro ao convidar usuário:', error);
        return Response.json({ 
            success: false,
            error: `Erro ao processar convite: ${error.message}` 
        }, { status: 500 });
    }
});