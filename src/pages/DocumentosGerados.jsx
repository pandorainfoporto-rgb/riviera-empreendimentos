import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Plus, Search, Edit, Eye, Share, Download, Trash2,
  File, FileClock, FileCheck, FileX
} from "lucide-react";

import GerarDocumentoDialog from "../components/documentos/GerarDocumentoDialog";
import VisualizarDocumentoDialog from "../components/documentos/VisualizarDocumentoDialog";
import EditarDocumentoDialog from "../components/documentos/EditarDocumentoDialog";

const statusColors = {
  rascunho: "bg-gray-100 text-gray-800",
  em_revisao: "bg-blue-100 text-blue-800",
  aguardando_assinaturas: "bg-yellow-100 text-yellow-800",
  assinado: "bg-green-100 text-green-800",
  arquivado: "bg-purple-100 text-purple-800",
  cancelado: "bg-red-100 text-red-800"
};

const statusLabels = {
  rascunho: "Rascunho",
  em_revisao: "Em Revisão",
  aguardando_assinaturas: "Aguardando Assinaturas",
  assinado: "Assinado",
  arquivado: "Arquivado",
  cancelado: "Cancelado"
};

const statusIcons = {
  rascunho: FileClock,
  em_revisao: FileText,
  aguardando_assinaturas: FileClock,
  assinado: FileCheck,
  arquivado: File,
  cancelado: FileX
};

export default function DocumentosGeradosPage() {
  const [busca, setBusca] = useState("");
  const [showGerarDialog, setShowGerarDialog] = useState(false);
  const [documentoVisualizando, setDocumentoVisualizando] = useState(null);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const queryClient = useQueryClient();

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos_gerados'],
    queryFn: () => base44.entities.DocumentoGerado.list('-created_date'),
  });

  const documentosFiltrados = documentos.filter(d =>
    d.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    d.numero_documento?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleVisualizar = (documento) => {
    setDocumentoVisualizando(documento);
  };

  const handleEditar = (documento) => {
    setDocumentoEditando(documento);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Documentos Gerados</h1>
          <p className="text-gray-600 mt-1">Contratos, propostas e documentos criados</p>
        </div>
        <Button 
          onClick={() => setShowGerarDialog(true)} 
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Gerar Documento
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar documentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando documentos...</p>
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {busca ? 'Nenhum documento encontrado' : 'Nenhum documento gerado ainda'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Gere seu primeiro documento com IA'}
            </p>
            {!busca && (
              <Button 
                onClick={() => setShowGerarDialog(true)} 
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Gerar Primeiro Documento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documentosFiltrados.map((documento) => {
            const StatusIcon = statusIcons[documento.status] || FileText;
            
            return (
              <Card key={documento.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-[var(--wine-50)] rounded-lg flex-shrink-0">
                        <StatusIcon className="w-6 h-6 text-[var(--wine-600)]" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{documento.titulo}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{documento.numero_documento}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {new Date(documento.data_geracao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[documento.status]}>
                        {statusLabels[documento.status]}
                      </Badge>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVisualizar(documento)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </Button>
                        {documento.status === 'rascunho' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditar(documento)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showGerarDialog && (
        <GerarDocumentoDialog
          open={showGerarDialog}
          onClose={() => setShowGerarDialog(false)}
        />
      )}

      {documentoVisualizando && (
        <VisualizarDocumentoDialog
          documento={documentoVisualizando}
          open={!!documentoVisualizando}
          onClose={() => setDocumentoVisualizando(null)}
        />
      )}

      {documentoEditando && (
        <EditarDocumentoDialog
          documento={documentoEditando}
          open={!!documentoEditando}
          onClose={() => setDocumentoEditando(null)}
        />
      )}
    </div>
  );
}