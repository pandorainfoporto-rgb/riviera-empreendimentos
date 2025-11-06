import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AportesResumo({ aportes = [] }) {
  const hoje = new Date();
  const cincoMesesAtras = subMonths(hoje, 4);
  const meses = eachMonthOfInterval({ start: cincoMesesAtras, end: hoje });

  const dadosPorMes = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const aportesDoMes = (aportes || []).filter(a => {
      if (!a.data_pagamento || a.status !== 'pago') return false;
      try {
        const dataPag = parseISO(a.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes;
      } catch {
        return false;
      }
    });

    const totalMes = aportesDoMes.reduce((sum, a) => sum + (a.valor || 0), 0);

    return {
      mes: format(mes, "MMM", { locale: ptBR }),
      total: totalMes,
    };
  });

  const aportesPendentes = (aportes || []).filter(a => a.status === 'pendente' || a.status === 'atrasado');
  const totalPendente = aportesPendentes.reduce((sum, a) => sum + (a.valor || 0), 0);

  const totalRecebido = (aportes || [])
    .filter(a => a.status === 'pago')
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
            <Receipt className="w-5 h-5" />
            Aportes de Sócios
          </CardTitle>
          {totalPendente > 0 && (
            <Badge className="bg-orange-600 text-white">
              {aportesPendentes.length} pendente{aportesPendentes.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(aportes || []).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhum aporte cadastrado</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  R$ {(totalRecebido / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-600">Recebido</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">
                  R$ {(totalPendente / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-600">Pendente</p>
              </div>
            </div>

            {dadosPorMes.some(d => d.total > 0) && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Últimos 5 meses</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={dadosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {aportesPendentes.length > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900">
                    Aportes Pendentes
                  </p>
                </div>
                <div className="space-y-1">
                  {aportesPendentes.slice(0, 3).map((aporte) => (
                    <div key={aporte.id} className="flex justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1">
                        {aporte.mes_referencia}
                      </span>
                      <span className="font-semibold text-orange-700 ml-2">
                        R$ {((aporte.valor || 0) / 1000).toFixed(1)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}