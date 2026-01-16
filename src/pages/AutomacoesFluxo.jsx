import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Zap, Trash2, Settings, Play, Pause, MessageSquare,
  Mail, Bell, CheckCircle2, UserCheck, Tag, Send
} from "lucide-react";
import { toast } from "sonner";

export default function AutomacoesFluxo() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState(null);
  const [acoes, setAcoes] = useState([]);
  const queryClient = useQueryClient();

  const { data: automacoes = [] } = useQuery({
    queryKey: ['automacoes_fluxo'],
    queryFn: () => base44.entities.AutomacaoFluxo.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomacaoFluxo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes_fluxo']);
      setShowDialog(false);
      setEditingAutomacao(null);
      setAcoes([]);
      toast.success("Automação criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomacaoFluxo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes_fluxo']);
      setShowDialog(false);
      setEditingAutomacao(null);
      setAcoes([]);
      toast.success("Automação atualizada!");
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }) => base44.entities.AutomacaoFluxo.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes_fluxo']);
      toast.success("Status atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomacaoFluxo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes_fluxo']);
      toast.success("Automação removida!");
    },
  });

  const handleAddAcao = () => {
    setAcoes([...acoes, { tipo: 'enviar_mensagem', configuracao: {}, ordem: acoes.length, delay_segundos: 0 }]);
  };

  const handleRemoveAcao = (index) => {
    setAcoes(acoes.filter((_, i) => i !== index));
  };

  const handleAcaoChange = (index, field, value) => {
    const newAcoes = [...acoes];
    if (field === 'tipo') {
      newAcoes[index].tipo = value;
    } else {
      newAcoes[index].configuracao[field] = value;
    }
    setAcoes(newAcoes);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      gatilho: formData.get('gatilho'),
      acoes: acoes,
      ativo: true,
      estatisticas: {
        total_execucoes: 0,
        total_sucesso: 0,
        total_erro: 0
      }
    };

    if (editingAutomacao?.id) {
      updateMutation.mutate({ id: editingAutomacao.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getIconByAcao = (tipo) => {
    const icons = {
      enviar_mensagem: MessageSquare,
      criar_tarefa: CheckCircle2,
      atualizar_lead: UserCheck,
      notificar_atendente: Bell,
      enviar_email: Mail,
      adicionar_tag: Tag,
    };
    return icons[tipo] || Zap;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            Automações de Fluxo
          </h1>
          <p className="text-gray-600 mt-1">Automatize processos com gatilhos e ações</p>
        </div>
        <Button onClick={() => { 
          setEditingAutomacao(null); 
          setAcoes([]);
          setShowDialog(true); 
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Lista de Automações */}
      <div className="grid gap-4">
        {automacoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma automação configurada</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        ) : (
          automacoes.map((automacao) => (
            <Card key={automacao.id} className={automacao.ativo ? 'border-green-200' : 'border-gray-200'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {automacao.nome}
                      {automacao.ativo ? (
                        <Badge className="bg-green-600">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Pausada</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{automacao.descricao}</p>
                  </div>
                  <div className="flex gap-2">
                    <Switch
                      checked={automacao.ativo}
                      onCheckedChange={(checked) => 
                        toggleAtivoMutation.mutate({ id: automacao.id, ativo: checked })
                      }
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => { 
                        setEditingAutomacao(automacao); 
                        setAcoes(automacao.acoes || []);
                        setShowDialog(true); 
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Remover automação?')) {
                          deleteMutation.mutate(automacao.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Play className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Gatilho</p>
                      <p className="text-sm text-gray-700">{automacao.gatilho.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Ações ({automacao.acoes?.length || 0})</p>
                    {automacao.acoes?.map((acao, idx) => {
                      const Icon = getIconByAcao(acao.tipo);
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <p className="text-sm">{acao.tipo.replace(/_/g, ' ')}</p>
                          {acao.delay_segundos > 0 && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              +{acao.delay_segundos}s
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-600">Execuções</p>
                      <p className="text-lg font-bold">{automacao.estatisticas?.total_execucoes || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Sucesso</p>
                      <p className="text-lg font-bold text-green-600">{automacao.estatisticas?.total_sucesso || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Erro</p>
                      <p className="text-lg font-bold text-red-600">{automacao.estatisticas?.total_erro || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAutomacao?.id ? 'Editar Automação' : 'Nova Automação'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Automação</label>
              <Input 
                name="nome" 
                defaultValue={editingAutomacao?.nome}
                placeholder="Ex: Responder novos leads em 5 minutos"
                required 
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea 
                name="descricao" 
                defaultValue={editingAutomacao?.descricao}
                placeholder="Descreva o que esta automação faz..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Gatilho (Quando executar)</label>
              <Select name="gatilho" defaultValue={editingAutomacao?.gatilho || "novo_lead"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo_lead">Novo Lead Criado</SelectItem>
                  <SelectItem value="conversa_iniciada">Conversa Iniciada</SelectItem>
                  <SelectItem value="conversa_finalizada">Conversa Finalizada</SelectItem>
                  <SelectItem value="status_lead_alterado">Status do Lead Alterado</SelectItem>
                  <SelectItem value="mensagem_recebida">Mensagem Recebida</SelectItem>
                  <SelectItem value="tempo_sem_resposta">Tempo Sem Resposta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Ações a Executar</h3>
                <Button type="button" size="sm" onClick={handleAddAcao}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>

              <div className="space-y-3">
                {acoes.map((acao, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-600">
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-3">
                          <Select 
                            value={acao.tipo}
                            onValueChange={(value) => handleAcaoChange(idx, 'tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enviar_mensagem">Enviar Mensagem</SelectItem>
                              <SelectItem value="criar_tarefa">Criar Tarefa</SelectItem>
                              <SelectItem value="atualizar_lead">Atualizar Status Lead</SelectItem>
                              <SelectItem value="notificar_atendente">Notificar Atendente</SelectItem>
                              <SelectItem value="enviar_email">Enviar Email</SelectItem>
                              <SelectItem value="adicionar_tag">Adicionar Tag</SelectItem>
                            </SelectContent>
                          </Select>

                          {acao.tipo === 'enviar_mensagem' && (
                            <Textarea
                              placeholder="Digite a mensagem a ser enviada..."
                              value={acao.configuracao.mensagem || ''}
                              onChange={(e) => handleAcaoChange(idx, 'mensagem', e.target.value)}
                              rows={2}
                            />
                          )}

                          {acao.tipo === 'criar_tarefa' && (
                            <Input
                              placeholder="Título da tarefa"
                              value={acao.configuracao.titulo || ''}
                              onChange={(e) => handleAcaoChange(idx, 'titulo', e.target.value)}
                            />
                          )}

                          {acao.tipo === 'enviar_email' && (
                            <>
                              <Input
                                placeholder="Assunto do email"
                                value={acao.configuracao.assunto || ''}
                                onChange={(e) => handleAcaoChange(idx, 'assunto', e.target.value)}
                              />
                              <Textarea
                                placeholder="Corpo do email"
                                value={acao.configuracao.corpo || ''}
                                onChange={(e) => handleAcaoChange(idx, 'corpo', e.target.value)}
                                rows={3}
                              />
                            </>
                          )}
                        </div>

                        <Button 
                          type="button"
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRemoveAcao(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAutomacao?.id ? 'Salvar Alterações' : 'Criar Automação'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}