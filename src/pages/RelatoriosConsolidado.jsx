
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Home, HardHat, Calendar, 
  Download, Filter, RefreshCw, AlertCircle, CheckCircle2, BarChart3
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const CORES_GRAFICO = ['#922B3E', '#7D5999', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function RelatoriosConsolidado() {
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");
  const [dataInicio, setDataInicio] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_obra'],
    queryFn: () => base44.entities.CustoObra.list(),
    initialData: [],
  });

  const { data: cronogramasObra = [] } = useQuery({
    queryKey: ['cronogramas_obra'],
    queryFn: () => base44.entities.CronogramaObra.list(),
    initialData: [],
  });

  const { data: cronogramasFinanceiro = [] } = useQuery({
    queryKey: ['cronogramas_financeiro'],
    queryFn: () => base44.entities.CronogramaFinanceiro.list(),
    initialData: [],
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list('-data_movimentacao', 500),
    initialData: [],
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentos_clientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
    initialData: [],
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes'],
    queryFn: () => base44.entities.Negociacao.list(),
    initialData: [],
  });

  // Filtrar dados
  const unidadesFiltradas = loteamentoFilter === "todos" 
    ? unidades 
    : unidades.filter(u => u.loteamento_id === loteamentoFilter);

  const unidadeIds = unidadesFiltradas.map(u => u.id);

  // 1. CUSTO vs ORÇAMENTO
  const dadosCustoOrcamento = unidadesFiltradas.map(unidade => {
    const custo = custosObra.find(c => c.unidade_id === unidade.id);
    const cronFinanceiros = cronogramasFinanceiro.filter(cf => cf.unidade_id === unidade.id);
    
    const totalOrcado = cronFinanceiros.reduce((sum, cf) => sum + (cf.custo_planejado || 0), 0);
    const totalRealizado = cronFinanceiros.reduce((sum, cf) => sum + (cf.custo_real || 0), 0);
    const totalEstimado = custo?.valor_total_estimado || 0;

    return {
      codigo: unidade.codigo,
      orcado: totalOrcado,
      realizado: totalRealizado,
      estimado: totalEstimado,
      variacao: totalRealizado - totalOrcado,
    };
  }).filter(d => d.orcado > 0 || d.realizado > 0 || d.estimado > 0);

  // 2. VENDAS E RECEITAS
  const unidadesPorStatus = {
    disponivel: unidadesFiltradas.filter(u => u.status === 'disponivel').length,
    reservada: unidadesFiltradas.filter(u => u.status === 'reservada').length,
    vendida: unidadesFiltradas.filter(u => u.status === 'vendida').length,
    escriturada: unidadesFiltradas.filter(u => u.status === 'escriturada').length,
    em_construcao: unidadesFiltradas.filter(u => u.status === 'em_construcao').length,
  };

  const dadosVendas = [
    { nome: 'Disponível', valor: unidadesPorStatus.disponivel, cor: CORES_GRAFICO[3] },
    { nome: 'Reservada', valor: unidadesPorStatus.reservada, cor: CORES_GRAFICO[4] },
    { nome: 'Vendida', valor: unidadesPorStatus.vendida, cor: CORES_GRAFICO[2] },
    { nome: 'Escriturada', valor: unidadesPorStatus.escriturada, cor: CORES_GRAFICO[6] },
    { nome: 'Em Construção', valor: unidadesPorStatus.em_construcao, cor: CORES_GRAFICO[4] },
  ];

  const totalReceitas = unidadesFiltradas.reduce((sum, u) => sum + (u.valor_venda || 0), 0);
  const totalCustos = unidadesFiltradas.reduce((sum, u) => sum + (u.valor_custo || 0), 0);
  const margemTotal = totalReceitas - totalCustos;

  // 3. PROGRESSO DAS OBRAS
  const dadosProgressoObras = unidadesFiltradas.map(unidade => {
    const cronogramas = cronogramasObra.filter(c => c.unidade_id === unidade.id);
    const mediaProgresso = cronogramas.length > 0
      ? cronogramas.reduce((sum, c) => sum + (c.percentual_conclusao || 0), 0) / cronogramas.length
      : 0;

    const totalEtapas = cronogramas.length;
    const etapasConcluidas = cronogramas.filter(c => c.status === 'concluida').length;
    const etapasAtrasadas = cronogramas.filter(c => c.status === 'atrasada').length;

    return {
      codigo: unidade.codigo,
      progresso: Math.round(mediaProgresso),
      totalEtapas,
      concluidas: etapasConcluidas,
      atrasadas: etapasAtrasadas,
      status: etapasAtrasadas > 0 ? 'atrasada' : mediaProgresso >= 100 ? 'concluida' : 'em_andamento',
    };
  }).filter(d => d.totalEtapas > 0);

  // 4. FLUXO DE CAIXA
  const meses = eachMonthOfInterval({
    start: parseISO(dataInicio),
    end: parseISO(dataFim)
  });

  const dadosFluxoCaixa = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const entradas = movimentacoes
      .filter(m => {
        if (m.tipo !== 'entrada') return false;
        const data = parseISO(m.data_movimentacao);
        return data >= inicioMes && data <= fimMes;
      })
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    const saidas = movimentacoes
      .filter(m => {
        if (m.tipo !== 'saida') return false;
        const data = parseISO(m.data_movimentacao);
        return data >= inicioMes && data <= fimMes;
      })
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    return {
      mes: format(mes, "MMM/yy", { locale: ptBR }),
      entradas: entradas / 1000,
      saidas: saidas / 1000,
      saldo: (entradas - saidas) / 1000,
    };
  });

  // 5. RECEITAS POR UNIDADE
  const receitasPorUnidade = unidadesFiltradas
    .map(unidade => {
      const pagamentos = pagamentosClientes.filter(p => p.unidade_id === unidade.id && p.status === 'pago');
      const totalRecebido = pagamentos.reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);
      const negociacao = negociacoes.find(n => n.unidade_id === unidade.id);

      return {
        codigo: unidade.codigo,
        valorVenda: unidade.valor_venda || 0,
        recebido: totalRecebido,
        aReceber: (unidade.valor_venda || 0) - totalRecebido,
        percentualRecebido: unidade.valor_venda > 0 ? (totalRecebido / unidade.valor_venda) * 100 : 0,
      };
    })
    .filter(d => d.valorVenda > 0)
    .sort((a, b) => b.recebido - a.recebido)
    .slice(0, 10);

  // Estatísticas Gerais
  const totalUnidades = unidadesFiltradas.length;
  const unidadesVendidas = unidadesPorStatus.vendida + unidadesPorStatus.escriturada;
  const taxaVenda = totalUnidades > 0 ? (unidadesVendidas / totalUnidades) * 100 : 0;
  const obrasAndamento = dadosProgressoObras.filter(d => d.status === 'em_andamento').length;
  const obrasAtrasadas = dadosProgressoObras.filter(d => d.status === 'atrasada').length;

  const exportarPDF = () => {
    // This is placeholder toast.info, make sure 'toast' is defined or imported if used
    console.log('Exportação de PDF em desenvolvimento');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatórios Consolidados</h1>
          <p className="text-gray-600 mt-1">Visão analítica completa dos projetos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportarPDF} className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Loteamento
              </Label>
              <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-blue-600">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total de Unidades</p>
                <p className="text-3xl font-bold text-blue-700">{totalUnidades}</p>
                <p className="text-xs text-gray-500 mt-1">{unidadesVendidas} vendidas ({taxaVenda.toFixed(1)}%)</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Receita Total</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(totalReceitas / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500 mt-1">Margem: R$ {(margemTotal / 1000).toFixed(0)}k</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Obras em Andamento</p>
                <p className="text-3xl font-bold text-orange-700">{obrasAndamento}</p>
                <p className="text-xs text-gray-500 mt-1">{obrasAtrasadas} atrasadas</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <HardHat className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Custo Médio/m²</p>
                <p className="text-2xl font-bold text-purple-700">
                  R$ {custosObra.length > 0 
                    ? (custosObra.reduce((sum, c) => sum + (c.valor_m2 || 0), 0) / custosObra.length).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{custosObra.length} orçamentos</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS COM RELATÓRIOS */}
      <Tabs defaultValue="custo_orcamento" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100">
          <TabsTrigger value="custo_orcamento">💰 Custo vs Orçamento</TabsTrigger>
          <TabsTrigger value="vendas">📊 Vendas</TabsTrigger>
          <TabsTrigger value="obras">🏗️ Obras</TabsTrigger>
          <TabsTrigger value="fluxo_caixa">💵 Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="receitas">📈 Receitas</TabsTrigger>
        </TabsList>

        {/* 1. CUSTO vs ORÇAMENTO */}
        <TabsContent value="custo_orcamento" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análise: Custo Realizado vs Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosCustoOrcamento.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosCustoOrcamento}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="codigo" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Bar dataKey="estimado" fill="#3b82f6" name="Estimado Inicial" />
                    <Bar dataKey="orcado" fill="#f59e0b" name="Orçado (BCWS)" />
                    <Bar dataKey="realizado" fill="#ef4444" name="Realizado (ACWP)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum dado de custo disponível para o filtro selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {dadosCustoOrcamento.map(item => (
              <Card key={item.codigo} className={`shadow-lg ${item.variacao > 0 ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
                <CardContent className="p-4">
                  <h4 className="font-bold text-gray-900 mb-3">{item.codigo}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orçado:</span>
                      <span className="font-semibold text-orange-700">R$ {item.orcado.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Realizado:</span>
                      <span className="font-semibold text-red-700">R$ {item.realizado.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className={`flex justify-between pt-2 border-t ${item.variacao > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <span className="font-medium">Variação:</span>
                      <span className="font-bold flex items-center gap-1">
                        {item.variacao > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        R$ {Math.abs(item.variacao).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 2. VENDAS */}
        <TabsContent value="vendas" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status das Unidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosVendas}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nome, valor }) => `${nome}: ${valor}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="valor"
                    >
                      {dadosVendas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Financeira</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Receitas</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Custos</p>
                  <p className="text-2xl font-bold text-red-700">
                    R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${margemTotal >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Margem Total</p>
                  <p className={`text-2xl font-bold ${margemTotal >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    R$ {margemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {totalCustos > 0 ? ((margemTotal / totalCustos) * 100).toFixed(1) : 0}% sobre custo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. PROGRESSO DAS OBRAS */}
        <TabsContent value="obras" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="w-5 h-5" />
                Progresso das Obras vs Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosProgressoObras.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosProgressoObras}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="codigo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="progresso" fill="#10b981" name="% Conclusão" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <HardHat className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum cronograma de obra disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {dadosProgressoObras.map(obra => (
              <Card key={obra.codigo} className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">{obra.codigo}</h4>
                    {obra.status === 'atrasada' ? (
                      <Badge className="bg-red-100 text-red-800">Atrasada</Badge>
                    ) : obra.status === 'concluida' ? (
                      <Badge className="bg-green-100 text-green-800">Concluída</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progresso:</span>
                      <span className="font-semibold">{obra.progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${obra.status === 'atrasada' ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${obra.progresso}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 pt-2">
                      <span>✅ {obra.concluidas}/{obra.totalEtapas} etapas</span>
                      {obra.atrasadas > 0 && (
                        <span className="text-red-600">⚠️ {obra.atrasadas} atrasadas</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. FLUXO DE CAIXA */}
        <TabsContent value="fluxo_caixa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Projeção de Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dadosFluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${(value * 1000).toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas (mil)" />
                  <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas (mil)" />
                  <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={3} name="Saldo (mil)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. RECEITAS POR UNIDADE */}
        <TabsContent value="receitas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Receitas por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {receitasPorUnidade.map((item, index) => (
                  <div key={item.codigo} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <h4 className="font-bold text-gray-900">{item.codigo}</h4>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {item.percentualRecebido.toFixed(1)}% recebido
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Valor Venda</p>
                        <p className="font-semibold text-blue-700">
                          R$ {item.valorVenda.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Recebido</p>
                        <p className="font-semibold text-green-700">
                          R$ {item.recebido.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">A Receber</p>
                        <p className="font-semibold text-orange-700">
                          R$ {item.aReceber.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                          style={{ width: `${item.percentualRecebido}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
