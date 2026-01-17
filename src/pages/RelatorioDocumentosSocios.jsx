import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, Download, Calendar, Eye, Shield, Users, 
  TrendingUp, BarChart2, PieChart as PieChartIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import moment from "moment";

const COLORS = ['#922B3E', '#7D5999', '#4A90A4', '#48BB78', '#ED8936', '#E53E3E'];

export default function RelatorioDocumentosSocios() {
  const [busca, setBusca] = useState("");

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos_socios_relatorio'],
    queryFn: () => base44.entities.DocumentoSocio.list('-data_apresentacao'),
  });

  const { data: logsAcesso = [] } = useQuery({
    queryKey: ['logs_acesso_documentos'],
    queryFn: async () => {
      const logs = await base44.entities.LogAcessoSocio.filter(
        { acao: 'download_documento' },
        '-data_hora',
        100
      );
      return logs;
    },
  });

  const tiposDocumento = {
    contrato_social: "Contrato Social",
    ata_reuniao: "Ata de Reunião",
    balanco_patrimonial: "Balanço Patrimonial",
    relatorio_financeiro: "Relatório Financeiro",
    dre: "DRE",
    balancete: "Balancete",
    estatuto: "Estatuto",
    regimento_interno: "Regimento Interno",
    outros: "Outros",
  };

  // Estatísticas
  const totalDocumentos = documentos.length;
  const documentosApresentados = documentos.filter(d => d.apresentado_para_socios).length;
  const documentosConfidenciais = documentos.filter(d => d.confidencial).length;
  const documentosAtas = documentos.filter(d => d.categoria_portal === 'atas_assembleias').length;
  const documentosSociedade = documentos.filter(d => d.categoria_portal === 'documentos_sociedade').length;

  // Documentos por tipo
  const documentosPorTipo = Object.entries(
    documentos.reduce((acc, doc) => {
      acc[doc.tipo_documento] = (acc[doc.tipo_documento] || 0) + 1;
      return acc;
    }, {})
  ).map(([tipo, quantidade]) => ({
    nome: tiposDocumento[tipo] || tipo,
    quantidade
  }));

  // Documentos por mês
  const documentosPorMes = documentos
    .filter(d => d.data_apresentacao)
    .reduce((acc, doc) => {
      const mes = moment(doc.data_apresentacao).format('MMM/YYYY');
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

  const chartDocumentosMes = Object.entries(documentosPorMes)
    .sort((a, b) => moment(a[0], 'MMM/YYYY').valueOf() - moment(b[0], 'MMM/YYYY').valueOf())
    .slice(-6)
    .map(([mes, quantidade]) => ({ mes, quantidade }));

  const documentosFiltrados = documentos.filter(d =>
    d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    tiposDocumento[d.tipo_documento]?.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarTamanho = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--wine-700)]">Relatório de Documentos - Sócios</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Análise completa dos documentos apresentados aos sócios</p>
        </div>
        <Button className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] w-full md:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{totalDocumentos}</p>
              </div>
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600 md:bg-blue-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Apresentados</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{documentosApresentados}</p>
              </div>
              <Eye className="w-6 h-6 md:w-8 md:h-8 text-green-600 md:bg-green-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Confidenciais</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{documentosConfidenciais}</p>
              </div>
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-red-600 md:bg-red-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Atas</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{documentosAtas}</p>
              </div>
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600 md:bg-purple-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Societários</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{documentosSociedade}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-orange-600 md:bg-orange-100 md:p-2 md:rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BarChart2 className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
              Documentos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={documentosPorTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#922B3E" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Atas e Assembleias', value: documentosAtas },
                    { name: 'Documentos da Sociedade', value: documentosSociedade }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={COLORS[0]} />
                  <Cell fill={COLORS[1]} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
              Documentos Apresentados por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartDocumentosMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#7D5999" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-base md:text-lg">Todos os Documentos</CardTitle>
            <Input 
              placeholder="Buscar documento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 md:p-3 font-semibold">Título</th>
                  <th className="text-left p-2 md:p-3 font-semibold hidden md:table-cell">Tipo</th>
                  <th className="text-left p-2 md:p-3 font-semibold hidden lg:table-cell">Categoria</th>
                  <th className="text-left p-2 md:p-3 font-semibold hidden md:table-cell">Data</th>
                  <th className="text-left p-2 md:p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {documentosFiltrados.map(doc => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 md:p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.titulo}</p>
                          <p className="text-xs text-gray-500 md:hidden">{tiposDocumento[doc.tipo_documento]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 md:p-3 hidden md:table-cell">
                      <Badge variant="outline">{tiposDocumento[doc.tipo_documento]}</Badge>
                    </td>
                    <td className="p-2 md:p-3 hidden lg:table-cell">
                      <Badge className={doc.categoria_portal === 'atas_assembleias' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                        {doc.categoria_portal === 'atas_assembleias' ? 'Atas' : 'Societários'}
                      </Badge>
                    </td>
                    <td className="p-2 md:p-3 text-gray-600 hidden md:table-cell">
                      {doc.data_documento ? moment(doc.data_documento).format('DD/MM/YYYY') : '-'}
                    </td>
                    <td className="p-2 md:p-3">
                      <div className="flex flex-col gap-1">
                        {doc.apresentado_para_socios && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Apresentado</Badge>
                        )}
                        {doc.confidencial && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Confidencial
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-[var(--wine-600)]" />
            Últimos Acessos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logsAcesso.slice(0, 10).map(log => (
              <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{log.nome_socio}</p>
                  <p className="text-xs text-gray-500 truncate">{log.descricao}</p>
                </div>
                <p className="text-xs text-gray-500 flex-shrink-0">
                  {moment(log.data_hora).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}