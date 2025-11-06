import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, Clock, Phone, Mail, MessageSquare } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function TarefasFollowUp({ tarefas, leads }) {
  const [conclusaoForm, setConclusaoForm] = useState({});
  const queryClient = useQueryClient();

  const concluirTarefaMutation = useMutation({
    mutationFn: ({ id, resultado }) => base44.entities.TarefaFollowUp.update(id, {
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
      resultado,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas_followup'] });
      setConclusaoForm({});
      toast.success("Tarefa concluída!");
    },
  });

  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente');
  const tarefasHoje = tarefasPendentes.filter(t => isToday(new Date(t.data_agendada)));
  const tarefasAtrasadas = tarefasPendentes.filter(t => isPast(new Date(t.data_agendada)) && !isToday(new Date(t.data_agendada)));
  const tarefasFuturas = tarefasPendentes.filter(t => !isPast(new Date(t.data_agendada)));

  const tipoIcons = {
    ligar: Phone,
    enviar_email: Mail,
    enviar_whatsapp: MessageSquare,
    agendar_visita: Calendar,
  };

  const renderTarefa = (tarefa) => {
    const lead = leads.find(l => l.id === tarefa.lead_id);
    const Icon = tipoIcons[tarefa.tipo] || Clock;
    const atrasada = isPast(new Date(tarefa.data_agendada)) && !isToday(new Date(tarefa.data_agendada));

    return (
      <Card key={tarefa.id} className={atrasada ? 'border-red-300' : ''}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className={`p-2 rounded-lg ${atrasada ? 'bg-red-100' : 'bg-orange-100'}`}>
              <Icon className={`w-5 h-5 ${atrasada ? 'text-red-600' : 'text-orange-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{tarefa.titulo}</h4>
                  {lead && <p className="text-sm text-gray-600">{lead.nome_cliente}</p>}
                </div>
                <Badge className={`${
                  tarefa.prioridade === 'urgente' ? 'bg-red-600 text-white' :
                  tarefa.prioridade === 'alta' ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {tarefa.prioridade}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-3">{tarefa.descricao}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Calendar className="w-3 h-3" />
                {format(new Date(tarefa.data_agendada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {atrasada && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
              </div>

              {conclusaoForm[tarefa.id] ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Resultado da tarefa..."
                    value={conclusaoForm[tarefa.id] || ''}
                    onChange={(e) => setConclusaoForm({...conclusaoForm, [tarefa.id]: e.target.value})}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => concluirTarefaMutation.mutate({
                        id: tarefa.id,
                        resultado: conclusaoForm[tarefa.id]
                      })}
                      className="bg-green-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newForm = {...conclusaoForm};
                        delete newForm[tarefa.id];
                        setConclusaoForm(newForm);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setConclusaoForm({...conclusaoForm, [tarefa.id]: ''})}
                  className="bg-[var(--wine-600)]"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Concluída
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {tarefasAtrasadas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Atrasadas ({tarefasAtrasadas.length})
          </h3>
          <div className="space-y-2">
            {tarefasAtrasadas.map(renderTarefa)}
          </div>
        </div>
      )}

      {tarefasHoje.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Hoje ({tarefasHoje.length})
          </h3>
          <div className="space-y-2">
            {tarefasHoje.map(renderTarefa)}
          </div>
        </div>
      )}

      {tarefasFuturas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximas ({tarefasFuturas.length})
          </h3>
          <div className="space-y-2">
            {tarefasFuturas.map(renderTarefa)}
          </div>
        </div>
      )}

      {tarefasPendentes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma tarefa pendente</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}