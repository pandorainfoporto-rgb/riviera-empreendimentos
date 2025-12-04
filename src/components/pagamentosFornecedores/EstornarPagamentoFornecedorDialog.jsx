import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function EstornarPagamentoFornecedorDialog({ pagamento, onClose }) {
  const [motivo, setMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const handleEstornar = async () => {
    if (!motivo.trim()) {
      toast.error("Por favor, informe o motivo do estorno");
      return;
    }

    setIsProcessing(true);
    try {
      // Buscar e remover movimentação de caixa
      const movimentacoes = await base44.entities.MovimentacaoCaixa.filter({
        pagamento_fornecedor_id: pagamento.id
      });

      for (const mov of movimentacoes) {
        // Estornar valor no caixa
        const caixa = await base44.entities.Caixa.get(mov.caixa_id);
        if (caixa) {
          await base44.entities.Caixa.update(mov.caixa_id, {
            saldo_atual: (caixa.saldo_atual || 0) + mov.valor
          });
        }
        // Deletar movimentação
        await base44.entities.MovimentacaoCaixa.delete(mov.id);
      }

      // Atualizar status do pagamento
      if (pagamento.tipo_item === 'consorcio') {
        await base44.entities.FaturaConsorcio.update(pagamento.id, {
          status: 'pendente',
          data_pagamento: null,
          valor_total_pago: null,
          forma_pagamento: null,
          observacoes: `ESTORNADO: ${motivo}\n\n${pagamento.observacoes || ''}`
        });
      } else {
        await base44.entities.PagamentoFornecedor.update(pagamento.id, {
          status: 'pendente',
          data_pagamento: null,
          valor_total_pago: null,
          forma_pagamento: null,
          observacoes: `ESTORNADO: ${motivo}\n\n${pagamento.observacoes || ''}`
        });
      }

      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['faturasConsorcio'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoesCaixa'] });

      toast.success("Pagamento estornado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao estornar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Estornar Pagamento
          </DialogTitle>
          <DialogDescription>
            Esta ação irá reverter o pagamento e devolver o valor ao caixa.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> O estorno irá:
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Alterar o status para "Pendente"</li>
              <li>Devolver o valor ao caixa de origem</li>
              <li>Remover a movimentação do histórico</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Valor a estornar:</p>
            <p className="text-xl font-bold text-[var(--wine-700)]">
              R$ {(pagamento.valor_total_pago || pagamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do estorno *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe o motivo do estorno..."
              rows={3}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEstornar}
            disabled={isProcessing || !motivo.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Estornando...
              </>
            ) : (
              "Confirmar Estorno"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}