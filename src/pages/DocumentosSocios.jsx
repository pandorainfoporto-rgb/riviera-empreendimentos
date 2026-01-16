import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, Upload, Eye, Download, UserCheck, Trash2, Edit, 
  Plus, Search, Loader2, Calendar, FileCheck
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function DocumentosSocios() {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [novoDocumento, setNovoDocumento] = useState({
    titulo: "",
    tipo_documento: "outros",
    descricao: "",
    arquivo_url: "",
    arquivo_nome: "",
    arquivo_tamanho: 0,
    apresentado_para_socios: false,
    versao: "1.0",
    confidencial: false,
    data_documento: new Date().toISOString().split('T')[0],
  });

  const queryClient = useQueryClient();

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos_socios'],
    queryFn: () => base44.entities.DocumentoSocio.list('-created_date'),
  });

  const criarDocumentoMutation = useMutation({
    mutationFn: (dados) => base44.entities.DocumentoSocio.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos_socios']);
      toast.success("Documento criado com sucesso!");
      setDialogAberto(false);
      resetarFormulario();
    },
    onError: () => toast.error("Erro ao criar documento"),
  });

  const editarDocumentoMutation = useMutation({
    mutationFn: ({ id, dados }) => base44.entities.DocumentoSocio.update(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos_socios']);
      toast.success("Documento atualizado!");
      setDialogAberto(false);
      resetarFormulario();
    },
    onError: () => toast.error("Erro ao atualizar documento"),
  });

  const deletarDocumentoMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentoSocio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos_socios']);
      toast.success("Documento deletado!");
    },
    onError: () => toast.error("Erro ao deletar documento"),
  });

  const apresentarParaSociosMutation = useMutation({
    mutationFn: ({ id, apresentar }) => 
      base44.entities.DocumentoSocio.update(id, {
        apresentado_para_socios: apresentar,
        data_apresentacao: apresentar ? new Date().toISOString() : null,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['documentos_socios']);
      toast.success(variables.apresentar ? "Documento apresentado aos sócios!" : "Documento ocultado dos sócios");
    },
  });

  const handleUploadArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setNovoDocumento({
        ...novoDocumento,
        arquivo_url: result.file_url,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
      });
      toast.success("Arquivo enviado!");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const resetarFormulario = () => {
    setNovoDocumento({
      titulo: "",
      tipo_documento: "outros",
      descricao: "",
      arquivo_url: "",
      arquivo_nome: "",
      arquivo_tamanho: 0,
      apresentado_para_socios: false,
      versao: "1.0",
      confidencial: false,
      data_documento: new Date().toISOString().split('T')[0],
    });
    setDocumentoEditando(null);
  };

  const handleEditar = (doc) => {
    setDocumentoEditando(doc);
    setNovoDocumento(doc);
    setDialogAberto(true);
  };

  const handleSalvar = () => {
    if (!novoDocumento.titulo || !novoDocumento.arquivo_url) {
      toast.error("Preencha título e faça upload do arquivo");
      return;
    }

    if (documentoEditando) {
      editarDocumentoMutation.mutate({ id: documentoEditando.id, dados: novoDocumento });
    } else {
      criarDocumentoMutation.mutate(novoDocumento);
    }
  };

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const documentosFiltrados = documentos.filter(d => 
    d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    d.tipo_documento.toLowerCase().includes(busca.toLowerCase())
  );

  const tiposDocumento = {
    contrato_social: "Contrato Social",
    ata_reuniao: "Ata de Reunião",
    balanco_patrimonial: "Balanço Patrimonial",
    relatorio_financeiro: "Relatório Financeiro",
    estatuto: "Estatuto",
    regimento_interno: "Regimento Interno",
    outros: "Outros",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Documentos para Sócios
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie documentos importantes apresentados aos sócios
            </p>
          </div>

          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetarFormulario}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {documentoEditando ? "Editar Documento" : "Novo Documento"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Título do Documento *</Label>
                  <Input
                    placeholder="Ex: Contrato Social - 2026"
                    value={novoDocumento.titulo}
                    onChange={(e) => setNovoDocumento({...novoDocumento, titulo: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Documento *</Label>
                    <Select 
                      value={novoDocumento.tipo_documento} 
                      onValueChange={(v) => setNovoDocumento({...novoDocumento, tipo_documento: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tiposDocumento).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Versão</Label>
                    <Input
                      placeholder="Ex: 1.0"
                      value={novoDocumento.versao}
                      onChange={(e) => setNovoDocumento({...novoDocumento, versao: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Data do Documento</Label>
                  <Input
                    type="date"
                    value={novoDocumento.data_documento}
                    onChange={(e) => setNovoDocumento({...novoDocumento, data_documento: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição do documento..."
                    value={novoDocumento.descricao}
                    onChange={(e) => setNovoDocumento({...novoDocumento, descricao: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Arquivo *</Label>
                  <div className="mt-2">
                    {novoDocumento.arquivo_url ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{novoDocumento.arquivo_nome}</p>
                            <p className="text-xs text-gray-600">
                              {formatarTamanho(novoDocumento.arquivo_tamanho)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setNovoDocumento({
                              ...novoDocumento,
                              arquivo_url: "",
                              arquivo_nome: "",
                              arquivo_tamanho: 0,
                            })}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">
                                Clique para fazer upload do arquivo
                              </p>
                              <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleUploadArquivo}
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                    <Switch
                      checked={novoDocumento.apresentado_para_socios}
                      onCheckedChange={(v) => setNovoDocumento({...novoDocumento, apresentado_para_socios: v})}
                    />
                    <Label>Apresentar para sócios imediatamente</Label>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded">
                    <Switch
                      checked={novoDocumento.confidencial}
                      onCheckedChange={(v) => setNovoDocumento({...novoDocumento, confidencial: v})}
                    />
                    <Label>Marcar como confidencial</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogAberto(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSalvar} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={criarDocumentoMutation.isPending || editarDocumentoMutation.isPending}
                  >
                    {(criarDocumentoMutation.isPending || editarDocumentoMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      documentoEditando ? "Atualizar" : "Criar Documento"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {documentosFiltrados.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-blue-100">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{doc.titulo}</h3>
                          {doc.confidencial && (
                            <Badge variant="outline" className="text-red-600">Confidencial</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{tiposDocumento[doc.tipo_documento]}</Badge>
                          {doc.versao && <Badge variant="outline">v{doc.versao}</Badge>}
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {moment(doc.data_documento).format('DD/MM/YYYY')}
                          </Badge>
                          {doc.apresentado_para_socios && (
                            <Badge className="bg-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Visível para Sócios
                            </Badge>
                          )}
                        </div>

                        {doc.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{doc.descricao}</p>
                        )}

                        <p className="text-xs text-gray-500">
                          {doc.arquivo_nome} • {formatarTamanho(doc.arquivo_tamanho)}
                        </p>

                        {doc.data_apresentacao && (
                          <p className="text-xs text-gray-500 mt-1">
                            Apresentado em {moment(doc.data_apresentacao).format('DD/MM/YYYY [às] HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.arquivo_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = doc.arquivo_url;
                          a.download = doc.arquivo_nome;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={doc.apresentado_para_socios ? "default" : "outline"}
                        onClick={() => apresentarParaSociosMutation.mutate({
                          id: doc.id,
                          apresentar: !doc.apresentado_para_socios
                        })}
                        className={doc.apresentado_para_socios ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditar(doc)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Deletar este documento?')) {
                            deletarDocumentoMutation.mutate(doc.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {documentosFiltrados.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum documento cadastrado ainda</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}