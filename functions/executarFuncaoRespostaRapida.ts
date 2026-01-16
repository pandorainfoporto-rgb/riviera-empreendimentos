import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { conversa_id, tipo_funcao, mensagem_id } = await req.json();

    const conversa = await base44.entities.ConversaOmnichannel.get(conversa_id);
    const cliente = conversa.cliente_id ? await base44.entities.Cliente.get(conversa.cliente_id) : null;

    let resultado = { sucesso: false };

    switch (tipo_funcao) {
      case 'enviar_boleto':
        resultado = await enviarBoleto(base44, conversa, cliente);
        break;
      
      case 'enviar_pix':
        resultado = await enviarDadosPix(base44, conversa, cliente);
        break;
      
      case 'enviar_nota':
        resultado = await enviarNotaFiscal(base44, conversa, cliente);
        break;
      
      case 'enviar_contrato':
        resultado = await enviarContrato(base44, conversa, cliente);
        break;
      
      case 'enviar_email_atendimento':
        resultado = await enviarEmailAtendimento(base44, conversa, cliente, user);
        break;
      
      case 'enviar_protocolo':
        resultado = await gerarEnviarProtocolo(base44, conversa, cliente, user);
        break;
    }

    return Response.json(resultado);

  } catch (error) {
    console.error('Erro ao executar função:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enviarBoleto(base44, conversa, cliente) {
  if (!cliente) {
    return { 
      sucesso: false, 
      mensagem: 'Cliente não identificado para enviar boleto' 
    };
  }

  // Buscar boletos pendentes do cliente
  const pagamentos = await base44.entities.PagamentoCliente.filter({
    cliente_id: cliente.id,
    status: { $in: ['pendente', 'atrasado'] }
  }, '-data_vencimento', 5);

  if (pagamentos.length === 0) {
    await base44.entities.MensagemOmnichannel.create({
      conversa_id: conversa.id,
      remetente_tipo: 'sistema',
      remetente_nome: 'Sistema',
      conteudo: '✅ Não há boletos pendentes no momento.',
      tipo_conteudo: 'texto',
      status_entrega: 'enviada',
      data_hora: new Date().toISOString(),
    });
    return { sucesso: true, mensagem: 'Sem boletos pendentes' };
  }

  // Enviar informações dos boletos
  let mensagem = `📄 *Boletos Pendentes*\n\n`;
  for (const pag of pagamentos) {
    mensagem += `Vencimento: ${new Date(pag.data_vencimento).toLocaleDateString()}\n`;
    mensagem += `Valor: R$ ${pag.valor.toFixed(2)}\n`;
    if (pag.boleto_url) {
      mensagem += `Link: ${pag.boleto_url}\n`;
    }
    if (pag.boleto_barcode) {
      mensagem += `Código de barras: ${pag.boleto_barcode}\n`;
    }
    mensagem += `\n`;
  }

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema de Cobrança',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { sucesso: true, mensagem: 'Boletos enviados' };
}

async function enviarDadosPix(base44, conversa, cliente) {
  // Buscar dados PIX configurados da empresa
  const empresas = await base44.entities.Empresa.list();
  const empresa = empresas[0];

  let mensagem = `💰 *Dados para Pagamento via PIX*\n\n`;
  
  if (empresa?.chave_pix) {
    mensagem += `${empresa.tipo_pix === 'cpf_cnpj' ? 'CPF/CNPJ' : empresa.tipo_pix.toUpperCase()}: ${empresa.chave_pix}\n`;
    mensagem += `Favorecido: ${empresa.razao_social || empresa.nome || 'Riviera Incorporadora'}\n\n`;
  }

  if (cliente) {
    const pagamentos = await base44.entities.PagamentoCliente.filter({
      cliente_id: cliente.id,
      status: { $in: ['pendente', 'atrasado'] }
    }, '-data_vencimento', 1);

    if (pagamentos.length > 0) {
      mensagem += `💵 Valor próximo pagamento: R$ ${pagamentos[0].valor.toFixed(2)}\n`;
      mensagem += `📅 Vencimento: ${new Date(pagamentos[0].data_vencimento).toLocaleDateString()}\n\n`;
      
      if (pagamentos[0].pix_copy_paste) {
        mensagem += `📋 PIX Copia e Cola:\n${pagamentos[0].pix_copy_paste}\n\n`;
      }
    }
  }

  mensagem += `⚠️ Após realizar o pagamento, envie o comprovante para confirmação.`;

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema Financeiro',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { sucesso: true, mensagem: 'Dados PIX enviados' };
}

async function enviarNotaFiscal(base44, conversa, cliente) {
  if (!cliente) {
    return { sucesso: false, mensagem: 'Cliente não identificado' };
  }

  // Buscar notas fiscais do cliente
  const compras = await base44.entities.CompraNotaFiscal.filter({
    cliente_id: cliente.id
  }, '-created_date', 5);

  if (compras.length === 0) {
    await base44.entities.MensagemOmnichannel.create({
      conversa_id: conversa.id,
      remetente_tipo: 'sistema',
      remetente_nome: 'Sistema',
      conteudo: '📄 Nenhuma nota fiscal encontrada. Entre em contato com o financeiro.',
      tipo_conteudo: 'texto',
      status_entrega: 'enviada',
      data_hora: new Date().toISOString(),
    });
    return { sucesso: true };
  }

  let mensagem = `🧾 *Notas Fiscais Disponíveis*\n\n`;
  for (const nf of compras.slice(0, 3)) {
    mensagem += `Número: ${nf.numero_nota || 'N/A'}\n`;
    mensagem += `Data: ${new Date(nf.created_date).toLocaleDateString()}\n`;
    mensagem += `Valor: R$ ${(nf.valor_total || 0).toFixed(2)}\n\n`;
  }

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema Fiscal',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { sucesso: true, mensagem: 'Notas enviadas' };
}

async function enviarContrato(base44, conversa, cliente) {
  if (!cliente) {
    return { sucesso: false, mensagem: 'Cliente não identificado' };
  }

  const contratos = await base44.entities.Contrato.filter({
    cliente_id: cliente.id
  }, '-created_date', 3);

  if (contratos.length === 0) {
    await base44.entities.MensagemOmnichannel.create({
      conversa_id: conversa.id,
      remetente_tipo: 'sistema',
      remetente_nome: 'Sistema',
      conteudo: '📋 Nenhum contrato encontrado. Entre em contato com o setor de contratos.',
      tipo_conteudo: 'texto',
      status_entrega: 'enviada',
      data_hora: new Date().toISOString(),
    });
    return { sucesso: true };
  }

  let mensagem = `📋 *Contratos Disponíveis*\n\n`;
  for (const contrato of contratos) {
    mensagem += `Tipo: ${contrato.tipo || 'Geral'}\n`;
    mensagem += `Data: ${new Date(contrato.data_contrato).toLocaleDateString()}\n`;
    mensagem += `Status: ${contrato.status}\n\n`;
  }
  mensagem += `Para receber a via do contrato, solicite ao atendimento.`;

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema de Contratos',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { sucesso: true, mensagem: 'Contratos listados' };
}

async function enviarEmailAtendimento(base44, conversa, cliente, atendente) {
  const emailAtendimento = Deno.env.get('atendimento@pandorainternet.net') || 'atendimento@riviera.com.br';

  const mensagem = `📧 *Contato por Email*\n\nPara dúvidas ou solicitações mais detalhadas, você pode nos enviar um email:\n\n✉️ ${emailAtendimento}\n\nResponderemos o mais breve possível!`;

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { sucesso: true, mensagem: 'Email enviado' };
}

async function gerarEnviarProtocolo(base44, conversa, cliente, atendente) {
  // Gerar número de protocolo único
  const ano = new Date().getFullYear();
  const protocolos = await base44.entities.ProtocoloAtendimento.filter({
    numero_protocolo: { $regex: `^${ano}` }
  }, '-created_date', 1);

  let proximoNumero = 1;
  if (protocolos.length > 0) {
    const ultimoNumero = parseInt(protocolos[0].numero_protocolo.substring(4));
    proximoNumero = ultimoNumero + 1;
  }

  const numeroProtocolo = `${ano}${proximoNumero.toString().padStart(6, '0')}`;

  // Buscar mensagens da conversa
  const mensagens = await base44.entities.MensagemOmnichannel.filter({
    conversa_id: conversa.id
  }, 'data_hora', 50);

  // Criar protocolo
  const protocolo = await base44.entities.ProtocoloAtendimento.create({
    numero_protocolo: numeroProtocolo,
    conversa_id: conversa.id,
    cliente_id: cliente?.id,
    lead_id: conversa.lead_id,
    tipo_interacao: 'atendimento_geral',
    canal: conversa.canal_id,
    atendente_id: atendente.id,
    atendente_nome: atendente.full_name,
    resumo: `Protocolo gerado via omnichannel para ${conversa.contato_nome}`,
    status: 'aberto',
    data_abertura: new Date().toISOString(),
    mensagens_ids: mensagens.map(m => m.id),
  });

  // Atualizar conversa com protocolo
  await base44.entities.ConversaOmnichannel.update(conversa.id, {
    metadados: {
      ...conversa.metadados,
      protocolo: numeroProtocolo
    }
  });

  // Enviar mensagem com protocolo
  const mensagem = `🎫 *Protocolo de Atendimento*\n\nSeu protocolo: *${numeroProtocolo}*\n\nGuarde este número para futuras consultas sobre este atendimento.\n\nData: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\nAtendente: ${atendente.full_name}`;

  await base44.entities.MensagemOmnichannel.create({
    conversa_id: conversa.id,
    remetente_tipo: 'sistema',
    remetente_nome: 'Sistema de Protocolos',
    conteudo: mensagem,
    tipo_conteudo: 'texto',
    status_entrega: 'enviada',
    data_hora: new Date().toISOString(),
  });

  return { 
    sucesso: true, 
    mensagem: 'Protocolo gerado', 
    protocolo: numeroProtocolo 
  };
}