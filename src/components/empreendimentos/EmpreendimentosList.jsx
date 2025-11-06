
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, MapPin, DollarSign, Calendar, FileText, Building2, Ruler } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  planejamento: "bg-gray-100 text-gray-700 border-gray-200",
  em_execucao: "bg-blue-100 text-blue-700 border-blue-200",
  em_pausa: "bg-yellow-100 text-yellow-700 border-yellow-200",
  concluido: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  planejamento: "Planejamento",
  em_execucao: "Em Execução",
  em_pausa: "Em Pausa",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function EmpreendimentosList({ items, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20" />
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
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Nenhum empreendimento cadastrado</h3>
          <p className="text-sm text-gray-600">Clique em "Novo Empreendimento" para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => (
        <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg text-[var(--wine-700)] truncate">{item.nome}</CardTitle>
                <Badge className={`${statusColors[item.status]} mt-2 text-xs`}>
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
                    if (window.confirm('Tem certeza que deseja excluir este empreendimento?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.endereco && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 break-words">{item.endereco}</span>
              </div>
            )}
            {item.area_total && (
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600">
                  {item.area_total.toLocaleString('pt-BR')} m²
                </span>
              </div>
            )}
            {item.valor_total && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[var(--wine-700)]">
                  R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {item.data_inicio && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600">
                  Início: {format(parseISO(item.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
