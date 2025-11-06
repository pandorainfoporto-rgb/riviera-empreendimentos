import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function EmpreendimentosStatus({ empreendimentos }) {
  const statusData = [
    { 
      name: "Em Execução", 
      value: empreendimentos.filter(e => e.status === 'em_execucao').length,
      color: "#10b981"
    },
    { 
      name: "Planejamento", 
      value: empreendimentos.filter(e => e.status === 'planejamento').length,
      color: "#3b82f6"
    },
    { 
      name: "Concluído", 
      value: empreendimentos.filter(e => e.status === 'concluido').length,
      color: "#8b5cf6"
    },
    { 
      name: "Em Pausa", 
      value: empreendimentos.filter(e => e.status === 'em_pausa').length,
      color: "#f59e0b"
    },
  ].filter(item => item.value > 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)] text-lg">
          <Building2 className="w-5 h-5" />
          Status dos Empreendimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum empreendimento cadastrado</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}