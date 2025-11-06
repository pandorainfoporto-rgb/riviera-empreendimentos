import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Users, CheckCircle2, TrendingUp, Award, DollarSign, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioConversoesImobiliarias() {
  const [periodoMeses, setPeriodoMeses] = useState(6);
  const [imobiliariaSelecionada, setImobiliariaSelecionada] = useState('todas');

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_prevenda'],
    queryFn: () => base44.entities.LeadPreVenda.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  // Filtrar leads por período
  const dataInicio = subMonths(new Date(), periodoMeses);
  const leadsFiltrados = leads.filter(lead => {
    const createdDate = new Date(lead.created_date);
    const matchPeriodo = createdDate >= dataInicio;
    const matchImobiliaria = imobiliariaSelecionada === 'todas' || lead.imobiliaria_id === imobiliariaSelecionada;
    return matchPeriodo && matchImobiliaria;
  });

  // Estatísticas gerais
  const totalLeads = leadsFiltrados.length;
  const leadsConvertidos = leadsFiltrados.filter(l => l.status === 'convertido').length;
  const leadsAprovados = leadsFiltrados.filter(l => l.status === 'aprovado').length;
  const leadsRejeitados = leadsFiltrados.filter(l => l.status === 'rejeitado').length;
  const taxaConversao = totalLeads > 0 ? ((leadsConvertidos / totalLeads) * 100).toFixed(1) : 0;
  const taxaAprovacao = totalLeads > 0 ? (((leadsConvertidos + leadsAprovados) / totalLeads) * 100).toFixed(1) : 0;

  // Valor estimado de conversões
  const valorTotalConversoes = leadsFiltrados
    .filter(l => l.status === 'convertido' && l.unidade_id)
    .reduce((sum, lead) => {
      const unidade = unidades.find(u => u.id === lead.unidade_id);
      return sum + (unidade?.valor_venda || 0);
    }, 0);

  // Dados por imobiliária
  const dadosPorImobiliaria = imobiliarias.map(imob => {
    const leadsImob = leadsFiltrados.filter(l => l.imobiliaria_id === imob.id);
    const convertidosImob = leadsImob.filter(l => l.status === 'convertido').length;
    const aprovadosImob = leadsImob.filter(l => l.status === 'aprovado').length;
    const rejeitadosImob = leadsImob.filter(l => l.status === 'rejeitado').length;
    
    return {
      nome: imob.nome,
      total: leadsImob.length,
      convertidos: convertidosImob,
      aprovados: aprovadosImob,
      rejeitados: rejeitadosImob,
      taxa_conversao: leadsImob.length > 0 ? ((convertidosImob / leadsImob.length) * 100).toFixed(1) : 0,
    };
  }).filter(d => d.total > 0).sort((a, b) => b.convertidos - a.convertidos);

  // Dados por status (para gráfico de pizza)
  const dadosPorStatus = [
    { name: 'Convertidos', value: leadsConvertidos, color: '#8b5cf6' },
    { name: 'Aprovados', value: leadsAprovados, color: '#10b981' },
    { name: 'Em Análise', value: leadsFiltrados.filter(l => l.status === 'em_analise').length, color: '#f59e0b' },
    { name: 'Novos', value: leadsFiltrados.filter(l => l.status === 'novo').length, color: '#3b82f6' },
    { name: 'Rejeitados', value: leadsRejeitados, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Evolução mensal
  const meses = [];
  for (let i = periodoMeses - 1; i >= 0; i--) {
    meses.push(subMonths(new Date(), i));
  }

  const evolucaoMensal = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);
    
    const leadsMes = leadsFiltrados.filter(lead => {
      const createdDate = new Date(lead.created_date);
      return createdDate >= inicioMes && createdDate <= fimMes;
    });
    
    return {
      mes: format(mes, "MMM/yy", { locale: ptBR }),
      total: leadsMes.length,
      convertidos: leadsMes.filter(l => l.status === 'convertido').length,
      aprovados: leadsMes.filter(l => l.status === 'aprovado').length,
    };
  });

  const handleExportar = () => {
    const csv = [
      ['Imobiliária', 'Total Leads', 'Convertidos', 'Aprovados', 'Rejeitados', 'Taxa Conversão (%)'].join(','),
      ...dadosPorImobiliaria.map(d => 
        [d.nome, d.total, d.convertidos, d.aprovados, d.rejeitados, d.taxa_conversao].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_conversoes_imobiliarias_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Conversões - Imobiliárias</h1>
          <p className="text-gray-600 mt-1">Análise de performance das imobiliárias parceiras</p>
        </div>
        <Button onClick={handleExportar} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={periodoMeses.toString()} onValueChange={(val) => setPeriodoMeses(parseInt(val))}>
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
            <div className="flex-1">
              <Select value={imobiliariaSelecionada} onValueChange={setImobiliariaSelecionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Imobiliárias</SelectItem>
                  {imobiliarias.map(imob => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-xs text-gray-600">Total de Leads</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{leadsConvertidos}</p>
              <p className="text-xs text-gray-600">Convertidos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{leadsAprovados}</p>
              <p className="text-xs text-gray-600">Aprovados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-700">{taxaConversao}%</p>
              <p className="text-xs text-gray-600">Taxa Conversão</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-cyan-500">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-6 h-6 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold text-cyan-700">{taxaAprovacao}%</p>
              <p className="text-xs text-gray-600">Taxa Aprovação</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-[var(--wine-600)]" />
              </div>
              <p className="text-lg font-bold text-[var(--wine-700)]">
                {(valorTotalConversoes / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-600">Valor Conversões</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="convertidos" fill="#8b5cf6" name="Convertidos" radius={[8, 8, 0, 0]} />
                <Bar dataKey="aprovados" fill="#10b981" name="Aprovados" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
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
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela por Imobiliária */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Imobiliária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Imobiliária</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Convertidos</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Aprovados</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Rejeitados</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Taxa Conversão</th>
                </tr>
              </thead>
              <tbody>
                {dadosPorImobiliaria.map((imob, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{imob.nome}</span>
                      </div>
                    </td>
                    <td className="text-center p-3 font-semibold">{imob.total}</td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {imob.convertidos}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {imob.aprovados}
                      </span>
                    </td>
                    <td className="text-center p-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {imob.rejeitados}
                      </span>
                    </td>
                    <td className="text-center p-3 font-bold text-lg text-[var(--wine-700)]">
                      {imob.taxa_conversao}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {dadosPorImobiliaria.length === 0 && (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}