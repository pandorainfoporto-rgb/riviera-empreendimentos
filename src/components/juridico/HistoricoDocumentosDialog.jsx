import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History, Eye, RotateCcw, GitCompare, FileText, Calendar, User,
  ChevronDown, ChevronUp, Copy, Check, Trash2, Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function HistoricoDocumentosDialog({
  open,
  onClose,
  documentos,
  onRestaurar,
  onExcluir,
  onVisualizar,
}) {
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const tiposLabel = {
    contrato_compra_venda: "Compra e Venda",
    contrato_locacao: "Locação",
    contrato_parceria: "Parceria/Sociedade",
    contrato_prestacao_servicos: "Prestação de Serviços",
    contrato_empreitada: "Empreitada",
    distrato: "Distrato",
    aditivo: "Aditivo",
    procuracao: "Procuração",
    declaracao: "Declaração",
    notificacao: "Notificação",
    termo_entrega: "Termo de Entrega",
    termo_vistoria: "Termo de Vistoria",
  };

  const statusColors = {
    rascunho: "bg-yellow-100 text-yellow-800",
    finalizado: "bg-green-100 text-green-800",
    arquivado: "bg-gray-100 text-gray-800",
  };

  const handleSelectDoc = (id) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== id));
    } else if (selectedDocs.length < 2) {
      setSelectedDocs([...selectedDocs, id]);
    }
  };

  const handleCopiar = (texto) => {
    navigator.clipboard.writeText(texto);
    toast.success("Documento copiado!");
  };

  // Agrupar documentos por documento_pai_id ou id próprio
  const documentosAgrupados = documentos.reduce((acc, doc) => {
    const grupoId = doc.documento_pai_id || doc.id;
    if (!acc[grupoId]) {
      acc[grupoId] = [];
    }
    acc[grupoId].push(doc);
    return acc;
  }, {});

  // Ordenar cada grupo por versão
  Object.keys(documentosAgrupados).forEach((key) => {
    documentosAgrupados[key].sort((a, b) => (b.versao || 1) - (a.versao || 1));
  });

  const doc1 = documentos.find((d) => d.id === selectedDocs[0]);
  const doc2 = documentos.find((d) => d.id === selectedDocs[1]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Documentos Gerados
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="lista" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="lista">
              <FileText className="w-4 h-4 mr-2" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="comparar" disabled={selectedDocs.length !== 2}>
              <GitCompare className="w-4 h-4 mr-2" />
              Comparar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="flex-1 overflow-hidden mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {documentos.length} documento(s) no histórico
              </p>
              {selectedDocs.length > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {selectedDocs.length} selecionado(s) para comparação
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {Object.entries(documentosAgrupados).map(([grupoId, versoes]) => {
                  const docPrincipal = versoes.find((v) => !v.documento_pai_id) || versoes[0];
                  const isExpanded = expandedId === grupoId;

                  return (
                    <Card key={grupoId} className="border">
                      <CardHeader className="py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : grupoId)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <div>
                              <CardTitle className="text-base">{docPrincipal.titulo}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {tiposLabel[docPrincipal.tipo_documento] || docPrincipal.tipo_documento}
                                </Badge>
                                <Badge className={statusColors[docPrincipal.status] || statusColors.rascunho}>
                                  {docPrincipal.status || "rascunho"}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  {versoes.length} versão(ões)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {format(new Date(docPrincipal.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-2 border-t pt-3">
                            {versoes.map((doc) => (
                              <div
                                key={doc.id}
                                className={`p-3 rounded-lg border ${
                                  selectedDocs.includes(doc.id)
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedDocs.includes(doc.id)}
                                      onChange={() => handleSelectDoc(doc.id)}
                                      className="w-4 h-4"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          Versão {doc.versao || 1}
                                        </span>
                                        {doc.versao === versoes[0]?.versao && (
                                          <Badge className="bg-green-100 text-green-700 text-xs">
                                            Atual
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {format(new Date(doc.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {doc.created_by}
                                        </span>
                                      </div>
                                      {doc.alteracoes_resumo && (
                                        <p className="text-xs text-blue-600 mt-1 italic">
                                          {doc.alteracoes_resumo}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onVisualizar(doc)}
                                      title="Visualizar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCopiar(doc.documento_conteudo)}
                                      title="Copiar"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    {doc.versao !== versoes[0]?.versao && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onRestaurar(doc)}
                                        title="Restaurar esta versão"
                                        className="text-blue-600"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onExcluir(doc.id)}
                                      title="Excluir"
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}

                {documentos.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento no histórico ainda.</p>
                    <p className="text-sm">Gere documentos para vê-los aqui.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comparar" className="flex-1 overflow-hidden mt-4">
            {doc1 && doc2 ? (
              <div className="grid grid-cols-2 gap-4 h-[500px]">
                <div className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-blue-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-800">
                        Versão {doc1.versao || 1}
                      </span>
                      <span className="text-xs text-blue-600">
                        {format(new Date(doc1.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {doc1.documento_conteudo}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-green-50 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800">
                        Versão {doc2.versao || 1}
                      </span>
                      <span className="text-xs text-green-600">
                        {format(new Date(doc2.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {doc2.documento_conteudo}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione 2 versões para comparar</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}