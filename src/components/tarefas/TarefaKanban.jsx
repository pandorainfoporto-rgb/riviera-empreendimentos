import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Clock, AlertTriangle, Pause, XCircle,
  AlertCircle, MoreVertical, Edit, Trash2, User, Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const colunas = [
  { id: "nao_iniciada", label: "Não Iniciadas", icon: Clock, color: "bg-gray-100" },
  { id: "em_andamento", label: "Em Andamento", icon: AlertCircle, color: "bg-blue-100" },
  { id: "atrasada", label: "Atrasadas", icon: AlertTriangle, color: "bg-red-100" },
  { id: "concluida", label: "Concluídas", icon: CheckCircle2, color: "bg-green-100" },
];

const prioridadeConfig = {
  baixa: { color: "bg-gray-200 text-gray-700" },
  media: { color: "bg-blue-200 text-blue-700" },
  alta: { color: "bg-orange-200 text-orange-700" },
  critica: { color: "bg-red-200 text-red-700" },
};

export default function TarefaKanban({ tarefas, unidades, onEdit, onStatusChange, onDelete }) {
  const hoje = new Date();

  const getTarefasPorStatus = (status) => {
    return tarefas.filter(t => t.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {colunas.map((coluna) => {
        const Icon = coluna.icon;
        const tarefasColuna = getTarefasPorStatus(coluna.id);

        return (
          <div key={coluna.id} className="space-y-3">
            <div className={`p-3 rounded-lg ${coluna.color} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{coluna.label}</span>
              </div>
              <Badge variant="secondary">{tarefasColuna.length}</Badge>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {tarefasColuna.map((tarefa) => {
                const unidade = unidades.find(u => u.id === tarefa.unidade_id);
                const dataFim = tarefa.data_fim_prevista ? parseISO(tarefa.data_fim_prevista) : null;
                const diasRestantes = dataFim ? differenceInDays(dataFim, hoje) : null;
                const prioridadeConf = prioridadeConfig[tarefa.prioridade] || prioridadeConfig.media;

                return (
                  <Card
                    key={tarefa.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      tarefa.caminho_critico ? 'ring-2 ring-orange-300' : ''
                    }`}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{tarefa.etapa}</p>
                          <p className="text-xs text-gray-500">{unidade?.codigo}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(tarefa)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {coluna.id !== 'em_andamento' && coluna.id !== 'concluida' && (
                              <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'em_andamento')}>
                                Iniciar
                              </DropdownMenuItem>
                            )}
                            {coluna.id === 'em_andamento' && (
                              <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'concluida')}>
                                Concluir
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onDelete(tarefa.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${prioridadeConf.color}`}>
                          {tarefa.prioridade}
                        </Badge>
                        {tarefa.caminho_critico && (
                          <Badge className="text-xs bg-orange-500 text-white">Crítico</Badge>
                        )}
                      </div>

                      {tarefa.responsavel && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <User className="w-3 h-3" />
                          <span className="truncate">{tarefa.responsavel}</span>
                        </div>
                      )}

                      {dataFim && (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span className={`${diasRestantes < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {format(dataFim, "dd/MM", { locale: ptBR })}
                            {diasRestantes !== null && tarefa.status !== 'concluida' && (
                              <span className="ml-1">
                                ({diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atraso` : `${diasRestantes}d`})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span>{tarefa.percentual_conclusao || 0}%</span>
                        </div>
                        <Progress value={tarefa.percentual_conclusao || 0} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {tarefasColuna.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}