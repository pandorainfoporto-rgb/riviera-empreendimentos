import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Building2, Calendar,
  Download, Filter, ArrowUpRight, ArrowDownRight, Target, Wallet
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import LayoutSocio from "../components/LayoutSocio";

const COLORS = ['#922B3E', '#7D5999', '#4A90A4', '#48BB78', '#ED8936', '#E53E3E', '#3182CE', '#805AD5'];

export default function PortalSocioRelatoriosFinanceiros() {
  const [periodo, setPeriodo] = useState("12");
  const [tipoInvestimento, setTipoInvestimento] = useState("todos");
  const [tabAtiva, setTabAtiva] = useState("rentabilidade");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: aportes = [] } = useQuery({
    queryKey: ['meus_aportes', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return [];
      return await base44.entities.AporteSocio.filter({ socio_id: user.socio_id }, '-data_vencimento');
    },
    enabled: !!user?.socio_id,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
  });

  const mesesPeriodo = parseInt(periodo);

  // Dados de Rentabilidade Histórica
  const dadosRentabilidade = [];
  let totalInvestido = 0;
  let valorAtual = 0;

  for (let i = mesesPeriodo - 1; i >= 0; i--) {
    const mesData = subMonths(new Date(), i);
    const mesLabel = format(mesData, 'MMM/yy', { locale: ptBR });
    const inicio = startOfMonth(mesData).toISOString().split('T')[0];
    const fim = endOfMonth(mesData).toISOString().split('T')[0];

    const receitasMes = pagamentosClientes
      .filter(p => p.status === 'pago' && p.data_pagamento >= inicio && p.data_pagamento <= fim)
      .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

    const despesasMes = pagamentosFornecedores
      .filter(p => p.status === 'pago' && p.data_pagamento >= inicio && p.data_pagamento <= fim)
      .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

    const aportesDoMes = aportes
      .filter(a => a.status === 'pago' && a.data_pagamento >= inicio && a.data_pagamento <= fim)
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    totalInvestido += aportesDoMes;
    valorAtual += (receitasMes - despesasMes);

    const rentabilidadeMes = totalInvestido > 0 
      ? ((valorAtual / totalInvestido) * 100).toFixed(2) 
      : 0;

    dadosRentabilidade.push({
      mes: mesLabel,
      receitas: receitasMes,
      despesas: despesasMes,
      lucro: receitasMes - despesasMes,
      rentabilidade: parseFloat(rentabilidadeMes),
      investido: totalInvestido,
    });
  }

  // Fluxo de Caixa por Empreendimento
  const fluxoPorEmpreendimento = loteamentos.map(lot => {
    const unidadesLot = unidades.filter(u => u.loteamento_id === lot.id);
    const unidadeIds = unidadesLot.map(u => u.id);

    const receitas = pagamentosClientes
      .filter(p => p.status === 'pago' && unidadeIds.includes(p.unidade_id))
      .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

    const despesas = pagamentosFornecedores
      .filter(p => p.status === 'pago' && unidadeIds.includes(p.unidade_id))
      .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

    return {
      nome: lot.nome,
      receitas,
      despesas,
      lucro: receitas - despesas,
      unidadesVendidas: unidadesLot.filter(u => u.status === 'vendida').length,
      totalUnidades: unidadesLot.length,
    };
  });

  // Projeções Futuras (próximos 6 meses)
  const projecoesFuturas = [];
  const mediaReceitaMensal = dadosRentabilidade.length > 0
    ? dadosRentabilidade.reduce((sum, d) => sum + d.receitas, 0) / dadosRentabilidade.length
    : 0;
  const mediaDespesaMensal = dadosRentabilidade.length > 0
    ? dadosRentabilidade.reduce((sum, d) => sum + d.despesas, 0) / dadosRentabilidade.length
    : 0;

  for (let i = 1; i <= 6; i++) {
    const mesData = addMonths(new Date(), i);
    
    // Aportes previstos
    const aportesPrevistosValues = aportes
      .filter(a => {
        const dataVenc = new Date(a.data_vencimento);
        return dataVenc.getMonth() === mesData.getMonth() && 
               dataVenc.getFullYear() === mesData.getFullYear() &&
               a.status === 'pendente';
      })
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    projecoesFuturas.push({
      mes: format(mesData, 'MMM/yy', { locale: ptBR }),
      receitaProjetada: mediaReceitaMensal * (1 + (i * 0.02)), // Crescimento 2% ao mês
      despesaProjetada: mediaDespesaMensal * (1 + (i * 0.01)), // Crescimento 1% ao mês
      lucroProjetado: (mediaReceitaMensal * (1 + (i * 0.02))) - (mediaDespesaMensal * (1 + (i * 0.01))),
      aportesPendentes: aportesPrevistosValues,
    });
  }

  // Indicadores chave
  const totalInvestidoGeral = aportes.filter(a => a.status === 'pago').reduce((sum, a) => sum + (a.valor || 0), 0);
  const receitaTotal = pagamentosClientes.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);
  const despesaTotal = pagamentosFornecedores.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);
  const lucroTotal = receitaTotal - despesaTotal;
  const rentabilidadeGeral = totalInvestidoGeral > 0 ? ((lucroTotal / totalInvestidoGeral) * 100) : 0;

  // Distribuição por Tipo de Investimento
  const distribuicaoInvestimentos = [
    { name: 'Loteamentos', value: loteamentos.filter(l => l.status !== 'cancelado').length * 500000 },
    { name: 'Construções', value: unidades.filter(u => u.status === 'em_construcao').length * 300000 },
    { name: 'Vendas', value: unidades.filter(u => u.status === 'vendida').length * 200000 },
    { name: 'Outros', value: 100000 },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatórios Financeiros</h1>
            <p className="text-gray-600 mt-1">Análise detalhada do desempenho financeiro dos investimentos</p>
          </div>
          <Button 
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Período de Análise</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Últimos 3 meses</SelectItem>
                    <SelectItem value="6">Últimos 6 meses</SelectItem>
                    <SelectItem value="12">Últimos 12 meses</SelectItem>
                    <SelectItem value="24">Últimos 24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Investimento</Label>
                <Select value={tipoInvestimento} onValueChange={setTipoInvestimento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Investimentos</SelectItem>
                    <SelectItem value="loteamentos">Loteamentos</SelectItem>
                    <SelectItem value="construcoes">Construções</SelectItem>
                    <SelectItem value="vendas">Vendas de Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full gap-2">
                  <Filter className="w-4 h-4" />
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Investido</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(totalInvestidoGeral)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lucro Acumulado</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(lucroTotal)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rentabilidade</p>
                  <p className="text-xl font-bold text-purple-600">
                    {rentabilidadeGeral.toFixed(2)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loteamentos</p>
                  <p className="text-xl font-bold text-orange-600">
                    {loteamentos.length}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Relatórios */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rentabilidade">Rentabilidade</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="projecoes">Projeções</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
          </TabsList>

          {/* Rentabilidade Histórica */}
          <TabsContent value="rentabilidade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--wine-600)]" />
                  Evolução da Rentabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={dadosRentabilidade}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'rentabilidade') return [`${value}%`, 'Rentabilidade'];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="receitas" name="Receitas" fill="#48BB78" />
                    <Bar yAxisId="left" dataKey="despesas" name="Despesas" fill="#E53E3E" />
                    <Line yAxisId="right" type="monotone" dataKey="rentabilidade" name="Rentabilidade %" stroke="#922B3E" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lucro Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dadosRentabilidade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="lucro" 
                        name="Lucro"
                        stroke="#7D5999" 
                        fill="#7D5999" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investimento Acumulado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosRentabilidade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="investido" 
                        name="Total Investido"
                        stroke="#922B3E" 
                        strokeWidth={2}
                        dot={{ fill: '#922B3E' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fluxo de Caixa */}
          <TabsContent value="fluxo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--wine-600)]" />
                  Fluxo de Caixa por Loteamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={fluxoPorEmpreendimento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis dataKey="nome" type="category" width={120} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="#48BB78" />
                    <Bar dataKey="despesas" name="Despesas" fill="#E53E3E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {fluxoPorEmpreendimento.map((emp, idx) => (
                <Card key={idx} className={emp.lucro >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">{emp.nome}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Receitas:</span>
                        <span className="text-green-600 font-medium">{formatCurrency(emp.receitas)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Despesas:</span>
                        <span className="text-red-600 font-medium">{formatCurrency(emp.despesas)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Resultado:</span>
                        <span className={`font-bold ${emp.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(emp.lucro)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-2">
                        <span>Unidades Vendidas:</span>
                        <span>{emp.unidadesVendidas}/{emp.totalUnidades}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projeções Futuras */}
          <TabsContent value="projecoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--wine-600)]" />
                  Projeção para os Próximos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={projecoesFuturas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="receitaProjetada" 
                      name="Receita Projetada"
                      stroke="#48BB78" 
                      fill="#48BB78" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="despesaProjetada" 
                      name="Despesa Projetada"
                      stroke="#E53E3E" 
                      fill="#E53E3E" 
                      fillOpacity={0.3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucroProjetado" 
                      name="Lucro Projetado"
                      stroke="#922B3E" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aportes Previstos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-6 gap-4">
                  {projecoesFuturas.map((proj, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-600">{proj.mes}</p>
                      <p className="text-lg font-bold text-[var(--wine-700)] mt-1">
                        {formatCurrency(proj.aportesPendentes)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">a aportar</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Projeção Otimista</h4>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        {formatCurrency(projecoesFuturas.reduce((sum, p) => sum + p.lucroProjetado, 0) * 1.2)}
                      </p>
                      <p className="text-sm text-green-600 mt-1">Lucro projetado (cenário +20%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <ArrowDownRight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900">Projeção Conservadora</h4>
                      <p className="text-2xl font-bold text-orange-700 mt-1">
                        {formatCurrency(projecoesFuturas.reduce((sum, p) => sum + p.lucroProjetado, 0) * 0.8)}
                      </p>
                      <p className="text-sm text-orange-600 mt-1">Lucro projetado (cenário -20%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribuição */}
          <TabsContent value="distribuicao" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--wine-600)]" />
                    Distribuição por Tipo de Investimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribuicaoInvestimentos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distribuicaoInvestimentos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento dos Investimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {distribuicaoInvestimentos.map((inv, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium">{inv.name}</span>
                        </div>
                        <span className="font-bold text-[var(--wine-700)]">
                          {formatCurrency(inv.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Loteamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fluxoPorEmpreendimento}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="lucro" name="Lucro" fill="#922B3E" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutSocio>
  );
}