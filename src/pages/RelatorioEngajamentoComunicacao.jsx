import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Clock, Mail, TrendingUp, TrendingDown,
  Download, FileText, Star, AlertCircle, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#922B3E', '#7D5999', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function RelatorioEngajamentoComunicacaoPage() {
  const [periodo, setPeriodo] = useState("30");
  const [exportando, setExportando] = useState(false);

  const dataInicio = subDays(new Date(), parseInt(periodo));

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ['mensagens_relatorio'],
    queryFn: () => base44.entities.Mensagem.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  // Filtrar por período
  const mensagensPeriodo = mensagens.filter(m => 
    new Date(m.created_date) >= dataInicio
  );

  // Estatísticas gerais
  const totalMensagens = mensagensPeriodo.length;
  const mensagensRecebidas = mensagensPeriodo.filter(m => m.remetente_tipo === 'cliente').length;
  const mensagensEnviadas = mensagensPeriodo.filter(m => m.remetente_tipo === 'admin').length;
  const emailsEnviados = mensagensPeriodo.filter(m => m.email_enviado).length;

  // Tempo médio de resposta
  const mensagensComResposta = mensagensPeriodo.filter(m => 
    m.tempo_resposta_minutos !== undefined && m.tempo_resposta_minutos !== null
  );
  const tempoMedioResposta = mensagensComResposta.length > 0
    ? Math.round(mensagensComResposta.reduce((sum, m) => sum + m.tempo_resposta_minutos, 0) / mensagensComResposta.length)
    : 0;

  // Taxa de resposta
  const taxaResposta = mensagensRecebidas > 0
    ? Math.round((mensagensComResposta.length / mensagensRecebidas) * 100)
    : 0;

  // Mensagens por canal
  const mensagensPorCanal = [
    { name: 'Sistema', value: mensagensPeriodo.filter(m => !m.email_enviado).length },
    { name: 'Email', value: emailsEnviados },
  ];

  // Mensagens por status
  const mensagensPorStatus = [
    { name: 'Aberto', value: mensagensPeriodo.filter(m => m.status === 'aberto').length, color: '#3B82F6' },
    { name: 'Em Andamento', value: mensagensPeriodo.filter(m => m.status === 'em_andamento').length, color: '#F59E0B' },
    { name: 'Resolvido', value: mensagensPeriodo.filter(m => m.status === 'resolvido').length, color: '#10B981' },
    { name: 'Fechado', value: mensagensPeriodo.filter(m => m.status === 'fechado').length, color: '#6B7280' },
  ];

  // Mensagens por categoria
  const mensagensPorCategoria = [
    { name: 'Dúvida', value: mensagensPeriodo.filter(m => m.categoria === 'duvida').length },
    { name: 'Reclamação', value: mensagensPeriodo.filter(m => m.categoria === 'reclamacao').length },
    { name: 'Elogio', value: mensagensPeriodo.filter(m => m.categoria === 'elogio').length },
    { name: 'Solicitação', value: mensagensPeriodo.filter(m => m.categoria === 'solicitacao').length },
    { name: 'Outros', value: mensagensPeriodo.filter(m => !m.categoria || m.categoria === 'outros').length },
  ].filter(c => c.value > 0);

  // Volume diário
  const volumeDiario = [];
  for (let i = parseInt(periodo) - 1; i >= 0; i--) {
    const data = subDays(new Date(), i);
    const dataStr = format(data, 'yyyy-MM-dd');
    
    volumeDiario.push({
      data: format(data, 'dd/MM'),
      recebidas: mensagensPeriodo.filter(m => 
        m.remetente_tipo === 'cliente' && 
        format(parseISO(m.created_date), 'yyyy-MM-dd') === dataStr
      ).length,
      enviadas: mensagensPeriodo.filter(m => 
        m.remetente_tipo === 'admin' && 
        format(parseISO(m.created_date), 'yyyy-MM-dd') === dataStr
      ).length,
    });
  }

  // Clientes mais ativos
  const mensagensPorCliente = {};
  mensagensPeriodo.forEach(m => {
    if (!mensagensPorCliente[m.cliente_id]) {
      mensagensPorCliente[m.cliente_id] = {
        total: 0,
        recebidas: 0,
        enviadas: 0
      };
    }
    mensagensPorCliente[m.cliente_id].total++;
    if (m.remetente_tipo === 'cliente') {
      mensagensPorCliente[m.cliente_id].recebidas++;
    } else {
      mensagensPorCliente[m.cliente_id].enviadas++;
    }
  });

  const clientesMaisAtivos = Object.entries(mensagensPorCliente)
    .map(([id, stats]) => ({
      cliente: clientes.find(c => c.id === id),
      ...stats
    }))
    .filter(c => c.cliente)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const exportarCSV = () => {
    setExportando(true);
    
    const csv = [
      ['Relatório de Engajamento de Comunicação'],
      ['Período', `Últimos ${periodo} dias`],
      [''],
      ['RESUMO GERAL'],
      ['Total de Mensagens', totalMensagens],
      ['Mensagens Recebidas', mensagensRecebidas],
      ['Mensagens Enviadas', mensagensEnviadas],
      ['Emails Enviados', emailsEnviados],
      ['Tempo Médio de Resposta (min)', tempoMedioResposta],
      ['Taxa de Resposta (%)', taxaResposta],
      [''],
      ['CLIENTES MAIS ATIVOS'],
      ['Cliente', 'Total Mensagens', 'Recebidas', 'Enviadas'],
      ...clientesMaisAtivos.map(c => [
        c.cliente.nome,
        c.total,
        c.recebidas,
        c.enviadas
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-engajamento-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setExportando(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Engajamento</h1>
          <p className="text-gray-600 mt-1">Análise de comunicação e atendimento</p>
        </div>
        <div className="flex gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={exportarCSV}
            disabled={exportando}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mensagens</p>
                <p className="text-3xl font-bold text-gray-900">{totalMensagens}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio Resposta</p>
                <p className="text-3xl font-bold text-gray-900">{tempoMedioResposta}min</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Resposta</p>
                <p className="text-3xl font-bold text-gray-900">{taxaResposta}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Enviados</p>
                <p className="text-3xl font-bold text-gray-900">{emailsEnviados}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volume de Mensagens (Diário)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeDiario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="recebidas" stroke="#3B82F6" name="Recebidas" />
                <Line type="monotone" dataKey="enviadas" stroke="#922B3E" name="Enviadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mensagensPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mensagensPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mensagensPorCanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#922B3E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mensagensPorCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mensagensPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Mais Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Clientes Mais Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientesMaisAtivos.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-gray-400">#{idx + 1}</span>
                  <div>
                    <p className="font-semibold">{item.cliente.nome}</p>
                    <p className="text-xs text-gray-600">{item.cliente.email}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{item.recebidas}</p>
                    <p className="text-xs text-gray-600">Enviou</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[var(--wine-600)]">{item.enviadas}</p>
                    <p className="text-xs text-gray-600">Recebeu</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{item.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SLA de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Menos de 1h</span>
                <Badge className="bg-green-100 text-green-700">
                  {Math.round((mensagensComResposta.filter(m => m.tempo_resposta_minutos < 60).length / mensagensComResposta.length) * 100) || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">1h - 4h</span>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {Math.round((mensagensComResposta.filter(m => m.tempo_resposta_minutos >= 60 && m.tempo_resposta_minutos < 240).length / mensagensComResposta.length) * 100) || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Mais de 4h</span>
                <Badge className="bg-red-100 text-red-700">
                  {Math.round((mensagensComResposta.filter(m => m.tempo_resposta_minutos >= 240).length / mensagensComResposta.length) * 100) || 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <span className="text-green-600">😊</span>
                  Positivo
                </span>
                <Badge className="bg-green-100 text-green-700">
                  {mensagensPeriodo.filter(m => m.sentimento === 'positivo').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <span className="text-gray-600">😐</span>
                  Neutro
                </span>
                <Badge className="bg-gray-100 text-gray-700">
                  {mensagensPeriodo.filter(m => m.sentimento === 'neutro').length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <span className="text-red-600">😞</span>
                  Negativo
                </span>
                <Badge className="bg-red-100 text-red-700">
                  {mensagensPeriodo.filter(m => m.sentimento === 'negativo').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-[var(--wine-600)]">
                {mensagensPeriodo.length > 0
                  ? Math.round((mensagensPeriodo.filter(m => m.status === 'resolvido' || m.status === 'fechado').length / mensagensPeriodo.length) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600 mt-2">das conversas foram resolvidas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}