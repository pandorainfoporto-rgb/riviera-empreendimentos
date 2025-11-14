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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function PagarDialog({ conta, fornecedores, caixas, tiposDespesa = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
    valor: 0,
    caixa_id: "",
    tipo_pagamento: "dinheiro",
    numero_documento: "",
    numero_nota: "",
    conta_contabil: "",
    tipo_despesa_id: "",
    observacoes: "",
    status: "pendente",
  });

  const [showFornecedorSearch, setShowFornecedorSearch] = useState(false);
  const [showCaixaSearch, setShowCaixaSearch] = useState(false);
  const [showTipoDespesaSearch, setShowTipoDespesaSearch] = useState(false);
  const [showContaContabilSearch, setShowContaContabilSearch] = useState(false);

  useEffect(() => {
    if (conta) {
      setFormData({
        fornecedor_id: conta.fornecedor_id || "",
        data_emissao: conta.created_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        data_vencimento: conta.data_vencimento || "",
        valor: conta.valor || 0,
        caixa_id: conta.caixa_id || "",
        tipo_pagamento: conta.tipo_pagamento || "dinheiro",
        numero_documento: conta.numero_documento || "",
        numero_nota: conta.numero_nota || "",
        conta_contabil: conta.conta_contabil || "",
        tipo_despesa_id: conta.tipo_despesa_id || "",
        observacoes: conta.observacoes || "",
        status: conta.status || "pendente",
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
      data_pagamento: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[var(--wine-700)]">
              Contas a pagar {conta ? `- ID: ${conta.id?.substring(0, 8)}` : ''}
            </DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSalvar} className="bg-[var(--wine-600)]">Salvar</Button>
              <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
              {conta && <Button size="sm" variant="destructive">Deletar</Button>}
              {conta && <Button size="sm" variant="outline">Duplicar</Button>}
              {conta && <Button size="sm" variant="outline">Auditoria</Button>}
              {conta && <Button size="sm" className="bg-green-600" onClick={handlePagar}>Pagar</Button>}
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
                    Fornecedor/Fornecedor *
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowFornecedorSearch(!showFornecedorSearch)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  {showFornecedorSearch ? (
                    <Select
                      value={formData.fornecedor_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, fornecedor_id: value });
                        setShowFornecedorSearch(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
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
                      />
                    </div>
                  )}
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
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
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
                    onClick={() => setShowCaixaSearch(!showCaixaSearch)}
                  >
                    <Search className="w-3 h-3" />
                  </Button>
                </Label>
                {showCaixaSearch ? (
                  <Select
                    value={formData.caixa_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, caixa_id: value });
                      setShowCaixaSearch(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar caixa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {caixas.map(caixa => (
                        <SelectItem key={caixa.id} value={caixa.id}>
                          {caixa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={caixa?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                )}
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
                      <div className="space-y-2">
                        <Input
                          placeholder="Digite código ou descrição da conta contábil"
                          onChange={(e) => {
                            setFormData({ ...formData, conta_contabil: e.target.value });
                          }}
                          onBlur={() => setShowContaContabilSearch(false)}
                          autoFocus
                        />
                      </div>
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
                    onClick={() => setShowTipoDespesaSearch(!showTipoDespesaSearch)}
                  >
                    <Search className="w-3 h-3" />
                  </Button>
                </Label>
                {showTipoDespesaSearch ? (
                  <Select
                    value={formData.tipo_despesa_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, tipo_despesa_id: value });
                      setShowTipoDespesaSearch(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar tipo de despesa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDespesa.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={tipoDespesa?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                )}
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

            <TabsContent value="info" className="mt-4">
              <div className="text-center py-12 text-gray-400">
                <p>Informações adicionais</p>
              </div>
            </TabsContent>

            <TabsContent value="pagamentos" className="mt-4">
              <div className="text-center py-12 text-gray-400">
                <p>Histórico de pagamentos</p>
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
  );
}