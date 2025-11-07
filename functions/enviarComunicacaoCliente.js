import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Envia comunicação para cliente via múltiplos canais
 * Registra automaticamente no histórico de comunicação
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      cliente_id,
      tipo,
      canal,
      assunto,
      conteudo,
      enviar_email,
      email_template_id,
      anexos,
      criar_followup,
      dias_followup
    } = await req.json();

    if (!cliente_id || !tipo || !canal || !assunto || !conteudo) {
      return Response.json({ 
        error: 'Campos obrigatórios: cliente_id, tipo, canal, assunto, conteudo' 
      }, { status: 400 });
    }

    // Buscar cliente
    const clientes = await base44.entities.Cliente.filter({ id: cliente_id });
    if (!clientes || clientes.length === 0) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    const cliente = clientes[0];

    // Criar mensagem no sistema
    const conversaId = `conv_${cliente_id}_${Date.now()}`;
    const mensagem = await base44.entities.Mensagem.create({
      cliente_id,
      conversa_id: conversaId,
      titulo: assunto,
      assunto,
      mensagem: conteudo,
      remetente_tipo: 'admin',
      remetente_email: user.email,
      remetente_nome: user.full_name,
      lida: false,
      status: 'aberto',
      prioridade: 'normal',
      arquivos: anexos || []
    });

    // Registrar no histórico
    const historico = await base44.entities.HistoricoComunicacao.create({
      cliente_id,
      tipo,
      canal,
      assunto,
      conteudo,
      remetente: user.full_name,
      remetente_email: user.email,
      destinatario: cliente.nome,
      destinatario_email: cliente.email,
      direcao: 'enviado',
      mensagem_id: mensagem.id,
      anexos: anexos || [],
      data_comunicacao: new Date().toISOString(),
      lido: false
    });

    let emailEnviado = false;

    // Enviar email se solicitado
    if (enviar_email && cliente.email) {
      try {
        let emailBody = conteudo;

        // Usar template se especificado
        if (email_template_id) {
          const templates = await base44.entities.EmailTemplate.filter({ id: email_template_id });
          if (templates && templates.length > 0) {
            const template = templates[0];
            emailBody = template.conteudo_html
              .replace(/\{\{nome_cliente\}\}/g, cliente.nome)
              .replace(/\{\{email_cliente\}\}/g, cliente.email || '')
              .replace(/\{\{telefone_cliente\}\}/g, cliente.telefone || '')
              .replace(/\{\{mensagem\}\}/g, conteudo);
          }
        } else {
          // Email simples padrão
          emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #922B3E 0%, #7D5999 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Riviera Incorporadora</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <div style="background: white; padding: 25px; border-radius: 8px;">
                  <p style="margin: 0 0 15px 0;"><strong>Olá, ${cliente.nome}!</strong></p>
                  <div style="color: #4B5563; line-height: 1.6; white-space: pre-wrap;">${conteudo}</div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      Atenciosamente,<br/>
                      <strong>${user.full_name}</strong><br/>
                      Riviera Incorporadora
                    </p>
                  </div>
                </div>
              </div>
              <div style="padding: 20px; text-align: center; background: #1F2937; color: white;">
                <p style="margin: 0; font-size: 12px;">© 2025 Riviera Incorporadora</p>
              </div>
            </div>
          `;
        }

        await base44.integrations.Core.SendEmail({
          to: cliente.email,
          subject: assunto,
          body: emailBody,
          from_name: 'Riviera Incorporadora'
        });

        emailEnviado = true;

        // Atualizar histórico
        await base44.entities.HistoricoComunicacao.update(historico.id, {
          email_enviado: true
        });

        // Criar registro separado de email
        await base44.entities.HistoricoComunicacao.create({
          cliente_id,
          tipo: 'email',
          canal: 'email',
          assunto,
          conteudo,
          remetente: user.full_name,
          remetente_email: user.email,
          destinatario: cliente.nome,
          destinatario_email: cliente.email,
          direcao: 'enviado',
          email_template_id,
          data_comunicacao: new Date().toISOString(),
          email_enviado: true
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    // Criar tarefa de follow-up se solicitado
    if (criar_followup) {
      const dataFollowup = new Date();
      dataFollowup.setDate(dataFollowup.getDate() + (dias_followup || 3));

      await base44.entities.TarefaFollowUp.create({
        cliente_id,
        tipo: 'outros',
        titulo: `Follow-up: ${assunto}`,
        descricao: `Follow-up da comunicação enviada em ${new Date().toLocaleDateString('pt-BR')}`,
        data_agendada: dataFollowup.toISOString(),
        prioridade: 'media',
        responsavel: user.email,
        status: 'pendente'
      });
    }

    return Response.json({
      success: true,
      mensagem_id: mensagem.id,
      historico_id: historico.id,
      email_enviado: emailEnviado,
      followup_criado: criar_followup
    });

  } catch (error) {
    console.error('Erro ao enviar comunicação:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});