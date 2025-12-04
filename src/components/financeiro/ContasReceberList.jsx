import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800",
  recebido: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-800",
  parcial: "bg-blue-100 text-blue-800",
  cancelado: "bg-gray-100 text-gray-800"
};

const categoriaLabels = {
  venda_unidade: "Venda de Unidade",
  aluguel: "Aluguel",
  consorcio: "Consórcio",
  servicos: "Serviços",
  multas_juros: "Multas e Juros",
  outros: "Outros"
};

export default function ContasReceberList({ contas, onEdit, onDelete }) {
  if (contas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma conta a receber cadastrada
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
                      <span className="font-medium text-green-600">
                        R$ {(conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {conta.data_recebimento && (
                      <div>
                        <span className="text-gray-600">Recebido em:</span>{" "}
                        <span className="font-medium">
                          {format(new Date(conta.data_recebimento), 'dd/MM/yyyy')}
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