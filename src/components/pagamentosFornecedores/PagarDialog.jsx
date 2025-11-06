import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, DollarSign, AlertCircle, Upload, FileText, Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

export default function PagarDialog({ pagamento, fornecedor, unidade, onClose, onConfirm, isProcessing }) {
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState(pagamento.forma_pagamento || "pix");
  const [numeroNota, setNumeroNota] = useState(pagamento.numero_nota || "");
  const [observacoes, setObservacoes] = useState("");
  
  // Campos de juros e multa
  const [jurosDia, setJurosDia] = useState(pagamento.juros_percentual || 0.1);
  const [multaPercentual, setMultaPercentual] = useState(pagamento.multa_percentual || 2);
  const [diasAtraso, setDiasAtraso] = useState(0);
  const [valorJuros, setValorJuros] = useState(0);
  const [valorMulta, setValorMulta] = useState(0);
  const [valorTotal, setValorTotal] = useState(pagamento.valor);

  // Upload de boleto
  const [arquivoBoleto, setArquivoBoleto] = useState(pagamento.arquivo_boleto || "");
  const [uploadingBoleto, setUploadingBoleto] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Calcular juros e multa
  useEffect(() => {
    const calcularJurosMulta = () => {
      try {
        const dataVenc = parseISO(pagamento.data_vencimento);
        const dataPag = parseISO(dataPagamento);
        const dias = differenceInDays(dataPag, dataVenc);
        
        if (dias > 0) {
          setDiasAtraso(dias);
          const juros = pagamento.valor * (jurosDia / 100) * dias;
          const multa = pagamento.valor * (multaPercentual / 100);
          setValorJuros(juros);
          setValorMulta(multa);
          setValorTotal(pagamento.valor + juros + multa);
        } else {
          setDiasAtraso(0);
          setValorJuros(0);
          setValorMulta(0);
          setValorTotal(pagamento.valor);
        }
      } catch (error) {
        console.error("Erro ao calcular juros:", error);
      }
    };

    calcularJurosMulta();
  }, [dataPagamento, jurosDia, multaPercentual, pagamento]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingBoleto(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArquivoBoleto(file_url);
    } catch (error) {
      alert("Erro ao fazer upload do boleto: " + error.message);
    } finally {
      setUploadingBoleto(false);
    }
  };

  const handleConfirm = () => {
    if (formaPagamento === 'boleto' && !arquivoBoleto) {
      alert("Por favor, faça upload do boleto");
      return;
    }

    onConfirm({
      data_pagamento: dataPagamento,
      forma_pagamento: formaPagamento,
      numero_nota: numeroNota,
      observacoes,
      juros_percentual: jurosDia,
      multa_percentual: multaPercentual,
      valor_juros: valorJuros,
      valor_multa: valorMulta,
      valor_total_pago: valorTotal,
      arquivo_boleto: arquivoBoleto,
    });
  };

  const ehAtrasado = diasAtraso > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--wine-700)]">Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            {fornecedor?.nome} - {unidade?.codigo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {ehAtrasado && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Pagamento está atrasado há <strong>{diasAtraso} dia(s)</strong>. Juros e multa serão aplicados.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Original:</span>
              <span className="font-semibold">R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {ehAtrasado && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Juros ({jurosDia}% ao dia × {diasAtraso} dias):</span>
                  <span className="text-orange-600">+ R$ {valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Multa ({multaPercentual}%):</span>
                  <span className="text-orange-600">+ R$ {valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-gray-300 flex justify-between">
                  <span className="font-semibold text-gray-900">Valor Total a Pagar:</span>
                  <span className="font-bold text-lg text-[var(--wine-700)]">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>

          {ehAtrasado && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="juros">Juros ao dia (%)</Label>
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  value={jurosDia}
                  onChange={(e) => setJurosDia(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa">Multa (%)</Label>
                <Input
                  id="multa"
                  type="number"
                  step="0.01"
                  value={multaPercentual}
                  onChange={(e) => setMultaPercentual(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

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
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CAMPO DE UPLOAD DO BOLETO */}
          {formaPagamento === 'boleto' && (
            <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label htmlFor="arquivo_boleto" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Upload do Boleto *</span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="arquivo_boleto"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="flex-1"
                  disabled={uploadingBoleto}
                />
                {uploadingBoleto && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
              </div>
              {arquivoBoleto && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <FileText className="w-4 h-4" />
                  <a 
                    href={arquivoBoleto} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-green-700"
                  >
                    Boleto carregado - clique para visualizar
                  </a>
                </div>
              )}
              {!arquivoBoleto && (
                <p className="text-xs text-blue-700">
                  Formatos aceitos: PDF, JPG, PNG
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="numero_nota">Número da Nota Fiscal</Label>
            <Input
              id="numero_nota"
              value={numeroNota}
              onChange={(e) => setNumeroNota(e.target.value)}
              placeholder="Ex: NF-12345"
            />
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing || uploadingBoleto}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing || uploadingBoleto || (formaPagamento === 'boleto' && !arquivoBoleto)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {isProcessing ? "Processando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}