import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 💬 INTEGRAÇÃO WHATSAPP BUSINESS API
 * Envia mensagens, templates e mídia via Meta Cloud API
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            action, 
            phone_number_id, 
            access_token, 
            destinatario, 
            mensagem, 
            template_name, 
            template_params,
            midia_url,
            midia_tipo 
        } = await req.json();

        const WHATSAPP_API = `https://graph.facebook.com/v18.0/${phone_number_id}/messages`;

        // 1. ENVIAR MENSAGEM DE TEXTO SIMPLES
        if (action === 'enviarTexto') {
            console.log(`📱 Enviando mensagem WhatsApp para ${destinatario}...`);

            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: destinatario.replace(/\D/g, ''),
                type: 'text',
                text: {
                    preview_url: true,
                    body: mensagem,
                }
            };

            const response = await fetch(WHATSAPP_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro WhatsApp: ${error.error?.message || 'Erro desconhecido'}`);
            }

            const result = await response.json();

            console.log('✅ Mensagem enviada:', result.messages[0].id);

            return Response.json({
                success: true,
                message_id: result.messages[0].id,
            });
        }

        // 2. ENVIAR TEMPLATE (Mensagens aprovadas pelo Meta)
        if (action === 'enviarTemplate') {
            console.log(`📋 Enviando template WhatsApp: ${template_name}`);

            const payload = {
                messaging_product: 'whatsapp',
                to: destinatario.replace(/\D/g, ''),
                type: 'template',
                template: {
                    name: template_name,
                    language: {
                        code: 'pt_BR'
                    },
                    components: template_params || []
                }
            };

            const response = await fetch(WHATSAPP_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro WhatsApp: ${error.error?.message}`);
            }

            const result = await response.json();

            console.log('✅ Template enviado');

            return Response.json({
                success: true,
                message_id: result.messages[0].id,
            });
        }

        // 3. ENVIAR MÍDIA (Imagem, Documento, PDF)
        if (action === 'enviarMidia') {
            console.log(`📎 Enviando mídia WhatsApp: ${midia_tipo}`);

            const tiposPermitidos = {
                'imagem': 'image',
                'documento': 'document',
                'pdf': 'document',
                'video': 'video',
            };

            const tipo = tiposPermitidos[midia_tipo] || 'document';

            const payload = {
                messaging_product: 'whatsapp',
                to: destinatario.replace(/\D/g, ''),
                type: tipo,
                [tipo]: {
                    link: midia_url,
                    caption: mensagem || '',
                }
            };

            const response = await fetch(WHATSAPP_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro WhatsApp: ${error.error?.message}`);
            }

            const result = await response.json();

            console.log('✅ Mídia enviada');

            return Response.json({
                success: true,
                message_id: result.messages[0].id,
            });
        }

        // 4. ENVIAR BOLETO VIA WHATSAPP
        if (action === 'enviarBoleto') {
            console.log('💳 Enviando boleto via WhatsApp...');

            // Template específico para boletos
            const templateBoleto = {
                messaging_product: 'whatsapp',
                to: destinatario.replace(/\D/g, ''),
                type: 'template',
                template: {
                    name: 'boleto_pagamento', // Template pré-aprovado
                    language: { code: 'pt_BR' },
                    components: [
                        {
                            type: 'body',
                            parameters: template_params // Nome, valor, vencimento, link
                        },
                        {
                            type: 'button',
                            sub_type: 'url',
                            index: 0,
                            parameters: [
                                {
                                    type: 'text',
                                    text: midia_url // URL do boleto
                                }
                            ]
                        }
                    ]
                }
            };

            const response = await fetch(WHATSAPP_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify(templateBoleto),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Erro ao enviar boleto: ${error.error?.message}`);
            }

            console.log('✅ Boleto enviado via WhatsApp');

            return Response.json({ success: true });
        }

        return Response.json({ error: 'Ação não suportada' }, { status: 400 });

    } catch (error) {
        console.error('❌ Erro WhatsApp API:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});