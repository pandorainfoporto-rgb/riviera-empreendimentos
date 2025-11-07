import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      cliente_id,
      titulo,
      mensagem,
      assunto = 'geral',
      conversa_id,
      enviar_email = true,
      anexos = [],
      resposta_template_id,
      criar_notificacao = true,
      prioridade = 'normal'
    } = await req.json();

    if (!cliente_id || !titulo || !mensagem) {
      return Response.json({ 
        error: 'cliente_id, titulo e mensagem são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar cliente
    const clientes = await base44.entities.Cliente.filter({ id: cliente_id });
    if (!clientes || clientes.length === 0) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    const cliente = clientes[0];

    // Gerar ID de conversa se não fornecido
    const conversaId = conversa_id || `CONV-${Date.now()}`;

    // Criar mensagem no sistema
    const novaMensagem = await base44.entities.Mensagem.create({
      cliente_id,
      titulo,
      mensagem,
      assunto,
      conversa_id: conversaId,
      remetente_tipo: 'admin',
      remetente_email: user.email,
      remetente_nome: user.full_name,
      arquivos: anexos,
      status: 'aberto',
      prioridade,
      lida: false,
    });

    // Processar placeholders
    let mensagemProcessada = mensagem;
    const placeholders = {
      '{{nome_cliente}}': cliente.nome,
      '{{email_cliente}}': cliente.email,
      '{{telefone_cliente}}': cliente.telefone || 'Não informado',
      '{{cpf_cnpj}}': cliente.cpf_cnpj || 'Não informado',
      '{{data_hoje}}': new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }),
      '{{atendente}}': user.full_name,
    };

    Object.entries(placeholders).forEach(([chave, valor]) => {
      mensagemProcessada = mensagemProcessada.replaceAll(chave, valor);
    });

    // Enviar email se solicitado
    let emailEnviado = false;
    if (enviar_email && cliente.email) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <tr>
                        <td style="background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">Nova Mensagem</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Riviera Incorporadora</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px;">
                            <p style="color: #333; font-size: 16px; margin: 0 0 10px 0;">
                                Olá, <strong>${cliente.nome}</strong>!
                            </p>
                            
                            <div style="background: #f9fafb; border-left: 4px solid #922B3E; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #922B3E; font-size: 18px;">${titulo}</h3>
                                <div style="color: #555; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
${mensagemProcessada}
                                </div>
                            </div>
                            
                            ${anexos && anexos.length > 0 ? `
                            <div style="margin: 25px 0;">
                                <h4 style="color: #666; font-size: 14px; margin: 0 0 10px 0;">📎 Anexos:</h4>
                                ${anexos.map(a => `
                                <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                                    <a href="${a.url}" style="color: #922B3E; text-decoration: none; font-weight: 500;">
                                        📄 ${a.nome}
                                    </a>
                                </div>
                                `).join('')}
                            </div>
                            ` : ''}
                            
                            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 15px 0; color: #424242; font-size: 14px;">
                                    Você pode responder diretamente através do Portal do Cliente
                                </p>
                                <a href="${req.headers.get('origin') || ''}/#/PortalClienteLogin" 
                                   style="display: inline-block; background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
                                    Acessar Portal
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                Atenciosamente,<br/>
                                <strong>${user.full_name}</strong><br/>
                                Riviera Incorporadora
                            </p>
                            <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                                Este é um email do sistema de gestão Riviera
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await base44.integrations.Core.SendEmail({
          from_name: 'Riviera Incorporadora',
          to: cliente.email,
          subject: titulo,
          body: emailHtml
        });

        emailEnviado = true;

        // Atualizar mensagem com status de email
        await base44.entities.Mensagem.update(novaMensagem.id, {
          email_enviado: true,
          data_envio_email: new Date().toISOString()
        });

      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não falhar a operação se email falhar
      }
    }

    // Criar notificação se solicitado
    if (criar_notificacao) {
      try {
        await base44.entities.Notificacao.create({
          cliente_id,
          tipo: 'mensagem',
          titulo: `Nova mensagem: ${titulo}`,
          mensagem: mensagemProcessada.substring(0, 200) + (mensagemProcessada.length > 200 ? '...' : ''),
          link: '/PortalClienteMensagens',
          referencia_id: novaMensagem.id,
          referencia_tipo: 'mensagem',
          prioridade,
          lida: false,
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError);
      }
    }

    // Atualizar contador de usos do template (se usado)
    if (resposta_template_id) {
      try {
        const templates = await base44.entities.RespostaTemplate.filter({ id: resposta_template_id });
        if (templates && templates.length > 0) {
          await base44.asServiceRole.entities.RespostaTemplate.update(resposta_template_id, {
            total_usos: (templates[0].total_usos || 0) + 1
          });
        }
      } catch (templateError) {
        console.error('Erro ao atualizar template:', templateError);
      }
    }

    return Response.json({
      sucesso: true,
      mensagem_id: novaMensagem.id,
      conversa_id: conversaId,
      email_enviado: emailEnviado,
      destinatario: cliente.email
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return Response.json({ 
      error: error.message || 'Erro ao enviar mensagem'
    }, { status: 500 });
  }
});