import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-800",
  parcial: "bg-blue-100 text-blue-800",
  cancelado: "bg-gray-100 text-gray-800"
};

const categoriaLabels = {
  folha_pagamento: "Folha de Pagamento",
  impostos_taxas: "Impostos e Taxas",
  servicos_terceiros: "Serviços de Terceiros",
  materiais_obra: "Materiais de Obra",
  energia_agua: "Energia e Água",
  aluguel: "Aluguel",
  manutencao: "Manutenção",
  marketing: "Marketing",
  administrativo: "Administrativo",
  financeiro: "Financeiro",
  outros: "Outros"
};

export default function ContasPagarList({ contas, onEdit, onDelete }) {
  if (contas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma conta a pagar cadastrada
      </div>
    );
  }

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {contas.map((conta) => {
        const atrasada = conta.status === 'pendente' && conta.data_vencimento < hoje;

        return (
          <Card key={conta.id} className={atrasada ? "border-red-300" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {atrasada && <AlertCircle className="w-4 h-4 text-red-600" />}
                    <h3 className="font-semibold text-gray-900">{conta.descricao}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={statusColors[conta.status]}>
                      {conta.status}
                    </Badge>
                    <Badge variant="outline">
                      {categoriaLabels[conta.categoria] || conta.categoria}
                    </Badge>
                    {conta.recorrente && (
                      <Badge variant="outline">🔄 Recorrente</Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Vencimento:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>{" "}
                      <span className="font-medium text-red-600">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {conta.data_pagamento && (
                      <div>
                        <span className="text-gray-600">Pago em:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(conta.data_pagamento), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(conta)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onDelete(conta.id)}
                    className="text-red-600 hover:bg-red-50"
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