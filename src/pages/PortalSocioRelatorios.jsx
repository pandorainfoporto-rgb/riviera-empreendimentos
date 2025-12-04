import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { 
  FileText, Download, TrendingUp, Building2, DollarSign,
  PieChart as PieChartIcon, BarChart2, Calendar, Loader2
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import LayoutSocio from "../components/LayoutSocio";

const COLORS = ['#922B3E', '#7D5999', '#4A90A4', '#48BB78', '#ED8936', '#E53E3E'];

export default function PortalSocioRelatorios() {
  const [periodo, setPeriodo] = useState("6");
  const [tipoRelatorio, setTipoRelatorio] = useState("geral");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socio } = useQuery({
    queryKey: ['meu_socio', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      return await base44.entities.Socio.get(user.socio_id);
    },
    enabled: !!user?.socio_id,
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

  // Dados para gráficos
  const mesesPeriodo = parseInt(periodo);
  const dadosAportesMensal = [];
  for (let i = mesesPeriodo - 1; i >= 0; i--) {
    const mesData = subMonths(new Date(), i);
    const inicio = startOfMonth(mesData).toISOString().split('T')[0];
    const fim = endOfMonth(mesData).toISOString().split('T')[0];
    
    const aportesDoMes = aportes.filter(a => 
      a.data_vencimento >= inicio && a.data_vencimento <= fim
    );
    
    const pago = aportesDoMes
      .filter(a => a.status === 'pago')
      .reduce((sum, a) => sum + (a.valor || 0), 0);
    
    const pendente = aportesDoMes
      .filter(a => a.status === 'pendente')
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    dadosAportesMensal.push({
      mes: format(mesData, 'MMM/yy', { locale: ptBR }),
      pago,
      pendente,
    });
  }

  // Dados de vendas por loteamento
  const vendasPorLoteamento = loteamentos.map(lot => {
    const unidadesLot = unidades.filter(u => u.loteamento_id === lot.id);
    const vendidas = unidadesLot.filter(u => u.status === 'vendida').length;
    const total = unidadesLot.length;
    return {
      nome: lot.nome,
      vendidas,
      disponiveis: total - vendidas,
      total,
      percentual: total > 0 ? Math.round((vendidas / total) * 100) : 0
    };
  });

  // Dados de receitas
  const receitasMensal = [];
  for (let i = mesesPeriodo - 1; i >= 0; i--) {
    const mesData = subMonths(new Date(), i);
    const inicio = startOfMonth(mesData).toISOString().split('T')[0];
    const fim = endOfMonth(mesData).toISOString().split('T')[0];
    
    const receitasMes = pagamentosClientes
      .filter(p => p.status === 'pago' && p.data_pagamento >= inicio && p.data_pagamento <= fim)
      .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

    receitasMensal.push({
      mes: format(mesData, 'MMM/yy', { locale: ptBR }),
      receita: receitasMes,
    });
  }

  // Status das unidades
  const statusUnidades = [
    { name: 'Vendidas', value: unidades.filter(u => u.status === 'vendida').length },
    { name: 'Disponíveis', value: unidades.filter(u => u.status === 'disponivel').length },
    { name: 'Reservadas', value: unidades.filter(u => u.status === 'reservada').length },
    { name: 'Em Construção', value: unidades.filter(u => u.status === 'em_construcao').length },
  ].filter(s => s.value > 0);

  const handleExportarRelatorio = async () => {
    toast.success("Relatório será gerado e enviado por email");
    
    // Registrar log
    try {
      await base44.entities.LogAcessoSocio.create({
        socio_id: user?.socio_id,
        user_id: user?.id,
        nome_socio: socio?.nome,
        email: user?.email,
        acao: 'download_documento',
        descricao: `Exportou relatório: ${tipoRelatorio}`,
        data_hora: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  return (
    <LayoutSocio>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatórios</h1>
            <p className="text-gray-600 mt-1">Acompanhe os indicadores dos empreendimentos</p>
          </div>
          <Button 
            onClick={handleExportarRelatorio}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Últimos 3 meses</SelectItem>
                    <SelectItem value="6">Últimos 6 meses</SelectItem>
                    <SelectItem value="12">Últimos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Relatório</Label>
                <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Visão Geral</SelectItem>
                    <SelectItem value="aportes">Meus Aportes</SelectItem>
                    <SelectItem value="vendas">Vendas</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Aportes Mensais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[var(--wine-600)]" />
                Meus Aportes por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosAportesMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="pago" name="Pago" fill="#48BB78" />
                  <Bar dataKey="pendente" name="Pendente" fill="#ED8936" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status das Unidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[var(--wine-600)]" />
                Status das Unidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusUnidades}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusUnidades.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receitas Mensais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--wine-600)]" />
                Receitas Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={receitasMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    name="Receita" 
                    stroke="#922B3E" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendas por Loteamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--wine-600)]" />
                Vendas por Empreendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendasPorLoteamento} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendidas" name="Vendidas" fill="#922B3E" stackId="a" />
                  <Bar dataKey="disponiveis" name="Disponíveis" fill="#7D5999" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Numérico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Total Aportado</p>
              <p className="text-xl font-bold text-green-600">
                R$ {aportes.filter(a => a.status === 'pago').reduce((sum, a) => sum + (a.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Unidades Vendidas</p>
              <p className="text-xl font-bold text-blue-600">
                {unidades.filter(u => u.status === 'vendida').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-xl font-bold text-purple-600">
                R$ {pagamentosClientes.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-sm text-gray-600">Empreendimentos</p>
              <p className="text-xl font-bold text-orange-600">
                {loteamentos.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutSocio>
  );
}