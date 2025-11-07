import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Plus, Search, Edit, Trash2, Copy, Star, Download,
  FileCheck, FileSignature, FileBadge, File
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import TemplateDocumentoForm from "../components/documentos/TemplateDocumentoForm";

const tipoIcons = {
  contrato_venda: FileSignature,
  contrato_locacao: FileCheck,
  proposta_venda: FileBadge,
  ficha_cadastral: FileText,
  escritura: File,
  distrato: FileText,
  personalizado: FileText
};

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
  ata_reuniao: "Ata de Reunião",
  relatorio_obra: "Relatório de Obra",
  memorial_descritivo: "Memorial Descritivo",
  personalizado: "Personalizado"
};

const categoriaColors = {
  juridico: "bg-purple-100 text-purple-800",
  comercial: "bg-blue-100 text-blue-800",
  administrativo: "bg-gray-100 text-gray-800",
  tecnico: "bg-orange-100 text-orange-800",
  financeiro: "bg-green-100 text-green-800"
};

export default function DocumentosTemplatesPage() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [templateEditando, setTemplateEditando] = useState(null);
  const [templateParaDeletar, setTemplateParaDeletar] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates_documentos'],
    queryFn: () => base44.entities.DocumentoTemplate.list('-created_date'),
  });

  const deletarMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentoTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates_documentos']);
      setTemplateParaDeletar(null);
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async (template) => {
      const novo = {
        ...template,
        nome: `${template.nome} (Cópia)`,
        codigo: `${template.codigo}_COPY_${Date.now()}`,
        eh_padrao: false,
        total_usos: 0
      };
      delete novo.id;
      delete novo.created_date;
      delete novo.updated_date;
      delete novo.created_by;
      
      return base44.entities.DocumentoTemplate.create(novo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates_documentos']);
    },
  });

  const templatesFiltrados = templates.filter(t =>
    t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    t.tipo?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleEditar = (template) => {
    setTemplateEditando(template);
    setShowForm(true);
  };

  const handleNovo = () => {
    setTemplateEditando(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTemplateEditando(null);
  };

  if (showForm) {
    return (
      <TemplateDocumentoForm
        template={templateEditando}
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Templates de Documentos</h1>
          <p className="text-gray-600 mt-1">Gerencie templates para geração automática com IA</p>
        </div>
        <Button onClick={handleNovo} className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
          <Plus className="w-5 h-5 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar templates..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando templates...</p>
        </div>
      ) : templatesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {busca ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Crie seu primeiro template de documento'}
            </p>
            {!busca && (
              <Button onClick={handleNovo} className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesFiltrados.map((template) => {
            const TipoIcon = tipoIcons[template.tipo] || FileText;
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-[var(--wine-50)] rounded-lg flex-shrink-0">
                        <TipoIcon className="w-5 h-5 text-[var(--wine-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base truncate">{template.nome}</CardTitle>
                          {template.eh_padrao && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {tipoLabels[template.tipo] || template.tipo}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoriaColors[template.categoria]}>
                        {template.categoria}
                      </Badge>
                      <Badge variant="outline">
                        {template.total_usos || 0} usos
                      </Badge>
                      {!template.ativo && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>

                    {template.descricao && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.descricao}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditar(template)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicarMutation.mutate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTemplateParaDeletar(template)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!templateParaDeletar} onOpenChange={() => setTemplateParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateParaDeletar?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletarMutation.mutate(templateParaDeletar.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}