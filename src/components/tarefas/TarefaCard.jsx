import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2, Clock, AlertTriangle, Pause, XCircle,
  Calendar, User, Building, MoreVertical, Edit, Trash2,
  AlertCircle, Play, Check
} from "lucide-react";
import { format, parseISO, differenceInDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  nao_iniciada: { label: "Não Iniciada", color: "bg-gray-100 text-gray-700 border-gray-300", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 border-blue-300", icon: AlertCircle },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
  atrasada: { label: "Atrasada", color: "bg-red-100 text-red-700 border-red-300", icon: AlertTriangle },
  pausada: { label: "Pausada", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Pause },
  cancelada: { label: "Cancelada", color: "bg-gray-200 text-gray-500 border-gray-400", icon: XCircle },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-600" },
  media: { label: "Média", color: "bg-blue-100 text-blue-600" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-600 animate-pulse" },
};

const faseLabels = {
  projeto: "Projeto",
  aprovacoes: "Aprovações",
  preparacao: "Preparação",
  fundacao: "Fundação",
  estrutura: "Estrutura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  acabamento: "Acabamento",
  finalizacao: "Finalização",
};

export default function TarefaCard({ tarefa, unidade, onEdit, onStatusChange, onDelete }) {
  const config = statusConfig[tarefa.status] || statusConfig.nao_iniciada;
  const prioridadeConf = prioridadeConfig[tarefa.prioridade] || prioridadeConfig.media;
  const StatusIcon = config.icon;

  const hoje = new Date();
  const dataFim = tarefa.data_fim_prevista ? parseISO(tarefa.data_fim_prevista) : null;
  const diasRestantes = dataFim ? differenceInDays(dataFim, hoje) : null;
  const estaAtrasada = dataFim && isBefore(dataFim, hoje) && tarefa.status !== 'concluida';

  return (
    <Card className={`hover:shadow-lg transition-shadow ${estaAtrasada ? 'border-l-4 border-red-500' : ''} ${tarefa.caminho_critico ? 'ring-2 ring-orange-300' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${config.color}`}>
            <StatusIcon className="w-5 h-5" />
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{tarefa.etapa}</h3>
                  <Badge className={prioridadeConf.color}>{prioridadeConf.label}</Badge>
                  {tarefa.caminho_critico && (
                    <Badge className="bg-orange-500 text-white">Caminho Crítico</Badge>
                  )}
                  {tarefa.eh_marco && (
                    <Badge className="bg-purple-100 text-purple-700">Marco</Badge>
                  )}
                </div>
                {tarefa.descricao && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tarefa.descricao}</p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {tarefa.status !== 'em_andamento' && tarefa.status !== 'concluida' && (
                    <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'em_andamento')}>
                      <Play className="w-4 h-4 mr-2 text-blue-600" />
                      Iniciar
                    </DropdownMenuItem>
                  )}
                  {tarefa.status === 'em_andamento' && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'concluida')}>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Concluir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'pausada')}>
                        <Pause className="w-4 h-4 mr-2 text-yellow-600" />
                        Pausar
                      </DropdownMenuItem>
                    </>
                  )}
                  {tarefa.status === 'pausada' && (
                    <DropdownMenuItem onClick={() => onStatusChange(tarefa, 'em_andamento')}>
                      <Play className="w-4 h-4 mr-2 text-blue-600" />
                      Retomar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Building className="w-4 h-4" />
                <span>{unidade?.codigo || 'Sem unidade'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <User className="w-4 h-4" />
                <span>{tarefa.responsavel || 'Sem responsável'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : 'Sem prazo'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {diasRestantes !== null && tarefa.status !== 'concluida' && (
                  <Badge variant="outline" className={`
                    ${diasRestantes < 0 ? 'border-red-500 text-red-600' : ''}
                    ${diasRestantes === 0 ? 'border-orange-500 text-orange-600' : ''}
                    ${diasRestantes > 0 && diasRestantes <= 7 ? 'border-yellow-500 text-yellow-600' : ''}
                    ${diasRestantes > 7 ? 'border-gray-300 text-gray-600' : ''}
                  `}>
                    {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrasado` : 
                     diasRestantes === 0 ? 'Vence hoje' : 
                     `${diasRestantes}d restantes`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress & Phase */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{faseLabels[tarefa.fase] || tarefa.fase}</span>
                  <span>{tarefa.percentual_conclusao || 0}%</span>
                </div>
                <Progress value={tarefa.percentual_conclusao || 0} className="h-2" />
              </div>
              <Badge className={config.color}>{config.label}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}