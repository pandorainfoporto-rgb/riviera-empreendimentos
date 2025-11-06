import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriasLabels = {
  pagamento_consorcio: "Pagamento Consórcio",
  juros_consorcio: "Juros Consórcio",
  multa_consorcio: "Multa Consórcio",
  recebimento_cliente: "Recebimento Cliente",
  pagamento_fornecedor: "Pagamento Fornecedor",
  aporte_socio: "Aporte Sócio",
  investimento: "Investimento",
  saque: "Saque",
  deposito: "Depósito",
  transferencia: "Transferência",
  outros: "Outros",
};

export default function MovimentacoesRecentes({ movimentacoes = [], caixas = [] }) {
  const movimentacoesRecentes = (movimentacoes || [])
    .sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao))
    .slice(0, 10);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)]">Movimentações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movimentacoesRecentes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma movimentação registrada</p>
          ) : (
            (movimentacoesRecentes || []).map((mov) => {
              const caixa = (caixas || []).find(c => c.id === mov.caixa_id);
              const isEntrada = mov.tipo === "entrada";

              return (
                <div key={mov.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isEntrada ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isEntrada ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {categoriasLabels[mov.categoria] || mov.categoria}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{caixa?.nome || "Caixa não identificado"}</p>
                      {mov.descricao && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{mov.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {format(parseISO(mov.data_movimentacao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                      {isEntrada ? '+' : '-'} R$ {(mov.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {isEntrada ? 'Entrada' : 'Saída'}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}