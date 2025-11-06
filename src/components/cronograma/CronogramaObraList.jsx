import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  nao_iniciada: "bg-gray-100 text-gray-800",
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
  atrasada: "bg-red-100 text-red-800",
  pausada: "bg-yellow-100 text-yellow-800",
  cancelada: "bg-gray-100 text-gray-600",
};

const prioridadeCores = {
  baixa: "bg-gray-500",
  media: "bg-blue-500",
  alta: "bg-orange-500",
  critica: "bg-red-500",
};

export default function CronogramaObraList({ items = [], unidades = [], isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">
          Carregando cronograma...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">Nenhuma tarefa cadastrada</p>
          <p className="text-sm text-gray-500 mt-2">
            Clique em "Nova Tarefa" para começar o cronograma
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por WBS ou ordem
  const itemsOrdenados = [...items].sort((a, b) => {
    if (a.wbs && b.wbs) {
      return a.wbs.localeCompare(b.wbs, undefined, { numeric: true });
    }
    return (a.ordem || 0) - (b.ordem || 0);
  });

  return (
    <div className="space-y-3">
      {itemsOrdenados.map((item) => {
        const unidade = (unidades || []).find(u => u.id === item.unidade_id);
        const indentacao = (item.nivel_hierarquia - 1) * 24;
        const ehCritico = item.caminho_critico;

        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-md transition-shadow ${ehCritico ? 'border-l-4 border-red-500 bg-red-50' : ''} ${item.eh_tarefa_resumo ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            style={{ marginLeft: `${indentacao}px` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {item.wbs && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.wbs}
                      </Badge>
                    )}
                    {item.eh_marco && (
                      <Badge className="bg-purple-600 text-white">
                        <Target className="w-3 h-3 mr-1" />
                        MARCO
                      </Badge>
                    )}
                    {ehCritico && (
                      <Badge className="bg-red-600 text-white animate-pulse">
                        🔴 CRÍTICO
                      </Badge>
                    )}
                    <div className={`w-3 h-3 rounded-full ${prioridadeCores[item.prioridade]}`} title={item.prioridade} />
                    <Badge className={statusColors[item.status]}>
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <h4 className={`font-semibold text-gray-900 mb-1 ${item.eh_tarefa_resumo ? 'text-lg' : ''}`}>
                    {item.etapa}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3">{unidade?.codigo}</p>

                  <div className="grid md:grid-cols-3 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Previsto:</span>
                      <p className="font-medium">
                        {format(parseISO(item.data_inicio_prevista), "dd/MM/yy")} - {format(parseISO(item.data_fim_prevista), "dd/MM/yy")}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duração:</span>
                      <p className="font-medium">{item.duracao_prevista_dias || 0} dias úteis</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Responsável:</span>
                      <p className="font-medium">{item.responsavel || '-'}</p>
                    </div>
                  </div>

                  {/* Predecessoras */}
                  {item.predecessoras && item.predecessoras.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Dependências:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.predecessoras.map((pred, idx) => {
                          const tarefaPred = items.find(t => t.id === pred.tarefa_id);
                          return (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tarefaPred?.wbs || 'T'} ({pred.tipo_relacao})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* EVM */}
                  {item.custo_planejado > 0 && (
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">
                        💰 Planejado: R$ {(item.custo_planejado / 1000).toFixed(1)}k
                      </Badge>
                      {item.custo_real > 0 && (
                        <>
                          <Badge variant="outline">
                            Real: R$ {(item.custo_real / 1000).toFixed(1)}k
                          </Badge>
                          <Badge className={(item.cpi || 0) >= 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            CPI: {(item.cpi || 0).toFixed(2)}
                          </Badge>
                        </>
                      )}
                    </div>
                  )}

                  {/* Folga */}
                  {item.folga_total !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">Folga:</span>
                      <Badge className={item.folga_total === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {item.folga_total} dias
                      </Badge>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso</span>
                      <span className="font-semibold text-[var(--wine-700)]">
                        {item.percentual_conclusao || 0}%
                      </span>
                    </div>
                    <Progress value={item.percentual_conclusao || 0} className="h-2" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    onClick={() => onEdit(item)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(item.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}