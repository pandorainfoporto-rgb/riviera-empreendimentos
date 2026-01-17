import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Bell, TrendingUp, BarChart2, PieChart as PieChartIcon, 
  FileText, DollarSign, Calendar, Users, Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import moment from "moment";

const COLORS = ['#922B3E', '#7D5999', '#4A90A4', '#48BB78', '#ED8936', '#E53E3E'];

export default function RelatorioNotificacoesSocios() {
  const [periodo, setPeriodo] = useState("30");

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes_relatorio'],
    queryFn: () => base44.entities.NotificacaoSocio.list('-created_date'),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const diasAtras = parseInt(periodo);
  const dataLimite = moment().subtract(diasAtras, 'days').toISOString();
  const notificacoesPeriodo = notificacoes.filter(n => n.created_date >= dataLimite);

  // Estatísticas
  const totalNotificacoes = notificacoesPeriodo.length;
  const notificacoesLidas = notificacoesPeriodo.filter(n => n.lida).length;
  const notificacoesNaoLidas = notificacoesPeriodo.filter(n => !n.lida).length;
  const taxaLeitura = totalNotificacoes > 0 ? Math.round((notificacoesLidas / totalNotificacoes) * 100) : 0;

  // Por tipo
  const notificacoesPorTipo = Object.entries(
    notificacoesPeriodo.reduce((acc, n) => {
      acc[n.tipo] = (acc[n.tipo] || 0) + 1;
      return acc;
    }, {})
  ).map(([tipo, quantidade]) => ({
    nome: tipo === 'documento' ? 'Documentos' :
          tipo === 'assembleia' ? 'Assembleias' :
          tipo === 'financeiro' ? 'Financeiro' :
          tipo === 'venda' ? 'Vendas' : 'Sistema',
    quantidade
  }));

  // Por dia (últimos 14 dias)
  const notificacoesPorDia = [];
  for (let i = 13; i >= 0; i--) {
    const dia = moment().subtract(i, 'days');
    const diaStr = dia.format('YYYY-MM-DD');
    const quantidade = notificacoesPeriodo.filter(n => 
      moment(n.created_date).format('YYYY-MM-DD') === diaStr
    ).length;
    notificacoesPorDia.push({
      dia: dia.format('DD/MM'),
      quantidade
    });
  }

  // Sócios mais engajados
  const sociosEngajamento = socios.map(socio => {
    const notifsSocio = notificacoesPeriodo.filter(n => n.socio_id === socio.id);
    const lidas = notifsSocio.filter(n => n.lida).length;
    return {
      nome: socio.nome,
      total: notifsSocio.length,
      lidas,
      taxa: notifsSocio.length > 0 ? Math.round((lidas / notifsSocio.length) * 100) : 0
    };
  }).filter(s => s.total > 0)
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 10);

  const tipoIcones = {
    documento: FileText,
    assembleia: Calendar,
    financeiro: DollarSign,
    venda: TrendingUp,
    sistema: Bell
  };

  const tipoCores = {
    documento: 'blue',
    assembleia: 'purple',
    financeiro: 'green',
    venda: 'orange',
    sistema: 'gray'
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">Relatório de Notificações - Sócios</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Análise de engajamento e comunicação com sócios</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Enviadas</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{totalNotificacoes}</p>
              </div>
              <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-600 md:bg-blue-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Lidas</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{notificacoesLidas}</p>
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-600 md:bg-green-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Não Lidas</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{notificacoesNaoLidas}</p>
              </div>
              <Bell className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 md:bg-yellow-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Taxa de Leitura</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{taxaLeitura}%</p>
              </div>
              <BarChart2 className="w-6 h-6 md:w-8 md:h-8 text-purple-600 md:bg-purple-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={notificacoesPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {notificacoesPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
              Notificações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={notificacoesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#7D5999" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engajamento por Sócio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
            Engajamento por Sócio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 md:p-3 font-semibold">Sócio</th>
                  <th className="text-center p-2 md:p-3 font-semibold">Total</th>
                  <th className="text-center p-2 md:p-3 font-semibold hidden md:table-cell">Lidas</th>
                  <th className="text-center p-2 md:p-3 font-semibold">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {sociosEngajamento.map(socio => (
                  <tr key={socio.nome} className="border-b hover:bg-gray-50">
                    <td className="p-2 md:p-3 font-medium">{socio.nome}</td>
                    <td className="p-2 md:p-3 text-center">{socio.total}</td>
                    <td className="p-2 md:p-3 text-center hidden md:table-cell">{socio.lidas}</td>
                    <td className="p-2 md:p-3 text-center">
                      <Badge className={
                        socio.taxa >= 80 ? 'bg-green-100 text-green-800' :
                        socio.taxa >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {socio.taxa}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}