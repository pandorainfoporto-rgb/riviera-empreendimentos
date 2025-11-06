
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, AlertCircle, Wallet } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PagarParcelaDialog({ 
  parcela, 
  consorcio, 
  cliente, 
  unidade, 
  caixas, 
  onClose, 
  onConfirm, 
  isProcessing 
}) {
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [caixaId, setCaixaId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [observacoes, setObservacoes] = useState("");
  
  const [valorJuros, setValorJuros] = useState(0);
  const [valorMulta, setValorMulta] = useState(0);
  const [diasAtraso, setDiasAtraso] = useState(0);
  const [valorTotal, setValorTotal] = useState(parcela.valor_total);

  // Definir caixa padrão
  useEffect(() => {
    const caixaPadrao = caixas.find(c => c.eh_padrao);
    if (caixaPadrao) {
      setCaixaId(caixaPadrao.id);
    } else if (caixas.length > 0) {
      setCaixaId(caixas[0].id);
    }
  }, [caixas]);

  // Calcular dias de atraso
  useEffect(() => {
    try {
      const dataVenc = parseISO(parcela.data_vencimento);
      const dataPag = parseISO(dataPagamento);
      const dias = differenceInDays(dataPag, dataVenc);
      
      if (dias > 0) {
        setDiasAtraso(dias);
      } else {
        setDiasAtraso(0);
        // Zerar juros e multa se não está atrasado
        setValorJuros(0);
        setValorMulta(0);
      }
    } catch (error) {
      console.error("Erro ao calcular dias de atraso:", error);
    }
  }, [dataPagamento, parcela.data_vencimento]);

  // Recalcular valor total quando juros ou multa mudarem
  useEffect(() => {
    const total = parcela.valor_total + valorJuros + valorMulta;
    setValorTotal(total);
  }, [valorJuros, valorMulta, parcela.valor_total]);

  const handleConfirm = () => {
    const caixa = caixas.find(c => c.id === caixaId);
    if (!caixa) {
      alert('Selecione um caixa válido');
      return;
    }

    let saldoAtual = caixa.saldo_atual || 0;
    const movimentacoes = [];

    const descricaoBase = `Grupo ${consorcio?.grupo} Cota ${consorcio?.cota}${
      consorcio?.eh_investimento_caixa ? ' (Investimento Caixa)' : ` - ${cliente?.nome || 'Cliente'}`
    }`;

    // 1. Movimentação da parcela principal
    const saldoAposParcela = saldoAtual - parcela.valor_total;
    movimentacoes.push({
      caixa_id: caixaId,
      tipo: "saida",
      categoria: "pagamento_consorcio",
      valor: parcela.valor_total,
      data_movimentacao: dataPagamento,
      descricao: `Parcela ${parcela.numero_parcela} - ${descricaoBase}`,
      fatura_consorcio_id: parcela.id,
      saldo_anterior: saldoAtual,
      saldo_posterior: saldoAposParcela,
      observacoes: `Forma: ${formaPagamento}`
    });
    saldoAtual = saldoAposParcela;

    // 2. Movimentação de juros (se houver)
    if (valorJuros > 0) {
      const saldoAposJuros = saldoAtual - valorJuros;
      movimentacoes.push({
        caixa_id: caixaId,
        tipo: "saida",
        categoria: "juros_consorcio",
        valor: valorJuros,
        data_movimentacao: dataPagamento,
        descricao: `Juros - Parcela ${parcela.numero_parcela} - ${descricaoBase}`,
        fatura_consorcio_id: parcela.id,
        saldo_anterior: saldoAtual,
        saldo_posterior: saldoAposJuros,
        observacoes: `${diasAtraso} dia(s) de atraso | Forma: ${formaPagamento}`
      });
      saldoAtual = saldoAposJuros;
    }

    // 3. Movimentação de multa (se houver)
    if (valorMulta > 0) {
      const saldoAposMulta = saldoAtual - valorMulta;
      movimentacoes.push({
        caixa_id: caixaId,
        tipo: "saida",
        categoria: "multa_consorcio",
        valor: valorMulta,
        data_movimentacao: dataPagamento,
        descricao: `Multa - Parcela ${parcela.numero_parcela} - ${descricaoBase}`,
        fatura_consorcio_id: parcela.id,
        saldo_anterior: saldoAtual,
        saldo_posterior: saldoAposMulta,
        observacoes: `${diasAtraso} dia(s) de atraso | Forma: ${formaPagamento}`
      });
      saldoAtual = saldoAposMulta;
    }

    onConfirm({
      id: parcela.id,
      data: {
        ...parcela,
        data_pagamento: dataPagamento,
        status: 'pago',
        valor_juros: valorJuros,
        valor_multa: valorMulta,
        valor_total_pago: valorTotal,
        observacoes: observacoes || `Forma: ${formaPagamento}${valorJuros > 0 ? ` | Juros: R$ ${valorJuros.toFixed(2)}` : ''}${valorMulta > 0 ? ` | Multa: R$ ${valorMulta.toFixed(2)}` : ''}`,
      },
      movimentacoes
    });
  };

  const ehAtrasado = diasAtraso > 0;
  const caixaSelecionado = caixas.find(c => c.id === caixaId);
  const saldoInsuficiente = caixaSelecionado && (caixaSelecionado.saldo_atual || 0) < valorTotal;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pagar Parcela de Consórcio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-gray-900">Informações da Parcela</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Grupo:</span>
                <span className="ml-2 font-semibold">{consorcio?.grupo}</span>
              </div>
              <div>
                <span className="text-gray-600">Cota:</span>
                <span className="ml-2 font-semibold">{consorcio?.cota}</span>
              </div>
              <div>
                <span className="text-gray-600">Parcela:</span>
                <span className="ml-2 font-semibold">{parcela.numero_parcela}</span>
              </div>
              <div>
                <span className="text-gray-600">
                  {consorcio?.eh_investimento_caixa ? 'Tipo:' : 'Cliente:'}
                </span>
                <span className="ml-2 font-semibold">
                  {consorcio?.eh_investimento_caixa ? 'Investimento Caixa' : (cliente?.nome || 'N/A')}
                </span>
              </div>
            </div>
          </div>

          {ehAtrasado && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Pagamento está atrasado há <strong>{diasAtraso} dia(s)</strong>. Você pode adicionar juros e multa abaixo.
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Valor da Parcela:</span>
              <span className="font-semibold text-gray-900">
                R$ {parcela.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {(valorJuros > 0 || valorMulta > 0) && (
              <>
                {valorJuros > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Juros:</span>
                    <span className="text-orange-600">+ R$ {valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {valorMulta > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Multa:</span>
                    <span className="text-orange-600">+ R$ {valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300 flex justify-between">
                  <span className="font-semibold text-gray-900">Valor Total a Pagar:</span>
                  <span className="font-bold text-xl text-green-700">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
            <Input
              id="data_pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              required
            />
          </div>

          {ehAtrasado && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <Label htmlFor="juros" className="flex items-center gap-2">
                  Juros (R$)
                  <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorJuros}
                  onChange={(e) => setValorJuros(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa" className="flex items-center gap-2">
                  Multa (R$)
                  <span className="text-xs text-gray-500 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="multa"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorMulta}
                  onChange={(e) => setValorMulta(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
              <div className="md:col-span-2 text-xs text-gray-600 bg-white p-2 rounded">
                💡 <strong>Dica:</strong> Informe os valores exatos de juros e multa em reais. 
                O sistema calculará automaticamente o valor total a pagar.
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caixa_id">Caixa para Pagamento *</Label>
            <Select value={caixaId} onValueChange={setCaixaId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o caixa" />
              </SelectTrigger>
              <SelectContent>
                {caixas.map(caixa => (
                  <SelectItem key={caixa.id} value={caixa.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{caixa.nome}</span>
                      <span className={`text-xs ${
                        (caixa.saldo_atual || 0) >= valorTotal ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {caixaSelecionado && (
              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Saldo atual:
                </span>
                <span className={`font-semibold ${
                  (caixaSelecionado.saldo_atual || 0) >= valorTotal ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {(caixaSelecionado.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {saldoInsuficiente && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Saldo insuficiente no caixa selecionado! 
                Necessário: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o pagamento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing || saldoInsuficiente || !caixaId}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {isProcessing ? "Processando..." : `Pagar R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
