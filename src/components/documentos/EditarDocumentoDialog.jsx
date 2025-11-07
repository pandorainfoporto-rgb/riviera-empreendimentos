import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

export default function EditarDocumentoDialog({ documento, open, onClose }) {
  const [conteudo, setConteudo] = useState(documento?.conteudo_atual || "");
  const queryClient = useQueryClient();

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const historicoAtual = documento.historico_edicoes || [];
      
      return base44.entities.DocumentoGerado.update(documento.id, {
        conteudo_atual: conteudo,
        versao_documento: (documento.versao_documento || 1) + 1,
        historico_edicoes: [
          ...historicoAtual,
          {
            versao: documento.versao_documento || 1,
            data: new Date().toISOString(),
            editado_por: (await base44.auth.me()).email,
            conteudo: documento.conteudo_atual,
            observacoes: "Edição manual"
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos_gerados']);
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="h-full font-mono text-sm"
            placeholder="Cole o conteúdo HTML do documento..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isLoading}
            className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
          >
            {salvarMutation.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}