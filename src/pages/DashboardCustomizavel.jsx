import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings, TrendingUp, TrendingDown, DollarSign, Users, Building2,
  FileText, Receipt, Package, Calendar, Wallet, Target, PieChart,
  BarChart3, Activity, AlertCircle, CheckCircle2, Clock, Briefcase,
  Star, RefreshCw, LayoutDashboard
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const WIDGETS_DISPONIVEIS = [
  // Financeiro
  { id: 'saldo_caixas', nome: 'Saldo de Caixas', categoria: 'financeiro', icon: Wallet },
  { id: 'receitas_mes', nome: 'Receitas do Mês', categoria: 'financeiro', icon: TrendingUp },
  { id: 'despesas_mes', nome: 'Despesas do Mês', categoria: 'financeiro', icon: TrendingDown },
  { id: 'lucro_mes', nome: 'Lucro do Mês', categoria: 'financeiro', icon: DollarSign },
  { id: 'contas_receber', nome: 'Contas a Receber', categoria: 'financeiro', icon: Receipt },
  { id: 'contas_pagar', nome: 'Contas a Pagar', categoria: 'financeiro', icon: Briefcase },
  
  // Vendas
  { id: 'vendas_mes', nome: 'Vendas do Mês', categoria: 'vendas', icon: FileText },
  { id: 'ticket_medio', nome: 'Ticket Médio', categoria: 'vendas', icon: Target },
  { id: 'taxa_conversao', nome: 'Taxa de Conversão', categoria: 'vendas', icon: Activity },
  { id: 'leads_ativos', nome: 'Leads Ativos', categoria: 'vendas', icon: Users },
  
  // Obras
  { id: 'obras_andamento', nome: 'Obras em Andamento', categoria: 'obras', icon: Building2 },
  { id: 'tarefas_atrasadas', nome: 'Tarefas Atrasadas', categoria: 'obras', icon: AlertCircle },
  { id: 'custo_obras', nome: 'Custo Total Obras', categoria: 'obras', icon: DollarSign },
  
  // Gráficos
  { id: 'grafico_vendas', nome: 'Gráfico de Vendas', categoria: 'graficos', icon: BarChart3, tipo: 'grafico' },
  { id: 'grafico_fluxo', nome: 'Fluxo de Caixa', categoria: 'graficos', icon: LineChart, tipo: 'grafico' },
  { id: 'grafico_unidades', nome: 'Status Unidades', categoria: 'graficos', icon: PieChart, tipo: 'grafico' },
];

const CORES = ['#922B3E', '#7D5999', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardCustomizavel() {
  const [showConfig, setShowConfig] = useState(false);
  const [widgetsAtivos, setWidgetsAtivos] = useState([
    'saldo_caixas', 'receitas_mes', 'despesas_mes', 'vendas_mes',
    'grafico_vendas', 'grafico_fluxo'
  ]);
  const queryClient = useQueryClient();

  // Buscar preferências do usuário
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Carregar preferências salvas
  useEffect(() => {
    if (user?.dashboard_widgets) {
      setWidgetsAtivos(user.dashboard_widgets);
    }
  }, [user]);

  // Dados
  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas_dash'],
    queryFn: () => base44.entities.Caixa.list(),
    initialData: [],
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes_dash'],
    queryFn: () => base44.entities.Negociacao.list(),
    initialData: [],
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentos_clientes_dash'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
    initialData: [],
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentos_fornecedores_dash'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades_dash'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: cronogramas = [] } = useQuery({
    queryKey: ['cronogramas_dash'],
    queryFn: async () => {
      try {
        return await base44.entities.CronogramaObra.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_dash'],
    queryFn: async () => {
      try {
        return await base44.entities.LeadPreVenda.list();
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  // Cálculos
  const mesAtual = new Date();
  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);

  const saldoTotal = caixas.reduce((sum, c) => sum + (c.saldo_atual || c.saldo_inicial || 0), 0);

  const receitasMes = pagamentosClientes
    .filter(p => p.status === 'pago' && new Date(p.data_pagamento) >= inicioMes && new Date(p.data_pagamento) <= fimMes)
    .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

  const despesasMes = pagamentosFornecedores
    .filter(p => p.status === 'pago' && new Date(p.data_pagamento) >= inicioMes && new Date(p.data_pagamento) <= fimMes)
    .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

  const lucroMes = receitasMes - despesasMes;

  const vendasMes = negociacoes.filter(n => 
    new Date(n.created_date) >= inicioMes && 
    new Date(n.created_date) <= fimMes &&
    ['contrato_assinado', 'finalizada'].includes(n.status)
  );

  const ticketMedio = vendasMes.length > 0 
    ? vendasMes.reduce((sum, v) => sum + (v.valor_total || 0), 0) / vendasMes.length 
    : 0;

  const contasReceber = pagamentosClientes
    .filter(p => ['pendente', 'atrasado'].includes(p.status))
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const contasPagar = pagamentosFornecedores
    .filter(p => ['pendente', 'atrasado'].includes(p.status))
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const obrasAndamento = unidades.filter(u => u.status === 'em_construcao').length;
  const tarefasAtrasadas = cronogramas.filter(c => c.status === 'atrasada').length;
  const leadsAtivos = leads.filter(l => !['convertido', 'perdido'].includes(l.status)).length;

  const taxaConversao = leads.length > 0 
    ? (leads.filter(l => l.status === 'convertido').length / leads.length) * 100 
    : 0;

  // Dados para gráficos
  const dadosVendasMensal = [];
  for (let i = 5; i >= 0; i--) {
    const mesRef = subMonths(new Date(), i);
    const inicioMesRef = startOfMonth(mesRef);
    const fimMesRef = endOfMonth(mesRef);
    
    const vendasPeriodo = negociacoes.filter(n => {
      const data = new Date(n.created_date);
      return data >= inicioMesRef && data <= fimMesRef && ['contrato_assinado', 'finalizada'].includes(n.status);
    });

    dadosVendasMensal.push({
      mes: format(mesRef, 'MMM', { locale: ptBR }),
      vendas: vendasPeriodo.length,
      valor: vendasPeriodo.reduce((sum, v) => sum + (v.valor_total || 0), 0) / 1000,
    });
  }

  const dadosFluxo = [];
  for (let i = 5; i >= 0; i--) {
    const mesRef = subMonths(new Date(), i);
    const inicioMesRef = startOfMonth(mesRef);
    const fimMesRef = endOfMonth(mesRef);
    
    const receitasPeriodo = pagamentosClientes
      .filter(p => p.status === 'pago' && new Date(p.data_pagamento) >= inicioMesRef && new Date(p.data_pagamento) <= fimMesRef)
      .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

    const despesasPeriodo = pagamentosFornecedores
      .filter(p => p.status === 'pago' && new Date(p.data_pagamento) >= inicioMesRef && new Date(p.data_pagamento) <= fimMesRef)
      .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

    dadosFluxo.push({
      mes: format(mesRef, 'MMM', { locale: ptBR }),
      receitas: receitasPeriodo / 1000,
      despesas: despesasPeriodo / 1000,
    });
  }

  const dadosUnidades = [
    { name: 'Disponível', value: unidades.filter(u => u.status === 'disponivel').length, color: '#10b981' },
    { name: 'Reservada', value: unidades.filter(u => u.status === 'reservada').length, color: '#f59e0b' },
    { name: 'Vendida', value: unidades.filter(u => u.status === 'vendida').length, color: '#3b82f6' },
    { name: 'Em Construção', value: unidades.filter(u => u.status === 'em_construcao').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Salvar preferências
  const salvarPreferencias = async () => {
    try {
      await base44.auth.updateMe({ dashboard_widgets: widgetsAtivos });
      toast.success('Preferências salvas!');
      setShowConfig(false);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error) {
      toast.error('Erro ao salvar preferências');
    }
  };

  const toggleWidget = (widgetId) => {
    setWidgetsAtivos(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  // Renderizar widget
  const renderWidget = (widgetId) => {
    const widget = WIDGETS_DISPONIVEIS.find(w => w.id === widgetId);
    if (!widget) return null;

    const Icon = widget.icon;

    // Widgets de card simples
    const cardWidgets = {
      saldo_caixas: { valor: saldoTotal, formato: 'moeda', cor: 'blue' },
      receitas_mes: { valor: receitasMes, formato: 'moeda', cor: 'green' },
      despesas_mes: { valor: despesasMes, formato: 'moeda', cor: 'red' },
      lucro_mes: { valor: lucroMes, formato: 'moeda', cor: lucroMes >= 0 ? 'blue' : 'red' },
      vendas_mes: { valor: vendasMes.length, formato: 'numero', cor: 'purple' },
      ticket_medio: { valor: ticketMedio, formato: 'moeda', cor: 'indigo' },
      taxa_conversao: { valor: taxaConversao, formato: 'percentual', cor: 'orange' },
      leads_ativos: { valor: leadsAtivos, formato: 'numero', cor: 'pink' },
      contas_receber: { valor: contasReceber, formato: 'moeda', cor: 'green' },
      contas_pagar: { valor: contasPagar, formato: 'moeda', cor: 'red' },
      obras_andamento: { valor: obrasAndamento, formato: 'numero', cor: 'purple' },
      tarefas_atrasadas: { valor: tarefasAtrasadas, formato: 'numero', cor: 'red' },
    };

    if (cardWidgets[widgetId]) {
      const config = cardWidgets[widgetId];
      let valorFormatado = config.valor;
      
      if (config.formato === 'moeda') {
        valorFormatado = `R$ ${(config.valor / 1000).toFixed(0)}k`;
      } else if (config.formato === 'percentual') {
        valorFormatado = `${config.valor.toFixed(1)}%`;
      }

      return (
        <Card key={widgetId} className={`border-l-4 border-${config.cor}-500`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{widget.nome}</p>
                <p className={`text-2xl font-bold text-${config.cor}-600`}>{valorFormatado}</p>
              </div>
              <Icon className={`w-8 h-8 text-${config.cor}-300`} />
            </div>
          </CardContent>
        </Card>
      );
    }

    // Widgets de gráfico
    if (widgetId === 'grafico_vendas') {
      return (
        <Card key={widgetId} className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vendas - Últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosVendasMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" orientation="left" stroke="#922B3E" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="vendas" fill="#922B3E" name="Vendas" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor (R$ mil)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }

    if (widgetId === 'grafico_fluxo') {
      return (
        <Card key={widgetId} className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Fluxo de Caixa - Últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dadosFluxo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value}k`} />
                <Area type="monotone" dataKey="receitas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Receitas" />
                <Area type="monotone" dataKey="despesas" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }

    if (widgetId === 'grafico_unidades') {
      return (
        <Card key={widgetId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Status das Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={dadosUnidades}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {dadosUnidades.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {dadosUnidades.map((item) => (
                <Badge key={item.name} style={{ backgroundColor: item.color }} className="text-white">
                  {item.name}: {item.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const widgetsCards = widgetsAtivos.filter(id => !WIDGETS_DISPONIVEIS.find(w => w.id === id)?.tipo);
  const widgetsGraficos = widgetsAtivos.filter(id => WIDGETS_DISPONIVEIS.find(w => w.id === id)?.tipo === 'grafico');

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">
            Dashboard Customizável
          </h1>
          <p className="text-gray-600 mt-1">Personalize os indicadores exibidos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  Configurar Dashboard
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="financeiro" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                  <TabsTrigger value="vendas">Vendas</TabsTrigger>
                  <TabsTrigger value="obras">Obras</TabsTrigger>
                  <TabsTrigger value="graficos">Gráficos</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px] mt-4">
                  {['financeiro', 'vendas', 'obras', 'graficos'].map(categoria => (
                    <TabsContent key={categoria} value={categoria} className="space-y-3">
                      {WIDGETS_DISPONIVEIS.filter(w => w.categoria === categoria).map(widget => {
                        const Icon = widget.icon;
                        return (
                          <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{widget.nome}</p>
                                <p className="text-xs text-gray-500">{widget.tipo === 'grafico' ? 'Gráfico' : 'Card'}</p>
                              </div>
                            </div>
                            <Switch
                              checked={widgetsAtivos.includes(widget.id)}
                              onCheckedChange={() => toggleWidget(widget.id)}
                            />
                          </div>
                        );
                      })}
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {widgetsAtivos.length} widgets selecionados
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowConfig(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarPreferencias} className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {widgetsAtivos.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutDashboard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-semibold text-gray-600">Nenhum widget selecionado</p>
          <p className="text-gray-500 mt-2">Clique em "Configurar" para adicionar indicadores ao seu dashboard.</p>
        </Card>
      ) : (
        <>
          {/* Cards */}
          {widgetsCards.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {widgetsCards.map(widgetId => renderWidget(widgetId))}
            </div>
          )}

          {/* Gráficos */}
          {widgetsGraficos.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {widgetsGraficos.map(widgetId => renderWidget(widgetId))}
            </div>
          )}
        </>
      )}
    </div>
  );
}