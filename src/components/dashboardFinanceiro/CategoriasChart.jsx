import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Layers } from "lucide-react";

const categoriaLabels = {
  pagamento_consorcio: "Consórcios",
  juros_consorcio: "Juros",
  multa_consorcio: "Multas",
  recebimento_cliente: "Clientes",
  pagamento_fornecedor: "Fornecedores",
  aporte_socio: "Aportes",
  investimento: "Investimentos",
  saque: "Saques",
  deposito: "Depósitos",
  transferencia: "Transferências",
  outros: "Outros",
};

const COLORS = [
  '#922B3E', '#7D5999', '#10b981', '#3b82f6', '#f59e0b', 
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export default function CategoriasChart({ movimentacoes }) {
  const despesas = movimentacoes.filter(m => m.tipo === "saida");
  
  const porCategoria = despesas.reduce((acc, mov) => {
    const categoria = mov.categoria || "outros";
    acc[categoria] = (acc[categoria] || 0) + (mov.valor || 0);
    return acc;
  }, {});

  const dados = Object.entries(porCategoria)
    .map(([categoria, valor]) => ({
      name: categoriaLabels[categoria] || categoria,
      value: valor,
    }))
    .sort((a, b) => b.value - a.value);

  const total = dados.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dados}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {dados.slice(0, 5).map((item, index) => {
                const percentual = (item.value / total) * 100;
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        R$ {(item.value / 1000).toFixed(1)}k
                      </span>
                      <span className="text-gray-500 ml-2">({percentual.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Nenhuma despesa no período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}