import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MapPin, Ruler, DollarSign, Building2, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MapaLoteamento from "../loteamentos/MapaLoteamento";

const statusColors = {
  disponivel: "bg-green-100 text-green-800 border-green-200",
  reservada: "bg-yellow-100 text-yellow-800 border-yellow-200",
  vendida: "bg-blue-100 text-blue-800 border-blue-200",
  escriturada: "bg-purple-100 text-purple-800 border-purple-200",
};

const statusLabels = {
  disponivel: "Disponível",
  reservada: "Reservado",
  vendida: "Vendido",
  escriturada: "Escriturado",
};

export default function LotesList({ items, loteamentos, empreendimentos, isLoading, onEdit, onDelete }) {
  const [selectedLote, setSelectedLote] = useState(null);
  const [showMapa, setShowMapa] = useState(false);
  const [loteamentoMapa, setLoteamentoMapa] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 sm:p-12 text-center">
          <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Nenhum lote cadastrado</h3>
          <p className="text-sm text-gray-600">Clique em "Novo Lote" para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => {
          const loteamento = loteamentos.find(l => l.id === item.loteamento_id);
          const empreendimento = empreendimentos.find(e => e.id === item.empreendimento_id);
          
          return (
            <Card key={item.id} className="shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Header do Card */}
              <div className="h-12 bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] flex items-center justify-between px-4">
                <span className="text-white font-bold">Lote {item.numero}</span>
                {item.quadra && (
                  <Badge className="bg-white text-[var(--wine-700)]">
                    Quadra {item.quadra}
                  </Badge>
                )}
              </div>

              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={statusColors[item.status] + " px-3 py-1"}>
                    {statusLabels[item.status]}
                  </Badge>
                  <div className="flex gap-1">
                    {loteamento?.arquivo_planta_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setLoteamentoMapa(item.loteamento_id);
                          setSelectedLote(item);
                          setShowMapa(true);
                        }}
                        className="h-8 w-8 hover:bg-purple-100 hover:text-purple-600"
                        title="Ver no Mapa"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir este lote?')) {
                          onDelete(item.id);
                        }
                      }}
                      className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {loteamento && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Loteamento</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{loteamento.nome}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Área</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.area?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Valor</p>
                        <p className="text-sm font-semibold text-[var(--wine-700)]">
                          R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.observacoes && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">Observações</p>
                      <p className="text-xs text-gray-700 italic line-clamp-2">{item.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog para visualizar no mapa */}
      <Dialog open={showMapa} onOpenChange={() => {
        setShowMapa(false);
        setSelectedLote(null);
        setLoteamentoMapa(null);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--wine-700)]" />
              Visualização no Mapa - Lote {selectedLote?.numero}
            </DialogTitle>
          </DialogHeader>
          {loteamentoMapa && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Número</p>
                  <p className="font-bold text-lg">{selectedLote?.numero}</p>
                </div>
                {selectedLote?.quadra && (
                  <div>
                    <p className="text-xs text-gray-500">Quadra</p>
                    <p className="font-bold">{selectedLote.quadra}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Área</p>
                  <p className="font-bold">{selectedLote?.area?.toFixed(2)} m²</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valor</p>
                  <p className="font-bold text-green-600">
                    R$ {(selectedLote?.valor_total || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <MapaLoteamento
                loteamentoId={loteamentoMapa}
                highlightLoteId={selectedLote?.id}
                onLoteClick={() => {}}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}