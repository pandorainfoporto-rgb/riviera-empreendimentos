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
  Briefcase, TrendingUp, Package, DollarSign, PieChart, BarChart3,
  Star, AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, ComposedChart, Area } from "recharts";
import { subMonths } from "date-fns";
import ExportarRelatorio from "../components/relatorios/ExportarRelatorio";

const CORES_ABC = {
  A: '#ef4444',
  B: '#f59e0b',
  C: '#10b981',
};

export default function RelatorioCurvaABCFornecedores() {
  const [periodoFiltro, setPeriodoFiltro] = useState("12");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores_abc'],
    queryFn: () => base44.entities.Fornecedor.list(),
    initialData: [],
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos_fornecedores_abc'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
    initialData: [],
  });

  const { data: compras = [] } = useQuery({
    queryKey: ['compras_abc'],
    queryFn: async () => {
      try {
        return await base44.entities.CompraNotaFiscal.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  // Filtrar por período
  const dataLimite = subMonths(new Date(), parseInt(periodoFiltro));

  const pagamentosFiltrados = pagamentos.filter(p => {
    const dataPag = new Date(p.created_date);
    return dataPag >= dataLimite && p.status === 'pago';
  });

  // Calcular volume por fornecedor
  const volumePorFornecedor = fornecedores.map(fornecedor => {
    const pagamentosForn = pagamentosFiltrados.filter(p => p.fornecedor_id === fornecedor.id);
    const comprasForn = compras.filter(c => c.fornecedor_id === fornecedor.id);
    
    const valorTotal = pagamentosForn.reduce((sum, p) => sum + (p.valor || 0), 0);
    const quantidadeCompras = comprasForn.length + pagamentosForn.length;
    const ticketMedio = quantidadeCompras > 0 ? valorTotal / quantidadeCompras : 0;

    return {
      id: fornecedor.id,
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj,
      tipoServico: fornecedor.tipo_servico || 'Outros',
      valorTotal,
      quantidadeCompras,
      ticketMedio,
      ativo: fornecedor.ativo !== false,
    };
  }).filter(f => {
    if (categoriaFiltro === "todas") return true;
    return f.tipoServico === categoriaFiltro;
  }).sort((a, b) => b.valorTotal - a.valorTotal);

  // Calcular total geral
  const valorTotalGeral = volumePorFornecedor.reduce((sum, f) => sum + f.valorTotal, 0);

  // Classificar ABC
  let acumulado = 0;
  const fornecedoresComClassificacao = volumePorFornecedor.map(fornecedor => {
    acumulado += fornecedor.valorTotal;
    const percentualAcumulado = valorTotalGeral > 0 ? (acumulado / valorTotalGeral) * 100 : 0;
    const percentualIndividual = valorTotalGeral > 0 ? (fornecedor.valorTotal / valorTotalGeral) * 100 : 0;
    
    let classificacao = 'C';
    if (percentualAcumulado <= 80) {
      classificacao = 'A';
    } else if (percentualAcumulado <= 95) {
      classificacao = 'B';
    }

    return {
      ...fornecedor,
      percentualIndividual,
      percentualAcumulado,
      classificacao,
    };
  });

  // Estatísticas por classificação
  const estatisticasABC = {
    A: {
      quantidade: fornecedoresComClassificacao.filter(f => f.classificacao === 'A').length,
      valor: fornecedoresComClassificacao.filter(f => f.classificacao === 'A').reduce((sum, f) => sum + f.valorTotal, 0),
    },
    B: {
      quantidade: fornecedoresComClassificacao.filter(f => f.classificacao === 'B').length,
      valor: fornecedoresComClassificacao.filter(f => f.classificacao === 'B').reduce((sum, f) => sum + f.valorTotal, 0),
    },
    C: {
      quantidade: fornecedoresComClassificacao.filter(f => f.classificacao === 'C').length,
      valor: fornecedoresComClassificacao.filter(f => f.classificacao === 'C').reduce((sum, f) => sum + f.valorTotal, 0),
    },
  };

  // Dados para gráficos
  const dadosPie = [
    { name: 'Classe A (80%)', value: estatisticasABC.A.valor, color: CORES_ABC.A },
    { name: 'Classe B (15%)', value: estatisticasABC.B.valor, color: CORES_ABC.B },
    { name: 'Classe C (5%)', value: estatisticasABC.C.valor, color: CORES_ABC.C },
  ].filter(d => d.value > 0);

  const dadosPareto = fornecedoresComClassificacao.slice(0, 15).map(f => ({
    name: f.nome.length > 12 ? f.nome.substring(0, 10) + '...' : f.nome,
    valor: f.valorTotal / 1000,
    acumulado: f.percentualAcumulado,
  }));

  // Top 10 por valor
  const top10 = fornecedoresComClassificacao.slice(0, 10);

  // Categorias únicas
  const categorias = [...new Set(fornecedores.map(f => f.tipo_servico).filter(Boolean))];

  const columnsExport = [
    { key: 'nome', label: 'Fornecedor' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'tipoServico', label: 'Categoria' },
    { key: 'classificacao', label: 'Classe' },
    { key: 'valorTotal', label: 'Valor Total', accessor: (r) => `R$ ${r.valorTotal.toLocaleString('pt-BR')}` },
    { key: 'quantidadeCompras', label: 'Qtd Compras' },
    { key: 'percentualIndividual', label: '% Individual', accessor: (r) => `${r.percentualIndividual.toFixed(2)}%` },
    { key: 'percentualAcumulado', label: '% Acumulado', accessor: (r) => `${r.percentualAcumulado.toFixed(2)}%` },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">
            Curva ABC de Fornecedores
          </h1>
          <p className="text-gray-600 mt-1">Análise de Pareto - Classificação por volume de compras</p>
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
              <SelectItem value="24">Últimos 2 anos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Categorias</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportarRelatorio
            data={fornecedoresComClassificacao}
            columns={columnsExport}
            filename="curva_abc_fornecedores"
            title="Curva ABC de Fornecedores"
          />
        </div>
      </div>

      {/* Cards de Classificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-600 text-white text-lg px-3">A</Badge>
                  <span className="text-sm text-gray-600">Alta Prioridade</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  {estatisticasABC.A.quantidade} fornecedores
                </p>
                <p className="text-sm text-gray-600">
                  R$ {(estatisticasABC.A.valor / 1000).toFixed(0)}k ({valorTotalGeral > 0 ? ((estatisticasABC.A.valor / valorTotalGeral) * 100).toFixed(0) : 0}% do total)
                </p>
              </div>
              <Star className="w-12 h-12 text-red-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-600 text-white text-lg px-3">B</Badge>
                  <span className="text-sm text-gray-600">Média Prioridade</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {estatisticasABC.B.quantidade} fornecedores
                </p>
                <p className="text-sm text-gray-600">
                  R$ {(estatisticasABC.B.valor / 1000).toFixed(0)}k ({valorTotalGeral > 0 ? ((estatisticasABC.B.valor / valorTotalGeral) * 100).toFixed(0) : 0}% do total)
                </p>
              </div>
              <Package className="w-12 h-12 text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600 text-white text-lg px-3">C</Badge>
                  <span className="text-sm text-gray-600">Baixa Prioridade</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {estatisticasABC.C.quantidade} fornecedores
                </p>
                <p className="text-sm text-gray-600">
                  R$ {(estatisticasABC.C.valor / 1000).toFixed(0)}k ({valorTotalGeral > 0 ? ((estatisticasABC.C.valor / valorTotalGeral) * 100).toFixed(0) : 0}% do total)
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-green-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pareto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="pareto">
            <BarChart3 className="w-4 h-4 mr-2" />
            Curva Pareto
          </TabsTrigger>
          <TabsTrigger value="distribuicao">
            <PieChart className="w-4 h-4 mr-2" />
            Distribuição
          </TabsTrigger>
          <TabsTrigger value="top10">
            <Star className="w-4 h-4 mr-2" />
            Top 10
          </TabsTrigger>
          <TabsTrigger value="detalhado">
            <Briefcase className="w-4 h-4 mr-2" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pareto" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Curva ABC - Pareto</CardTitle>
              <p className="text-sm text-gray-500">Volume de compras x Percentual acumulado</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={dadosPareto}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} />
                  <YAxis yAxisId="left" orientation="left" stroke="#922B3E" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" domain={[0, 100]} unit="%" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'valor' ? `R$ ${value}k` : `${value.toFixed(1)}%`,
                      name === 'valor' ? 'Valor' : '% Acumulado'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="valor" fill="#922B3E" name="Valor (R$ mil)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#3b82f6" strokeWidth={2} name="% Acumulado" dot />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Interpretação da Curva ABC</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li><strong>Classe A (80%):</strong> Poucos fornecedores representam a maior parte do volume. Priorize negociações e parcerias.</li>
                  <li><strong>Classe B (15%):</strong> Fornecedores intermediários. Acompanhe desempenho e potencial de crescimento.</li>
                  <li><strong>Classe C (5%):</strong> Muitos fornecedores com baixo volume. Considere consolidação ou eliminação.</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Classe</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {dadosPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quantidade de Fornecedores por Classe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 pt-4">
                  {Object.entries(estatisticasABC).map(([classe, dados]) => {
                    const percentualFornecedores = fornecedoresComClassificacao.length > 0
                      ? (dados.quantidade / fornecedoresComClassificacao.length) * 100
                      : 0;
                    return (
                      <div key={classe}>
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: CORES_ABC[classe] }}>{classe}</Badge>
                            <span className="font-medium">{dados.quantidade} fornecedores</span>
                          </div>
                          <span className="text-gray-500">{percentualFornecedores.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={percentualFornecedores} 
                          className="h-3"
                          style={{ '--progress-foreground': CORES_ABC[classe] }}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top10" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Fornecedores por Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top10.map((fornecedor, idx) => (
                  <div key={fornecedor.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: CORES_ABC[fornecedor.classificacao] }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{fornecedor.nome}</p>
                      <p className="text-sm text-gray-500">{fornecedor.tipoServico} • {fornecedor.quantidadeCompras} compras</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R$ {(fornecedor.valorTotal / 1000).toFixed(0)}k</p>
                      <p className="text-sm text-gray-500">{fornecedor.percentualIndividual.toFixed(1)}% do total</p>
                    </div>
                    <Badge style={{ backgroundColor: CORES_ABC[fornecedor.classificacao] }}>
                      {fornecedor.classificacao}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhado" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Listagem Completa</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Classe</TableHead>
                    <TableHead className="text-center">Compras</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-center">% Individual</TableHead>
                    <TableHead className="text-center">% Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedoresComClassificacao.slice(0, 50).map((fornecedor, idx) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-bold">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.tipoServico}</TableCell>
                      <TableCell className="text-center">
                        <Badge style={{ backgroundColor: CORES_ABC[fornecedor.classificacao], color: 'white' }}>
                          {fornecedor.classificacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{fornecedor.quantidadeCompras}</TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {fornecedor.valorTotal.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {fornecedor.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-center">{fornecedor.percentualIndividual.toFixed(2)}%</TableCell>
                      <TableCell className="text-center">
                        <Progress value={fornecedor.percentualAcumulado} className="h-2 w-16 mx-auto" />
                        <span className="text-xs">{fornecedor.percentualAcumulado.toFixed(1)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {fornecedoresComClassificacao.length > 50 && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  Mostrando 50 de {fornecedoresComClassificacao.length} fornecedores
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}