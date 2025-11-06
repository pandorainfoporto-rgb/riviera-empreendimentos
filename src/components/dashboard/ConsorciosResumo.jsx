import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Award, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ConsorciosResumo({ consorcios = [], unidades = [] }) {
  const totalCotas = (consorcios || []).length;
  const cotasContempladas = (consorcios || []).filter(c => c.contemplado).length;
  const cotasAtivas = (consorcios || []).filter(c => !c.contemplado).length;
  const cotasInvestimento = (consorcios || []).filter(c => c.eh_investimento_caixa).length;

  const chartData = [
    { name: 'Ativas', value: cotasAtivas, color: '#3b82f6' },
    { name: 'Contempladas', value: cotasContempladas, color: '#10b981' },
    { name: 'Investimento', value: cotasInvestimento, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const valorTotalCotas = (consorcios || []).reduce((sum, c) => sum + (c.valor_carta || 0), 0);
  const valorContemplado = (consorcios || [])
    .filter(c => c.contemplado)
    .reduce((sum, c) => sum + (c.valor_carta || 0), 0);

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <CircleDollarSign className="w-5 h-5" />
          Resumo de Consórcios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalCotas === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhum consórcio cadastrado</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{cotasAtivas}</p>
                <p className="text-xs text-gray-600">Ativas</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{cotasContempladas}</p>
                <p className="text-xs text-gray-600">Contempladas</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{cotasInvestimento}</p>
                <p className="text-xs text-gray-600">Investimento</p>
              </div>
            </div>

            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(chartData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Total em Cotas</span>
                <span className="font-semibold text-gray-900">
                  R$ {(valorTotalCotas / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Contemplado</span>
                <span className="font-semibold text-green-700">
                  R$ {(valorContemplado / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}