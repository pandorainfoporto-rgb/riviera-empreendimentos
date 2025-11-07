import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { token, senha } = await req.json();

        if (!token || !senha) {
            return Response.json({ 
                success: false, 
                error: 'Token e senha são obrigatórios' 
            }, { status: 400 });
        }

        if (senha.length < 6) {
            return Response.json({ 
                success: false, 
                error: 'A senha deve ter pelo menos 6 caracteres' 
            }, { status: 400 });
        }

        // Buscar convite
        const convites = await base44.asServiceRole.entities.ConviteUsuario.filter({ token });

        if (!convites || convites.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Convite inválido' 
            }, { status: 400 });
        }

        const convite = convites[0];

        // Verificar se já foi aceito
        if (convite.aceito) {
            return Response.json({ 
                success: false,
                error: 'Este convite já foi utilizado' 
            }, { status: 400 });
        }

        // Verificar expiração
        const agora = new Date();
        const dataExpiracao = new Date(convite.data_expiracao);
        
        if (agora > dataExpiracao) {
            return Response.json({ 
                success: false,
                error: 'Este convite expirou' 
            }, { status: 400 });
        }

        // Criar usuário no auth
        const { data: authData, error: authError } = await base44.asServiceRole.client.auth.admin.createUser({
            email: convite.email,
            password: senha,
            email_confirm: true,
            user_metadata: { 
                full_name: convite.full_name
            }
        });

        if (authError || !authData?.user) {
            console.error('Erro ao criar usuário:', authError);
            return Response.json({ 
                success: false,
                error: 'Erro ao criar acesso. Tente novamente.' 
            }, { status: 500 });
        }

        // Atualizar registro User com os dados do convite
        const updateData = {
            tipo_acesso: convite.tipo_acesso,
            grupo_id: convite.grupo_id,
            cliente_id: convite.cliente_id,
            imobiliaria_id: convite.imobiliaria_id,
            telefone: convite.telefone,
            cargo: convite.cargo,
            ativo: true,
            primeiro_acesso: false
        };

        const { error: updateError } = await base44.asServiceRole.client
            .from('User')
            .update(updateData)
            .eq('id', authData.user.id);

        if (updateError) {
            console.error('Erro ao atualizar User:', updateError);
        }

        // Marcar convite como aceito
        await base44.asServiceRole.entities.ConviteUsuario.update(convite.id, {
            aceito: true,
            data_aceite: new Date().toISOString(),
            user_id_criado: authData.user.id
        });

        // Enviar email de confirmação
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: convite.email,
                subject: '✅ Acesso Criado - Riviera Incorporadora',
                body: `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #922B3E;">Bem-vindo(a), ${convite.full_name}!</h2>
                        
                        <p>Seu acesso ao sistema da <strong>Riviera Incorporadora</strong> foi criado com sucesso!</p>
                        
                        <p><strong>Suas credenciais:</strong></p>
                        <ul>
                            <li><strong>Email:</strong> ${convite.email}</li>
                            <li><strong>Tipo de Acesso:</strong> ${tiposAcessoLabels[convite.tipo_acesso] || convite.tipo_acesso}</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${origin}" 
                               style="background-color: #922B3E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                ACESSAR O SISTEMA
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
                            © ${new Date().getFullYear()} Riviera Incorporadora
                        </p>
                    </body>
                    </html>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
        }

        return Response.json({ 
            success: true,
            message: 'Acesso criado com sucesso!',
            user_id: authData.user.id
        });

    } catch (error) {
        console.error('Erro ao finalizar convite:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Erro ao processar convite' 
        }, { status: 500 });
    }
});