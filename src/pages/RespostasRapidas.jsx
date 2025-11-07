import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Plus, Search, Edit, Trash2, Copy, Eye, Star, Mail
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import CriarTemplateDialog from "../components/comunicacao/CriarTemplateDialog";

const categoriaColors = {
  financeiro: "bg-green-100 text-green-700",
  obra: "bg-orange-100 text-orange-700",
  documentacao: "bg-blue-100 text-blue-700",
  agendamento: "bg-purple-100 text-purple-700",
  suporte: "bg-yellow-100 text-yellow-700",
  geral: "bg-gray-100 text-gray-700",
  urgente: "bg-red-100 text-red-700",
  boas_vindas: "bg-pink-100 text-pink-700",
  follow_up: "bg-indigo-100 text-indigo-700"
};

const categoriaLabels = {
  financeiro: "Financeiro",
  obra: "Obra",
  documentacao: "Documentação",
  agendamento: "Agendamento",
  suporte: "Suporte",
  geral: "Geral",
  urgente: "Urgente",
  boas_vindas: "Boas-vindas",
  follow_up: "Follow-up"
};

export default function RespostasRapidasPage() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [templateEditando, setTemplateEditando] = useState(null);
  const [templateParaDeletar, setTemplateParaDeletar] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['respostas_template_all'],
    queryFn: () => base44.entities.RespostaTemplate.list('-total_usos'),
  });

  const deletarMutation = useMutation({
    mutationFn: (id) => base44.entities.RespostaTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_template_all']);
      queryClient.invalidateQueries(['respostas_template']);
      setTemplateParaDeletar(null);
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async (template) => {
      const novo = {
        ...template,
        nome: `${template.nome} (Cópia)`,
        codigo: `${template.codigo}_COPY_${Date.now()}`,
        total_usos: 0
      };
      delete novo.id;
      delete novo.created_date;
      delete novo.updated_date;
      delete novo.created_by;
      
      return base44.entities.RespostaTemplate.create(novo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_template_all']);
      queryClient.invalidateQueries(['respostas_template']);
    },
  });

  const toggleFavoritoMutation = useMutation({
    mutationFn: ({ id, favorito }) => base44.entities.RespostaTemplate.update(id, { favorito: !favorito }),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_template_all']);
      queryClient.invalidateQueries(['respostas_template']);
    },
  });

  const templatesFiltrados = templates
    .filter(t => {
      const matchBusca = t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                        t.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
                        t.conteudo?.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
      return matchBusca && matchCategoria;
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Respostas Rápidas</h1>
          <p className="text-gray-600 mt-1">Gerencie templates de mensagens para atendimento ágil</p>
        </div>
        <Button 
          onClick={() => {
            setTemplateEditando(null);
            setShowForm(true);
          }} 
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar templates..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="obra">Obra</SelectItem>
            <SelectItem value="documentacao">Documentação</SelectItem>
            <SelectItem value="agendamento">Agendamento</SelectItem>
            <SelectItem value="suporte">Suporte</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="boas_vindas">Boas-vindas</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        </div>
      ) : templatesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {busca || filtroCategoria !== 'todas' ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca || filtroCategoria !== 'todas' ? 'Tente ajustar os filtros' : 'Crie templates para agilizar o atendimento aos clientes'}
            </p>
            {!busca && filtroCategoria === 'todas' && (
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesFiltrados.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base truncate">{template.nome}</CardTitle>
                      {template.favorito && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoriaColors[template.categoria]}>
                        {categoriaLabels[template.categoria]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.codigo}
                      </Badge>
                      {template.enviar_email_automatico && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {template.conteudo}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">
                    Usado {template.total_usos || 0} vezes
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavoritoMutation.mutate({ id: template.id, favorito: template.favorito })}
                  >
                    <Star className={`w-4 h-4 ${template.favorito ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTemplatePreview(template)}
                    className="text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTemplateEditando(template);
                      setShowForm(true);
                    }}
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicarMutation.mutate(template)}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTemplateParaDeletar(template)}
                  className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <CriarTemplateDialog
          open={showForm}
          template={templateEditando}
          onClose={() => {
            setShowForm(false);
            setTemplateEditando(null);
          }}
        />
      )}

      {/* Preview Dialog */}
      {templatePreview && (
        <AlertDialog open={!!templatePreview} onOpenChange={() => setTemplatePreview(null)}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--wine-600)]" />
                {templatePreview.nome}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4 text-left">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={categoriaColors[templatePreview.categoria]}>
                      {categoriaLabels[templatePreview.categoria]}
                    </Badge>
                    <Badge variant="outline">{templatePreview.codigo}</Badge>
                    {templatePreview.enviar_email_automatico && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Mail className="w-3 h-3 mr-1" />
                        Envia Email Automático
                      </Badge>
                    )}
                    {templatePreview.favorito && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <Star className="w-3 h-3 mr-1" />
                        Favorito
                      </Badge>
                    )}
                  </div>
                  
                  {templatePreview.assunto_sugerido && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Assunto:</p>
                      <p className="text-sm text-gray-900">{templatePreview.assunto_sugerido}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Conteúdo:</p>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {templatePreview.conteudo}
                      </p>
                    </div>
                  </div>
                  
                  {templatePreview.placeholders && templatePreview.placeholders.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Placeholders disponíveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {templatePreview.placeholders.map((ph, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {ph.chave}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-600">Total de usos</p>
                      <p className="text-lg font-bold text-gray-900">{templatePreview.total_usos || 0}</p>
                    </div>
                    {templatePreview.criar_tarefa_followup && (
                      <div>
                        <p className="text-xs text-gray-600">Follow-up após</p>
                        <p className="text-lg font-bold text-gray-900">{templatePreview.dias_followup} dias</p>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setTemplateEditando(templatePreview);
                  setTemplatePreview(null);
                  setShowForm(true);
                }}
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Deletar Dialog */}
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