import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Ruler, DollarSign, Home, X } from "lucide-react";

export default function VisualizarMapaLotes({ loteamento, open, onClose }) {
  const [selectedLote, setSelectedLote] = useState(null);

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes_loteamento', loteamento?.id],
    queryFn: () => base44.entities.Lote.filter({ loteamento_id: loteamento.id }),
    enabled: !!loteamento?.id,
  });

  const statusColors = {
    disponivel: '#10b981',
    reservado: '#f59e0b',
    vendido: '#6b7280',
    indisponivel: '#ef4444',
  };

  const statusLabels = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    vendido: 'Vendido',
    indisponivel: 'Indisponível',
  };

  const handleLoteClick = (lote) => {
    setSelectedLote(lote);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[var(--wine-600)]" />
            {loteamento?.nome} - Mapa de Lotes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Legenda */}
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {statusLabels[status]}
                </span>
              </div>
            ))}
          </div>

          {/* Mapa Visual dos Lotes */}
          {loteamento?.mapa_lotes && (
            <div className="relative border rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={loteamento.mapa_lotes}
                alt="Mapa do Loteamento"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{lotes.length}</p>
                <p className="text-xs text-gray-600">Total de Lotes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {lotes.filter(l => l.status === 'disponivel').length}
                </p>
                <p className="text-xs text-gray-600">Disponíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {lotes.filter(l => l.status === 'reservado').length}
                </p>
                <p className="text-xs text-gray-600">Reservados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {lotes.filter(l => l.status === 'vendido').length}
                </p>
                <p className="text-xs text-gray-600">Vendidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {lotes.filter(l => l.status === 'indisponivel').length}
                </p>
                <p className="text-xs text-gray-600">Indisponíveis</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Lotes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Lotes do Empreendimento</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lotes.map((lote) => (
                <div
                  key={lote.id}
                  onClick={() => handleLoteClick(lote)}
                  onMouseEnter={() => handleLoteClick(lote)}
                  className="relative p-4 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2"
                  style={{
                    backgroundColor: statusColors[lote.status] + '20',
                    borderColor: statusColors[lote.status],
                  }}
                >
                  <div className="text-center">
                    <p className="font-bold text-sm text-gray-900">{lote.numero_lote}</p>
                    {lote.area && (
                      <p className="text-xs text-gray-600 mt-1">{lote.area}m²</p>
                    )}
                    <div
                      className="w-2 h-2 rounded-full mx-auto mt-2"
                      style={{ backgroundColor: statusColors[lote.status] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dialog de Detalhes do Lote */}
          {selectedLote && (
            <Card className="border-2 border-[var(--wine-600)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Detalhes - Lote {selectedLote.numero_lote}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedLote(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      style={{
                        backgroundColor: statusColors[selectedLote.status] + '40',
                        color: statusColors[selectedLote.status],
                        borderColor: statusColors[selectedLote.status],
                      }}
                      className="border"
                    >
                      {statusLabels[selectedLote.status]}
                    </Badge>
                  </div>

                  {selectedLote.area && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Área:</span>
                      </div>
                      <span className="font-semibold">{selectedLote.area} m²</span>
                    </div>
                  )}

                  {selectedLote.valor && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Valor:</span>
                      </div>
                      <span className="font-bold text-green-700">
                        R$ {selectedLote.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {selectedLote.quadra && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Quadra:</span>
                      </div>
                      <span className="font-semibold">{selectedLote.quadra}</span>
                    </div>
                  )}

                  {selectedLote.observacoes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Observações:</p>
                      <p className="text-sm text-gray-800">{selectedLote.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}