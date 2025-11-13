
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, Download, Eye, Calendar, Search, 
  File, FileSpreadsheet, Image, CheckCircle2, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalClienteDocumentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("todos");

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      if (!user?.cliente_id) return null;
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: negociacoes = [], isLoading: isLoadingNegociacoes } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery({
    queryKey: ['unidadesPortalCliente'],
    queryFn: () => base44.entities.Unidade.list(),
    staleTime: 1000 * 60 * 5,
  });

  // Determine the active negotiation and unit based on fetched data
  const negociacaoAtiva = negociacoes.find(n => n.status === 'ativa');
  const unidadeAtiva = negociacaoAtiva ? unidades.find(u => u.id === negociacaoAtiva.unidade_id) : null;

  const { data: documentos = [], isLoading: isLoadingDocumentos } = useQuery({
    queryKey: ['documentosUnidade', unidadeAtiva?.id],
    queryFn: () => base44.entities.DocumentoObra.filter({ unidade_id: unidadeAtiva.id }),
    enabled: !!unidadeAtiva?.id, // Only fetch documents if an active unit is identified
    staleTime: 1000 * 60 * 5,
  });

  // Display a loading spinner until essential data is fetched
  if (isLoadingUser || isLoadingCliente || isLoadingNegociacoes || isLoadingUnidades || (unidadeAtiva && isLoadingDocumentos)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If after loading, there's no user or client, or no active unit, it means no relevant documents can be displayed.
  // We can show a message or an empty state, but the structure below will naturally handle empty `documentos` array.

  const getFileIcon = (tipo) => {
    switch(tipo) {
      case 'foto':
        return <Image className="w-5 h-5" />;
      case 'projeto':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'nota_fiscal':
      case 'recibo':
        return <File className="w-5 h-5" />;
      case 'contrato':
      case 'documento_geral':
      case 'negociacao':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      foto: 'Foto',
      projeto: 'Projeto',
      nota_fiscal: 'Nota Fiscal',
      recibo: 'Recibo',
      contrato: 'Contrato',
      documento_geral: 'Documento',
      pagamento: 'Pagamento',
      negociacao: 'Negociação',
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aprovado':
        return 'bg-green-100 text-green-700';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejeitado':
        return 'bg-red-100 text-red-700';
      case 'pago':
        return 'bg-blue-100 text-blue-700';
      case 'arquivado':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const documentosFiltrados = documentos.filter(doc => {
    const matchesSearch = 
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = selectedType === 'todos' || doc.tipo === selectedType;
    
    return matchesSearch && matchesTipo;
  });

  const tiposDisponiveis = [...new Set(documentos.map(d => d.tipo))];

  const documentosContratos = documentosFiltrados.filter(d => 
    d.tipo === 'contrato' || d.tipo === 'negociacao'
  );
  
  const documentosGerais = documentosFiltrados.filter(d => 
    d.tipo === 'documento_geral' || d.tipo === 'projeto'
  );
  
  const documentosFinanceiros = documentosFiltrados.filter(d => 
    d.tipo === 'nota_fiscal' || d.tipo === 'recibo' || d.tipo === 'pagamento'
  );
  
  const fotos = documentosFiltrados.filter(d => d.tipo === 'foto');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Meus Documentos</h1>
          <p className="text-gray-600 mt-1">Acesse todos os documentos relacionados à sua compra</p>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedType === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('todos')}
                >
                  Todos ({documentos.length})
                </Button>
                {tiposDisponiveis.map(tipo => {
                  const count = documentos.filter(d => d.tipo === tipo).length;
                  return (
                    <Button
                      key={tipo}
                      variant={selectedType === tipo ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(tipo)}
                    >
                      {getTipoLabel(tipo)} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos e Negociações */}
        {documentosContratos.length > 0 && (
          <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
                <FileText className="w-5 h-5" />
                Contratos e Negociações ({documentosContratos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {documentosContratos.map((doc) => {
                  const unidade = unidades.find(u => u.id === doc.unidade_id);
                  
                  return (
                    <div key={doc.id} className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                          {getFileIcon(doc.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{doc.titulo}</h3>
                          <p className="text-sm text-gray-600">Unidade: {unidade?.codigo || 'N/A'}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status === 'aprovado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {doc.status === 'pendente' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {doc.status || 'N/A'}
                        </Badge>
                      </div>
                      {doc.descricao && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.descricao}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(doc.arquivo_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                          onClick={() => window.open(doc.arquivo_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos Gerais */}
        {documentosGerais.length > 0 && (
          <Card className="shadow-lg border-t-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <FileSpreadsheet className="w-5 h-5" />
                Documentos Gerais ({documentosGerais.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentosGerais.map((doc) => {
                  const unidade = unidades.find(u => u.id === doc.unidade_id);
                  
                  return (
                    <div key={doc.id} className="p-4 bg-white rounded-lg border hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            {getFileIcon(doc.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900">{doc.titulo}</h3>
                            <p className="text-sm text-gray-600">Unidade: {unidade?.codigo || 'N/A'}</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            {doc.descricao && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{doc.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos Financeiros */}
        {documentosFinanceiros.length > 0 && (
          <Card className="shadow-lg border-t-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <File className="w-5 h-5" />
                Documentos Financeiros ({documentosFinanceiros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentosFinanceiros.map((doc) => {
                  const unidade = unidades.find(u => u.id === doc.unidade_id);
                  
                  return (
                    <div key={doc.id} className="p-4 bg-white rounded-lg border hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                            {getFileIcon(doc.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900">{doc.titulo}</h3>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                              <span>Unidade: {unidade?.codigo || 'N/A'}</span>
                              {doc.numero_documento && (
                                <span>• Nº {doc.numero_documento}</span>
                              )}
                              {doc.valor && (
                                <span className="font-semibold text-green-700">
                                  • R$ {doc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <Card className="shadow-lg border-t-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Image className="w-5 h-5" />
                Fotos da Obra ({fotos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotos.map((doc) => {
                  const unidade = unidades.find(u => u.id === doc.unidade_id);
                  
                  return (
                    <div key={doc.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-all">
                      <img
                        src={doc.arquivo_url}
                        alt={doc.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="font-semibold text-sm truncate">{doc.titulo}</p>
                          <p className="text-xs opacity-90">{unidade?.codigo || 'N/A'}</p>
                          <p className="text-xs opacity-75">
                            {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          onClick={() => window.open(doc.arquivo_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nenhum documento */}
        {documentosFiltrados.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Nenhum documento encontrado</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Documentos serão adicionados conforme o andamento do processo'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
