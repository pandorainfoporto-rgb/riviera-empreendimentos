import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReceitasDespesasChart({ movimentacoes, dataInicio, dataFim }) {
  // Agrupar por dia
  const dias = eachDayOfInterval({ start: dataInicio, end: dataFim });
  
  const dados = dias.map(dia => {
    const movsDia = movimentacoes.filter(m => {
      try {
        return isSameDay(parseISO(m.data_movimentacao), dia);
      } catch {
        return false;
      }
    });

    const receitas = movsDia
      .filter(m => m.tipo === "entrada")
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    const despesas = movsDia
      .filter(m => m.tipo === "saida")
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    return {
      data: format(dia, "dd/MM"),
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Receitas x Despesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="data" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="receitas" fill="#10b981" name="Receitas" radius={[8, 8, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}