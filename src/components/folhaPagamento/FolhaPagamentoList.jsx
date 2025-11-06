import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileText } from "lucide-react";

const statusColors = {
  calculada: "bg-yellow-100 text-yellow-800",
  paga: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

export default function FolhaPagamentoList({ items, colaboradores, centrosCusto, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum lançamento neste período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(folha => {
        const colaborador = colaboradores.find(c => c.id === folha.colaborador_id);
        const centroCusto = centrosCusto.find(cc => cc.id === folha.centro_custo_id);

        return (
          <Card key={folha.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{colaborador?.nome_completo}</h3>
                    <Badge className={statusColors[folha.status]}>
                      {folha.status}
                    </Badge>
                    <Badge variant="outline">
                      {folha.tipo_folha?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cargo</p>
                      <p className="font-semibold">{colaborador?.cargo}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Centro Custo</p>
                      <p className="font-semibold">{centroCusto?.codigo}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Líquido</p>
                      <p className="font-bold text-green-700">
                        R$ {(folha.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Custo Empresa</p>
                      <p className="font-bold text-purple-700">
                        R$ {(folha.custo_total_empresa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(folha)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(folha.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}