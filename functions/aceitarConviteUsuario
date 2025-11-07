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

        // Buscar usuário pelo token
        const { data: usuarios, error } = await base44.asServiceRole.client
            .from('User')
            .select('*')
            .eq('convite_token', token)
            .limit(1);

        if (error || !usuarios || usuarios.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Convite inválido ou expirado' 
            }, { status: 400 });
        }

        const usuario = usuarios[0];

        // Verificar se já foi aceito
        if (usuario.convite_aceito) {
            return Response.json({ 
                success: false,
                error: 'Este convite já foi utilizado' 
            }, { status: 400 });
        }

        // Atualizar senha no auth
        const { error: updateAuthError } = await base44.asServiceRole.client.auth.admin.updateUserById(
            usuario.id,
            { password: senha }
        );

        if (updateAuthError) {
            console.error('Erro ao atualizar senha:', updateAuthError);
            return Response.json({ 
                success: false,
                error: 'Erro ao criar senha. Tente novamente.' 
            }, { status: 500 });
        }

        // Atualizar User
        const { error: updateUserError } = await base44.asServiceRole.client
            .from('User')
            .update({
                convite_aceito: true,
                convite_data_aceite: new Date().toISOString(),
                convite_token: null,
                ativo: true,
                primeiro_acesso: false
            })
            .eq('id', usuario.id);

        if (updateUserError) {
            console.error('Erro ao atualizar usuário:', updateUserError);
            return Response.json({ 
                success: false,
                error: 'Erro ao processar convite' 
            }, { status: 500 });
        }

        // Enviar email de confirmação
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: usuario.email,
                subject: 'Acesso Criado com Sucesso - Riviera',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #922B3E;">Olá ${usuario.full_name}!</h2>
                        
                        <p>Seu acesso ao sistema da <strong>Riviera Incorporadora</strong> foi criado com sucesso!</p>
                        
                        <p><strong>Suas credenciais:</strong></p>
                        <ul>
                            <li><strong>Email:</strong> ${usuario.email}</li>
                            <li><strong>Tipo de Acesso:</strong> ${usuario.tipo_acesso === 'admin' ? 'Administrador' : usuario.tipo_acesso === 'usuario' ? 'Usuário' : usuario.tipo_acesso}</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${req.headers.get('origin') || 'https://app.base44.com'}" 
                               style="background-color: #922B3E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                ACESSAR O SISTEMA
                            </a>
                        </div>
                        
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            © ${new Date().getFullYear()} Riviera Incorporadora
                        </p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
        }

        return Response.json({ 
            success: true,
            message: 'Senha criada com sucesso! Você já pode fazer login.',
            email: usuario.email
        });

    } catch (error) {
        console.error('Erro ao aceitar convite:', error);
        return Response.json({ 
            success: false,
            error: 'Erro ao processar convite. Tente novamente.' 
        }, { status: 500 });
    }
});