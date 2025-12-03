import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadProjetoDialog({ open, onClose, intencao, onSave }) {
  const [file, setFile] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const novaVersao = (intencao.projeto_arquitetonico_versao || 0) + 1;
      const historicoAtual = intencao.historico_projetos || [];

      // Adiciona versão anterior ao histórico se existir
      if (intencao.projeto_arquitetonico_url) {
        historicoAtual.push({
          versao: intencao.projeto_arquitetonico_versao || 1,
          url: intencao.projeto_arquitetonico_url,
          data_upload: intencao.data_entrega_projeto || intencao.updated_date,
          observacoes: "Versão anterior",
        });
      }

      const updateData = {
        projeto_arquitetonico_url: file_url,
        projeto_arquitetonico_versao: novaVersao,
        data_entrega_projeto: new Date().toISOString().split("T")[0],
        historico_projetos: historicoAtual,
        status: "aguardando_reuniao",
      };

      onSave(updateData);
      toast.success("Projeto enviado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao enviar arquivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Upload do Projeto Arquitetônico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Versão Atual</Label>
            <p className="text-sm text-gray-600">
              {intencao?.projeto_arquitetonico_versao
                ? `Versão ${intencao.projeto_arquitetonico_versao} → Nova versão ${intencao.projeto_arquitetonico_versao + 1}`
                : "Primeira versão do projeto"}
            </p>
          </div>

          <div>
            <Label>Arquivo do Projeto *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center mt-2">
              <input
                type="file"
                id="projeto-file"
                className="hidden"
                accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="projeto-file" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DWG, DXF, PNG, JPG</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre esta versão do projeto..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Projeto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}