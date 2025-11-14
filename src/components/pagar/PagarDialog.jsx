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
    filial: "1",
    regime_contabil: "previsao",
    tipo_despesa_id: "",
    despesa_veiculada: "sim",
    observacoes: "",
    status: "pendente",
  });

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
        filial: conta.filial || "1",
        regime_contabil: conta.regime_contabil || "previsao",
        tipo_despesa_id: conta.tipo_despesa_id || "",
        despesa_veiculada: conta.despesa_veiculada || "sim",
        observacoes: conta.observacoes || "",
        status: conta.status || "pendente",
      });
    } else {
      setFormData({
        fornecedor_id: "",
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: "",
        valor: 0,
        caixa_id: "",
        tipo_pagamento: "dinheiro",
        numero_documento: "",
        numero_nota: "",
        conta_contabil: "",
        filial: "1",
        regime_contabil: "previsao",
        tipo_despesa_id: "",
        despesa_veiculada: "sim",
        observacoes: "",
        status: "pendente",
      });
    }
  }, [conta]);

  const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-800 text-white border-slate-600">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">
              Contas a pagar {conta ? `- ID: ${conta.id?.substring(0, 8)}` : ''}
            </DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleSalvar}>Salvar</Button>
              <Button size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>
              {conta && <Button size="sm" variant="secondary">Deletar</Button>}
              {conta && <Button size="sm" variant="secondary">Duplicar</Button>}
              {conta && <Button size="sm" variant="secondary">Auditoria</Button>}
              {conta && <Button size="sm" variant="secondary" onClick={handlePagar}>Pagar</Button>}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="contas" className="w-full">
            <TabsList className="bg-slate-700">
              <TabsTrigger value="contas" className="data-[state=active]:bg-slate-600">
                Contas a pagar
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-slate-600">
                Informações
              </TabsTrigger>
              <TabsTrigger value="pagamentos" className="data-[state=active]:bg-slate-600">
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="arquivos" className="data-[state=active]:bg-slate-600">
                Arquivos
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="data-[state=active]:bg-slate-600">
                Auditoria
              </TabsTrigger>
              <TabsTrigger value="log" className="data-[state=active]:bg-slate-600">
                Log de pagamento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contas" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">ID</Label>
                  <Input
                    value={conta?.id?.substring(0, 13) || "Novo"}
                    disabled
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white flex items-center gap-2">
                    Fornecedor/Fornecedor
                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={fornecedor?.id?.substring(0, 8) || ""}
                      disabled
                      className="w-24 bg-slate-700 border-slate-600 text-white"
                    />
                    <Select
                      value={formData.fornecedor_id}
                      onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                    >
                      <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-white">
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Data da emissão *</Label>
                  <Input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Data do vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <input type="radio" name="caixa_radio" defaultChecked />
                  Caixa de pagamento *
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                    <Search className="w-3 h-3" />
                  </Button>
                </Label>
                <Select
                  value={formData.caixa_id}
                  onValueChange={(value) => setFormData({ ...formData, caixa_id: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Buscar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {caixas.map(caixa => (
                      <SelectItem key={caixa.id} value={caixa.id}>
                        {caixa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Tipo de pagamento *</Label>
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
                  <Label className="text-white">Número do documento</Label>
                  <Input
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Número da nota</Label>
                  <Input
                    value={formData.numero_nota}
                    onChange={(e) => setFormData({ ...formData, numero_nota: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-600 pt-4">
                <p className="text-sm text-slate-400 mb-3">Detalhes do lançamento</p>
              </div>

              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-white flex items-center gap-2">
                        <input type="radio" name="conta_contabil_radio" defaultChecked />
                        Conta contábil analítica
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                          <Search className="w-3 h-3 text-white" />
                        </Button>
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="2225"
                        value={formData.conta_contabil?.split(' - ')[0] || ""}
                        onChange={(e) => {
                          const codigo = e.target.value;
                          const descricao = formData.conta_contabil?.split(' - ')[1] || "";
                          setFormData({ ...formData, conta_contabil: descricao ? `${codigo} - ${descricao}` : codigo });
                        }}
                        className="w-24 bg-slate-800 border-slate-600 text-white"
                      />
                      <Input
                        placeholder="Despesas com alimentação, hospeda..."
                        value={formData.conta_contabil?.split(' - ')[1] || ""}
                        onChange={(e) => {
                          const codigo = formData.conta_contabil?.split(' - ')[0] || "";
                          setFormData({ ...formData, conta_contabil: `${codigo} - ${e.target.value}` });
                        }}
                        className="flex-1 bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-white text-sm">Filial</Label>
                      <Input
                        value={formData.filial}
                        onChange={(e) => setFormData({ ...formData, filial: e.target.value })}
                        className="w-20 bg-slate-800 border-slate-600 text-white text-sm"
                      />
                      <span className="text-white text-sm">PANDORA INFORMATICA E TECNOL...</span>
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                        <Search className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="text-white">Regime contábil (Previsão) *</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "previsao", label: "Competência (Previsão não)" },
                    { value: "competencia", label: "Competência (Previsão não)" },
                    { value: "caixa", label: "Caixa (Previsão sim)" },
                    { value: "manual", label: "Manual" },
                  ].map(regime => (
                    <label key={regime.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="regime_contabil"
                        value={regime.value}
                        checked={formData.regime_contabil === regime.value}
                        onChange={(e) => setFormData({ ...formData, regime_contabil: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{regime.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <input type="radio" name="tipo_despesa_radio" defaultChecked />
                  Tipo de despesa *
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6">
                    <Search className="w-3 h-3" />
                  </Button>
                </Label>
                <Select
                  value={formData.tipo_despesa_id}
                  onValueChange={(value) => setFormData({ ...formData, tipo_despesa_id: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Buscar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDespesa.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Despesa veiculada *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="despesa_veiculada"
                      value="sim"
                      checked={formData.despesa_veiculada === "sim"}
                      onChange={(e) => setFormData({ ...formData, despesa_veiculada: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="despesa_veiculada"
                      value="nao"
                      checked={formData.despesa_veiculada === "nao"}
                      onChange={(e) => setFormData({ ...formData, despesa_veiculada: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <div className="text-center py-12 text-slate-400">
                <p>Informações adicionais</p>
              </div>
            </TabsContent>

            <TabsContent value="pagamentos" className="mt-4">
              <div className="text-center py-12 text-slate-400">
                <p>Histórico de pagamentos</p>
              </div>
            </TabsContent>

            <TabsContent value="arquivos" className="mt-4">
              <div className="text-center py-12 text-slate-400">
                <p>Anexos e arquivos</p>
              </div>
            </TabsContent>

            <TabsContent value="auditoria" className="mt-4">
              <div className="text-center py-12 text-slate-400">
                <p>Informações de auditoria</p>
              </div>
            </TabsContent>

            <TabsContent value="log" className="mt-4">
              <div className="text-center py-12 text-slate-400">
                <p>Log de pagamento</p>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}