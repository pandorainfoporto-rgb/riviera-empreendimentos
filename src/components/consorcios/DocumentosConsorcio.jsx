import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Upload, Trash2, Download, Eye, 
  CheckCircle2, FileCheck, FileSignature, AlertCircle 
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DocumentosConsorcio({ consorcio }) {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("adesao");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentoParaDeletar, setDocumentoParaDeletar] = useState(null);
  const queryClient = useQueryClient();

  const updateConsorcioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consorcio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      toast.success("Documento enviado com sucesso!");
      setUploading(false);
    },
    onError: (error) => {
      toast.error("Erro ao enviar documento: " + error.message);
      setUploading(false);
    },
  });

  const handleFileUpload = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploading(true);

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Preparar novo documento
      const novoDocumento = {
        nome: file.name,
        url: file_url,
        data_upload: new Date().toISOString(),
      };

      // Atualizar array correspondente
      let documentosAtualizados = { ...consorcio };
      
      if (tipo === 'adesao') {
        documentosAtualizados.documentos_adesao = [
          ...(consorcio.documentos_adesao || []),
          novoDocumento
        ];
      } else if (tipo === 'contemplacao') {
        documentosAtualizados.documentos_contemplacao = [
          ...(consorcio.documentos_contemplacao || []),
          novoDocumento
        ];
      } else if (tipo === 'alienacao') {
        documentosAtualizados.documentos_alienacao = [
          ...(consorcio.documentos_alienacao || []),
          novoDocumento
        ];
      }

      // Atualizar consórcio
      updateConsorcioMutation.mutate({
        id: consorcio.id,
        data: documentosAtualizados
      });

    } catch (error) {
      toast.error("Erro ao fazer upload: " + error.message);
      setUploading(false);
    }
  };

  const handleDeleteDocumento = (tipo, index) => {
    let documentosAtualizados = { ...consorcio };
    
    if (tipo === 'adesao') {
      documentosAtualizados.documentos_adesao = consorcio.documentos_adesao.filter((_, i) => i !== index);
    } else if (tipo === 'contemplacao') {
      documentosAtualizados.documentos_contemplacao = consorcio.documentos_contemplacao.filter((_, i) => i !== index);
    } else if (tipo === 'alienacao') {
      documentosAtualizados.documentos_alienacao = consorcio.documentos_alienacao.filter((_, i) => i !== index);
    }

    updateConsorcioMutation.mutate({
      id: consorcio.id,
      data: documentosAtualizados
    });

    setShowDeleteDialog(false);
    setDocumentoParaDeletar(null);
  };

  const confirmarDelecao = (tipo, index, documento) => {
    setDocumentoParaDeletar({ tipo, index, documento });
    setShowDeleteDialog(true);
  };

  const renderDocumentos = (documentos, tipo, titulo, icone, cor) => {
    const Icone = icone;
    const qtdDocumentos = documentos?.length || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icone className={`w-5 h-5 ${cor}`} />
            <h4 className="font-semibold text-gray-900">{titulo}</h4>
            <Badge variant="outline" className={qtdDocumentos > 0 ? 'bg-green-50 text-green-700 border-green-300' : ''}>
              {qtdDocumentos} {qtdDocumentos === 1 ? 'documento' : 'documentos'}
            </Badge>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, tipo)}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              className="border-[var(--wine-600)] text-[var(--wine-700)] hover:bg-[var(--wine-50)]"
              onClick={(e) => e.preventDefault()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
            </Button>
          </label>
        </div>

        {documentos && documentos.length > 0 ? (
          <div className="space-y-2">
            {documentos.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${cor.replace('text-', 'bg-').replace('600', '100')}`}>
                    <FileText className={`w-5 h-5 ${cor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.nome}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.data_upload).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.url, '_blank')}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.url;
                      link.download = doc.nome;
                      link.click();
                    }}
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmarDelecao(tipo, index, doc)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum documento enviado ainda</p>
            <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar Arquivo" para fazer upload</p>
          </div>
        )}
      </div>
    );
  };

  const totalDocumentos = 
    (consorcio.documentos_adesao?.length || 0) +
    (consorcio.documentos_contemplacao?.length || 0) +
    (consorcio.documentos_alienacao?.length || 0);

  return (
    <>
      <Card className="shadow-lg border-t-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-blue-600" />
              <span className="text-[var(--wine-700)]">Documentação do Consórcio</span>
            </div>
            <Badge className="bg-blue-100 text-blue-700">
              {totalDocumentos} {totalDocumentos === 1 ? 'arquivo' : 'arquivos'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="adesao" className="relative">
                <FileText className="w-4 h-4 mr-2" />
                Adesão
                {(consorcio.documentos_adesao?.length || 0) > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 bg-green-500 text-white">
                    {consorcio.documentos_adesao.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contemplacao" className="relative">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Contemplação
                {(consorcio.documentos_contemplacao?.length || 0) > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 bg-green-500 text-white">
                    {consorcio.documentos_contemplacao.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="alienacao" className="relative">
                <FileSignature className="w-4 h-4 mr-2" />
                Alienação
                {(consorcio.documentos_alienacao?.length || 0) > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 bg-green-500 text-white">
                    {consorcio.documentos_alienacao.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="adesao">
              {renderDocumentos(
                consorcio.documentos_adesao,
                'adesao',
                'Documentos de Adesão',
                FileText,
                'text-blue-600'
              )}
            </TabsContent>

            <TabsContent value="contemplacao">
              {renderDocumentos(
                consorcio.documentos_contemplacao,
                'contemplacao',
                'Documentos de Contemplação',
                CheckCircle2,
                'text-green-600'
              )}
            </TabsContent>

            <TabsContent value="alienacao">
              {renderDocumentos(
                consorcio.documentos_alienacao,
                'alienacao',
                'Documentos de Alienação',
                FileSignature,
                'text-purple-600'
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este documento?
            </DialogDescription>
          </DialogHeader>
          {documentoParaDeletar && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{documentoParaDeletar.documento.nome}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(documentoParaDeletar.documento.data_upload).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-red-600 mt-3">
                ⚠️ Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDocumentoParaDeletar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (documentoParaDeletar) {
                  handleDeleteDocumento(
                    documentoParaDeletar.tipo,
                    documentoParaDeletar.index
                  );
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}