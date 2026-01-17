import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, Trash2, MapPin, Ruler, Eye } from "lucide-react";
import ImageCard from "../imagens/ImageCard";
import VisualizarMapaLotes from "./VisualizarMapaLotes";

export default function LoteamentosList({ items, isLoading, onEdit, onDelete }) {
  const [visualizandoMapa, setVisualizandoMapa] = useState(null);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Nenhum loteamento encontrado</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-xl transition-shadow overflow-hidden">
          <ImageCard 
            entidadeTipo="Loteamento" 
            entidadeId={item.id} 
            className="h-48"
          />
          
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--wine-600)]" />
                {item.nome}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {item.descricao && (
              <p className="text-sm text-gray-600 line-clamp-2">{item.descricao}</p>
            )}

            <div className="space-y-2 text-sm">
              {item.cidade && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{item.cidade} - {item.estado}</span>
                </div>
              )}

              {item.area_total > 0 && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Ruler className="w-4 h-4 text-gray-500" />
                  <span>{item.area_total.toLocaleString('pt-BR')} m²</span>
                </div>
              )}

              {item.quantidade_lotes > 0 && (
                <Badge variant="outline" className="text-xs">
                  {item.quantidade_lotes} lotes
                </Badge>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button
                onClick={() => setVisualizandoMapa(item)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={() => onEdit(item)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => {
                  if (confirm(`Deseja excluir o loteamento "${item.nome}"?`)) {
                    onDelete(item.id);
                  }
                }}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <VisualizarMapaLotes
        loteamento={visualizandoMapa}
        open={!!visualizandoMapa}
        onClose={() => setVisualizandoMapa(null)}
      />
    </div>
  );
}