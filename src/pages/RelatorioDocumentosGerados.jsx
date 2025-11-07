import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, TrendingUp, Calendar, Users, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#922B3E', '#7D5999', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const tipoLabels = {
  contrato_venda: "Contrato de Venda",
  contrato_locacao: "Contrato de Locação",
  proposta_venda: "Proposta de Venda",
  ficha_cadastral: "Ficha Cadastral",
  escritura: "Escritura",
  distrato: "Distrato",
  aditivo_contratual: "Aditivo Contratual",
  recibo: "Recibo",
  procuracao: "Procuração",
  declaracao: "Declaração",
  termo_entrega: "Termo de Entrega",
  vistoria: "Vistoria",
  personalizado: "Personalizado"
};

export default function RelatorioDocumentosGeradosPage() {
  const [periodo, setPeriodo] = useState("30");
  const [exportando, setExportando] = useState(false);

  const dataInicio = subDays(new Date(), parseInt(periodo));

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos_gerados_relatorio'],
    queryFn: () => base44.entities.DocumentoGerado.list('-created_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates_documentos'],
    queryFn: () => base44.entities.DocumentoTemplate.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  // Filtrar por período
  const documentosPeriodo = documentos.filter(d => 
    new Date(d.created_date) >= dataInicio
  );

  // Estatísticas
  const totalDocumentos = documentosPeriodo.length;
  const documentosAssinados = documentosPeriodo.filter(d => d.status === 'assinado').length;
  const documentosAguardando = documentosPeriodo.filter(d => d.status === 'aguardando_assinaturas').length;
  const taxaAssinatura = totalDocumentos > 0
    ? Math.round((documentosAssinados / totalDocumentos) * 100)
    : 0;

  // Documentos por tipo
  const documentosPorTipo = Object.entries(
    documentosPeriodo.reduce((acc, d) => {
      acc[d.tipo] = (acc[d.tipo] || 0) + 1;
      return acc;
    }, {})
  ).map(([tipo, qtd]) => ({
    name: tipoLabels[tipo] || tipo,
    value: qtd
  }));

  // Documentos por status
  const documentosPorStatus = [
    { name: 'Rascunho', value: documentosPeriodo.filter(d => d.status === 'rascunho').length, color: '#6B7280' },
    { name: 'Em Revisão', value: documentosPeriodo.filter(d => d.status === 'em_revisao').length, color: '#3B82F6' },
    { name: 'Aguardando Assinaturas', value: documentosPeriodo.filter(d => d.status === 'aguardando_assinaturas').length, color: '#F59E0B' },
    { name: 'Assinado', value: documentosPeriodo.filter(d => d.status === 'assinado').length, color: '#10B981' },
    { name: 'Arquivado', value: documentosPeriodo.filter(d => d.status === 'arquivado').length, color: '#8B5CF6' },
  ].filter(s => s.value > 0);

  // Volume diário
  const volumeDiario = [];
  for (let i = parseInt(periodo) - 1; i >= 0; i--) {
    const data = subDays(new Date(), i);
    const dataStr = format(data, 'yyyy-MM-dd');
    
    volumeDiario.push({
      data: format(data, 'dd/MM'),
      gerados: documentosPeriodo.filter(d => 
        format(parseISO(d.created_date), 'yyyy-MM-dd') === dataStr
      ).length,
    });
  }

  // Templates mais usados
  const templatesMaisUsados = templates
    .map(t => ({
      nome: t.nome,
      total: documentosPeriodo.filter(d => d.template_id === t.id).length,
      tipo: t.tipo
    }))
    .filter(t => t.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const exportarCSV = () => {
    setExportando(true);
    
    const csv = [
      ['Relatório de Documentos Gerados'],
      ['Período', `Últimos ${periodo} dias`],
      [''],
      ['RESUMO GERAL'],
      ['Total de Documentos', totalDocumentos],
      ['Documentos Assinados', documentosAssinados],
      ['Aguardando Assinaturas', documentosAguardando],
      ['Taxa de Assinatura (%)', taxaAssinatura],
      [''],
      ['TEMPLATES MAIS USADOS'],
      ['Template', 'Tipo', 'Total Gerado'],
      ...templatesMaisUsados.map(t => [
        t.nome,
        tipoLabels[t.tipo] || t.tipo,
        t.total
      ]),
      [''],
      ['DOCUMENTOS POR TIPO'],
      ['Tipo', 'Quantidade'],
      ...documentosPorTipo.map(d => [d.name, d.value])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-documentos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setExportando(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Documentos</h1>
          <p className="text-gray-600 mt-1">Análise de geração e assinaturas</p>
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

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gerados</p>
                <p className="text-3xl font-bold text-gray-900">{totalDocumentos}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assinados</p>
                <p className="text-3xl font-bold text-gray-900">{documentosAssinados}</p>
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
                <p className="text-sm text-gray-600">Taxa Assinatura</p>
                <p className="text-3xl font-bold text-gray-900">{taxaAssinatura}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aguardando</p>
                <p className="text-3xl font-bold text-gray-900">{documentosAguardando}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Volume de Documentos (Diário)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeDiario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="gerados" stroke="#922B3E" name="Documentos Gerados" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentosPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentosPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Documentos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentosPorTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#922B3E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Templates Mais Usados */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Mais Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templatesMaisUsados.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-bold text-lg text-gray-400">#{idx + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{item.nome}</p>
                    <p className="text-xs text-gray-600">{tipoLabels[item.tipo]}</p>
                  </div>
                </div>
                <Badge className="bg-[var(--wine-600)] text-white">
                  {item.total} documentos
                </Badge>
              </div>
            ))}
            {templatesMaisUsados.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum documento gerado no período</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}