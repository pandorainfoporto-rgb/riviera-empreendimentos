import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intencao_compra_id } = await req.json();

    if (!intencao_compra_id) {
      return Response.json({ error: 'ID da intenção de compra é obrigatório' }, { status: 400 });
    }

    // Buscar dados da intenção de compra
    const intencao = await base44.entities.IntencaoCompra.get(intencao_compra_id);
    
    // Buscar dados relacionados
    const cliente = await base44.entities.Cliente.get(intencao.cliente_id);
    const loteamento = intencao.loteamento_id 
      ? await base44.entities.Loteamento.get(intencao.loteamento_id)
      : null;
    const lote = intencao.lote_id
      ? await base44.entities.Lote.get(intencao.lote_id)
      : null;

    // Criar PDF
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(20);
    doc.setTextColor(146, 43, 62); // Wine color
    doc.text('INTENÇÃO DE COMPRA', 105, y, { align: 'center' });
    y += 15;

    // Linha separadora
    doc.setDrawColor(146, 43, 62);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Dados do Cliente
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('DADOS DO CLIENTE', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Nome: ${cliente.nome}`, 20, y);
    y += 6;
    doc.text(`CPF/CNPJ: ${cliente.cpf_cnpj}`, 20, y);
    y += 6;
    doc.text(`E-mail: ${cliente.email || 'Não informado'}`, 20, y);
    y += 6;
    doc.text(`Telefone: ${cliente.telefone || 'Não informado'}`, 20, y);
    y += 10;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;

    // Dados do Loteamento/Lote
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('IMÓVEL DE INTERESSE', 20, y);
    y += 8;

    doc.setFontSize(10);
    if (loteamento) {
      doc.text(`Loteamento: ${loteamento.nome}`, 20, y);
      y += 6;
      if (loteamento.cidade && loteamento.estado) {
        doc.text(`Localização: ${loteamento.cidade} - ${loteamento.estado}`, 20, y);
        y += 6;
      }
    }
    
    if (lote) {
      doc.text(`Lote: ${lote.numero}${lote.quadra ? ' - Quadra ' + lote.quadra : ''}`, 20, y);
      y += 6;
      if (lote.area) {
        doc.text(`Área: ${lote.area} m²`, 20, y);
        y += 6;
      }
      if (lote.valor_total) {
        doc.text(`Valor do Lote: R$ ${lote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
        y += 6;
      }
    }
    y += 4;

    // Linha separadora
    doc.line(20, y, 190, y);
    y += 10;

    // Características do Imóvel Desejado
    doc.setFontSize(14);
    doc.text('CARACTERÍSTICAS DO IMÓVEL', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Padrão: ${intencao.padrao_imovel?.toUpperCase()}`, 20, y);
    y += 6;
    
    if (intencao.area_construida_desejada) {
      doc.text(`Área Construída: ${intencao.area_construida_desejada} m²`, 20, y);
      y += 6;
    }
    
    if (intencao.quantidade_pavimentos) {
      doc.text(`Pavimentos: ${intencao.quantidade_pavimentos}`, 20, y);
      y += 6;
    }
    
    if (intencao.quantidade_quartos) {
      doc.text(`Quartos: ${intencao.quantidade_quartos} (${intencao.quantidade_suites || 0} suítes)`, 20, y);
      y += 6;
    }
    
    if (intencao.quantidade_banheiros) {
      doc.text(`Banheiros: ${intencao.quantidade_banheiros}`, 20, y);
      y += 6;
    }
    
    if (intencao.vagas_garagem) {
      doc.text(`Garagem: ${intencao.vagas_garagem} vaga(s)${intencao.garagem_coberta ? ' (coberta)' : ''}`, 20, y);
      y += 6;
    }
    y += 4;

    // Orçamento
    if (intencao.orcamento_minimo || intencao.orcamento_maximo) {
      doc.line(20, y, 190, y);
      y += 10;
      
      doc.setFontSize(14);
      doc.text('ORÇAMENTO', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      if (intencao.orcamento_minimo) {
        doc.text(`Mínimo: R$ ${intencao.orcamento_minimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
        y += 6;
      }
      if (intencao.orcamento_maximo) {
        doc.text(`Máximo: R$ ${intencao.orcamento_maximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
        y += 6;
      }
      y += 4;
    }

    // Status
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.text('STATUS', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    const statusLabels = {
      rascunho: 'Rascunho',
      aguardando_projeto: 'Aguardando Projeto',
      aguardando_reuniao: 'Aguardando Reunião',
      alteracao_projeto: 'Alteração de Projeto',
      aprovado: 'Aprovado',
      cancelado: 'Cancelado'
    };
    doc.text(`Status atual: ${statusLabels[intencao.status] || intencao.status}`, 20, y);
    y += 6;
    
    doc.text(`Data de criação: ${new Date(intencao.created_date).toLocaleDateString('pt-BR')}`, 20, y);
    y += 15;

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este documento é uma intenção de compra e não constitui um contrato vinculante.', 105, 280, { align: 'center' });
    doc.text('Sistema Riviera - Incorporadora', 105, 285, { align: 'center' });

    // Retornar PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=intencao-compra-${intencao_compra_id}.pdf`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});