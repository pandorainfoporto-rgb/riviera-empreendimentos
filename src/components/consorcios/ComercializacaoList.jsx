import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, DollarSign, TrendingUp, TrendingDown, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  negociacao: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  vendida: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

export default function ComercializacaoList({ items, consorcios, clientes, isLoading, onEdit, onDelete }) {
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

  if (!items || items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhuma comercialização registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const consorcio = consorcios.find(c => c.id === item.consorcio_id);
        const cliente = clientes.find(c => c.id === item.cliente_id);
        const statusColor = statusColors[item.status] || statusColors.vendida;
        const lucroPositivo = (item.lucro_reais || 0) >= 0;

        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-xl transition-all duration-200 border-t-4 ${
              item.status === 'vendida' ? 'border-green-500' : 
              item.status === 'negociacao' ? 'border-yellow-500' : 
              'border-gray-400'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-[var(--wine-600)]" />
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">
                      Grupo {consorcio?.grupo} - Cota {consorcio?.cota}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{cliente?.nome}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.data_venda && format(parseISO(item.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Badge className={`${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                  {item.status === 'negociacao' ? 'Negociação' : 
                   item.status === 'vendida' ? 'Vendida' : 'Cancelada'}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor da Carta</span>
                  <span className="font-semibold text-gray-900">
                    R$ {item.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor de Venda</span>
                  <span className="font-semibold text-green-700">
                    R$ {item.valor_venda?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg border-2 ${
                  lucroPositivo 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {lucroPositivo ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-xs font-semibold ${
                        lucroPositivo ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {lucroPositivo ? 'Lucro' : 'Prejuízo'}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${
                      lucroPositivo ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {item.lucro_percentual?.toFixed(2)}%
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${
                    lucroPositivo ? 'text-green-700' : 'text-red-700'
                  }`}>
                    R$ {Math.abs(item.lucro_reais || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Forma Pagamento</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {item.forma_pagamento}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)] hover:border-[var(--wine-400)]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}