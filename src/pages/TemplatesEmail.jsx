import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Plus, Edit, Trash2, Copy, Eye, Search, FileCode,
  Tag, Clock, Send, Star, Filter
} from "lucide-react";
import { toast } from "sonner";

import TemplateForm from "../components/emailTemplates/TemplateForm";
import TemplatePreview from "../components/emailTemplates/TemplatePreview";
import TemplateCard from "../components/emailTemplates/TemplateCard";

export default function TemplatesEmail() {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowForm(false);
      setEditando(null);
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => toast.error("Erro ao criar: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowForm(false);
      setEditando(null);
      toast.success("Template atualizado!");
    },
    onError: (error) => toast.error("Erro ao atualizar: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success("Template excluído!");
    },
    onError: (error) => toast.error("Erro ao excluir: " + error.message)
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template) => {
      const novoCodigo = `${template.codigo}_copy_${Date.now()}`;
      const novoTemplate = {
        ...template,
        id: undefined,
        created_date: undefined,
        updated_date: undefined,
        created_by: undefined,
        nome: `${template.nome} (Cópia)`,
        codigo: novoCodigo,
        eh_padrao: false,
        total_envios: 0,
        ultima_utilizacao: null,
        historico_versoes: []
      };
      return await base44.entities.EmailTemplate.create(novoTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success("Template duplicado com sucesso!");
    },
    onError: (error) => toast.error("Erro ao duplicar: " + error.message)
  });

  const handleEditar = (template) => {
    setEditando(template);
    setShowForm(true);
  };

  const handleDuplicar = (template) => {
    duplicateMutation.mutate(template);
  };

  const handleExcluir = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSalvar = (data) => {
    if (editando) {
      // Salvar versão anterior no histórico
      const historicoAtualizado = editando.historico_versoes || [];
      historicoAtualizado.push({
        versao: editando.versao,
        data: new Date().toISOString(),
        alterado_por: 'Sistema',
        conteudo_html: editando.conteudo_html,
        observacoes: 'Versão anterior'
      });

      updateMutation.mutate({
        id: editando.id,
        data: {
          ...data,
          versao: (editando.versao || 1) + 1,
          historico_versoes: historicoAtualizado
        }
      });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filtros
  const templatesFiltrados = templates.filter(template => {
    const matchSearch = searchTerm === "" || 
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria = categoriaFiltro === "todos" || template.categoria === categoriaFiltro;

    return matchSearch && matchCategoria;
  });

  // Estatísticas
  const stats = {
    total: templates.length,
    ativos: templates.filter(t => t.ativo).length,
    transacionais: templates.filter(t => t.categoria === 'transacional').length,
    marketing: templates.filter(t => t.categoria === 'marketing').length,
  };

  const categorias = [
    { value: "todos", label: "Todas", icon: Mail },
    { value: "transacional", label: "Transacional", icon: Send },
    { value: "marketing", label: "Marketing", icon: Star },
    { value: "notificacao", label: "Notificação", icon: Mail },
    { value: "boas_vindas", label: "Boas-vindas", icon: Mail },
    { value: "cobranca", label: "Cobrança", icon: FileCode },
    { value: "financeiro", label: "Financeiro", icon: FileCode },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <TemplateForm
        template={editando}
        onSave={handleSalvar}
        onCancel={() => {
          setShowForm(false);
          setEditando(null);
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  if (previewTemplate) {
    return (
      <TemplatePreview
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onEdit={() => {
          handleEditar(previewTemplate);
          setPreviewTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Templates de Email</h1>
          <p className="text-gray-600 mt-1">Crie e gerencie templates reutilizáveis</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-[var(--wine-700)]">{stats.total}</p>
              </div>
              <Mail className="w-8 h-8 text-[var(--wine-600)]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transacionais</p>
                <p className="text-2xl font-bold text-blue-600">{stats.transacionais}</p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Marketing</p>
                <p className="text-2xl font-bold text-purple-600">{stats.marketing}</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, assunto ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categorias.map((cat) => (
                <Button
                  key={cat.value}
                  variant={categoriaFiltro === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoriaFiltro(cat.value)}
                  className={categoriaFiltro === cat.value ? "bg-[var(--wine-600)]" : ""}
                >
                  <cat.icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      {templatesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {searchTerm || categoriaFiltro !== "todos"
                  ? "Nenhum template encontrado com os filtros aplicados"
                  : "Nenhum template cadastrado"}
              </p>
              {!searchTerm && categoriaFiltro === "todos" && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesFiltrados.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleEditar(template)}
              onDuplicate={() => handleDuplicar(template)}
              onDelete={() => handleExcluir(template.id)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
}