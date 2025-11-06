import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, DollarSign, Calendar, CheckCircle2, 
  AlertCircle, Clock, Receipt, Download, Shield
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PortalClienteFinanceiro() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  
  // Dados do cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const clientes = await base44.entities.Cliente.filter({ email: currentUser.email });
        if (clientes && clientes.length > 0) {
          setCliente(clientes[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentosClientes', cliente?.id],
    queryFn: () => base44.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
    enabled: !!cliente,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const pagarMutation = useMutation({
    mutationFn: async ({ pagamentoId, data }) => {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar pagamento
      return await base44.entities.PagamentoCliente.update(pagamentoId, {
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_total_recebido: data.valor,
        observacoes: `Pagamento online via ${data.metodo} - ${new Date().toLocaleString('pt-BR')}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
      setShowPaymentDialog(false);
      setSelectedPagamento(null);
      toast.success("Pagamento realizado com sucesso! Você receberá um comprovante por email.");
    },
    onError: (error) => {
      toast.error("Erro ao processar pagamento: " + error.message);
    },
  });

  const handlePayment = async () => {
    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
        toast.error("Preencha todos os dados do cartão");
        return;
      }
    }

    setProcessing(true);
    
    try {
      await pagarMutation.mutateAsync({
        pagamentoId: selectedPagamento.id,
        data: {
          valor: selectedPagamento.valor,
          metodo: paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                  paymentMethod === 'pix' ? 'PIX' : 'Boleto',
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!user || !cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente' || p.status === 'atrasado');
  const pagamentosPagos = pagamentos.filter(p => p.status === 'pago');

  const totalPendente = pagamentosPendentes.reduce((sum, p) => sum + p.valor, 0);
  const totalPago = pagamentosPagos.reduce((sum, p) => sum + (p.valor_total_recebido || p.valor), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Financeiro</h1>
          <p className="text-gray-600 mt-1">Gerencie seus pagamentos e histórico financeiro</p>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-t-4 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pendente</p>
                  <p className="text-2xl font-bold text-orange-700">
                    R$ {(totalPendente / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{pagamentosPendentes.length} parcela(s)</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pago</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {(totalPago / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{pagamentosPagos.length} parcela(s)</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Geral</p>
                  <p className="text-2xl font-bold text-blue-700">
                    R$ {((totalPago + totalPendente) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{pagamentos.length} parcela(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Pagamentos */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="pendentes">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pendentes">
                  Pagamentos Pendentes ({pagamentosPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="historico">
                  Histórico ({pagamentosPagos.length})
                </TabsTrigger>
              </TabsList>

              {/* Pagamentos Pendentes */}
              <TabsContent value="pendentes">
                {pagamentosPendentes.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">Nenhum pagamento pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagamentosPendentes
                      .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
                      .map((pag) => {
                        const unidade = unidades.find(u => u.id === pag.unidade_id);
                        const isVencido = pag.status === 'atrasado';
                        
                        return (
                          <div 
                            key={pag.id}
                            className={`p-6 rounded-lg border-l-4 ${
                              isVencido 
                                ? 'bg-red-50 border-red-500' 
                                : 'bg-blue-50 border-blue-500'
                            } hover:shadow-md transition-all`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Receipt className={`w-5 h-5 ${isVencido ? 'text-red-600' : 'text-blue-600'}`} />
                                  <h3 className="font-bold text-gray-900">
                                    {pag.tipo === 'entrada' ? 'Entrada' : 
                                     pag.tipo === 'parcela' ? 'Parcela Mensal' : 
                                     pag.tipo === 'sinal' ? 'Sinal' : 
                                     pag.tipo === 'chaves' ? 'Chaves' : pag.tipo}
                                  </h3>
                                  <Badge className={isVencido ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                                    {isVencido ? 'Vencido' : 'Pendente'}
                                  </Badge>
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      Venc: {format(parseISO(pag.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                  </div>
                                  <div>
                                    <span>Unidade: {unidade?.codigo || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <p className="text-3xl font-bold text-gray-900">
                                    R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Button
                                  onClick={() => {
                                    setSelectedPagamento(pag);
                                    setShowPaymentDialog(true);
                                  }}
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90 w-full md:w-auto"
                                  size="lg"
                                >
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Pagar Online
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Histórico */}
              <TabsContent value="historico">
                {pagamentosPagos.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Nenhum pagamento realizado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagamentosPagos
                      .sort((a, b) => new Date(b.data_pagamento) - new Date(a.data_pagamento))
                      .map((pag) => {
                        const unidade = unidades.find(u => u.id === pag.unidade_id);
                        
                        return (
                          <div 
                            key={pag.id}
                            className="p-6 rounded-lg bg-green-50 border-l-4 border-green-500"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  <h3 className="font-bold text-gray-900">
                                    {pag.tipo === 'entrada' ? 'Entrada' : 
                                     pag.tipo === 'parcela' ? 'Parcela Mensal' : pag.tipo}
                                  </h3>
                                  <Badge className="bg-green-100 text-green-700">
                                    Pago
                                  </Badge>
                                </div>
                                <div className="grid md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      Pago em: {format(parseISO(pag.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                  </div>
                                  <div>
                                    <span>Unidade: {unidade?.codigo || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-green-700">
                                      R$ {(pag.valor_total_recebido || pag.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                                {pag.observacoes && (
                                  <p className="text-xs text-gray-500 mt-2">{pag.observacoes}</p>
                                )}
                              </div>
                              <div>
                                <Button variant="outline" size="sm">
                                  <Download className="w-4 h-4 mr-2" />
                                  Comprovante
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Pagamento */}
      {showPaymentDialog && selectedPagamento && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Pagamento Seguro
              </DialogTitle>
              <DialogDescription>
                Preencha os dados para realizar o pagamento de forma segura
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Resumo do Pagamento */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Resumo do Pagamento</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-semibold">{selectedPagamento.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vencimento:</span>
                    <span className="font-semibold">
                      {format(parseISO(selectedPagamento.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-gray-900 font-bold">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      R$ {selectedPagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-4">
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">
                      💳 Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="pix">
                      🔷 PIX
                    </SelectItem>
                    <SelectItem value="boleto">
                      📄 Boleto Bancário
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formulário de Cartão */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Dados do Cartão
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="card_number">Número do Cartão</Label>
                      <Input
                        id="card_number"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="card_name">Nome no Cartão</Label>
                      <Input
                        id="card_name"
                        placeholder="NOME COMPLETO"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card_expiry">Validade</Label>
                        <Input
                          id="card_expiry"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="card_cvv">CVV</Label>
                        <Input
                          id="card_cvv"
                          placeholder="000"
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value)}
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PIX */}
              {paymentMethod === 'pix' && (
                <div className="p-6 bg-blue-50 rounded-lg text-center">
                  <div className="w-48 h-48 bg-white mx-auto mb-4 rounded-lg flex items-center justify-center">
                    <div className="text-6xl">🔷</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code ou copie o código PIX</p>
                  <Button variant="outline" className="w-full">
                    Copiar Código PIX
                  </Button>
                </div>
              )}

              {/* Boleto */}
              {paymentMethod === 'boleto' && (
                <div className="p-6 bg-yellow-50 rounded-lg text-center">
                  <p className="text-gray-700 mb-4">
                    Um boleto será gerado e enviado para seu email
                  </p>
                  <p className="text-sm text-gray-600">
                    Prazo de pagamento: 3 dias úteis
                  </p>
                </div>
              )}

              {/* Segurança */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Pagamento 100% Seguro</p>
                    <p className="text-xs text-green-700 mt-1">
                      Seus dados são protegidos com criptografia de ponta a ponta. 
                      Não armazenamos informações do seu cartão.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={processing}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}