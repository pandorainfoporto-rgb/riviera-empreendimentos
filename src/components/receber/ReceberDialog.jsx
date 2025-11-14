import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Save, DollarSign, Calendar, CheckCircle2, Trash2, CreditCard, Plus } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { InputCurrency } from "@/components/ui/input-currency";
import { toast } from "sonner";

export default function ReceberDialog({ conta, clientes, socios, unidades, caixas, onClose, onSave }) {
  const [formData, setFormData] = useState({
    cliente_id: "",
    socio_id: "",
    unidade_id: "",
    valor: 0,
    data_vencimento: "",
    data_emissao: "",
    data_pagamento: "",
    status: "pendente",
    forma_pagamento: "",
    formas_pagamento: [],
    caixa_id: "",
    valor_total_recebido: 0,
    juros_percentual: 0.1,
    multa_percentual: 2,
    valor_juros: 0,
    valor_multa: 0,
    observacoes: "",
    historico_pagamentos: [],
  });

  const [valorRecebimento, setValorRecebimento] = useState(0);
  const [formaRecebimento, setFormaRecebimento] = useState("pix");
  const [caixaRecebimento, setCaixaRecebimento] = useState("");
  const [showPagamentoParcial, setShowPagamentoParcial] = useState(false);

  useEffect(() => {
    if (conta) {
      setFormData({
        ...conta,
        historico_pagamentos: conta.historico_pagamentos || [],
      });
      calcularJurosMulta(conta);
    }
  }, [conta]);

  const calcularJurosMulta = (dadosConta) => {
    if (!dadosConta?.data_vencimento || dadosConta.status === 'pago') return;

    const hoje = new Date();
    const dataVenc = parseISO(dadosConta.data_vencimento);
    const diasAtraso = differenceInDays(hoje, dataVenc);

    if (diasAtraso > 0) {
      const valorJuros = (dadosConta.valor || 0) * (dadosConta.juros_percentual || 0.1) / 100 * diasAtraso;
      const valorMulta = (dadosConta.valor || 0) * (dadosConta.multa_percentual || 2) / 100;

      setFormData(prev => ({
        ...prev,
        valor_juros: valorJuros,
        valor_multa: valorMulta,
      }));
    }
  };

  const handleReceber = () => {
    if (!caixaRecebimento) {
      toast.error("Selecione o caixa de destino");
      return;
    }

    const valorTotal = formData.valor + formData.valor_juros + formData.valor_multa;

    const novoHistorico = [
      ...(formData.historico_pagamentos || []),
      {
        data: new Date().toISOString(),
        valor: valorTotal,
        forma_pagamento: formaRecebimento,
        caixa_id: caixaRecebimento,
        observacoes: formData.observacoes,
      }
    ];

    onSave({
      ...formData,
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      forma_pagamento: formaRecebimento,
      caixa_id: caixaRecebimento,
      valor_total_recebido: valorTotal,
      historico_pagamentos: novoHistorico,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!conta?.id) {
      onSave(formData);
    }
  };

  const cliente = conta?.tipo_titulo === 'cliente' ? clientes.find(c => c.id === conta.cliente_id) : null;
  const socio = conta?.tipo_titulo === 'socio' ? socios.find(s => s.id === conta.socio_id) : null;
  const unidade = unidades.find(u => u.id === conta?.unidade_id);
  const isPago = conta?.status === 'pago' || conta?.status === 'recebido';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            {conta?.id ? "Recebimento" : "Novo Título a Receber"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="contas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contas">Conta</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="info">Informações</TabsTrigger>
            </TabsList>

            <TabsContent value="contas" className="space-y-4 mt-4">
              {conta?.id && (
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-300">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Pagador</p>
                      <p className="font-bold text-gray-900">{cliente?.nome || socio?.nome || '-'}</p>
                      {unidade && (
                        <p className="text-xs text-gray-600 mt-1">Unidade: {unidade.codigo}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Original</p>
                      <p className="text-2xl font-bold text-green-700">
                        R$ {(formData.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="text-2xl font-bold text-blue-700">
                        R$ {((formData.valor || 0) + (formData.valor_juros || 0) + (formData.valor_multa || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {(formData.valor_juros > 0 || formData.valor_multa > 0) && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Juros: </span>
                        <span className="font-semibold text-red-600">
                          R$ {formData.valor_juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Multa: </span>
                        <span className="font-semibold text-red-600">
                          R$ {formData.valor_multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data da emissão *</Label>
                  <Input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data do vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Total *</Label>
                  <InputCurrency
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  />
                </div>
              </div>

              {!isPago && conta?.id && (
                <>
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">💰 Registrar Recebimento</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Forma de Recebimento *</Label>
                        <Select value={formaRecebimento} onValueChange={setFormaRecebimento}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                            <SelectItem value="multiplas">Múltiplas Formas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Caixa Destino *</Label>
                        <Select value={caixaRecebimento} onValueChange={setCaixaRecebimento}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o caixa" />
                          </SelectTrigger>
                          <SelectContent>
                            {caixas.filter(c => c.ativo).map(caixa => (
                              <SelectItem key={caixa.id} value={caixa.id}>
                                {caixa.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        onClick={handleReceber}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirmar Recebimento
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <div className="space-y-3">
                {formData.historico_pagamentos?.length > 0 ? (
                  formData.historico_pagamentos.map((hist, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            R$ {(hist.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {hist.forma_pagamento} • {format(parseISO(hist.data), 'dd/MM/yyyy HH:mm')}
                          </p>
                          {hist.observacoes && (
                            <p className="text-xs text-gray-500 mt-1">{hist.observacoes}</p>
                          )}
                        </div>
                        <Badge className="bg-green-500">Recebido</Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum histórico de recebimentos
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={4}
                  placeholder="Observações sobre este recebimento..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}