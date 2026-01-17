import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, Calendar, Database, Play, Pause, Trash2, Plus, 
  CheckCircle2, XCircle, AlertCircle, Edit, Zap 
} from "lucide-react";
import AutomacaoForm from "../components/automacoes/AutomacaoForm";
import { base44 } from "@/api/base44Client";

export default function GestorAutomacoes() {
  const [showForm, setShowForm] = useState(false);
  const [editingAutomacao, setEditingAutomacao] = useState(null);
  const queryClient = useQueryClient();

  const { data: automacoes = [], isLoading } = useQuery({
    queryKey: ['automacoes'],
    queryFn: async () => {
      const response = await fetch('/api/automations', {
        headers: {
          'Authorization': `Bearer ${await base44.auth.getToken()}`
        }
      });
      const data = await response.json();
      return data.automations || [];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch(`/api/automations/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await base44.auth.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !is_active })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await base44.auth.getToken()}`
        }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automacoes']);
    }
  });

  const handleEdit = (automacao) => {
    setEditingAutomacao(automacao);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAutomacao(null);
  };

  const agendadas = automacoes.filter(a => a.automation_type === 'scheduled');
  const entidades = automacoes.filter(a => a.automation_type === 'entity');

  const getStatusBadge = (automacao) => {
    if (!automacao.is_active) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">Pausado</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Ativo</Badge>;
  };

  const getScheduleText = (automacao) => {
    if (automacao.schedule_mode === 'one-time') {
      return `Uma vez em ${new Date(automacao.one_time_date).toLocaleString('pt-BR')}`;
    }
    
    if (automacao.schedule_type === 'cron') {
      return `Cron: ${automacao.cron_expression}`;
    }

    let text = `A cada ${automacao.repeat_interval} ${automacao.repeat_unit}`;
    
    if (automacao.repeat_unit === 'weeks' && automacao.repeat_on_days?.length) {
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      text += ` (${automacao.repeat_on_days.map(d => dias[d]).join(', ')})`;
    }
    
    if (automacao.start_time) {
      text += ` às ${automacao.start_time}`;
    }

    return text;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)]"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-6">
        <AutomacaoForm 
          automacao={editingAutomacao} 
          onClose={handleCloseForm}
          onSuccess={() => {
            handleCloseForm();
            queryClient.invalidateQueries(['automacoes']);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Automações</h1>
          <p className="text-gray-600 mt-1">Execute tarefas automaticamente em horários programados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <Tabs defaultValue="agendadas" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agendadas">
            <Clock className="w-4 h-4 mr-2" />
            Agendadas ({agendadas.length})
          </TabsTrigger>
          <TabsTrigger value="entidades">
            <Database className="w-4 h-4 mr-2" />
            Por Evento ({entidades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendadas" className="space-y-4">
          {agendadas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Nenhuma automação agendada. Crie uma para começar!
              </CardContent>
            </Card>
          ) : (
            agendadas.map((automacao) => (
              <Card key={automacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{automacao.name}</CardTitle>
                        {getStatusBadge(automacao)}
                      </div>
                      {automacao.description && (
                        <CardDescription>{automacao.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {getScheduleText(automacao)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {automacao.function_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMutation.mutate({ 
                          id: automacao.id, 
                          is_active: automacao.is_active 
                        })}
                      >
                        {automacao.is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(automacao)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta automação?')) {
                            deleteMutation.mutate(automacao.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="entidades" className="space-y-4">
          {entidades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Nenhuma automação por evento. Crie uma para reagir a mudanças nos dados!
              </CardContent>
            </Card>
          ) : (
            entidades.map((automacao) => (
              <Card key={automacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{automacao.name}</CardTitle>
                        {getStatusBadge(automacao)}
                      </div>
                      {automacao.description && (
                        <CardDescription>{automacao.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          {automacao.entity_name}
                        </div>
                        <div className="flex gap-1">
                          {automacao.event_types?.map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event === 'create' ? 'Criar' : event === 'update' ? 'Atualizar' : 'Deletar'}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {automacao.function_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleMutation.mutate({ 
                          id: automacao.id, 
                          is_active: automacao.is_active 
                        })}
                      >
                        {automacao.is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(automacao)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta automação?')) {
                            deleteMutation.mutate(automacao.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}