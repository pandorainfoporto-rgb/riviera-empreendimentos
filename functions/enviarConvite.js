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

        // Validações
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

        // Verificar convites pendentes existentes
        const convitesExistentes = await base44.asServiceRole.entities.ConviteUsuario.filter({ 
            email: email.toLowerCase(),
            aceito: false 
        });

        if (convitesExistentes && convitesExistentes.length > 0) {
            return Response.json({ 
                success: false,
                error: 'Já existe um convite pendente para este email. Aguarde ou cancele o anterior.' 
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

        // Obter URL da aplicação
        const origin = req.headers.get('origin') || 'https://app.base44.com';
        const conviteUrl = `${origin}/#/AceitarConvite?token=${token}`;

        // Labels
        const tiposAcessoLabels = {
            'admin': 'Administrador',
            'usuario': 'Usuário',
            'cliente': 'Cliente',
            'imobiliaria': 'Imobiliária'
        };

        const assunto = `Convite - ${tiposAcessoLabels[tipo_acesso]} - Riviera Incorporadora`;

        // Enviar email
        await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Riviera Incorporadora',
            to: email,
            subject: assunto,
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                        <div style="background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); padding: 40px 20px; text-align: center;">
                            <div style="background: white; width: 80px; height: 80px; margin: 0 auto; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <span style="color: #922B3E; font-size: 40px; font-weight: bold;">R</span>
                            </div>
                            <h1 style="color: white; margin-top: 20px; font-size: 24px; margin-bottom: 0;">Riviera Incorporadora</h1>
                        </div>
                        
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #922B3E; margin-top: 0;">Olá ${full_name}!</h2>
                            
                            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                                Você foi convidado para acessar o sistema da <strong>Riviera Incorporadora</strong> como <strong>${tiposAcessoLabels[tipo_acesso]}</strong>.
                            </p>

                            ${cargo ? `<p style="color: #666; font-size: 14px;"><strong>Cargo:</strong> ${cargo}</p>` : ''}
                            
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                                <strong>Para ativar seu acesso:</strong>
                            </p>
                            
                            <ol style="color: #333; font-size: 16px; line-height: 1.8;">
                                <li>Clique no botão abaixo</li>
                                <li>Crie sua senha de acesso</li>
                                <li>Faça login no sistema</li>
                            </ol>
                            
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="${conviteUrl}" 
                                   style="background-color: #922B3E; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(146, 43, 62, 0.3);">
                                    CRIAR MINHA SENHA
                                </a>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #922B3E;">
                                <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: bold;">
                                    📎 Ou copie e cole este link no navegador:
                                </p>
                                <p style="margin: 0; color: #922B3E; font-size: 13px; word-break: break-all; font-family: monospace;">
                                    ${conviteUrl}
                                </p>
                            </div>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #ffc107;">
                                <p style="margin: 0; font-size: 14px; color: #856404;">
                                    <strong>⚠️ Importante:</strong> Este convite expira em 7 dias (${dataExpiracao.toLocaleDateString('pt-BR')}). 
                                </p>
                            </div>
                        </div>
                        
                        <div style="border-top: 2px solid #e5e7eb; padding: 20px; text-align: center; background-color: #f9fafb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                Este é um email automático, por favor não responda.
                            </p>
                            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                                © ${new Date().getFullYear()} Riviera Incorporadora. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        return Response.json({
            success: true,
            message: 'Convite enviado com sucesso!',
            convite_id: convite.id,
            email_enviado: true,
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