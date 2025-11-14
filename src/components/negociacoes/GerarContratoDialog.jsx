import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GerarContratoDialog({ negociacao, cliente, unidade, open, onClose, onSuccess }) {
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [gerando, setGerando] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['documentoTemplates'],
    queryFn: () => base44.entities.DocumentoTemplate.filter({ tipo: 'contrato', ativo: true }),
  });

  const gerarContrato = async () => {
    if (!templateSelecionado) {
      toast.error("Selecione um template de contrato");
      return;
    }

    setGerando(true);

    try {
      // Chamar função para gerar o documento
      const response = await base44.functions.invoke('gerarDocumentoIA', {
        template_id: templateSelecionado,
        negociacao_id: negociacao.id,
        cliente_id: negociacao.cliente_id,
        unidade_id: negociacao.unidade_id,
      });

      if (response.data.success && response.data.documento_id) {
        // Atualizar negociação para aguardando assinatura
        await base44.entities.Negociacao.update(negociacao.id, {
          status: 'aguardando_assinatura_contrato',
          contrato_id: response.data.documento_id,
          contrato_gerado: true,
        });

        // Atualizar unidade para reservada
        await base44.entities.Unidade.update(negociacao.unidade_id, {
          status: 'reservada',
        });

        queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
        queryClient.invalidateQueries({ queryKey: ['unidades'] });
        queryClient.invalidateQueries({ queryKey: ['documentosGerados'] });

        toast.success("✅ Contrato gerado! Unidade reservada e negociação aguardando assinatura.");
        onSuccess();
      } else {
        toast.error("Erro ao gerar contrato: " + (response.data.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      toast.error("Erro ao gerar contrato: " + error.message);
    } finally {
      setGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--wine-700)]">
            <FileText className="w-5 h-5" />
            Gerar Contrato de Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo da Negociação */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Dados da Negociação</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{cliente?.nome}</p>
              </div>
              <div>
                <p className="text-gray-600">Unidade</p>
                <p className="font-semibold text-gray-900">{unidade?.codigo}</p>
              </div>
              <div>
                <p className="text-gray-600">Valor Total</p>
                <p className="font-bold text-green-700">
                  R$ {(negociacao.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Entrada</p>
                <p className="font-semibold text-gray-900">
                  R$ {(negociacao.valor_entrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Seleção de Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template de Contrato *</Label>
            <Select value={templateSelecionado} onValueChange={setTemplateSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚠️ Nenhum template de contrato cadastrado. Cadastre templates em Documentação → Templates.
              </p>
            )}
          </div>

          {/* Ações que serão realizadas */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ações que serão realizadas:
            </h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Gerar contrato baseado no template selecionado</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Atualizar status da negociação para <Badge className="bg-yellow-500 text-white">Aguardando Assinatura</Badge></span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Atualizar status da unidade para <Badge className="bg-yellow-100 text-yellow-800">Reservada</Badge></span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Vincular contrato à negociação</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={gerando}>
            Cancelar
          </Button>
          <Button 
            onClick={gerarContrato} 
            disabled={!templateSelecionado || gerando}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {gerando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Contrato
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}