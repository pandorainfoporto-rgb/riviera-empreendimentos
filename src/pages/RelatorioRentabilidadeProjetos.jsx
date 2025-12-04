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
  Building2, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3,
  AlertTriangle, CheckCircle2, Target
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, ComposedChart, Area } from "recharts";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#922B3E'];

export default function RelatorioRentabilidadeProjetos() {
  const [loteamentoFiltro, setLoteamentoFiltro] = useState("todos");

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades_rentabilidade'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes_rentabilidade'],
    queryFn: () => base44.entities.Negociacao.list(),
    initialData: [],
  });

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_obra_rentabilidade'],
    queryFn: () => base44.entities.CustoObra.list(),
    initialData: [],
  });

  const { data: despesasObra = [] } = useQuery({
    queryKey: ['despesas_obra_rentabilidade'],
    queryFn: async () => {
      try {
        return await base44.entities.DespesaObra.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  // Calcular rentabilidade por projeto/loteamento
  const rentabilidadePorLoteamento = loteamentos.map(loteamento => {
    const unidadesLote = unidades.filter(u => u.loteamento_id === loteamento.id);
    const unidadeIds = unidadesLote.map(u => u.id);
    
    // Vendas
    const vendasLote = negociacoes.filter(n => 
      unidadeIds.includes(n.unidade_id) && ['contrato_assinado', 'finalizada'].includes(n.status)
    );
    const receitaTotal = vendasLote.reduce((sum, n) => sum + (n.valor_total || 0), 0);
    
    // Custos
    const custosLote = custosObra.filter(c => unidadeIds.includes(c.unidade_id));
    const custoEstimado = custosLote.reduce((sum, c) => sum + (c.valor_total_estimado || 0), 0);
    const custoRealizado = custosLote.reduce((sum, c) => sum + (c.valor_total_realizado || 0), 0);
    
    // Despesas reais
    const despesasLote = despesasObra.filter(d => unidadeIds.includes(d.unidade_id));
    const despesasTotal = despesasLote.reduce((sum, d) => sum + (d.valor || 0), 0);
    
    const custoTotal = custoRealizado > 0 ? custoRealizado : custoEstimado;
    const lucroReal = receitaTotal - custoTotal;
    const margemLucro = receitaTotal > 0 ? (lucroReal / receitaTotal) * 100 : 0;
    const roi = custoTotal > 0 ? (lucroReal / custoTotal) * 100 : 0;
    
    // Progresso de vendas
    const unidadesVendidas = unidadesLote.filter(u => u.status === 'vendida').length;
    const progressoVendas = unidadesLote.length > 0 ? (unidadesVendidas / unidadesLote.length) * 100 : 0;
    
    // VGV (Valor Geral de Vendas)
    const vgv = unidadesLote.reduce((sum, u) => sum + (u.valor_venda || 0), 0);
    const vgvRealizado = vendasLote.reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const percentualVGV = vgv > 0 ? (vgvRealizado / vgv) * 100 : 0;

    return {
      id: loteamento.id,
      nome: loteamento.nome,
      totalUnidades: unidadesLote.length,
      unidadesVendidas,
      progressoVendas,
      receitaTotal,
      custoEstimado,
      custoRealizado: custoTotal,
      lucroReal,
      margemLucro,
      roi,
      vgv,
      vgvRealizado,
      percentualVGV,
      status: loteamento.status,
    };
  }).filter(l => loteamentoFiltro === "todos" || l.id === loteamentoFiltro);

  // Estatísticas gerais
  const totalReceita = rentabilidadePorLoteamento.reduce((sum, l) => sum + l.receitaTotal, 0);
  const totalCusto = rentabilidadePorLoteamento.reduce((sum, l) => sum + l.custoRealizado, 0);
  const totalLucro = rentabilidadePorLoteamento.reduce((sum, l) => sum + l.lucroReal, 0);
  const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;
  const roiMedio = totalCusto > 0 ? (totalLucro / totalCusto) * 100 : 0;

  // Projetos mais rentáveis
  const projetosMaisRentaveis = [...rentabilidadePorLoteamento]
    .filter(l => l.receitaTotal > 0)
    .sort((a, b) => b.margemLucro - a.margemLucro)
    .slice(0, 5);

  // Dados para gráficos
  const dadosRentabilidade = rentabilidadePorLoteamento
    .filter(l => l.receitaTotal > 0)
    .slice(0, 8)
    .map(l => ({
      name: l.nome.length > 15 ? l.nome.substring(0, 12) + '...' : l.nome,
      receita: l.receitaTotal / 1000,
      custo: l.custoRealizado / 1000,
      lucro: l.lucroReal / 1000,
    }));

  const dadosMargens = rentabilidadePorLoteamento
    .filter(l => l.receitaTotal > 0)
    .map(l => ({
      name: l.nome.length > 12 ? l.nome.substring(0, 10) + '...' : l.nome,
      margem: l.margemLucro,
      roi: l.roi,
    }));

  // Distribuição por status
  const distribuicaoStatus = [
    { name: 'Lucrativos', value: rentabilidadePorLoteamento.filter(l => l.lucroReal > 0).length, color: '#10b981' },
    { name: 'Break-even', value: rentabilidadePorLoteamento.filter(l => l.lucroReal === 0).length, color: '#f59e0b' },
    { name: 'Prejuízo', value: rentabilidadePorLoteamento.filter(l => l.lucroReal < 0).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const columnsExport = [
    { key: 'nome', label: 'Projeto' },
    { key: 'totalUnidades', label: 'Unidades' },
    { key: 'unidadesVendidas', label: 'Vendidas' },
    { key: 'receitaTotal', label: 'Receita', accessor: (r) => `R$ ${r.receitaTotal.toLocaleString('pt-BR')}` },
    { key: 'custoRealizado', label: 'Custo', accessor: (r) => `R$ ${r.custoRealizado.toLocaleString('pt-BR')}` },
    { key: 'lucroReal', label: 'Lucro', accessor: (r) => `R$ ${r.lucroReal.toLocaleString('pt-BR')}` },
    { key: 'margemLucro', label: 'Margem', accessor: (r) => `${r.margemLucro.toFixed(1)}%` },
    { key: 'roi', label: 'ROI', accessor: (r) => `${r.roi.toFixed(1)}%` },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">
            Rentabilidade por Projeto
          </h1>
          <p className="text-gray-600 mt-1">Análise de lucratividade e ROI por empreendimento</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={loteamentoFiltro} onValueChange={setLoteamentoFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Projetos</SelectItem>
              {loteamentos.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportarRelatorio
            data={rentabilidadePorLoteamento}
            columns={columnsExport}
            filename="rentabilidade_projetos"
            title="Relatório de Rentabilidade por Projeto"
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Receita Total</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              R$ {(totalReceita / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-gray-500">Custo Total</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              R$ {(totalCusto / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Lucro Total</span>
            </div>
            <p className={`text-xl font-bold ${totalLucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {(totalLucro / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-500">Margem Média</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{margemMedia.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-500">ROI Médio</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{roiMedio.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visao_geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="visao_geral">
            <Building2 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="comparativo">
            <BarChart3 className="w-4 h-4 mr-2" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="margens">
            <PieChart className="w-4 h-4 mr-2" />
            Margens
          </TabsTrigger>
          <TabsTrigger value="detalhado">
            <DollarSign className="w-4 h-4 mr-2" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao_geral" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receita x Custo x Lucro (R$ mil)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={dadosRentabilidade}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value.toFixed(0)}k`, '']} />
                    <Legend />
                    <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="custo" fill="#ef4444" name="Custo" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={2} name="Lucro" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={distribuicaoStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {distribuicaoStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 mais rentáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Projetos Mais Rentáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                {projetosMaisRentaveis.map((projeto, idx) => (
                  <div key={projeto.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-600">{idx + 1}º</Badge>
                    </div>
                    <p className="font-semibold text-sm truncate">{projeto.nome}</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">
                      {projeto.margemLucro.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Margem de Lucro</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      ROI: {projeto.roi.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparativo de Margem e ROI por Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosMargens} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="%" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, '']} />
                  <Legend />
                  <Bar dataKey="margem" fill="#922B3E" name="Margem Lucro" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="roi" fill="#7D5999" name="ROI" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margens" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {rentabilidadePorLoteamento.filter(l => l.receitaTotal > 0).slice(0, 6).map((projeto) => (
              <Card key={projeto.id} className={`${projeto.lucroReal >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base truncate">{projeto.nome}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso Vendas</span>
                        <span>{projeto.progressoVendas.toFixed(0)}%</span>
                      </div>
                      <Progress value={projeto.progressoVendas} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Margem</p>
                        <p className={`font-bold ${projeto.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {projeto.margemLucro.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-gray-500">ROI</p>
                        <p className={`font-bold ${projeto.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {projeto.roi.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Lucro</span>
                        <span className={`font-bold ${projeto.lucroReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {(projeto.lucroReal / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detalhado" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise Detalhada por Projeto</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-center">Unidades</TableHead>
                    <TableHead className="text-center">Vendidas</TableHead>
                    <TableHead className="text-center">% Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-center">Margem</TableHead>
                    <TableHead className="text-center">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentabilidadePorLoteamento.map((projeto) => (
                    <TableRow key={projeto.id}>
                      <TableCell className="font-medium">{projeto.nome}</TableCell>
                      <TableCell className="text-center">{projeto.totalUnidades}</TableCell>
                      <TableCell className="text-center">{projeto.unidadesVendidas}</TableCell>
                      <TableCell className="text-center">
                        <Progress value={projeto.progressoVendas} className="h-2 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        R$ {projeto.receitaTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        R$ {projeto.custoRealizado.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${projeto.lucroReal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {projeto.lucroReal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={projeto.margemLucro >= 20 ? 'bg-green-600' : projeto.margemLucro >= 10 ? 'bg-yellow-600' : 'bg-red-600'}>
                          {projeto.margemLucro.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={projeto.roi >= 0 ? 'text-green-700' : 'text-red-700'}>
                          {projeto.roi.toFixed(1)}%
                        </Badge>
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