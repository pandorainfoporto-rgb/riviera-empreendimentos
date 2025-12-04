import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, TrendingUp, Award, Target, DollarSign, BarChart3,
  Medal, Trophy, Crown, Star
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

const COLORS = ['#922B3E', '#7D5999', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function RelatorioPerformanceCorretores() {
  const [periodoFiltro, setPeriodoFiltro] = useState("6");
  const [imobiliariaFiltro, setImobiliariaFiltro] = useState("todas");

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
    initialData: [],
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
    initialData: [],
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes_corretores'],
    queryFn: () => base44.entities.Negociacao.list(),
    initialData: [],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_corretores'],
    queryFn: async () => {
      try {
        return await base44.entities.LeadPreVenda.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  // Filtrar por período
  const dataLimite = subMonths(new Date(), parseInt(periodoFiltro));
  
  const negociacoesFiltradas = negociacoes.filter(n => {
    const dataNeg = new Date(n.created_date);
    if (dataNeg < dataLimite) return false;
    if (imobiliariaFiltro !== "todas" && n.imobiliaria_id !== imobiliariaFiltro) return false;
    return true;
  });

  // Calcular performance por corretor
  const performanceCorretores = corretores.map(corretor => {
    const vendasCorretor = negociacoesFiltradas.filter(n => n.corretor_id === corretor.id);
    const vendasFechadas = vendasCorretor.filter(n => ['contrato_assinado', 'finalizada'].includes(n.status));
    const leadsCorretor = leads.filter(l => l.corretor_id === corretor.id);
    const leadsConvertidos = leadsCorretor.filter(l => l.status === 'convertido');
    
    const valorTotal = vendasFechadas.reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const comissaoTotal = vendasFechadas.reduce((sum, n) => sum + (n.comissao_corretor_valor || 0), 0);
    const ticketMedio = vendasFechadas.length > 0 ? valorTotal / vendasFechadas.length : 0;
    const taxaConversao = leadsCorretor.length > 0 ? (leadsConvertidos.length / leadsCorretor.length) * 100 : 0;

    const imobiliaria = imobiliarias.find(i => i.id === corretor.imobiliaria_id);

    return {
      id: corretor.id,
      nome: corretor.nome,
      imobiliaria: imobiliaria?.nome || "Direto",
      totalVendas: vendasFechadas.length,
      valorTotal,
      comissaoTotal,
      ticketMedio,
      taxaConversao,
      leadsAtendidos: leadsCorretor.length,
      leadsConvertidos: leadsConvertidos.length,
      negociacoesAtivas: vendasCorretor.filter(n => n.status === 'ativa').length,
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);

  // Top 5 corretores
  const top5 = performanceCorretores.slice(0, 5);

  // Dados para gráficos
  const dadosVendasPorCorretor = top5.map(c => ({
    name: c.nome.split(' ')[0],
    vendas: c.totalVendas,
    valor: c.valorTotal / 1000,
  }));

  const dadosConversao = top5.map(c => ({
    name: c.nome.split(' ')[0],
    taxa: c.taxaConversao,
  }));

  // Evolução mensal (últimos 6 meses)
  const evolucaoMensal = [];
  for (let i = 5; i >= 0; i--) {
    const mesData = subMonths(new Date(), i);
    const inicioMes = startOfMonth(mesData);
    const fimMes = endOfMonth(mesData);
    
    const vendasMes = negociacoesFiltradas.filter(n => {
      const data = new Date(n.created_date);
      return data >= inicioMes && data <= fimMes && ['contrato_assinado', 'finalizada'].includes(n.status);
    });

    evolucaoMensal.push({
      mes: format(mesData, 'MMM/yy', { locale: ptBR }),
      vendas: vendasMes.length,
      valor: vendasMes.reduce((sum, n) => sum + (n.valor_total || 0), 0) / 1000,
    });
  }

  // Estatísticas gerais
  const totalVendas = performanceCorretores.reduce((sum, c) => sum + c.totalVendas, 0);
  const totalValor = performanceCorretores.reduce((sum, c) => sum + c.valorTotal, 0);
  const totalComissoes = performanceCorretores.reduce((sum, c) => sum + c.comissaoTotal, 0);
  const mediaConversao = performanceCorretores.length > 0
    ? performanceCorretores.reduce((sum, c) => sum + c.taxaConversao, 0) / performanceCorretores.length
    : 0;

  const columnsExport = [
    { key: 'nome', label: 'Corretor' },
    { key: 'imobiliaria', label: 'Imobiliária' },
    { key: 'totalVendas', label: 'Vendas' },
    { key: 'valorTotal', label: 'Valor Total', accessor: (r) => `R$ ${r.valorTotal.toLocaleString('pt-BR')}` },
    { key: 'comissaoTotal', label: 'Comissão', accessor: (r) => `R$ ${r.comissaoTotal.toLocaleString('pt-BR')}` },
    { key: 'ticketMedio', label: 'Ticket Médio', accessor: (r) => `R$ ${r.ticketMedio.toLocaleString('pt-BR')}` },
    { key: 'taxaConversao', label: 'Taxa Conversão', accessor: (r) => `${r.taxaConversao.toFixed(1)}%` },
  ];

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Star className="w-4 h-4 text-gray-300" />;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">
            Performance de Corretores
          </h1>
          <p className="text-gray-600 mt-1">Análise de vendas e conversões por corretor</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Select value={imobiliariaFiltro} onValueChange={setImobiliariaFiltro}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Imobiliárias</SelectItem>
              {imobiliarias.map(i => (
                <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportarRelatorio
            data={performanceCorretores}
            columns={columnsExport}
            filename="performance_corretores"
            title="Relatório de Performance de Corretores"
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Corretores Ativos</span>
            </div>
            <p className="text-2xl font-bold">{performanceCorretores.filter(c => c.totalVendas > 0).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Total Vendas</span>
            </div>
            <p className="text-2xl font-bold">{totalVendas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-500">Volume Vendas</span>
            </div>
            <p className="text-xl font-bold text-purple-600">R$ {(totalValor / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-500">Taxa Conversão Média</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{mediaConversao.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="ranking">
            <Trophy className="w-4 h-4 mr-2" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="graficos">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="evolucao">
            <TrendingUp className="w-4 h-4 mr-2" />
            Evolução
          </TabsTrigger>
          <TabsTrigger value="detalhado">
            <Users className="w-4 h-4 mr-2" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-6 mt-6">
          {/* Top 3 Destaque */}
          <div className="grid md:grid-cols-3 gap-4">
            {top5.slice(0, 3).map((corretor, idx) => (
              <Card key={corretor.id} className={`${idx === 0 ? 'border-2 border-yellow-400 bg-yellow-50' : idx === 1 ? 'border-gray-300' : 'border-amber-300'}`}>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    {getRankIcon(idx)}
                  </div>
                  <p className="text-lg font-bold">{corretor.nome}</p>
                  <p className="text-sm text-gray-500 mb-4">{corretor.imobiliaria}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Vendas</p>
                      <p className="font-bold text-lg">{corretor.totalVendas}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Valor</p>
                      <p className="font-bold text-lg text-green-600">
                        R$ {(corretor.valorTotal / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Taxa de Conversão</p>
                    <Progress value={corretor.taxaConversao} className="h-2" />
                    <p className="text-sm font-semibold mt-1">{corretor.taxaConversao.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ranking completo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-center">Conversão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceCorretores.map((corretor, idx) => (
                    <TableRow key={corretor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(idx)}
                          <span className="font-bold">{idx + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{corretor.nome}</TableCell>
                      <TableCell>{corretor.imobiliaria}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{corretor.totalVendas}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {corretor.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {corretor.comissaoTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={corretor.taxaConversao >= 30 ? 'bg-green-600' : corretor.taxaConversao >= 15 ? 'bg-yellow-600' : 'bg-gray-500'}>
                          {corretor.taxaConversao.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 5 - Vendas por Corretor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosVendasPorCorretor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#922B3E" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'vendas' ? value : `R$ ${value}k`,
                        name === 'vendas' ? 'Vendas' : 'Valor (R$ mil)'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="vendas" fill="#922B3E" name="Vendas" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor (R$ mil)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taxa de Conversão - Top 5</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosConversao} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Taxa Conversão']} />
                    <Bar dataKey="taxa" fill="#7D5999" radius={[0, 4, 4, 0]}>
                      {dadosConversao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Vendas (Últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis yAxisId="left" orientation="left" stroke="#922B3E" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="vendas" stroke="#922B3E" strokeWidth={2} name="Vendas" />
                  <Line yAxisId="right" type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} name="Valor (R$ mil)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhado" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento por Corretor</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Convertidos</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-center">Em Andamento</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceCorretores.map((corretor) => (
                    <TableRow key={corretor.id}>
                      <TableCell className="font-medium">{corretor.nome}</TableCell>
                      <TableCell>{corretor.imobiliaria}</TableCell>
                      <TableCell className="text-center">{corretor.leadsAtendidos}</TableCell>
                      <TableCell className="text-center">{corretor.leadsConvertidos}</TableCell>
                      <TableCell className="text-center font-bold text-green-600">{corretor.totalVendas}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{corretor.negociacoesAtivas}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {corretor.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        R$ {corretor.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}