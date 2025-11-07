import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Send, Plus, Edit, Trash2, Copy } from "lucide-react";

import CriarTemplateDialog from "./CriarTemplateDialog";

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

export default function RespostasTemplateDialog({ open, onClose, cliente, conversaId }) {
  const [busca, setBusca] = useState("");
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [mensagemPreview, setMensagemPreview] = useState("");
  const [showCriarTemplate, setShowCriarTemplate] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['respostas_template'],
    queryFn: () => base44.entities.RespostaTemplate.list('-total_usos'),
  });

  const usarTemplateMutation = useMutation({
    mutationFn: async (template) => {
      // Processar placeholders
      let mensagemProcessada = template.conteudo;
      
      if (cliente) {
        const placeholders = {
          '{{nome_cliente}}': cliente.nome,
          '{{email_cliente}}': cliente.email,
          '{{telefone_cliente}}': cliente.telefone || 'Não informado',
          '{{cpf_cnpj}}': cliente.cpf_cnpj || '',
          '{{data_hoje}}': new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
        };

        Object.entries(placeholders).forEach(([chave, valor]) => {
          mensagemProcessada = mensagemProcessada.replaceAll(chave, valor);
        });
      }

      const resultado = await base44.functions.invoke('enviarMensagemComEmail', {
        cliente_id: cliente.id,
        titulo: template.assunto_sugerido || 'Mensagem',
        mensagem: mensagemProcessada,
        assunto: template.categoria,
        conversa_id: conversaId,
        enviar_email: template.enviar_email_automatico,
        anexos: template.anexos_padrao || [],
        resposta_template_id: template.id,
        prioridade: template.categoria === 'urgente' ? 'urgente' : 'normal'
      });

      return resultado.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensagens_todas']);
      onClose();
    },
  });

  const deletarMutation = useMutation({
    mutationFn: (id) => base44.entities.RespostaTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_template']);
    },
  });

  const templatesFiltrados = templates.filter(t =>
    t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    t.categoria?.toLowerCase().includes(busca.toLowerCase())
  );

  const templatesFavoritos = templatesFiltrados.filter(t => t.favorito);
  const templatesRecentes = templatesFiltrados.sort((a, b) => (b.total_usos || 0) - (a.total_usos || 0)).slice(0, 5);

  const handlePreview = (template) => {
    setTemplateSelecionado(template);
    
    let preview = template.conteudo;
    if (cliente) {
      const placeholders = {
        '{{nome_cliente}}': cliente.nome,
        '{{email_cliente}}': cliente.email,
        '{{data_hoje}}': new Date().toLocaleDateString('pt-BR'),
      };
      Object.entries(placeholders).forEach(([chave, valor]) => {
        preview = preview.replaceAll(chave, valor);
      });
    }
    setMensagemPreview(preview);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Respostas Rápidas</DialogTitle>
              <Button
                size="sm"
                onClick={() => setShowCriarTemplate(true)}
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar Template
              </Button>
            </div>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar templates..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-4">
            {/* Lista de Templates */}
            <div className="overflow-y-auto space-y-2 pr-2">
              <Tabs defaultValue="todos" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
                  <TabsTrigger value="recentes">Mais Usados</TabsTrigger>
                </TabsList>

                <TabsContent value="todos" className="mt-3 space-y-2">
                  {templatesFiltrados.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        templateSelecionado?.id === template.id ? 'border-2 border-[var(--wine-600)]' : ''
                      }`}
                      onClick={() => handlePreview(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm truncate">{template.nome}</h4>
                              {template.favorito && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {template.conteudo.substring(0, 80)}...
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${categoriaColors[template.categoria]}`}>
                                {categoriaLabels[template.categoria]}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {template.total_usos || 0} usos
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => deletarMutation.mutate(template.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="favoritos" className="mt-3 space-y-2">
                  {templatesFavoritos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhum template favorito</p>
                  ) : (
                    templatesFavoritos.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handlePreview(template)}
                      >
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm mb-1">{template.nome}</h4>
                          <p className="text-xs text-gray-600 line-clamp-1">{template.conteudo.substring(0, 80)}...</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="recentes" className="mt-3 space-y-2">
                  {templatesRecentes.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handlePreview(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{template.nome}</h4>
                            <p className="text-xs text-gray-600 line-clamp-1">{template.conteudo.substring(0, 80)}...</p>
                          </div>
                          <Badge variant="secondary">{template.total_usos || 0}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview */}
            <div className="border-l pl-4 overflow-y-auto">
              {templateSelecionado ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{templateSelecionado.nome}</h3>
                    <div className="flex gap-2 mb-4">
                      <Badge className={categoriaColors[templateSelecionado.categoria]}>
                        {categoriaLabels[templateSelecionado.categoria]}
                      </Badge>
                      {templateSelecionado.enviar_email_automatico && (
                        <Badge variant="outline">
                          <Mail className="w-3 h-3 mr-1" />
                          Envia Email
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Preview:</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap text-sm">
                      {mensagemPreview}
                    </div>
                  </div>

                  {templateSelecionado.anexos_padrao && templateSelecionado.anexos_padrao.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Anexos Incluídos:</Label>
                      <div className="mt-2 space-y-1">
                        {templateSelecionado.anexos_padrao.map((anexo, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {anexo.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => usarTemplateMutation.mutate(templateSelecionado)}
                    disabled={!cliente || usarTemplateMutation.isPending}
                    className="w-full bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {usarTemplateMutation.isPending ? 'Enviando...' : 'Usar este Template'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Star className="w-12 h-12 mx-auto mb-3" />
                    <p>Selecione um template para visualizar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showCriarTemplate && (
        <CriarTemplateDialog
          open={showCriarTemplate}
          onClose={() => setShowCriarTemplate(false)}
        />
      )}
    </>
  );
}