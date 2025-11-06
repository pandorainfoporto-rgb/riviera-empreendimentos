import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  X, User, Phone, Mail, DollarSign, Calendar, MessageSquare,
  Plus, CheckCircle2, Clock, MapPin, FileText, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoIcons = {
  email: Mail,
  telefone: Phone,
  whatsapp: MessageSquare,
  reuniao: Calendar,
  visita: MapPin,
  proposta: FileText,
  nota: MessageSquare,
};

export default function LeadDetalhes({ lead, atividades, tarefas, onClose, onUpdate, imobiliarias, corretores }) {
  const [novaAtividade, setNovaAtividade] = useState({
    tipo: "nota",
    assunto: "",
    descricao: "",
    resultado: "pendente",
  });
  const [novaTarefa, setNovaTarefa] = useState({
    tipo: "ligar",
    titulo: "",
    descricao: "",
    data_agendada: "",
    prioridade: "media",
  });

  const queryClient = useQueryClient();

  const createAtividadeMutation = useMutation({
    mutationFn: (data) => base44.entities.AtividadeLead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades_leads'] });
      setNovaAtividade({ tipo: "nota", assunto: "", descricao: "", resultado: "pendente" });
      alert("Atividade registrada!");
    },
  });

  const createTarefaMutation = useMutation({
    mutationFn: (data) => base44.entities.TarefaFollowUp.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas_followup'] });
      setNovaTarefa({ tipo: "ligar", titulo: "", descricao: "", data_agendada: "", prioridade: "media" });
      alert("Tarefa agendada!");
    },
  });

  const handleRegistrarAtividade = async (e) => {
    e.preventDefault();
    
    const user = await base44.auth.me();
    await createAtividadeMutation.mutateAsync({
      ...novaAtividade,
      lead_id: lead.id,
      data_atividade: new Date().toISOString(),
      usuario_responsavel: user.email,
    });

    onUpdate({
      data_ultima_interacao: new Date().toISOString(),
      tentativas_contato: (lead.tentativas_contato || 0) + 1,
    });
  };

  const handleAgendarTarefa = async (e) => {
    e.preventDefault();
    
    const user = await base44.auth.me();
    createTarefaMutation.mutate({
      ...novaTarefa,
      lead_id: lead.id,
      responsavel: user.email,
      status: "pendente",
    });
  };

  const imobiliaria = imobiliarias.find(i => i.id === lead.imobiliaria_id);
  const corretor = corretores.find(c => c.id === lead.corretor_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col my-4">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[var(--wine-50)] to-white">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--wine-700)]">{lead.nome_cliente}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-blue-100 text-blue-700">{lead.status}</Badge>
              <Badge className="bg-purple-100 text-purple-700">{lead.estagio_funil}</Badge>
              {lead.temperatura_lead && (
                <Badge className={
                  lead.temperatura_lead === 'muito_quente' ? 'bg-red-100 text-red-700' :
                  lead.temperatura_lead === 'quente' ? 'bg-orange-100 text-orange-700' :
                  lead.temperatura_lead === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {lead.temperatura_lead}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{lead.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  {lead.valor_proposta && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">R$ {lead.valor_proposta.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {lead.renda_mensal && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span>Renda: R$ {lead.renda_mensal.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métricas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tentativas:</span>
                    <span className="font-semibold">{lead.tentativas_contato || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emails:</span>
                    <span className="font-semibold">{lead.emails_enviados || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ligações:</span>
                    <span className="font-semibold">{lead.ligacoes_realizadas || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {(imobiliaria || corretor) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Responsável</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {imobiliaria && (
                      <div>
                        <p className="text-gray-600">Imobiliária:</p>
                        <p className="font-semibold">{imobiliaria.nome}</p>
                      </div>
                    )}
                    {corretor && (
                      <div>
                        <p className="text-gray-600">Corretor:</p>
                        <p className="font-semibold">{corretor.nome}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="md:col-span-2">
              <Tabs defaultValue="atividades">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="atividades">Atividades ({atividades.length})</TabsTrigger>
                  <TabsTrigger value="tarefas">Tarefas ({tarefas.filter(t => t.status === 'pendente').length})</TabsTrigger>
                </TabsList>

                <TabsContent value="atividades" className="space-y-4 mt-4">
                  <Card className="bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-base">Registrar Atividade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleRegistrarAtividade} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <Select value={novaAtividade.tipo} onValueChange={(val) => setNovaAtividade({...novaAtividade, tipo: val})}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="telefone">Ligação</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="reuniao">Reunião</SelectItem>
                                <SelectItem value="visita">Visita</SelectItem>
                                <SelectItem value="proposta">Proposta</SelectItem>
                                <SelectItem value="nota">Nota</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Resultado</Label>
                            <Select value={novaAtividade.resultado} onValueChange={(val) => setNovaAtividade({...novaAtividade, resultado: val})}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sucesso">Sucesso</SelectItem>
                                <SelectItem value="sem_sucesso">Sem Sucesso</SelectItem>
                                <SelectItem value="nao_atendeu">Não Atendeu</SelectItem>
                                <SelectItem value="reagendar">Reagendar</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Assunto</Label>
                          <Input
                            value={novaAtividade.assunto}
                            onChange={(e) => setNovaAtividade({...novaAtividade, assunto: e.target.value})}
                            placeholder="Ex: Envio de proposta..."
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição</Label>
                          <Textarea
                            value={novaAtividade.descricao}
                            onChange={(e) => setNovaAtividade({...novaAtividade, descricao: e.target.value})}
                            rows={3}
                            className="text-sm"
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full bg-[var(--wine-600)]">
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    {atividades.map((atividade) => {
                      const Icon = tipoIcons[atividade.tipo] || MessageSquare;
                      
                      return (
                        <Card key={atividade.id}>
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                                <Icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-semibold text-sm">{atividade.assunto}</h4>
                                  <Badge variant="outline" className="text-xs">{atividade.resultado}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{atividade.descricao}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(atividade.data_atividade), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  {atividade.usuario_responsavel && ` • ${atividade.usuario_responsavel}`}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {atividades.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhuma atividade registrada</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="tarefas" className="space-y-4 mt-4">
                  <Card className="bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-base">Agendar Follow-up</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAgendarTarefa} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <Select value={novaTarefa.tipo} onValueChange={(val) => setNovaTarefa({...novaTarefa, tipo: val})}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ligar">Ligar</SelectItem>
                                <SelectItem value="enviar_email">Enviar Email</SelectItem>
                                <SelectItem value="enviar_whatsapp">Enviar WhatsApp</SelectItem>
                                <SelectItem value="agendar_visita">Agendar Visita</SelectItem>
                                <SelectItem value="enviar_proposta">Enviar Proposta</SelectItem>
                                <SelectItem value="reuniao">Reunião</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Prioridade</Label>
                            <Select value={novaTarefa.prioridade} onValueChange={(val) => setNovaTarefa({...novaTarefa, prioridade: val})}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baixa">Baixa</SelectItem>
                                <SelectItem value="media">Média</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Título</Label>
                          <Input
                            value={novaTarefa.titulo}
                            onChange={(e) => setNovaTarefa({...novaTarefa, titulo: e.target.value})}
                            placeholder="Ex: Ligar para apresentar lote..."
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Data/Hora</Label>
                          <Input
                            type="datetime-local"
                            value={novaTarefa.data_agendada}
                            onChange={(e) => setNovaTarefa({...novaTarefa, data_agendada: e.target.value})}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full bg-orange-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Agendar
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    {tarefas.map((tarefa) => (
                      <Card key={tarefa.id} className={tarefa.status === 'concluida' ? 'opacity-60' : tarefa.status === 'atrasada' ? 'border-red-300' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              tarefa.status === 'concluida' ? 'bg-green-100' :
                              tarefa.status === 'atrasada' ? 'bg-red-100' : 'bg-orange-100'
                            }`}>
                              {tarefa.status === 'concluida' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-orange-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{tarefa.titulo}</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {format(new Date(tarefa.data_agendada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{tarefa.tipo}</Badge>
                                <Badge className={`text-xs ${
                                  tarefa.prioridade === 'urgente' ? 'bg-red-100 text-red-700' :
                                  tarefa.prioridade === 'alta' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {tarefa.prioridade}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {tarefas.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhuma tarefa agendada</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}