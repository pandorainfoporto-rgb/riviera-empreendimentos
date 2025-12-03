import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, Download, Calendar, User, CheckCircle2, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function VisualizarDocumentoDialog({ open, onClose, documento }) {
  if (!documento) return null;

  const tiposLabel = {
    contrato_compra_venda: "Contrato de Compra e Venda",
    contrato_locacao: "Contrato de Locação",
    contrato_parceria: "Contrato de Parceria/Sociedade",
    contrato_prestacao_servicos: "Contrato de Prestação de Serviços",
    contrato_empreitada: "Contrato de Empreitada",
    distrato: "Distrato/Rescisão",
    aditivo: "Aditivo Contratual",
    procuracao: "Procuração",
    declaracao: "Declaração",
    notificacao: "Notificação Extrajudicial",
    termo_entrega: "Termo de Entrega de Chaves",
    termo_vistoria: "Termo de Vistoria",
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(documento.documento_conteudo);
    toast.success("Documento copiado para a área de transferência!");
  };

  const handleDownload = () => {
    const blob = new Blob([documento.documento_conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documento.titulo || "documento"}_v${documento.versao || 1}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {documento.titulo}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">
              {tiposLabel[documento.tipo_documento] || documento.tipo_documento}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              Versão {documento.versao || 1}
            </Badge>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(documento.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              {documento.created_by}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {documento.observacoes_ia && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Observações da IA
              </p>
              <p className="text-sm text-yellow-700 mt-1">{documento.observacoes_ia}</p>
            </div>
          )}

          {documento.clausulas_principais?.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">Cláusulas Principais:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                {documento.clausulas_principais.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {documento.documento_conteudo}
              </pre>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleCopiar}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}