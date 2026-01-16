import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, Clock, MessageSquare, Zap, TrendingUp, Users, 
  Phone, Instagram, Facebook, Mail, CheckCircle2, AlertCircle,
  Download, Filter
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from "moment";

export default function RelatoriosOmnichannel() {
  const [dataInicio, setDataInicio] = useState(
    moment().subtract(30, 'days').format('YYYY-MM-DD')
  );
  const [dataFim, setDataFim] = useState(moment().format('YYYY-MM-DD'));
  const [canalFiltro, setCanalFiltro] = useState("todos");

  const { data: canais = [] } = useQuery({
    queryKey: ['canais_atendimento'],
    queryFn: () => base44.entities.CanalAtendimento.list(),
  });

  const { data: conversas = [] } = useQuery({
    queryKey: ['conversas_relatorio', dataInicio, dataFim],
    queryFn: async () => {
      return await base44.entities.ConversaOmnichannel.filter({
        created_date: {
          $gte: dataInicio + 'T00:00:00',
          $lte: dataFim + 'T23:59:59'
        }
      });
    },
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_relatorio', dataInicio, dataFim],
    queryFn: async () => {
      return await base44.entities.MensagemOmnichannel.filter({
        data_hora: {
          $gte: dataInicio + 'T00:00:00',
          $lte: dataFim + 'T23:59:59'
        }
      });
    },
  });

  // Filtrar por canal
  const conversasFiltradas = canalFiltro === "todos" 
    ? conversas 
    : conversas.filter(c => c.canal_id === canalFiltro);

  // Métricas Gerais
  const totalConversas = conversasFiltradas.length;
  const conversasAtendidas = conversasFiltradas.filter(c => c.status === 'finalizado').length;
  const conversasIA = conversasFiltradas.filter(c => c.atendido_por_ia).length;
  const conversasHumano = conversasFiltradas.filter(c => c.atendente_id).length;
  const taxaIA = totalConversas > 0 ? ((conversasIA / totalConversas) * 100).toFixed(1) : 0;
  const taxaResolucaoIA = conversasIA > 0 
    ? ((conversasFiltradas.filter(c => c.atendido_por_ia && !c.requer_humano).length / conversasIA) * 100).toFixed(1)
    : 0;

  // Performance por Canal
  const performanceCanal = canais.map(canal => {
    const conversasCanal = conversas.filter(c => c.canal_id === canal.id);
    const mensagensCanal = mensagens.filter(m => 
      conversasCanal.some(c => c.id === m.conversa_id)
    );
    
    return {
      nome: canal.nome,
      tipo: canal.tipo,
      conversas: conversasCanal.length,
      mensagens: mensagensCanal.length,
      atendidaIA: conversasCanal.filter(c => c.atendido_por_ia).length,
      finalizadas: conversasCanal.filter(c => c.status === 'finalizado').length,
    };
  });

  // Conversas por Dia
  const conversasPorDia = {};
  conversasFiltradas.forEach(c => {
    const dia = moment(c.created_date).format('DD/MM');
    conversasPorDia[dia] = (conversasPorDia[dia] || 0) + 1;
  });
  const dadosTemporais = Object.entries(conversasPorDia).map(([dia, total]) => ({
    dia,
    total
  }));

  // Distribuição por Tipo de Contato
  const distribuicaoTipo = [
    { name: 'Clientes', value: conversasFiltradas.filter(c => c.tipo_contato === 'cliente').length },
    { name: 'Leads', value: conversasFiltradas.filter(c => c.tipo_contato === 'lead').length },
    { name: 'Novos', value: conversasFiltradas.filter(c => c.tipo_contato === 'novo').length },
  ];

  // Análise de Sentimento
  const sentimentos = [
    { name: 'Positivo', value: conversasFiltradas.filter(c => c.analise_ia?.sentimento === 'positivo').length },
    { name: 'Neutro', value: conversasFiltradas.filter(c => c.analise_ia?.sentimento === 'neutro').length },
    { name: 'Negativo', value: conversasFiltradas.filter(c => c.analise_ia?.sentimento === 'negativo').length },
  ];

  // Performance de Atendentes
  const atendentes = {};
  conversasFiltradas.forEach(c => {
    if (c.atendente_id) {
      if (!atendentes[c.atendente_id]) {
        atendentes[c.atendente_id] = {
          total: 0,
          finalizadas: 0,
          mensagens: 0
        };
      }
      atendentes[c.atendente_id].total++;
      if (c.status === 'finalizado') {
        atendentes[c.atendente_id].finalizadas++;
      }
      atendentes[c.atendente_id].mensagens += mensagens.filter(m => 
        m.conversa_id === c.id && m.remetente_tipo === 'atendente'
      ).length;
    }
  });

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Omnichannel</h1>
          <p className="text-gray-600 mt-1">Análise de performance e métricas de atendimento</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input 
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input 
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Canal</label>
              <Select value={canalFiltro} onValueChange={setCanalFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Canais</SelectItem>
                  {canais.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{totalConversas}</p>
              <p className="text-sm text-gray-600">Total Conversas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{taxaIA}%</p>
              <p className="text-sm text-gray-600">Taxa IA</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{taxaResolucaoIA}%</p>
              <p className="text-sm text-gray-600">Resolução IA</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{conversasHumano}</p>
              <p className="text-sm text-gray-600">Atendimento Humano</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold">{conversasAtendidas}</p>
              <p className="text-sm text-gray-600">Finalizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="canais">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="canais">Por Canal</TabsTrigger>
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
          <TabsTrigger value="atendentes">Atendentes</TabsTrigger>
          <TabsTrigger value="analise">Análise IA</TabsTrigger>
        </TabsList>

        <TabsContent value="canais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceCanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversas" fill="#8b5cf6" name="Conversas" />
                  <Bar dataKey="atendidaIA" fill="#f59e0b" name="Atendidas IA" />
                  <Bar dataKey="finalizadas" fill="#10b981" name="Finalizadas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceCanal.map((canal, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-12 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <div>
                        <p className="font-semibold">{canal.nome}</p>
                        <p className="text-sm text-gray-600">{canal.tipo.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{canal.conversas}</p>
                        <p className="text-xs text-gray-600">Conversas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{canal.mensagens}</p>
                        <p className="text-xs text-gray-600">Mensagens</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{canal.atendidaIA}</p>
                        <p className="text-xs text-gray-600">IA</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{canal.finalizadas}</p>
                        <p className="text-xs text-gray-600">Finalizadas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTemporais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Conversas" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribuicaoTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribuicaoTipo.map((entry, index) => (
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
                <CardTitle>Análise de Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === 'Positivo' ? '#10b981' : 
                          entry.name === 'Negativo' ? '#ef4444' : '#94a3b8'
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="atendentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Atendentes Humanos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(atendentes).map(([id, dados], idx) => (
                  <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold">Atendente {id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">
                          {((dados.finalizadas / dados.total) * 100).toFixed(0)}% de finalização
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{dados.total}</p>
                        <p className="text-xs text-gray-600">Atendimentos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{dados.finalizadas}</p>
                        <p className="text-xs text-gray-600">Finalizadas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{dados.mensagens}</p>
                        <p className="text-xs text-gray-600">Mensagens</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Eficiência da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Taxa de Atendimento IA</p>
                    <p className="text-2xl font-bold text-purple-600">{taxaIA}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${taxaIA}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Taxa de Resolução IA</p>
                    <p className="text-2xl font-bold text-green-600">{taxaResolucaoIA}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${taxaResolucaoIA}%` }}></div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Conversas Transferidas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {conversasFiltradas.filter(c => c.requer_humano).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intenções Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['comprar', 'duvida', 'visita', 'reclamacao'].map((intencao) => {
                    const count = conversasFiltradas.filter(c => 
                      c.analise_ia?.intencao === intencao
                    ).length;
                    const percent = totalConversas > 0 ? ((count / totalConversas) * 100).toFixed(0) : 0;
                    
                    return (
                      <div key={intencao} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium capitalize">{intencao}</p>
                          <Badge>{count}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}