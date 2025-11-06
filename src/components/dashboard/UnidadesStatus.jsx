import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Home } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const statusColors = {
  disponivel: "#10b981",
  reservada: "#f59e0b",
  vendida: "#3b82f6",
  escriturada: "#8b5cf6",
  em_construcao: "#6b7280",
};

const statusLabels = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  escriturada: "Escriturada",
  em_construcao: "Em Construção",
};

export default function UnidadesStatus({ unidades = [] }) {
  const statusCount = (unidades || []).reduce((acc, uni) => {
    const status = uni.status || 'disponivel';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCount).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || "#6b7280",
  }));

  const totalUnidades = (unidades || []).length;
  const unidadesVendidas = statusCount.vendida || 0;
  const percentualVendido = totalUnidades > 0 ? ((unidadesVendidas / totalUnidades) * 100).toFixed(1) : 0;

  return (
    <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-base sm:text-lg">
          <Building2 className="w-5 h-5" />
          Status das Unidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalUnidades === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhuma unidade cadastrada</p>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-3xl font-bold text-[var(--wine-700)]">
                {unidadesVendidas}/{totalUnidades}
              </p>
              <p className="text-sm text-gray-600">
                {percentualVendido}% vendidas
              </p>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(chartData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {(chartData || []).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}