import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoriaLabels = {
  renda_fixa: { label: "Renda Fixa", color: "bg-blue-100 text-blue-700 border-blue-200" },
  renda_variavel: { label: "Renda Variável", color: "bg-purple-100 text-purple-700 border-purple-200" },
  fundos: { label: "Fundos", color: "bg-green-100 text-green-700 border-green-200" },
  imoveis: { label: "Imóveis", color: "bg-orange-100 text-orange-700 border-orange-200" },
  outros: { label: "Outros", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const riscoLabels = {
  baixo: { label: "Baixo", color: "bg-green-100 text-green-700" },
  medio: { label: "Médio", color: "bg-yellow-100 text-yellow-700" },
  alto: { label: "Alto", color: "bg-orange-100 text-orange-700" },
  muito_alto: { label: "Muito Alto", color: "bg-red-100 text-red-700" },
};

export default function TipoAtivosList({ items, isLoading, onEdit, onDelete }) {
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
          <Coins className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">Nenhum tipo de ativo cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-xl transition-all duration-200 border-t-4 border-[var(--wine-400)]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--wine-100)] to-[var(--grape-100)] flex items-center justify-center">
                  <Coins className="w-6 h-6 text-[var(--wine-600)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--wine-700)]">{item.nome}</h3>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={categoriaLabels[item.categoria]?.color || categoriaLabels.outros.color}>
                  {categoriaLabels[item.categoria]?.label || "Outros"}
                </Badge>
                <Badge className={riscoLabels[item.risco]?.color || riscoLabels.medio.color}>
                  Risco {riscoLabels[item.risco]?.label || "Médio"}
                </Badge>
              </div>
              {item.liquidez && (
                <p className="text-sm text-gray-600">
                  Liquidez: {item.liquidez === 'diaria' ? 'Diária' : item.liquidez === 'semanal' ? 'Semanal' : item.liquidez === 'mensal' ? 'Mensal' : 'Baixa'}
                </p>
              )}
            </div>

            {item.descricao && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.descricao}</p>
            )}

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
                onClick={() => {
                  if (window.confirm("Tem certeza que deseja excluir este tipo de ativo?")) {
                    onDelete(item.id);
                  }
                }}
                className="hover:bg-red-50 hover:text-red-700 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}