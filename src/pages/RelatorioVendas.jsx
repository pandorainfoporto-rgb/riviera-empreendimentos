import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Building2, DollarSign, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import RelatorioUnidadesComponent from "../components/relatorios/RelatorioUnidades";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

export default function RelatorioVendas() {
  const [periodoFiltro, setPeriodoFiltro] = useState("12");
  
  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes_vendas'],
    queryFn: () => base44.entities.Negociacao.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_vendas'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  // Filtrar vendas por período
  const dataLimite = subMonths(new Date(), parseInt(periodoFiltro));
  const vendasFiltradas = negociacoes.filter(n => {
    const data = new Date(n.created_date);
    return data >= dataLimite && ['contrato_assinado', 'finalizada'].includes(n.status);
  });

  // Vendas mensais
  const vendasMensais = [];
  for (let i = parseInt(periodoFiltro) - 1; i >= 0; i--) {
    const mesRef = subMonths(new Date(), i);
    const inicioMesRef = startOfMonth(mesRef);
    const fimMesRef = endOfMonth(mesRef);
    
    const vendasMes = vendasFiltradas.filter(n => {
      const data = new Date(n.created_date);
      return data >= inicioMesRef && data <= fimMesRef;
    });

    vendasMensais.push({
      mes: format(mesRef, 'MMM/yy', { locale: ptBR }),
      quantidade: vendasMes.length,
      valor: vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0) / 1000,
    });
  }

  // Vendas por loteamento
  const vendasPorLoteamento = loteamentos.map(lote => {
    const vendasLote = vendasFiltradas.filter(n => {
      const unidade = n.unidade_id;
      return true; // Simplificado - idealmente buscar unidade.loteamento_id
    });
    return {
      nome: lote.nome,
      vendas: vendasLote.length,
    };
  }).filter(l => l.vendas > 0).sort((a, b) => b.vendas - a.vendas).slice(0, 8);

  const totalVendas = vendasFiltradas.length;
  const valorTotal = vendasFiltradas.reduce((sum, v) => sum + (v.valor_total || 0), 0);
  const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

  const columnsExport = [
    { key: 'mes', label: 'Mês' },
    { key: 'quantidade', label: 'Vendas' },
    { key: 'valor', label: 'Valor', accessor: (r) => `R$ ${r.valor}k` },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">Relatório de Vendas</h1>
          <p className="text-gray-600 mt-1">Análise de vendas e faturamento de unidades</p>
        </div>
        <div className="flex gap-2">
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <ExportarRelatorio
            data={vendasMensais}
            columns={columnsExport}
            filename="vendas_mensais"
            title="Relatório de Vendas Mensais"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Total Vendas</span>
            </div>
            <p className="text-2xl font-bold">{totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Valor Total</span>
            </div>
            <p className="text-xl font-bold text-blue-600">R$ {(valorTotal / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-500">Ticket Médio</span>
            </div>
            <p className="text-xl font-bold text-purple-600">R$ {(ticketMedio / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analise">
            <Calendar className="w-4 h-4 mr-2" />
            Análise Temporal
          </TabsTrigger>
          <TabsTrigger value="unidades">
            <Building2 className="w-4 h-4 mr-2" />
            Por Unidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendas Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasMensais}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" orientation="left" stroke="#922B3E" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="quantidade" fill="#922B3E" name="Quantidade" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor (R$ mil)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendas por Loteamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasPorLoteamento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nome" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="#7D5999" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={vendasMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value}k`} />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} name="Valor (R$ mil)" dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unidades" className="mt-6">
          <RelatorioUnidadesComponent tipo="vendas" />
        </TabsContent>
      </Tabs>
    </div>
  );
}