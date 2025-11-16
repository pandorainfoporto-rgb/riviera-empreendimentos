import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Eye, Search, 
  File, FileSpreadsheet, Image, FileCheck,
  Calendar, DollarSign, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PortalClienteDocumentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("todos");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['minhasUnidades', cliente?.id],
    queryFn: () => base44.entities.Unidade.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 5,
  });

  const unidadeIds = unidades.map(u => u.id);

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentosCliente', unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      const docs = await base44.entities.DocumentoObra.filter({ 
        unidade_id: { $in: unidadeIds }
      });
      return docs;
    },
    enabled: unidadeIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratosCliente', cliente?.id],
    queryFn: () => base44.entities.Contrato.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: documentosGerados = [] } = useQuery({
    queryKey: ['documentosGeradosCliente', cliente?.id],
    queryFn: async () => {
      const docs = await base44.entities.DocumentoGerado.list();
      const negociacaoIds = negociacoes.map(n => n.id);
      const contratoIds = contratos.map(c => c.id);
      
      return docs.filter(d => 
        negociacaoIds.includes(d.negociacao_id) || 
        contratoIds.includes(d.contrato_id) ||
        d.cliente_id === cliente.id
      );
    },
    enabled: !!cliente?.id && negociacoes.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentosCliente', cliente?.id],
    queryFn: () => base44.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const getFileIcon = (tipo) => {
    switch(tipo) {
      case 'foto': return <Image className="w-5 h-5" />;
      case 'projeto': return <FileSpreadsheet className="w-5 h-5" />;
      case 'nota_fiscal':
      case 'recibo': return <File className="w-5 h-5" />;
      case 'contrato': return <FileCheck className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      foto: 'Foto', projeto: 'Projeto', nota_fiscal: 'Nota Fiscal',
      recibo: 'Recibo', contrato: 'Contrato', documento_geral: 'Documento',
      pagamento: 'Pagamento', negociacao: 'Negociação',
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aprovado': case 'assinado': case 'ativo': return 'bg-green-100 text-green-700';
      case 'pendente': case 'aguardando_assinatura': return 'bg-yellow-100 text-yellow-700';
      case 'rejeitado': case 'cancelado': return 'bg-red-100 text-red-700';
      case 'pago': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDownload = (url, titulo) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = titulo || 'documento';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download iniciado!");
  };

  const handlePreview = (doc) => {
    setSelectedDoc(doc);
    setShowPreview(true);
  };

  const fotos = documentos.filter(d => d.tipo === 'foto');
  const comprovantes = pagamentos.filter(p => p.status === 'pago');
  
  const todosDocumentos = [
    ...documentos.map(d => ({ ...d, categoria: 'obra' })),
    ...documentosGerados.map(d => ({ ...d, categoria: 'gerado', tipo: 'documento_geral' })),
    ...contratos.map(c => ({ ...c, categoria: 'contrato', tipo: 'contrato', titulo: c.titulo || `Contrato ${c.numero_contrato}`, arquivo_url: c.arquivo_pdf_url, data_documento: c.data_contrato })),
  ];

  const documentosFiltrados = todosDocumentos.filter(doc => {
    const matchesSearch = 
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = selectedType === 'todos' || doc.tipo === selectedType;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="todos">
            Todos ({todosDocumentos.length})
          </TabsTrigger>
          <TabsTrigger value="contratos">
            Contratos ({contratos.length})
          </TabsTrigger>
          <TabsTrigger value="comprovantes">
            Comprovantes ({comprovantes.length})
          </TabsTrigger>
          <TabsTrigger value="fotos">
            Fotos ({fotos.length})
          </TabsTrigger>
          <TabsTrigger value="outros">
            Outros ({documentos.length - fotos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {documentosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhum documento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentosFiltrados.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        {getFileIcon(doc.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{doc.titulo}</h3>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(doc.data_documento || doc.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <Badge className={`mt-1 ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handlePreview(doc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                        onClick={() => handleDownload(doc.arquivo_url, doc.titulo)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          {contratos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhum contrato disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {contratos.map((contrato) => {
                const unidade = unidades.find(u => u.id === contrato.unidade_id);
                
                return (
                  <Card key={contrato.id} className="border-t-4 border-purple-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{contrato.titulo}</h3>
                          <p className="text-sm text-gray-600">Unidade: {unidade?.codigo || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {format(parseISO(contrato.data_contrato), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          {contrato.valor_total && (
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-700">
                                R$ {contrato.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(contrato.status)}>
                          {contrato.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(contrato.arquivo_pdf_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                          onClick={() => handleDownload(contrato.arquivo_pdf_url, contrato.titulo)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comprovantes" className="space-y-4">
          {comprovantes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhum comprovante disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {comprovantes.map((pag) => {
                const unidade = unidades.find(u => u.id === pag.unidade_id);
                
                return (
                  <Card key={pag.id} className="border-l-4 border-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <File className="w-5 h-5 text-green-600" />
                            <h3 className="font-bold">Comprovante - {pag.tipo}</h3>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>Unidade: {unidade?.codigo || 'N/A'}</div>
                            <div>
                              Pago em: {format(parseISO(pag.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          <p className="text-lg font-bold text-green-700 mt-2">
                            R$ {(pag.valor_total_recebido || pag.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button
                          onClick={() => toast.success("Comprovante gerado! (funcionalidade em desenvolvimento)")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fotos" className="space-y-4">
          {fotos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhuma foto disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotos.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => handlePreview(doc)}
                >
                  <img
                    src={doc.arquivo_url}
                    alt={doc.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 p-3 text-white w-full">
                      <p className="font-semibold text-sm truncate">{doc.titulo}</p>
                      <p className="text-xs opacity-90">
                        {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.arquivo_url, doc.titulo);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outros" className="space-y-4">
          {documentos.filter(d => d.tipo !== 'foto').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Nenhum documento disponível</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documentos.filter(d => d.tipo !== 'foto').map((doc) => {
                const unidade = unidades.find(u => u.id === doc.unidade_id);
                
                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                            {getFileIcon(doc.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{doc.titulo}</h3>
                            <p className="text-sm text-gray-600">Unidade: {unidade?.codigo || 'N/A'}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-blue-600"
                            onClick={() => handleDownload(doc.arquivo_url, doc.titulo)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showPreview && selectedDoc && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedDoc.titulo}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto max-h-[70vh]">
              {selectedDoc.tipo === 'foto' ? (
                <img 
                  src={selectedDoc.arquivo_url} 
                  alt={selectedDoc.titulo}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={selectedDoc.arquivo_url}
                  className="w-full h-[70vh] border-0 rounded-lg"
                  title={selectedDoc.titulo}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}