import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

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
    
    // Buscar dados da empresa
    const empresas = await base44.entities.Empresa.list();
    const empresa = empresas[0] || {
      nome: 'Riviera Incorporadora',
      cnpj: '00.000.000/0001-00',
      endereco: 'Endereço não cadastrado',
    };

    // Gerar código de barras (simulado - em produção usar API real)
    const codigoBarras = gerarCodigoBarras(pagamento);

    // Criar PDF do boleto
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(10);
    doc.text('BOLETO BANCÁRIO - MISTO (BOLIX)', 105, 15, { align: 'center' });
    
    // Dados do cedente (empresa)
    doc.setFontSize(8);
    doc.text('Cedente:', 20, 30);
    doc.setFontSize(9);
    doc.text(empresa.nome || 'Riviera Incorporadora', 20, 35);
    doc.setFontSize(8);
    doc.text(`CNPJ: ${empresa.cnpj || 'Não informado'}`, 20, 40);
    
    // Dados do sacado (cliente)
    doc.text('Sacado:', 20, 55);
    doc.setFontSize(9);
    doc.text(cliente.nome, 20, 60);
    doc.setFontSize(8);
    doc.text(`CPF/CNPJ: ${cliente.cpf_cnpj}`, 20, 65);
    doc.text(`End: ${cliente.logradouro || cliente.endereco || 'Não informado'}`, 20, 70);
    
    // Dados do boleto
    doc.setFontSize(10);
    doc.text('Vencimento:', 120, 55);
    doc.setFontSize(11);
    doc.text(new Date(pagamento.data_vencimento).toLocaleDateString(), 120, 60);
    
    doc.setFontSize(10);
    doc.text('Valor:', 120, 68);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`R$ ${pagamento.valor.toFixed(2)}`, 120, 73);
    doc.setFont(undefined, 'normal');
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 85, 190, 85);
    
    // Instruções
    doc.setFontSize(8);
    doc.text('Instruções:', 20, 95);
    doc.setFontSize(7);
    doc.text('- Pagamento referente a parcela de imóvel', 20, 100);
    doc.text('- Não receber após o vencimento', 20, 105);
    doc.text('- Em caso de dúvidas, entre em contato', 20, 110);
    
    // Código de barras (representação textual)
    doc.setFontSize(8);
    doc.text('Código de Barras:', 20, 125);
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.text(codigoBarras, 20, 130);
    doc.setFont(undefined, 'normal');
    
    // Linha pontilhada de corte
    doc.setLineDash([2, 2]);
    doc.line(20, 145, 190, 145);
    doc.setLineDash([]);
    
    // Ficha de compensação (parte de baixo)
    doc.setFontSize(9);
    doc.text('FICHA DE COMPENSAÇÃO', 105, 155, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Beneficiário: ${empresa.nome || 'Riviera Incorporadora'}`, 20, 165);
    doc.text(`Pagador: ${cliente.nome}`, 20, 170);
    doc.text(`Vencimento: ${new Date(pagamento.data_vencimento).toLocaleDateString()}`, 20, 175);
    doc.text(`Valor: R$ ${pagamento.valor.toFixed(2)}`, 20, 180);
    
    // Gerar buffer do PDF
    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Upload do PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `boleto_${pagamento.id}.pdf`, { type: 'application/pdf' });
    
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    const boletoUrl = uploadResult.file_url;

    // Atualizar pagamento com dados do boleto
    await base44.entities.PagamentoCliente.update(pagamento_id, {
      boleto_url: boletoUrl,
      boleto_barcode: codigoBarras,
    });

    return Response.json({
      sucesso: true,
      boleto_url: boletoUrl,
      codigo_barras: codigoBarras,
      valor: pagamento.valor,
      vencimento: pagamento.data_vencimento,
    });

  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function gerarCodigoBarras(pagamento) {
  // Gera código de barras simulado (em produção usar API bancária real)
  const banco = '001'; // Banco do Brasil (exemplo)
  const moeda = '9';
  const valor = pagamento.valor.toFixed(2).replace('.', '').padStart(10, '0');
  const vencimento = Math.floor((new Date(pagamento.data_vencimento) - new Date('1997-10-07')) / (1000 * 60 * 60 * 24)).toString().padStart(4, '0');
  const nossoNumero = pagamento.id.substring(0, 10).padStart(10, '0');
  
  // Formato simplificado (em produção calcular DV corretamente)
  const codigo = `${banco}${moeda}${vencimento}${valor}${nossoNumero}`;
  
  return codigo;
}