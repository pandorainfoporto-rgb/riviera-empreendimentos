import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { pagamento_id } = await req.json();

    // Buscar dados do pagamento
    const pagamento = await base44.entities.PagamentoCliente.get(pagamento_id);
    const cliente = await base44.entities.Cliente.get(pagamento.cliente_id);
    
    // Buscar dados da empresa para PIX
    const empresas = await base44.entities.Empresa.list();
    const empresa = empresas[0];

    if (!empresa?.chave_pix) {
      return Response.json({ 
        error: 'Chave PIX da empresa não configurada' 
      }, { status: 400 });
    }

    // Gerar PIX Copia e Cola (formato simplificado)
    const pixCopiaCola = gerarPixCopiaCola(empresa, pagamento, cliente);

    // Gerar QR Code usando API
    const qrCodeUrl = await gerarQRCode(pixCopiaCola);

    // Atualizar pagamento com dados do PIX
    await base44.entities.PagamentoCliente.update(pagamento_id, {
      pix_copy_paste: pixCopiaCola,
      pix_qrcode: qrCodeUrl,
    });

    return Response.json({
      sucesso: true,
      pix_copia_cola: pixCopiaCola,
      qr_code_url: qrCodeUrl,
      valor: pagamento.valor,
      vencimento: pagamento.data_vencimento,
    });

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function gerarPixCopiaCola(empresa, pagamento, cliente) {
  // Formato PIX simplificado (em produção usar biblioteca oficial PIX)
  const chavePix = empresa.chave_pix;
  const valor = pagamento.valor.toFixed(2);
  const descricao = `Pagamento Riviera - ${pagamento.tipo || 'Parcela'}`;
  
  // Formato básico de PIX Copia e Cola
  // Em produção, usar biblioteca oficial para gerar payload PIX correto
  const pixPayload = `00020126${chavePix.length.toString().padStart(2, '0')}${chavePix}5204000053039865802BR5913${empresa.nome?.substring(0, 25) || 'Riviera'}6009SAO_PAULO${valor.length > 0 ? `54${valor.length.toString().padStart(2, '0')}${valor}` : ''}62070503***6304`;
  
  return pixPayload;
}

async function gerarQRCode(pixCopiaCola) {
  // Usar API gratuita para gerar QR Code
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopiaCola)}`;
  return qrApiUrl;
}