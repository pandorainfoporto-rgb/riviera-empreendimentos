import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { format, parseISO, isBefore, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PagamentosPrioritarios({ pagamentosClientes = [] }) {
  const hoje = new Date();
  const proximosSete = addDays(hoje, 7);

  const pagamentosPrioritarios = (pagamentosClientes || [])
    .filter(p => {
      if (p.status === 'pago' || p.status === 'cancelado') return false;
      
      try {
        const dataVenc = parseISO(p.data_vencimento);
        return isBefore(dataVenc, proximosSete);
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dataA = parseISO(a.data_vencimento);
        const dataB = parseISO(b.data_vencimento);
        return dataA - dataB;
      } catch {
        return 0;
      }
    })
    .slice(0, 5);

  const totalPrioritario = (pagamentosPrioritarios || []).reduce((sum, p) => sum + (p.valor || 0), 0);

  const getPrioridade = (dataVencimento) => {
    try {
      const dataVenc = parseISO(dataVencimento);
      if (isBefore(dataVenc, hoje)) {
        return { label: "VENCIDO", cor: "bg-red-600 text-white" };
      }
      if (isToday(dataVenc)) {
        return { label: "HOJE", cor: "bg-orange-600 text-white" };
      }
      return { label: "PRÓXIMO", cor: "bg-yellow-100 text-yellow-800" };
    } catch {
      return { label: "PRÓXIMO", cor: "bg-yellow-100 text-yellow-800" };
    }
  };

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
            <AlertTriangle className="w-5 h-5" />
            Pagamentos Prioritários
          </CardTitle>
          {totalPrioritario > 0 && (
            <Badge className="bg-red-600 text-white">
              R$ {(totalPrioritario / 1000).toFixed(1)}k
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(!pagamentosPrioritarios || pagamentosPrioritarios.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Nenhum pagamento prioritário</p>
              <p className="text-xs text-gray-400 mt-1">Todos os pagamentos estão em dia! ✅</p>
            </div>
          ) : (
            (pagamentosPrioritarios || []).map((pag) => {
              const prioridade = getPrioridade(pag.data_vencimento);

              return (
                <div
                  key={pag.id}
                  className="p-3 border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        Cliente: {pag.cliente_id || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Tipo: {pag.tipo || 'N/A'}
                      </p>
                    </div>
                    <Badge className={prioridade.cor}>
                      {prioridade.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">
                        {format(parseISO(pag.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-[var(--wine-700)]">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">
                        {(pag.valor || 0).toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pagamentosPrioritarios.length > 0 && (
          <Link to={createPageUrl('PagamentosClientes')}>
            <Button variant="outline" className="w-full mt-4 hover:bg-[var(--wine-50)]">
              Ver Todos os Recebimentos
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}