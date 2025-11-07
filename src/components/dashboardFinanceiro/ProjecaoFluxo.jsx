import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { parseISO, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProjecaoFluxo({ pagamentosClientes = [], pagamentosFornecedores = [], aportesSocios = [] }) {
  // Garantir que são arrays
  const clientesArray = Array.isArray(pagamentosClientes) ? pagamentosClientes : [];
  const fornecedoresArray = Array.isArray(pagamentosFornecedores) ? pagamentosFornecedores : [];
  const aportesArray = Array.isArray(aportesSocios) ? aportesSocios : [];

  const hoje = new Date();
  const proximosMeses = [0, 1, 2].map(i => addMonths(hoje, i));

  const dados = proximosMeses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const receitasClientes = clientesArray.filter(p => {
      if (p.status === 'pago') return false;
      try {
        const dataVenc = parseISO(p.data_vencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      } catch {
        return false;
      }
    }).reduce((sum, p) => sum + (p.valor || 0), 0);

    const aportes = aportesArray.filter(a => {
      if (a.status === 'pago') return false;
      try {
        const dataVenc = parseISO(a.data_vencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      } catch {
        return false;
      }
    }).reduce((sum, a) => sum + (a.valor || 0), 0);

    const despesas = fornecedoresArray.filter(p => {
      if (p.status === 'pago') return false;
      try {
        const dataVenc = parseISO(p.data_vencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      } catch {
        return false;
      }
    }).reduce((sum, p) => sum + (p.valor || 0), 0);

    const totalReceitas = receitasClientes + aportes;
    const saldoProjetado = totalReceitas - despesas;

    return {
      mes: format(mes, "MMMM/yyyy", { locale: ptBR }),
      receitas: totalReceitas,
      despesas,
      saldo: saldoProjetado,
      atrasados: {
        receitas: clientesArray.filter(p => {
          if (p.status !== 'atrasado') return false;
          try {
            const dataVenc = parseISO(p.data_vencimento);
            return dataVenc >= inicioMes && dataVenc <= fimMes;
          } catch {
            return false;
          }
        }).length,
        despesas: fornecedoresArray.filter(p => {
          if (p.status !== 'atrasado') return false;
          try {
            const dataVenc = parseISO(p.data_vencimento);
            return dataVenc >= inicioMes && dataVenc <= fimMes;
          } catch {
            return false;
          }
        }).length,
      }
    };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Projeção de Fluxo (Próximos 3 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dados.map((dado, index) => {
          const isPositivo = dado.saldo >= 0;
          const temAtrasados = dado.atrasados.receitas > 0 || dado.atrasados.despesas > 0;

          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-l-4 ${
                index === 0 ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 capitalize">{dado.mes}</h4>
                {temAtrasados && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Atrasados</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Receitas</span>
                  </div>
                  <p className="font-bold text-green-600">
                    R$ {(dado.receitas / 1000).toFixed(1)}k
                  </p>
                  {dado.atrasados.receitas > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {dado.atrasados.receitas} atrasado(s)
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Despesas</span>
                  </div>
                  <p className="font-bold text-red-600">
                    R$ {(dado.despesas / 1000).toFixed(1)}k
                  </p>
                  {dado.atrasados.despesas > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {dado.atrasados.despesas} atrasado(s)
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Saldo Projetado</span>
                  <span className={`text-lg font-bold ${isPositivo ? 'text-blue-600' : 'text-red-600'}`}>
                    {isPositivo ? '+' : ''} R$ {(dado.saldo / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            💡 Projeção baseada em pagamentos pendentes e atrasados
          </p>
        </div>
      </CardContent>
    </Card>
  );
}