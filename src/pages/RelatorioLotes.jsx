import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Package, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import MapaLoteamento from "../components/loteamentos/MapaLoteamento";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

const STATUS_COLORS = {
  disponivel: '#22C55E',
  reservado: '#FBBF24',
  em_negociacao: '#3B82F6',
  vendido: '#EF4444'
};

export default function RelatorioLotes() {
  const [loteamentoSelecionado, setLoteamentoSelecionado] = useState("todos");

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes'],
    queryFn: () => base44.entities.Lote.list(),
  });

  const lotesFiltrados = loteamentoSelecionado === "todos"
    ? lotes
    : lotes.filter(l => l.loteamento_id === loteamentoSelecionado);

  const estatisticas = {
    total: lotesFiltrados.length,
    disponiveis: lotesFiltrados.filter(l => l.status === 'disponivel').length,
    reservados: lotesFiltrados.filter(l => l.status === 'reservado').length,
    em_negociacao: lotesFiltrados.filter(l => l.status === 'em_negociacao').length,
    vendidos: lotesFiltrados.filter(l => l.status === 'vendido').length,
    valorTotal: lotesFiltrados.reduce((sum, l) => sum + (l.valor_total || 0), 0),
    valorVendido: lotesFiltrados.filter(l => l.status === 'vendido').reduce((sum, l) => sum + (l.valor_total || 0), 0),
    areaTotal: lotesFiltrados.reduce((sum, l) => sum + (l.area || 0), 0),
  };

  const percentualVendido = estatisticas.total > 0 
    ? (estatisticas.vendidos / estatisticas.total) * 100 
    : 0;

  const dadosPizza = [
    { name: 'Disponíveis', value: estatisticas.disponiveis, color: STATUS_COLORS.disponivel },
    { name: 'Reservados', value: estatisticas.reservados, color: STATUS_COLORS.reservado },
    { name: 'Em Negociação', value: estatisticas.em_negociacao, color: STATUS_COLORS.em_negociacao },
    { name: 'Vendidos', value: estatisticas.vendidos, color: STATUS_COLORS.vendido },
  ].filter(d => d.value > 0);

  const dadosPorQuadra = Object.entries(
    lotesFiltrados.reduce((acc, lote) => {
      const quadra = lote.quadra || 'Sem Quadra';
      if (!acc[quadra]) acc[quadra] = { quadra, total: 0, disponiveis: 0, vendidos: 0 };
      acc[quadra].total++;
      if (lote.status === 'disponivel') acc[quadra].disponiveis++;
      if (lote.status === 'vendido') acc[quadra].vendidos++;
      return acc;
    }, {})
  ).map(([_, data]) => data);

  const dadosExportar = lotesFiltrados.map(lote => {
    const loteamento = loteamentos.find(l => l.id === lote.loteamento_id);
    return {
      'Loteamento': loteamento?.nome || 'N/A',
      'Número': lote.numero,
      'Quadra': lote.quadra || '-',
      'Área (m²)': lote.area || 0,
      'Valor Total': lote.valor_total || 0,
      'Valor/m²': lote.valor_m2 || 0,
      'Status': lote.status,
    };
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Lotes</h1>
          <p className="text-gray-600 mt-1">Análise completa dos lotes por loteamento</p>
        </div>
        <ExportarRelatorio 
          dados={dadosExportar}
          nomeArquivo="relatorio-lotes"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Select value={loteamentoSelecionado} onValueChange={setLoteamentoSelecionado}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o loteamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Loteamentos</SelectItem>
            {loteamentos.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">{estatisticas.total}</Badge>
            </div>
            <p className="text-sm text-gray-600">Total de Lotes</p>
            <p className="text-2xl font-bold">{estatisticas.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-800">{estatisticas.disponiveis}</Badge>
            </div>
            <p className="text-sm text-gray-600">Disponíveis</p>
            <p className="text-2xl font-bold text-green-600">{estatisticas.disponiveis}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <Badge className="bg-red-100 text-red-800">{estatisticas.vendidos}</Badge>
            </div>
            <p className="text-sm text-gray-600">Vendidos</p>
            <p className="text-2xl font-bold text-red-600">{estatisticas.vendidos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">% Vendido</p>
            <p className="text-2xl font-bold text-purple-600">{percentualVendido.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {loteamentoSelecionado !== "todos" && loteamentos.find(l => l.id === loteamentoSelecionado)?.arquivo_planta_url && (
        <MapaLoteamento 
          loteamentoId={loteamentoSelecionado}
          onLoteClick={(lote) => {
            toast.info(`Lote ${lote.numero} - ${lote.status} - ${lote.area?.toFixed(0)}m²`);
          }}
        />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {dadosPorQuadra.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lotes por Quadra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPorQuadra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quadra" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="disponiveis" fill="#22C55E" name="Disponíveis" />
                  <Bar dataKey="vendidos" fill="#EF4444" name="Vendidos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Detalhada de Lotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Loteamento</th>
                  <th className="text-left p-3">Número</th>
                  <th className="text-left p-3">Quadra</th>
                  <th className="text-left p-3">Área</th>
                  <th className="text-left p-3">Valor Total</th>
                  <th className="text-left p-3">Valor/m²</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.map(lote => {
                  const loteamento = loteamentos.find(l => l.id === lote.loteamento_id);
                  return (
                    <tr key={lote.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{loteamento?.nome || 'N/A'}</td>
                      <td className="p-3 font-semibold">{lote.numero}</td>
                      <td className="p-3">{lote.quadra || '-'}</td>
                      <td className="p-3">{lote.area?.toFixed(2) || 0} m²</td>
                      <td className="p-3">R$ {(lote.valor_total || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3">R$ {(lote.valor_m2 || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3">
                        <Badge style={{ backgroundColor: STATUS_COLORS[lote.status] }}>
                          {lote.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}