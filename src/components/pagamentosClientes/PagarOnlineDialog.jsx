import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, QrCode, FileText, Copy, CheckCircle2, 
  Loader2, Shield, AlertCircle 
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagarOnlineDialog({ pagamento, cliente, unidade, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [metodoSelecionado, setMetodoSelecionado] = useState("pix");
  const [copied, setCopied] = useState(false);

  const handleCreatePayment = async (metodo) => {
    setLoading(true);
    
    try {
      const response = await base44.functions.invoke('asaasCreatePayment', {
        pagamento_id: pagamento.id,
        tipo: 'cliente',
        forma_pagamento: metodo,
      });

      if (response.data.success) {
        setPaymentData(response.data);
        toast.success("Cobrança gerada com sucesso!");
      } else {
        throw new Error(response.data.error || 'Erro ao gerar cobrança');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error("Erro ao gerar cobrança: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (paymentData?.pix_copy_paste) {
      navigator.clipboard.writeText(paymentData.pix_copy_paste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--wine-600)] mx-auto mb-4" />
            <p className="text-gray-600">Gerando cobrança...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Pagamento Gerado
            </DialogTitle>
            <DialogDescription>
              Realize o pagamento usando o método selecionado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Resumo do Pagamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-semibold">{cliente?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidade:</span>
                  <span className="font-semibold">{unidade?.codigo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vencimento:</span>
                  <span className="font-semibold">
                    {format(parseISO(pagamento.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-gray-900 font-bold">Total:</span>
                  <span className="text-2xl font-bold text-blue-900">
                    R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* PIX */}
            {metodoSelecionado === 'pix' && paymentData.pix_qrcode && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-4">Pagar com PIX</h3>
                  
                  <div className="bg-white p-6 rounded-lg border-2 border-blue-500 inline-block mb-4">
                    <img 
                      src={`data:image/png;base64,${paymentData.pix_qrcode}`}
                      alt="QR Code PIX"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Abra o app do seu banco e escaneie o QR Code acima
                  </p>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">ou copie o código PIX:</p>
                    <div className="flex gap-2 max-w-md mx-auto">
                      <input
                        type="text"
                        value={paymentData.pix_copy_paste}
                        readOnly
                        className="flex-1 p-3 border rounded bg-gray-50 text-xs font-mono"
                      />
                      <Button
                        onClick={handleCopyPix}
                        variant="outline"
                        className="border-blue-500 text-blue-700 hover:bg-blue-50"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Pagamento Instantâneo</p>
                      <p className="text-xs text-green-700 mt-1">
                        Após o pagamento, a confirmação é automática e você receberá um email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boleto */}
            {metodoSelecionado === 'boleto' && paymentData.boleto_url && (
              <div className="space-y-4">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-4">Boleto Bancário</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-2">Código de Barras:</p>
                      <p className="font-mono text-xs break-all">{paymentData.boleto_barcode}</p>
                    </div>

                    <Button
                      onClick={() => window.open(paymentData.boleto_url, '_blank')}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      size="lg"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Baixar Boleto (PDF)
                    </Button>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900">Atenção</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            O boleto pode levar até 3 dias úteis para compensar após o pagamento.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Segurança */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Pagamento 100% Seguro</p>
                  <p className="text-xs text-green-700 mt-1">
                    Processado pela plataforma Asaas. Seus dados estão protegidos com criptografia de ponta a ponta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[var(--wine-600)]" />
            Pagamento Online
          </DialogTitle>
          <DialogDescription>
            Escolha a forma de pagamento e gere a cobrança
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Resumo do Pagamento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-semibold">{pagamento.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento:</span>
                <span className="font-semibold">
                  {format(parseISO(pagamento.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="text-gray-900 font-bold">Total a Pagar:</span>
                <span className="text-2xl font-bold text-blue-900">
                  R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Escolha a forma de pagamento:</h3>
            
            <Tabs value={metodoSelecionado} onValueChange={setMetodoSelecionado}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pix" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  PIX (Instantâneo)
                </TabsTrigger>
                <TabsTrigger value="boleto" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Boleto (3 dias)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pix" className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <QrCode className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900">PIX - Pagamento Instantâneo</h4>
                      <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li>✓ Confirmação automática em segundos</li>
                        <li>✓ Disponível 24 horas por dia</li>
                        <li>✓ Sem taxas adicionais</li>
                        <li>✓ QR Code ou Copia e Cola</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="boleto" className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <FileText className="w-8 h-8 text-orange-600" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Boleto Bancário</h4>
                      <ul className="text-sm text-orange-700 mt-2 space-y-1">
                        <li>✓ Pagável em qualquer banco</li>
                        <li>✓ Código de barras disponível</li>
                        <li>✓ Download do PDF do boleto</li>
                        <li>⚠ Compensação em até 3 dias úteis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Segurança */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Pagamento 100% Seguro</p>
                <p className="text-xs text-green-700 mt-1">
                  Seus dados são protegidos com criptografia de ponta a ponta. 
                  Não armazenamos informações sensíveis de pagamento.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleCreatePayment(metodoSelecionado)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
          >
            {metodoSelecionado === 'pix' && <QrCode className="w-4 h-4 mr-2" />}
            {metodoSelecionado === 'boleto' && <FileText className="w-4 h-4 mr-2" />}
            Gerar {metodoSelecionado === 'pix' ? 'PIX' : 'Boleto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}