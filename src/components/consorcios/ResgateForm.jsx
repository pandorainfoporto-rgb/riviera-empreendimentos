import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Calculator } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const formasRecebimento = [
  { value: "transferencia", label: "Transferência" },
  { value: "ted", label: "TED" },
  { value: "doc", label: "DOC" },
  { value: "cheque", label: "Cheque" },
  { value: "outros", label: "Outros" },
];

export default function ResgateForm({ consorcios, unidades, clientes, caixas, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState({
    consorcio_id: "",
    unidade_id: "",
    cliente_id: "",
    caixa_id: "",
    valor_resgate: 0,
    valor_amortizado: 0,
    valor_saldo_devedor: 0,
    taxa_administrativa: 0,
    valor_liquido: 0,
    data_resgate: new Date().toISOString().split('T')[0],
    forma_recebimento: "transferencia",
    alocado_unidade: false,
    observacoes: "",
    status: "solicitado",
  });

  const consorcioSelecionado = consorcios.find(c => c.id === formData.consorcio_id);

  // Calcular valor líquido automaticamente
  const calcularValorLiquido = (valorResgate, taxaAdmin) => {
    const taxa = parseFloat(taxaAdmin) || 0;
    const valor = parseFloat(valorResgate) || 0;
    return valor - (valor * taxa / 100);
  };

  const handleValorResgateChange = (valor) => {
    const valorNum = parseFloat(valor) || 0;
    const valorLiq = calcularValorLiquido(valorNum, formData.taxa_administrativa);
    setFormData({
      ...formData,
      valor_resgate: valorNum,
      valor_liquido: valorLiq,
    });
  };

  const handleTaxaChange = (taxa) => {
    const taxaNum = parseFloat(taxa) || 0;
    const valorLiq = calcularValorLiquido(formData.valor_resgate, taxaNum);
    setFormData({
      ...formData,
      taxa_administrativa: taxaNum,
      valor_liquido: valorLiq,
    });
  };

  const handleConsorcioChange = (consorcioId) => {
    const consorcio = consorcios.find(c => c.id === consorcioId);
    if (consorcio) {
      setFormData({
        ...formData,
        consorcio_id: consorcioId,
        unidade_id: consorcio.unidade_id || "",
        cliente_id: consorcio.cliente_id || "",
        valor_resgate: consorcio.valor_carta || 0,
        valor_amortizado: (consorcio.parcelas_pagas || 0) * (consorcio.valor_parcela || 0),
        valor_saldo_devedor: 0,
        valor_liquido: calcularValorLiquido(consorcio.valor_carta || 0, formData.taxa_administrativa),
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-xl border-t-4 border-green-600">
      <CardHeader>
        <CardTitle className="text-green-700 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Novo Resgate de Consórcio
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="consorcio_id">Consórcio Contemplado *</Label>
            <Select
              value={formData.consorcio_id}
              onValueChange={handleConsorcioChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cota contemplada" />
              </SelectTrigger>
              <SelectContent>
                {consorcios.map(cons => (
                  <SelectItem key={cons.id} value={cons.id}>
                    Grupo {cons.grupo} - Cota {cons.cota} (R$ {(cons.valor_carta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {consorcioSelecionado && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Informações do Consórcio</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Grupo:</span>
                  <span className="ml-2 font-medium">{consorcioSelecionado.grupo}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cota:</span>
                  <span className="ml-2 font-medium">{consorcioSelecionado.cota}</span>
                </div>
                <div>
                  <span className="text-gray-600">Valor Carta:</span>
                  <span className="ml-2 font-medium">R$ {(consorcioSelecionado.valor_carta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-gray-600">Parcelas Pagas:</span>
                  <span className="ml-2 font-medium">{consorcioSelecionado.parcelas_pagas}/{consorcioSelecionado.parcelas_total}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_resgate">Valor do Resgate *</Label>
              <Input
                id="valor_resgate"
                type="number"
                step="0.01"
                value={formData.valor_resgate}
                onChange={(e) => handleValorResgateChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa_administrativa">Taxa Administrativa (%)</Label>
              <Input
                id="taxa_administrativa"
                type="number"
                step="0.01"
                value={formData.taxa_administrativa}
                onChange={(e) => handleTaxaChange(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_amortizado">Valor Amortizado</Label>
              <Input
                id="valor_amortizado"
                type="number"
                step="0.01"
                value={formData.valor_amortizado}
                onChange={(e) => setFormData({ ...formData, valor_amortizado: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_saldo_devedor">Saldo Devedor</Label>
              <Input
                id="valor_saldo_devedor"
                type="number"
                step="0.01"
                value={formData.valor_saldo_devedor}
                onChange={(e) => setFormData({ ...formData, valor_saldo_devedor: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-green-900">Valor Líquido a Receber:</span>
              <span className="text-2xl font-bold text-green-700">
                R$ {(formData.valor_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_resgate">Data do Resgate *</Label>
              <Input
                id="data_resgate"
                type="date"
                value={formData.data_resgate}
                onChange={(e) => setFormData({ ...formData, data_resgate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_recebimento">Forma de Recebimento *</Label>
              <Select
                value={formData.forma_recebimento}
                onValueChange={(value) => setFormData({ ...formData, forma_recebimento: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formasRecebimento.map(forma => (
                    <SelectItem key={forma.value} value={forma.value}>
                      {forma.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caixa_id">Caixa Destino *</Label>
            <Select
              value={formData.caixa_id}
              onValueChange={(value) => setFormData({ ...formData, caixa_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o caixa" />
              </SelectTrigger>
              <SelectContent>
                {caixas.map(caixa => (
                  <SelectItem key={caixa.id} value={caixa.id}>
                    {caixa.nome} (Saldo: R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-semibold">Alocar na Unidade</Label>
                <p className="text-sm text-gray-500">Adicionar valor ao saldo disponível da unidade</p>
              </div>
              <Switch
                checked={formData.alocado_unidade}
                onCheckedChange={(checked) => setFormData({ ...formData, alocado_unidade: checked })}
              />
            </div>

            {formData.alocado_unidade && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidade_id">Unidade *</Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    required={formData.alocado_unidade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cli => (
                        <SelectItem key={cli.id} value={cli.id}>
                          {cli.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
            disabled={isProcessing}
          >
            <Save className="w-4 h-4 mr-2" />
            {isProcessing ? "Salvando..." : "Registrar Resgate"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}