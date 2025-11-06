import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, User, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoriaLabels = {
  documentacao: "Documentação",
  material: "Material",
  equipamento: "Equipamento",
  mao_de_obra: "Mão de Obra",
  inspecao: "Inspeção",
  qualidade: "Qualidade",
  seguranca: "Segurança",
  outros: "Outros",
};

const categoriaColors = {
  documentacao: "bg-purple-100 text-purple-700 border-purple-200",
  material: "bg-blue-100 text-blue-700 border-blue-200",
  equipamento: "bg-orange-100 text-orange-700 border-orange-200",
  mao_de_obra: "bg-green-100 text-green-700 border-green-200",
  inspecao: "bg-yellow-100 text-yellow-700 border-yellow-200",
  qualidade: "bg-teal-100 text-teal-700 border-teal-200",
  seguranca: "bg-red-100 text-red-700 border-red-200",
  outros: "bg-gray-100 text-gray-700 border-gray-200",
};

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-700 border-gray-200",
  media: "bg-blue-100 text-blue-700 border-blue-200",
  alta: "bg-orange-100 text-orange-700 border-orange-200",
  critica: "bg-red-100 text-red-700 border-red-200",
};

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  em_andamento: "bg-blue-100 text-blue-700 border-blue-200",
  concluido: "bg-green-100 text-green-700 border-green-200",
  bloqueado: "bg-red-100 text-red-700 border-red-200",
};

const statusIcons = {
  pendente: Circle,
  em_andamento: Clock,
  concluido: CheckCircle2,
  bloqueado: XCircle,
};

export default function ChecklistItemCard({ item, onEdit, onDelete, onUpdateStatus }) {
  const StatusIcon = statusIcons[item.status];

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4" 
          style={{ borderLeftColor: item.status === 'concluido' ? '#10b981' : item.status === 'bloqueado' ? '#ef4444' : '#eab308' }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mt-1 hover:opacity-70 transition-opacity">
                  <StatusIcon className={`w-5 h-5 ${
                    item.status === 'concluido' ? 'text-green-600' :
                    item.status === 'bloqueado' ? 'text-red-600' :
                    item.status === 'em_andamento' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onUpdateStatus(item.id, "pendente", null)}>
                  <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                  Marcar como Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(item.id, "em_andamento", null)}>
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(item.id, "concluido", new Date().toISOString().split('T')[0])}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Marcar como Concluído
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(item.id, "bloqueado", null)}>
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Marcar como Bloqueado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1">
              <p className={`font-medium ${item.status === 'concluido' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {item.item}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={categoriaColors[item.categoria]}>
                  {categoriaLabels[item.categoria]}
                </Badge>
                <Badge className={prioridadeColors[item.prioridade]}>
                  {item.prioridade}
                </Badge>
                <Badge className={statusColors[item.status]}>
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {item.responsavel && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{item.responsavel}</span>
                  </div>
                )}
                {item.data_prevista && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Previsto: {format(parseISO(item.data_prevista), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
                {item.data_conclusao && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Concluído: {format(parseISO(item.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>

              {item.observacoes && (
                <p className="text-sm text-gray-500 mt-2 italic">{item.observacoes}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Tem certeza que deseja excluir este item?")) {
                  onDelete(item.id);
                }
              }}
              className="hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}