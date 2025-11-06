import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Wallet } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FluxoCaixaChart({ pagamentosClientes = [], pagamentosFornecedores = [], aportesSocios = [] }) {
  const hoje = new Date();
  const seiseMesesAtras = subMonths(hoje, 5);
  const meses = eachMonthOfInterval({ start: seiseMesesAtras, end: hoje });

  const dados = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const receitas = (pagamentosClientes || [])
      .filter(p => {
        if (!p.data_pagamento) return false;
        const dataPag = parseISO(p.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && p.status === 'pago';
      })
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    const aportes = (aportesSocios || [])
      .filter(a => {
        if (!a.data_pagamento) return false;
        const dataPag = parseISO(a.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && a.status === 'pago';
      })
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    const despesas = (pagamentosFornecedores || [])
      .filter(p => {
        if (!p.data_pagamento) return false;
        const dataPag = parseISO(p.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && p.status === 'pago';
      })
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    const entradas = receitas + aportes;
    const saldo = entradas - despesas;

    return {
      mes: format(mes, "MMM", { locale: ptBR }),
      receitas,
      aportes,
      despesas,
      entradas,
      saldo,
    };
  });

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-lg">
          <Wallet className="w-5 h-5" />
          Fluxo de Caixa (últimos 6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="receitas" fill="#10b981" name="Receitas" radius={[8, 8, 0, 0]} />
            <Bar dataKey="aportes" fill="#3b82f6" name="Aportes" radius={[8, 8, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}