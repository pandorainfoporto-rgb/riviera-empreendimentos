import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MapPin, Ruler, DollarSign, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => {
        const loteamento = loteamentos.find(l => l.id === item.loteamento_id);
        const empreendimento = empreendimentos.find(e => e.id === item.empreendimento_id);
        
        return (
          <Card key={item.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-[var(--wine-400)]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[var(--wine-700)] mb-2 truncate">
                    {item.codigo}
                  </h3>
                  <Badge className={statusColors[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                </div>
                <div className="flex gap-1 flex-shrink-0">
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

                {empreendimento && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Empreendimento</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{empreendimento.nome}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Área</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.area_total?.toLocaleString('pt-BR')} m²
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Valor</p>
                      <p className="text-sm font-semibold text-[var(--wine-700)]">
                        R$ {(item.valor_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
  );
}