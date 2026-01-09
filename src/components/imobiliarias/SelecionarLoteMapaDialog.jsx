import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Building2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MapaLoteamento from "../loteamentos/MapaLoteamento";
import { Badge } from "@/components/ui/badge";

export default function SelecionarLoteMapaDialog({ open, onClose, onLoteSelecionado }) {
  const [loteamentoSelecionado, setLoteamentoSelecionado] = useState("");
  const [loteSelecionado, setLoteSelecionado] = useState(null);

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_mapa'],
    queryFn: () => base44.entities.Loteamento.filter({ 
      arquivo_planta_url: { $ne: null } 
    }),
  });

  const handleLoteClick = (lote) => {
    if (lote.status !== 'disponivel') {
      return; // Não permite selecionar lotes indisponíveis
    }
    setLoteSelecionado(lote);
  };

  const handleConfirmar = () => {
    if (!loteSelecionado) return;
    onLoteSelecionado(loteSelecionado, loteamentoSelecionado);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--wine-700)]">
            <MapPin className="w-6 h-6" />
            Selecionar Lote no Mapa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <strong>Como funciona:</strong> Escolha o loteamento, visualize o mapa e clique no lote disponível (verde) 
              para criar uma intenção de compra.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Selecione o Loteamento</Label>
            <Select value={loteamentoSelecionado} onValueChange={setLoteamentoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um loteamento..." />
              </SelectTrigger>
              <SelectContent>
                {loteamentos.length === 0 && (
                  <SelectItem value="_empty" disabled>
                    Nenhum loteamento com mapa disponível
                  </SelectItem>
                )}
                {loteamentos.map(lot => (
                  <SelectItem key={lot.id} value={lot.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {lot.nome} - {lot.cidade}/{lot.estado}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loteamentoSelecionado && (
            <MapaLoteamento
              loteamentoId={loteamentoSelecionado}
              onLoteClick={handleLoteClick}
              highlightLoteId={loteSelecionado?.id}
            />
          )}

          {loteSelecionado && (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-green-900">Lote Selecionado</h4>
                <Badge className="bg-green-600 text-white">
                  {loteSelecionado.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-600">Número</p>
                  <p className="font-bold text-lg">{loteSelecionado.numero}</p>
                </div>
                {loteSelecionado.quadra && (
                  <div>
                    <p className="text-xs text-gray-600">Quadra</p>
                    <p className="font-bold">{loteSelecionado.quadra}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Área</p>
                  <p className="font-bold">{loteSelecionado.area?.toFixed(2) || 0} m²</p>
                </div>
                {loteSelecionado.valor_total > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Valor</p>
                    <p className="font-bold">R$ {loteSelecionado.valor_total.toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!loteSelecionado}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            Criar Intenção de Compra
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}