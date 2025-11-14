
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchFornecedorDialog from "./SearchFornecedorDialog";
import SearchCaixaDialog from "./SearchCaixaDialog";
import SearchTipoDespesaDialog from "./SearchTipoDespesaDialog";
import { InputCurrency } from "@/components/ui/input-currency"; // Added import

export default function PagarDialog({ conta, fornecedores, caixas, tiposDespesa = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
    valor: 0,
    valor_pago: 0,
    saldo_devedor: 0,
    caixa_id: "",
    tipo_pagamento: "dinheiro",
    numero_documento: "",
    numero_nota: "",
    conta_contabil: "",
    tipo_despesa_id: "",
    observacoes: "",
    status: "pendente",
    historico_pagamentos: [],
  });

  const [showFornecedorSearch, setShowFornecedorSearch] = useState(false);
  const [showCaixaSearch, setShowCaixaSearch] = useState(false);
  const [showTipoDespesaSearch, setShowTipoDespesaSearch] = useState(false);
  const [showContaContabilSearch, setShowContaContabilSearch] = useState(false);
  const [showPagamentoParcial, setShowPagamentoParcial] = useState(false);
  const [valorPagamentoParcial, setValorPagamentoParcial] = useState(0);

  useEffect(() => {
    if (conta) {
      setFormData({
        fornecedor_id: conta.fornecedor_id || "",
        data_emissao: conta.created_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        data_vencimento: conta.data_vencimento || "",
        valor: conta.valor || 0,
        valor_pago: conta.valor_pago || 0,
        saldo_devedor: conta.saldo_devedor || conta.valor || 0,
        caixa_id: conta.caixa_id || "",
        tipo_pagamento: conta.tipo_pagamento || "dinheiro",
        numero_documento: conta.numero_documento || "",
        numero_nota: conta.numero_nota || "",
        conta_contabil: conta.conta_contabil || "",
        tipo_despesa_id: conta.tipo_despesa_id || "",
        observacoes: conta.observacoes || "",
        status: conta.status || "pendente",
        historico_pagamentos: conta.historico_pagamentos || [],
      });
    }
  }, [conta]);

  const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
  const caixa = caixas.find(c => c.id === formData.caixa_id);
  const tipoDespesa = tiposDespesa.find(t => t.id === formData.tipo_despesa_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleSalvar = () => {
    onSave(formData);
  };

  const handlePagar = () => {
    onSave({
      ...formData,
      status: 'pago',
      valor_pago: formData.valor,
      saldo_devedor: 0,
      data_pagamento: new Date().toISOString().split('T')[0],
      historico_pagamentos: [
        ...(formData.historico_pagamentos || []),
        {
          data: new Date().toISOString().split('T')[0],
          valor: formData.saldo_devedor,
          tipo_pagamento: formData.tipo_pagamento,
          caixa_id: formData.caixa_id,
          observacao: "Pagamento total",
        }
      ]
    });
  };

  const handlePagamentoParcial = () => {
    if (valorPagamentoParcial <= 0 || valorPagamentoParcial > formData.saldo_devedor) {
      alert("Valor inválido para pagamento parcial");
      return;
    }

    const novoValorPago = formData.valor_pago + valorPagamentoParcial;
    const novoSaldo = formData.valor - novoValorPago;
    const novoStatus = novoSaldo > 0 ? 'parcial' : 'pago';

    onSave({
      ...formData,
      valor_pago: novoValorPago,
      saldo_devedor: novoSaldo,
      status: novoStatus,
      data_pagamento: novoStatus === 'pago' ? new Date().toISOString().split('T')[0] : formData.data_pagamento,
      historico_pagamentos: [
        ...(formData.historico_pagamentos || []),
        {
          data: new Date().toISOString().split('T')[0],
          valor: valorPagamentoParcial,
          tipo_pagamento: formData.tipo_pagamento,
          caixa_id: formData.caixa_id,
          observacao: `Pagamento parcial ${formData.historico_pagamentos.length + 1}`,
        }
      ]
    });
    setShowPagamentoParcial(false);
    setValorPagamentoParcial(0);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-[var(--wine-700)]">
                  Contas a pagar {conta && `- #${conta.id?.substring(0, 8)}`}
                </DialogTitle>
                {formData.status === 'parcial' && (
                  <Badge className="bg-yellow-500">Parcial</Badge>
                )}
                {formData.status === 'pago' && (
                  <Badge className="bg-green-600">Pago</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSalvar} className="bg-[var(--wine-600)]">Salvar</Button>
                <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
                {conta && <Button size="sm" variant="destructive">Deletar</Button>}
                {conta && <Button size="sm" variant="outline">Duplicar</Button>}
                {conta && <Button size="sm" variant="outline">Auditoria</Button>}
                {conta && formData.saldo_devedor > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      className="bg-orange-600" 
                      onClick={() => setShowPagamentoParcial(true)}
                    >
                      Pagar Parcial
                    </Button>
                    <Button size="sm" className="bg-green-600" onClick={handlePagar}>
                      Pagar Total
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="contas" className="w-full">
              <TabsList>
                <TabsTrigger value="contas">Contas a pagar</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
                <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
                <TabsTrigger value="log">Log de pagamento</TabsTrigger>
              </TabsList>

              <TabsContent value="contas" className="space-y-4 mt-4">
                {/* Resumo Financeiro */}
                {conta && formData.valor > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Valor Total</p>
                          <p className="text-xl font-bold text-gray-900">
                            R$ {formData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Valor Pago</p>
                          <p className="text-xl font-bold text-green-600">
                            R$ {formData.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Saldo Devedor</p>
                          <p className="text-xl font-bold text-red-600">
                            R$ {formData.saldo_devedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">% Pago</p>
                          <p className="text-xl font-bold text-blue-600">
                            {((formData.valor_pago / formData.valor) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID</Label>
                    <Input
                      value={conta?.id?.substring(0, 8) || "Novo"}
                      disabled
                      className="w-32 bg-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Fornecedor *
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => setShowFornecedorSearch(true)}
                      >
                        <Search className="w-3 h-3" />
                      </Button>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={fornecedor?.id?.substring(0, 8) || ""}
                        disabled
                        className="w-24 bg-gray-100"
                      />
                      <Input
                        value={fornecedor?.nome || ""}
                        disabled
                        className="flex-1 bg-gray-100"
                        placeholder="Clique na lupa para selecionar..."
                      />
                    </div>
                  </div>
                </div>

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
                      onChange={(value) => { // InputCurrency typically returns the numeric value directly
                        const novoValor = parseFloat(value) || 0;
                        setFormData({ 
                          ...formData, 
                          valor: novoValor,
                          saldo_devedor: novoValor - formData.valor_pago
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Caixa de pagamento *
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowCaixaSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={caixa?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de pagamento *</Label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "dinheiro", label: "Dinheiro" },
                      { value: "boleto", label: "Boleto" },
                      { value: "cheque", label: "Cheque" },
                      { value: "cartao", label: "Cartão" },
                      { value: "deposito", label: "Depósito" },
                      { value: "debito", label: "Débito em conta" },
                      { value: "transferencia", label: "Transferência" },
                      { value: "pix", label: "Pix" },
                    ].map(tipo => (
                      <label key={tipo.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipo_pagamento"
                          value={tipo.value}
                          checked={formData.tipo_pagamento === tipo.value}
                          onChange={(e) => setFormData({ ...formData, tipo_pagamento: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{tipo.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do documento</Label>
                    <Input
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número da nota</Label>
                    <Input
                      value={formData.numero_nota}
                      onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3 font-semibold">Detalhes do lançamento</p>
                </div>

                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="flex items-center gap-2">
                          Conta contábil analítica
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => setShowContaContabilSearch(!showContaContabilSearch)}
                          >
                            <Search className="w-3 h-3" />
                          </Button>
                        </Label>
                      </div>
                      {showContaContabilSearch ? (
                        <Input
                          placeholder="Digite código ou descrição da conta contábil"
                          onChange={(e) => {
                            setFormData({ ...formData, conta_contabil: e.target.value });
                          }}
                          onBlur={() => setShowContaContabilSearch(false)}
                          autoFocus
                        />
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Código"
                            value={formData.conta_contabil?.split(' - ')[0] || ""}
                            disabled
                            className="w-24 bg-gray-100"
                          />
                          <Input
                            placeholder="Despesas com alimentação, hospedagem..."
                            value={formData.conta_contabil?.split(' - ')[1] || ""}
                            disabled
                            className="flex-1 bg-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Tipo de despesa *
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowTipoDespesaSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={tipoDespesa?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pagamentos" className="mt-4 space-y-4">
                {formData.historico_pagamentos && formData.historico_pagamentos.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Histórico de Pagamentos</h3>
                    {formData.historico_pagamentos.map((pag, idx) => (
                      <Card key={idx} className="border-l-4 border-green-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-lg">
                                R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(pag.data).toLocaleDateString('pt-BR')} - {pag.tipo_pagamento}
                              </p>
                              <p className="text-sm text-gray-500">{pag.observacao}</p>
                            </div>
                            <Badge>Pagamento #{idx + 1}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>Nenhum pagamento registrado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="mt-4">
                <div className="text-center py-12 text-gray-400">
                  <p>Informações adicionais</p>
                </div>
              </TabsContent>

              <TabsContent value="arquivos" className="mt-4">
                <div className="text-center py-12 text-gray-400">
                  <p>Anexos e arquivos</p>
                </div>
              </TabsContent>

              <TabsContent value="auditoria" className="mt-4">
                <div className="text-center py-12 text-gray-400">
                  <p>Informações de auditoria</p>
                </div>
              </TabsContent>

              <TabsContent value="log" className="mt-4">
                <div className="text-center py-12 text-gray-400">
                  <p>Log de pagamento</p>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pagamento Parcial */}
      <Dialog open={showPagamentoParcial} onOpenChange={setShowPagamentoParcial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Parcial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Devedor</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {formData.saldo_devedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Valor do Pagamento Parcial *</Label>
              <InputCurrency
                value={valorPagamentoParcial}
                onChange={(value) => setValorPagamentoParcial(parseFloat(value) || 0)} // InputCurrency returns numeric value
                placeholder="0,00"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPagamentoParcial(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePagamentoParcial} className="bg-green-600">
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SearchFornecedorDialog
        open={showFornecedorSearch}
        onClose={() => setShowFornecedorSearch(false)}
        fornecedores={fornecedores}
        onSelect={(fornecedor) => {
          setFormData({ ...formData, fornecedor_id: fornecedor.id });
          setShowFornecedorSearch(false);
        }}
      />

      <SearchCaixaDialog
        open={showCaixaSearch}
        onClose={() => setShowCaixaSearch(false)}
        caixas={caixas}
        onSelect={(caixa) => {
          setFormData({ ...formData, caixa_id: caixa.id });
          setShowCaixaSearch(false);
        }}
      />

      <SearchTipoDespesaDialog
        open={showTipoDespesaSearch}
        onClose={() => setShowTipoDespesaSearch(false)}
        tiposDespesa={tiposDespesa}
        onSelect={(tipo) => {
          setFormData({ ...formData, tipo_despesa_id: tipo.id });
          setShowTipoDespesaSearch(false);
        }}
      />
    </>
  );
}
