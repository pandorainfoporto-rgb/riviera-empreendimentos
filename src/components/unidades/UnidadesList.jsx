import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, MapPin, Ruler, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageGallery from "../imagens/ImageGallery";

const statusColors = {
  disponivel: "bg-green-100 text-green-800",
  reservada: "bg-yellow-100 text-yellow-800",
  vendida: "bg-blue-100 text-blue-800",
  escriturada: "bg-purple-100 text-purple-800",
  em_construcao: "bg-orange-100 text-orange-800",
  alugada: "bg-cyan-100 text-cyan-800"
};

const statusLabels = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  escriturada: "Escriturada",
  em_construcao: "Em Construção",
  alugada: "Alugada"
};

const tipoLabels = {
  apartamento: "Apartamento",
  casa: "Casa",
  lote: "Lote",
  sala_comercial: "Sala Comercial",
  terreno: "Terreno",
  outros: "Outros"
};

export default function UnidadesList({ unidades, loteamentos = [], onEdit, onTogglePortfolio }) {
  const [selectedUnidade, setSelectedUnidade] = useState(null);

  if (unidades.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Nenhuma unidade encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unidades.map((unidade) => {
          const loteamento = loteamentos?.find(l => l.id === unidade.loteamento_id);

          return (
            <Card 
              key={unidade.id} 
              className="hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedUnidade(unidade)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--wine-100)] to-[var(--grape-100)]">
                      <Building2 className="w-6 h-6 text-[var(--wine-600)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{unidade.codigo}</h3>
                      {loteamento && (
                        <p className="text-sm text-gray-600">{loteamento.nome}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColors[unidade.status]}>
                      {statusLabels[unidade.status]}
                    </Badge>
                    <Badge variant="outline">
                      {tipoLabels[unidade.tipo]}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ruler className="w-4 h-4" />
                      <span>{unidade.area_total} m²</span>
                      {unidade.area_construida && (
                        <span className="text-gray-400">({unidade.area_construida} m² construídos)</span>
                      )}
                    </div>

                    {unidade.endereco && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{unidade.endereco}</span>
                      </div>
                    )}

                    {unidade.valor_venda > 0 && (
                      <div className="text-lg font-bold text-green-600">
                        R$ {unidade.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(unidade);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePortfolio(unidade);
                    }}
                    className="flex-1"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Retirar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedUnidade} onOpenChange={() => setSelectedUnidade(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imagens - {selectedUnidade?.codigo}</DialogTitle>
          </DialogHeader>
          {selectedUnidade && (
            <ImageGallery
              entidadeTipo="Unidade"
              entidadeId={selectedUnidade.id}
              allowDelete={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}