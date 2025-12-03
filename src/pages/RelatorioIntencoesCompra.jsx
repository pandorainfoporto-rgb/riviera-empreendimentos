import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Users, Building2, TrendingUp, BarChart3, PieChart,
  Home, Palette, Settings, DollarSign, Download, Filter
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "#6b7280" },
  aguardando_projeto: { label: "Aguardando Projeto", color: "#f59e0b" },
  aguardando_reuniao: { label: "Aguardando Reunião", color: "#3b82f6" },
  alteracao_projeto: { label: "Alteração Projeto", color: "#8b5cf6" },
  aprovado: { label: "Aprovado", color: "#10b981" },
  cancelado: { label: "Cancelado", color: "#ef4444" },
};

const PADRAO_CONFIG = {
  economico: { label: "Econômico", color: "#6b7280" },
  medio_baixo: { label: "Médio Baixo", color: "#10b981" },
  medio: { label: "Médio", color: "#3b82f6" },
  medio_alto: { label: "Médio Alto", color: "#f59e0b" },
  alto: { label: "Alto", color: "#ef4444" },
  luxo: { label: "Luxo", color: "#8b5cf6" },
};

const TELHADO_LABELS = {
  ceramica: "Cerâmica",
  concreto: "Concreto",
  fibrocimento: "Fibrocimento",
  metalico: "Metálico",
  vidro: "Vidro",
  laje_impermeabilizada: "Laje Impermeabilizada",
  verde: "Telhado Verde",
  isotermica: "Telha Isotérmica",
};

const PISO_INTERNO_LABELS = {
  ceramica: "Cerâmica",
  porcelanato: "Porcelanato",
  porcelanato_liquido: "Porcelanato Líquido",
  madeira: "Madeira",
  laminado: "Laminado",
  vinilico: "Vinílico",
  granito: "Granito",
  marmore: "Mármore",
  cimento_queimado: "Cimento Queimado",
};

export default function RelatorioIntencoesCompra() {
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const { data: intencoes = [] } = useQuery({
    queryKey: ['intencoes_compra_relatorio'],
    queryFn: () => base44.entities.IntencaoCompra.list('-created_date'),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  // Filtrar intenções
  const intencoesFiltradas = intencoes.filter(i => {
    if (statusFiltro !== "todos" && i.status !== statusFiltro) return false;
    if (periodoFiltro !== "todos") {
      const dataIntencao = new Date(i.created_date);
      const agora = new Date();
      if (periodoFiltro === "mes") {
        const umMesAtras = new Date(agora.setMonth(agora.getMonth() - 1));
        if (dataIntencao < umMesAtras) return false;
      } else if (periodoFiltro === "trimestre") {
        const tresMesesAtras = new Date(agora.setMonth(agora.getMonth() - 3));
        if (dataIntencao < tresMesesAtras) return false;
      } else if (periodoFiltro === "ano") {
        const umAnoAtras = new Date(agora.setFullYear(agora.getFullYear() - 1));
        if (dataIntencao < umAnoAtras) return false;
      }
    }
    return true;
  });

  // Estatísticas
  const totalIntencoes = intencoesFiltradas.length;
  const aprovadas = intencoesFiltradas.filter(i => i.status === "aprovado").length;
  const canceladas = intencoesFiltradas.filter(i => i.status === "cancelado").length;
  const emAndamento = intencoesFiltradas.filter(i => !["aprovado", "cancelado"].includes(i.status)).length;
  const taxaConversao = totalIntencoes > 0 ? ((aprovadas / totalIntencoes) * 100).toFixed(1) : 0;

  const areaMedia = intencoesFiltradas.length > 0
    ? (intencoesFiltradas.reduce((sum, i) => sum + (i.area_construida_desejada || 0), 0) / intencoesFiltradas.length).toFixed(0)
    : 0;

  const orcamentoMedio = intencoesFiltradas.filter(i => i.orcamento_maximo).length > 0
    ? intencoesFiltradas.reduce((sum, i) => sum + (i.orcamento_maximo || 0), 0) / intencoesFiltradas.filter(i => i.orcamento_maximo).length
    : 0;

  // Dados para gráficos
  const dadosStatus = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: intencoesFiltradas.filter(i => i.status === key).length,
    color: config.color,
  })).filter(d => d.value > 0);

  const dadosPadrao = Object.entries(PADRAO_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: intencoesFiltradas.filter(i => i.padrao_imovel === key).length,
    color: config.color,
  })).filter(d => d.value > 0);

  // Acabamentos mais solicitados
  const contarAcabamento = (campo, labels) => {
    const contagem = {};
    intencoesFiltradas.forEach(i => {
      const valor = i[campo];
      if (valor && labels[valor]) {
        contagem[valor] = (contagem[valor] || 0) + 1;
      }
    });
    return Object.entries(contagem)
      .map(([key, value]) => ({ name: labels[key], value }))
      .sort((a, b) => b.value - a.value);
  };

  const telhadosMaisSolicitados = contarAcabamento("tipo_telhado", TELHADO_LABELS);
  const pisosMaisSolicitados = contarAcabamento("tipo_piso_interno", PISO_INTERNO_LABELS);

  // Adicionais mais solicitados
  const adicionaisMaisSolicitados = [];
  const adicionaisLabels = {
    ar_condicionado: "Ar Condicionado",
    energia_solar: "Energia Solar",
    automacao_residencial: "Automação",
    sistema_seguranca: "Segurança",
    paisagismo: "Paisagismo",
    piscina: "Piscina",
  };

  Object.entries(adicionaisLabels).forEach(([key, label]) => {
    let count = 0;
    intencoesFiltradas.forEach(i => {
      if (i.adicionais?.[key] || i.comodos?.[key]) count++;
    });
    if (count > 0) adicionaisMaisSolicitados.push({ name: label, value: count });
  });
  adicionaisMaisSolicitados.sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">
            Relatório de Intenções de Compra
          </h1>
          <p className="text-gray-600 mt-1">Análise completa das intenções de compra e preferências dos clientes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ano">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{totalIntencoes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aprovadas</p>
            <p className="text-2xl font-bold text-green-600">{aprovadas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Em Andamento</p>
            <p className="text-2xl font-bold text-yellow-600">{emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{canceladas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Taxa Conversão</p>
            <p className="text-2xl font-bold text-purple-600">{taxaConversao}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Área Média</p>
            <p className="text-2xl font-bold text-indigo-600">{areaMedia}m²</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visao_geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="visao_geral">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="acabamentos">
            <Palette className="w-4 h-4 mr-2" />
            Acabamentos
          </TabsTrigger>
          <TabsTrigger value="adicionais">
            <Settings className="w-4 h-4 mr-2" />
            Adicionais
          </TabsTrigger>
          <TabsTrigger value="detalhado">
            <FileText className="w-4 h-4 mr-2" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao_geral" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {dadosStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Padrões Mais Solicitados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosPadrao} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Orçamento Médio por Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(PADRAO_CONFIG).map(([key, config]) => {
                  const intencoesPadrao = intencoesFiltradas.filter(i => i.padrao_imovel === key && i.orcamento_maximo);
                  const mediaOrcamento = intencoesPadrao.length > 0
                    ? intencoesPadrao.reduce((sum, i) => sum + (i.orcamento_maximo || 0), 0) / intencoesPadrao.length
                    : 0;
                  return (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg text-center">
                      <Badge style={{ backgroundColor: config.color, color: 'white' }} className="mb-2">
                        {config.label}
                      </Badge>
                      <p className="text-lg font-bold">
                        {mediaOrcamento > 0 ? `R$ ${(mediaOrcamento / 1000).toFixed(0)}k` : '-'}
                      </p>
                      <p className="text-xs text-gray-500">{intencoesPadrao.length} intenções</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acabamentos" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Tipos de Telhado Mais Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {telhadosMaisSolicitados.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={telhadosMaisSolicitados.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Pisos Internos Mais Solicitados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pisosMaisSolicitados.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pisosMaisSolicitados.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Destaque para novos acabamentos */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-purple-900">🆕 Novos Acabamentos (v4.3)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Telha Isotérmica</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {intencoesFiltradas.filter(i => i.tipo_telhado === "isotermica").length}
                  </p>
                  <p className="text-sm text-gray-600">solicitações</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Porcelanato Líquido</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {intencoesFiltradas.filter(i => i.tipo_piso_interno === "porcelanato_liquido").length}
                  </p>
                  <p className="text-sm text-gray-600">solicitações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adicionais" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionais Mais Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              {adicionaisMaisSolicitados.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={adicionaisMaisSolicitados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalhado" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lista Detalhada de Intenções</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Loteamento</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intencoesFiltradas.slice(0, 50).map((intencao) => {
                    const cliente = clientes.find(c => c.id === intencao.cliente_id);
                    const loteamento = loteamentos.find(l => l.id === intencao.loteamento_id);
                    const statusConfig = STATUS_CONFIG[intencao.status] || STATUS_CONFIG.rascunho;
                    const padraoConfig = PADRAO_CONFIG[intencao.padrao_imovel] || PADRAO_CONFIG.medio;

                    return (
                      <TableRow key={intencao.id}>
                        <TableCell className="text-sm">
                          {format(new Date(intencao.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{cliente?.nome || "-"}</TableCell>
                        <TableCell>{loteamento?.nome || "-"}</TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: padraoConfig.color, color: 'white' }}>
                            {padraoConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{intencao.area_construida_desejada || 0} m²</TableCell>
                        <TableCell>
                          {intencao.orcamento_maximo
                            ? `R$ ${(intencao.orcamento_maximo / 1000).toFixed(0)}k`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: statusConfig.color, color: 'white' }}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {intencoesFiltradas.length > 50 && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  Mostrando 50 de {intencoesFiltradas.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}