import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PagamentosPendentes({ pagamentosClientes, pagamentosFornecedores }) {
  const receitasPendentes = pagamentosClientes
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 5);

  const despesasPendentes = pagamentosFornecedores
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 5);

  return (
    <Card className="shadow-lg border-t-4 border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700 text-base sm:text-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Pagamentos Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            A Receber
          </h4>
          {receitasPendentes.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum recebimento pendente</p>
          ) : (
            <div className="space-y-2">
              {receitasPendentes.map((pag) => (
                <div key={pag.id} className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2 p-2 bg-green-50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate block">R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-600 text-[10px] sm:text-xs">
                      {format(parseISO(pag.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <Badge className={`text-[10px] ${pag.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} whitespace-nowrap`}>
                    {pag.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            A Pagar
          </h4>
          {despesasPendentes.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum pagamento pendente</p>
          ) : (
            <div className="space-y-2">
              {despesasPendentes.map((pag) => (
                <div key={pag.id} className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2 p-2 bg-red-50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate block">R$ {pag.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-600 text-[10px] sm:text-xs">
                      {format(parseISO(pag.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <Badge className={`text-[10px] ${pag.status === 'atrasado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} whitespace-nowrap`}>
                    {pag.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}