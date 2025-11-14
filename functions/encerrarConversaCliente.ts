import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversa_id, cliente_id } = await req.json();

    if (!conversa_id || !cliente_id) {
      return Response.json({ error: 'conversa_id e cliente_id são obrigatórios' }, { status: 400 });
    }

    // Buscar todas as mensagens da conversa
    const mensagens = await base44.asServiceRole.entities.Mensagem.filter({
      conversa_id: conversa_id
    }, 'created_date');

    if (mensagens.length === 0) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar dados do cliente
    const cliente = await base44.asServiceRole.entities.Cliente.get(cliente_id);

    // Atualizar todas as mensagens para status "fechado"
    for (const msg of mensagens) {
      await base44.asServiceRole.entities.Mensagem.update(msg.id, {
        status: 'fechado'
      });
    }

    // Criar HTML do histórico
    const historicoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #922B3E, #7D5999); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .mensagem { margin: 15px 0; padding: 15px; border-radius: 8px; }
          .cliente { background: #f3f4f6; text-align: left; }
          .admin { background: #922B3E; color: white; text-align: right; }
          .meta { font-size: 12px; opacity: 0.7; margin-top: 5px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${mensagens[0].titulo}</h1>
          <p>Cliente: ${cliente.nome}</p>
          <p>Assunto: ${mensagens[0].assunto}</p>
          <p>Data Encerramento: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <h2>Histórico de Mensagens</h2>
        
        ${mensagens.map(msg => `
          <div class="mensagem ${msg.remetente_tipo === 'cliente' ? 'cliente' : 'admin'}">
            <strong>${msg.remetente_nome}</strong>
            <p>${msg.mensagem.replace(/\n/g, '<br>')}</p>
            <div class="meta">
              ${new Date(msg.created_date).toLocaleString('pt-BR')}
            </div>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>Este histórico foi gerado automaticamente pelo Sistema Riviera.</p>
          <p>Total de mensagens: ${mensagens.length}</p>
          <p>© ${new Date().getFullYear()} Riviera Incorporadora</p>
        </div>
      </body>
      </html>
    `;

    // Enviar email para o cliente
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "Riviera Incorporadora",
      to: cliente.email,
      subject: `Conversa Encerrada: ${mensagens[0].titulo}`,
      body: historicoHTML
    });

    return Response.json({ 
      success: true, 
      mensagem: 'Conversa encerrada e histórico enviado por email',
      total_mensagens: mensagens.length
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});