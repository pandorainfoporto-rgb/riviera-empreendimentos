import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, TrendingUp, Calculator } from "lucide-react";
import { differenceInMonths, parseISO } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InvestimentoForm({ item, tiposAtivos, corretoras, bancos, empreendimentos, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    tipo_ativo_id: "",
    corretora_id: "",
    banco_id: "",
    empreendimento_id: "",
    valor_aplicado: 0,
    data_aplicacao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
    taxa_rendimento_mensal: 0,
    taxa_rendimento_anual: 0,
    tipo_rendimento: "mensal",
    taxa_ir: 15,
    status: "ativo",
    observacoes: "",
  });

  const [previsao, setPrevisao] = useState(null);

  // Calcular previsão quando houver mudanças relevantes
  useEffect(() => {
    if (formData.valor_aplicado > 0 && formData.data_vencimento && formData.taxa_rendimento_mensal > 0) {
      calcularPrevisao();
    }
  }, [formData.valor_aplicado, formData.data_vencimento, formData.taxa_rendimento_mensal, formData.taxa_ir]);

  const calcularPrevisao = () => {
    const dataAplicacao = new Date(formData.data_aplicacao);
    const dataVencimento = new Date(formData.data_vencimento);
    const meses = differenceInMonths(dataVencimento, dataAplicacao);
    
    if (meses <= 0) return;

    const valorAplicado = parseFloat(formData.valor_aplicado) || 0;
    const taxaMensal = (parseFloat(formData.taxa_rendimento_mensal) || 0) / 100;
    
    const valorFuturo = valorAplicado * Math.pow(1 + taxaMensal, meses);
    const rendimentoBruto = valorFuturo - valorAplicado;
    const ir = (rendimentoBruto * (parseFloat(formData.taxa_ir) || 0)) / 100;
    const rendimentoLiquido = rendimentoBruto - ir;
    const valorLiquido = valorAplicado + rendimentoLiquido;

    setPrevisao({
      meses,
      valorFuturo,
      rendimentoBruto,
      ir,
      rendimentoLiquido,
      valorLiquido,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tipoAtivoSelecionado = tiposAtivos.find(t => t.id === formData.tipo_ativo_id);

  return (
    <Card className="shadow-xl border-t-4 border-blue-600">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          {item ? "Editar Investimento" : "Novo Investimento"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome/Identificação *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: CDB Banco XYZ, Tesouro Direto 2027, etc."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ativo_id">Tipo de Ativo *</Label>
              <Select
                value={formData.tipo_ativo_id}
                onValueChange={(value) => setFormData({ ...formData, tipo_ativo_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAtivos.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="empreendimento_id">Empreendimento</Label>
              <Select
                value={formData.empreendimento_id}
                onValueChange={(value) => setFormData({ ...formData, empreendimento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="corretora_id">Corretora</Label>
              <Select
                value={formData.corretora_id}
                onValueChange={(value) => setFormData({ ...formData, corretora_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a corretora" />
                </SelectTrigger>
                <SelectContent>
                  {corretoras.map(corr => (
                    <SelectItem key={corr.id} value={corr.id}>
                      {corr.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banco_id">Banco</Label>
              <Select
                value={formData.banco_id}
                onValueChange={(value) => setFormData({ ...formData, banco_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_aplicado">Valor Aplicado *</Label>
              <Input
                id="valor_aplicado"
                type="number"
                step="0.01"
                value={formData.valor_aplicado}
                onChange={(e) => setFormData({ ...formData, valor_aplicado: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_aplicacao">Data Aplicação *</Label>
              <Input
                id="data_aplicacao"
                type="date"
                value={formData.data_aplicacao}
                onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxa_rendimento_mensal">Taxa Rendimento Mensal (%) *</Label>
              <Input
                id="taxa_rendimento_mensal"
                type="number"
                step="0.01"
                value={formData.taxa_rendimento_mensal}
                onChange={(e) => setFormData({ ...formData, taxa_rendimento_mensal: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa_rendimento_anual">Taxa Rendimento Anual (%)</Label>
              <Input
                id="taxa_rendimento_anual"
                type="number"
                step="0.01"
                value={formData.taxa_rendimento_anual}
                onChange={(e) => setFormData({ ...formData, taxa_rendimento_anual: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa_ir">Taxa IR (%) *</Label>
              <Input
                id="taxa_ir"
                type="number"
                step="0.01"
                value={formData.taxa_ir}
                onChange={(e) => setFormData({ ...formData, taxa_ir: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          {previsao && (
            <Alert className="border-green-500 bg-green-50">
              <Calculator className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2 mt-2">
                  <p className="font-semibold">Projeção de Rendimento ({previsao.meses} meses):</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Valor Futuro:</span>
                      <p className="font-semibold">R$ {previsao.valorFuturo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rendimento Bruto:</span>
                      <p className="font-semibold text-green-700">+R$ {previsao.rendimentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">IR:</span>
                      <p className="font-semibold text-red-600">-R$ {previsao.ir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rendimento Líquido:</span>
                      <p className="font-semibold text-blue-700">R$ {previsao.rendimentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t">
                      <span className="text-gray-600">Valor Líquido Total:</span>
                      <p className="font-bold text-lg text-green-700">R$ {previsao.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {item ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}