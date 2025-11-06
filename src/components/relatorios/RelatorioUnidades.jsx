import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Home, CheckCircle2, Clock, Package } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function RelatorioUnidades({ tipo }) {
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const statusCores = {
    disponivel: '#3b82f6',
    reservada: '#f59e0b',
    vendida: '#10b981',
    escriturada: '#6366f1',
    em_construcao: '#8b5cf6',
  };

  const statusLabels = {
    disponivel: 'Disponível',
    reservada: 'Reservada',
    vendida: 'Vendida',
    escriturada: 'Escriturada',
    em_construcao: 'Em Construção',
  };

  const dadosPorStatus = Object.keys(statusLabels).map(status => ({
    name: statusLabels[status],
    value: unidades.filter(u => u.status === status).length,
    color: statusCores[status],
  }));

  const dadosPorLoteamento = loteamentos.map(lot => ({
    nome: lot.nome,
    quantidade: unidades.filter(u => u.loteamento_id === lot.id).length,
    vendidas: unidades.filter(u => u.loteamento_id === lot.id && (u.status === 'vendida' || u.status === 'escriturada')).length,
  }));

  const totalUnidades = unidades.length;
  const totalVendidas = unidades.filter(u => u.status === 'vendida' || u.status === 'escriturada').length;
  const totalDisponiveis = unidades.filter(u => u.status === 'disponivel').length;
  const valorTotalVendas = unidades
    .filter(u => u.status === 'vendida' || u.status === 'escriturada')
    .reduce((sum, u) => sum + (u.valor_venda || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Unidades</p>
                <p className="text-3xl font-bold text-gray-900">{totalUnidades}</p>
              </div>
              <Home className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vendidas</p>
                <p className="text-3xl font-bold text-green-600">{totalVendidas}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Disponíveis</p>
                <p className="text-3xl font-bold text-yellow-600">{totalDisponiveis}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-xl font-bold text-[var(--wine-700)]">
                  R$ {(valorTotalVendas / 1000).toFixed(0)}k
                </p>
              </div>
              <Package className="w-10 h-10 text-[var(--wine-600)] opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Unidades por Loteamento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorLoteamento}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nome" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#3b82f6" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="vendidas" fill="#10b981" name="Vendidas" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}