import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, X, CheckCircle2, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  ativo: { label: "Ativo", color: "bg-blue-100 text-blue-700 border-blue-200" },
  contemplado: { label: "Contemplado", color: "bg-green-100 text-green-700 border-green-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  perdido: { label: "Não Contemplado", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function LancesList({ items, consorcios, clientes, empreendimentos, isLoading, onEdit, onDelete, onUpdateStatus }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
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
      <Card className="text-center py-12">
        <CardContent>
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum lance ofertado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((lance) => {
        const consorcio = consorcios.find(c => c.id === lance.consorcio_id);
        const cliente = consorcio ? clientes.find(c => c.id === consorcio.cliente_id) : null;
        const emp = consorcio ? empreendimentos.find(e => e.id === consorcio.empreendimento_id) : null;

        return (
          <Card 
            key={lance.id} 
            className={`hover:shadow-xl transition-all duration-200 border-t-4 ${
              lance.status === 'contemplado' 
                ? 'border-green-500' 
                : lance.status === 'ativo'
                  ? 'border-blue-500'
                  : 'border-gray-400'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--wine-700)]">
                    Grupo {lance.grupo} - Cota {lance.cota}
                  </h3>
                  <p className="text-sm text-gray-600">{cliente?.nome}</p>
                  <p className="text-xs text-gray-500">{emp?.nome}</p>
                </div>
                <Badge className={statusConfig[lance.status].color}>
                  {statusConfig[lance.status].label}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {lance.tipo_lance === 'percentual' ? (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {lance.tipo_lance === 'percentual' ? 'Lance Percentual' : 'Valor Fixo'}
                    </span>
                  </div>
                  {lance.tipo_lance === 'percentual' && (
                    <p className="text-2xl font-bold text-blue-700">
                      {lance.percentual_lance}%
                    </p>
                  )}
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    R$ {lance.valor_lance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(lance.data_lance), "dd/MM/yyyy", { locale: ptBR })}
                </div>

                {lance.data_assembleia_referencia && (
                  <div className="text-xs text-gray-500">
                    Assembleia: {format(parseISO(lance.data_assembleia_referencia), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}

                {lance.observacoes && (
                  <p className="text-sm text-gray-600 italic">{lance.observacoes}</p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {lance.status === 'ativo' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(lance)}
                      className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)]"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateStatus(lance.id, 'contemplado')}
                      className="flex-1 hover:bg-green-50 hover:text-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Contemplado
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(lance.id)}
                  className="hover:bg-red-50 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}