import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function RelatorioFinanceiro({ tipo }) {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
  });

  const filtrarPorPeriodo = (items, campoData) => {
    return items.filter(item => {
      if (!item[campoData]) return false;
      const data = parseISO(item[campoData]);
      return data >= parseISO(dataInicio) && data <= parseISO(dataFim);
    });
  };

  const receitas = filtrarPorPeriodo(
    pagamentosClientes.filter(p => p.status === 'pago'),
    'data_pagamento'
  );

  const despesas = filtrarPorPeriodo(
    pagamentosFornecedores.filter(p => p.status === 'pago'),
    'data_pagamento'
  );

  const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);

  const dadosGrafico = [
    { name: 'Receitas', value: totalReceitas, color: '#10b981' },
    { name: 'Despesas', value: totalDespesas, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-green-900">Total Receitas</span>
                <span className="font-bold text-green-700">
                  R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between p-4 bg-red-50 rounded-lg">
                <span className="font-semibold text-red-900">Total Despesas</span>
                <span className="font-bold text-red-700">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`flex justify-between p-4 rounded-lg ${totalReceitas >= totalDespesas ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <span className={`font-semibold ${totalReceitas >= totalDespesas ? 'text-blue-900' : 'text-orange-900'}`}>
                  Saldo
                </span>
                <span className={`font-bold text-xl ${totalReceitas >= totalDespesas ? 'text-blue-700' : 'text-orange-700'}`}>
                  R$ {(totalReceitas - totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}