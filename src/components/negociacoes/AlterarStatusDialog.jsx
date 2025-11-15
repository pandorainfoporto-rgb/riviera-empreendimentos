import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusLabels = {
  ativa: "Ativa",
  aguardando_assinatura_contrato: "Aguardando Assinatura",
  contrato_assinado: "Contrato Assinado",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export default function AlterarStatusDialog({ open, onClose, negociacao, onConfirmar }) {
  const [novoStatus, setNovoStatus] = useState(negociacao.status);
  const [alterando, setAlterando] = useState(false);

  const handleConfirmar = async () => {
    setAlterando(true);
    try {
      await onConfirmar(novoStatus);
    } finally {
      setAlterando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status da Negociação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Status Atual</Label>
            <div className="mt-2">
              <Badge className="text-base px-3 py-1">
                {statusLabels[negociacao.status]}
              </Badge>
            </div>
          </div>

          <div>
            <Label>Novo Status *</Label>
            <Select value={novoStatus} onValueChange={setNovoStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="aguardando_assinatura_contrato">Aguardando Assinatura</SelectItem>
                <SelectItem value="contrato_assinado">Contrato Assinado</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {novoStatus === 'finalizada' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Atenção!</p>
                  <p>Ao finalizar a negociação:</p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Não será mais possível editar</li>
                    <li>Apenas poderá ser excluída</li>
                    <li>Exclua as parcelas antes de excluir a negociação</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={alterando}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={alterando || novoStatus === negociacao.status}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            {alterando ? "Alterando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}