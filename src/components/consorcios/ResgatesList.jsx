import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Building2, User, Wallet, Calendar, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  solicitado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processando: "bg-blue-100 text-blue-700 border-blue-200",
  concluido: "bg-green-100 text-green-700 border-green-200",
  cancelado: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  solicitado: "Solicitado",
  processando: "Processando",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function ResgatesList({ items, consorcios, unidades, clientes, caixas, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array(4).fill(0).map((_, i) => (
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
          <p className="text-gray-500">Nenhum resgate cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((item) => {
        const consorcio = consorcios?.find(c => c.id === item.consorcio_id);
        const unidade = unidades?.find(u => u.id === item.unidade_id);
        const cliente = clientes?.find(cl => cl.id === item.cliente_id);
        const caixa = caixas?.find(cx => cx.id === item.caixa_id);

        let dataFormatada = "";
        try {
          if (item.data_resgate) {
            dataFormatada = format(parseISO(item.data_resgate), "dd/MM/yyyy", { locale: ptBR });
          }
        } catch (error) {
          dataFormatada = item.data_resgate;
        }

        return (
          <Card key={item.id} className="hover:shadow-xl transition-all duration-200 border-t-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--wine-700)]">
                      Grupo {consorcio?.grupo} - Cota {consorcio?.cota}
                    </h3>
                    <p className="text-sm text-gray-500">{dataFormatada}</p>
                  </div>
                </div>
                <Badge className={statusColors[item.status]}>
                  {statusLabels[item.status]}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Líquido</span>
                    <span className="text-xl font-bold text-green-700">
                      R$ {(item.valor_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Valor Resgate:</span>
                    <p className="font-semibold text-gray-900">
                      R$ {(item.valor_resgate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Taxa Admin:</span>
                    <p className="font-semibold text-gray-900">
                      {(item.taxa_administrativa || 0).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amortizado:</span>
                    <p className="font-semibold text-gray-900">
                      R$ {(item.valor_amortizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Saldo Devedor:</span>
                    <p className="font-semibold text-gray-900">
                      R$ {(item.valor_saldo_devedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  {caixa && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Caixa:</span>
                      <span className="font-medium">{caixa.nome}</span>
                    </div>
                  )}

                  {item.alocado_unidade && unidade && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">Alocado em:</span>
                      <span className="font-medium text-blue-700">{unidade.codigo}</span>
                    </div>
                  )}

                  {cliente && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{cliente.nome}</span>
                    </div>
                  )}
                </div>

                {item.observacoes && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500">{item.observacoes}</p>
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