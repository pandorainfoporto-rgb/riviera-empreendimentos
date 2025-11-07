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

        // Verificar convites pendentes
        const convitesExistentes = await base44.asServiceRole.entities.ConviteUsuario.filter({ 
            email: email.toLowerCase(),
            aceito: false 
        });

        if (convitesExistentes && convitesExistentes.length > 0) {
            return Response.json({ 
                success: false,
                error: 'Já existe um convite pendente para este email.' 
            }, { status: 400 });
        }

        // Gerar token e datas
        const token = crypto.randomUUID();
        const dataEnvio = new Date();
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 7);

        // Criar convite
        const convite = await base44.asServiceRole.entities.ConviteUsuario.create({
            email: email.toLowerCase(),
            full_name,
            tipo_acesso,
            grupo_id: grupo_id || null,
            cliente_id: cliente_id || null,
            imobiliaria_id: imobiliaria_id || null,
            telefone: telefone || null,
            cargo: cargo || null,
            token,
            data_envio: dataEnvio.toISOString(),
            data_expiracao: dataExpiracao.toISOString(),
            aceito: false,
            convidado_por: user.email
        });

        // Obter URL do convite
        const origin = req.headers.get('origin') || 'https://app.base44.com';
        const conviteUrl = `${origin}/#/AceitarConvite?token=${token}`;

        // Tentar enviar email (pode falhar se email externo)
        let emailEnviado = false;
        try {
            const tiposAcessoLabels = {
                'admin': 'Administrador',
                'usuario': 'Usuário',
                'cliente': 'Cliente',
                'imobiliaria': 'Imobiliária'
            };

            await base44.asServiceRole.integrations.Core.SendEmail({
                from_name: 'Riviera Incorporadora',
                to: email,
                subject: `Convite - ${tiposAcessoLabels[tipo_acesso]} - Riviera Incorporadora`,
                body: `
                    <!DOCTYPE html>
                    <html>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 30px;">
                            <h2 style="color: #922B3E;">Olá ${full_name}!</h2>
                            
                            <p>Você foi convidado para acessar o sistema da <strong>Riviera Incorporadora</strong> como <strong>${tiposAcessoLabels[tipo_acesso]}</strong>.</p>
                            
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="${conviteUrl}" 
                                   style="background-color: #922B3E; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                    CRIAR MINHA SENHA
                                </a>
                            </div>
                            
                            <p style="font-size: 13px; color: #666;">
                                Link: ${conviteUrl}
                            </p>
                            
                            <p style="color: #856404; font-size: 14px;">
                                ⚠️ Este convite expira em 7 dias.
                            </p>
                        </div>
                    </body>
                    </html>
                `
            });
            emailEnviado = true;
        } catch (emailError) {
            console.error('Não foi possível enviar email (usuário externo):', emailError);
            emailEnviado = false;
        }

        return Response.json({
            success: true,
            message: emailEnviado 
                ? 'Convite enviado com sucesso!' 
                : 'Convite criado! Copie o link abaixo e envie manualmente ao usuário.',
            convite_id: convite.id,
            email_enviado: emailEnviado,
            convite_url: conviteUrl,
            expira_em: dataExpiracao.toISOString()
        });

    } catch (error) {
        console.error('Erro ao enviar convite:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Erro ao processar convite' 
        }, { status: 500 });
    }
});