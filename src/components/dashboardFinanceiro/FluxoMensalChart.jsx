import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FluxoMensalChart({ movimentacoes, periodoMeses = 6 }) {
  const hoje = new Date();
  const mesesAtras = subMonths(hoje, periodoMeses - 1);
  const meses = eachMonthOfInterval({ start: startOfMonth(mesesAtras), end: endOfMonth(hoje) });

  const dados = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const movsMes = movimentacoes.filter(m => {
      try {
        const dataMov = parseISO(m.data_movimentacao);
        return dataMov >= inicioMes && dataMov <= fimMes;
      } catch {
        return false;
      }
    });

    const receitas = movsMes
      .filter(m => m.tipo === "entrada")
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    const despesas = movsMes
      .filter(m => m.tipo === "saida")
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    return {
      mes: format(mes, "MMM/yy", { locale: ptBR }),
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Fluxo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="receitas" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Receitas"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Despesas"
              dot={{ fill: '#ef4444', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Saldo"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}