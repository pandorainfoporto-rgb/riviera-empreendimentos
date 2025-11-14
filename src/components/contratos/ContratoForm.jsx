import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ContratoForm({ contrato, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(contrato || {
    tipo: "compra_venda",
    numero_contrato: "",
    titulo: "",
    partes_envolvidas: [],
    valor_total: 0,
    data_assinatura: "",
    data_inicio_vigencia: "",
    data_fim_vigencia: "",
    prazo_meses: 0,
    renovacao_automatica: false,
    clausulas_principais: [],
    arquivo_pdf_url: "",
    status: "rascunho",
    forma_pagamento: "",
    observacoes: ""
  });

  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleUploadPDF = async (file) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, arquivo_pdf_url: file_url });
      toast.success("PDF enviado!");

      // Perguntar se quer extrair dados
      if (confirm("Deseja extrair dados automaticamente do contrato?")) {
        await handleExtrairDados(file_url);
      }
    } catch (error) {
      toast.error("Erro ao enviar PDF: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExtrairDados = async (file_url) => {
    try {
      setExtracting(true);
      const response = await base44.functions.invoke('extrairDadosContrato', { file_url });
      
      if (response.data.success) {
        const dados = response.data.dados_extraidos;
        setFormData({
          ...formData,
          numero_contrato: dados.numero_contrato || formData.numero_contrato,
          tipo: dados.tipo || formData.tipo,
          partes_envolvidas: dados.partes_envolvidas || formData.partes_envolvidas,
          valor_total: dados.valor_total || formData.valor_total,
          data_assinatura: dados.data_assinatura || formData.data_assinatura,
          data_inicio_vigencia: dados.data_inicio_vigencia || formData.data_inicio_vigencia,
          data_fim_vigencia: dados.data_fim_vigencia || formData.data_fim_vigencia,
          prazo_meses: dados.prazo_meses || formData.prazo_meses,
          clausulas_principais: dados.clausulas_principais || formData.clausulas_principais,
          forma_pagamento: dados.forma_pagamento || formData.forma_pagamento,
          titulo: dados.objeto_contrato || formData.titulo,
          dados_extraidos: dados,
          arquivo_pdf_url: file_url
        });
        toast.success("Dados extraídos com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao extrair dados: " + error.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {contrato ? "Editar Contrato" : "Novo Contrato"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload PDF */}
          <div className="p-4 border-2 border-dashed rounded-lg">
            <Label>Arquivo PDF do Contrato</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleUploadPDF(file);
                }}
                disabled={uploading || extracting}
              />
              {extracting && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Extraindo dados...</span>
                </div>
              )}
            </div>
            {formData.arquivo_pdf_url && (
              <p className="text-sm text-green-600 mt-2">✓ PDF anexado</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra_venda">Compra e Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="prestacao_servicos">Prestação de Serviços</SelectItem>
                  <SelectItem value="fornecimento">Fornecimento</SelectItem>
                  <SelectItem value="parceria">Parceria</SelectItem>
                  <SelectItem value="empreitada">Empreitada</SelectItem>
                  <SelectItem value="consorcio">Consórcio</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número do Contrato</Label>
              <Input
                value={formData.numero_contrato}
                onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                placeholder="Ex: CT-2024-001"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Título/Objeto do Contrato *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Breve descrição do objeto do contrato"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Assinatura</Label>
              <Input
                type="date"
                value={formData.data_assinatura}
                onChange={(e) => setFormData({ ...formData, data_assinatura: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Início Vigência *</Label>
              <Input
                type="date"
                value={formData.data_inicio_vigencia}
                onChange={(e) => setFormData({ ...formData, data_inicio_vigencia: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim Vigência</Label>
              <Input
                type="date"
                value={formData.data_fim_vigencia}
                onChange={(e) => setFormData({ ...formData, data_fim_vigencia: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Prazo (meses)</Label>
              <Input
                type="number"
                value={formData.prazo_meses}
                onChange={(e) => setFormData({ ...formData, prazo_meses: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="rescindido">Rescindido</SelectItem>
                  <SelectItem value="renovado">Renovado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Forma de Pagamento</Label>
              <Input
                value={formData.forma_pagamento}
                onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                placeholder="Ex: Parcelas mensais, À vista, etc."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.renovacao_automatica}
                  onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked })}
                />
                <span>Renovação Automática</span>
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
                placeholder="Observações adicionais sobre o contrato..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing || uploading || extracting}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Contrato"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}