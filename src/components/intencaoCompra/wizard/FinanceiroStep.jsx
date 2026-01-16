import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Save, DollarSign, FileText, Download } from "lucide-react";
import { InputCurrency } from "../../ui/input-currency";
import { base44 } from "@/api/base44Client";

const condicaoPagamentoOptions = [
  { value: "a_vista", label: "À Vista" },
  { value: "2x", label: "2x" },
  { value: "3x", label: "3x" },
  { value: "4x", label: "4x" },
  { value: "5x", label: "5x" },
  { value: "6x", label: "6x" },
];

export default function FinanceiroStep({ data, onChange, onFinish, onBack }) {
  const [showDownloadPDF, setShowDownloadPDF] = useState(false);
  const [intencaoId, setIntencaoId] = useState(data?.id || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const result = await onFinish();
      if (result && result.id) {
        setIntencaoId(result.id);
      }
      setShowDownloadPDF(true);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!intencaoId) return;
    
    try {
      const response = await base44.functions.invoke('gerarPDFIntencaoCompra', {
        intencao_compra_id: intencaoId
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intencao-compra-${intencaoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Orçamento do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              💰 O orçamento foi preenchido com base no valor do lote selecionado.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Orçamento Mínimo</Label>
              <InputCurrency
                value={data.orcamento_minimo}
                onChange={(e) => handleChange("orcamento_minimo", e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label>Orçamento Máximo</Label>
              <InputCurrency
                value={data.orcamento_maximo}
                onChange={(e) => handleChange("orcamento_maximo", e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Custo do Projeto (Engenheiro)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Switch
              checked={data.gerar_custo_projeto}
              onCheckedChange={(checked) => handleChange("gerar_custo_projeto", checked)}
            />
            <div>
              <Label className="font-semibold">Gerar Cobrança do Projeto</Label>
              <p className="text-xs text-gray-600">
                Caso a negociação não se concretize
              </p>
            </div>
          </div>

          {data.gerar_custo_projeto && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div>
                <Label>Valor do Projeto *</Label>
                <InputCurrency
                  value={data.valor_custo_projeto}
                  onChange={(e) => handleChange("valor_custo_projeto", e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Condição de Pagamento</Label>
                  <Select
                    value={data.condicao_pagamento_projeto}
                    onValueChange={(value) => handleChange("condicao_pagamento_projeto", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {condicaoPagamentoOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={data.data_vencimento_projeto}
                    onChange={(e) => handleChange("data_vencimento_projeto", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Label>Observações Gerais</Label>
          <Textarea
            value={data.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações adicionais sobre a intenção de compra..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          {showDownloadPDF && intencaoId && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleDownloadPDF}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          )}
          <Button 
            type="button" 
            onClick={handleFinish}
            disabled={isLoading}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Intenção de Compra'}
          </Button>
        </div>
      </div>
    </div>
  );
}