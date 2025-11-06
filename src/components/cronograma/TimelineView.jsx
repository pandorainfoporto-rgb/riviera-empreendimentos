import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  nao_iniciada: "bg-gray-500",
  em_andamento: "bg-blue-500",
  concluida: "bg-green-500",
  atrasada: "bg-red-500",
  pausada: "bg-yellow-500",
  cancelada: "bg-gray-400",
};

const prioridadeCores = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  critica: "bg-red-100 text-red-800",
};

export default function TimelineView({ cronogramasObra = [], unidades = [] }) {
  // Ordenar por ordem e WBS
  const etapasOrdenadas = [...(cronogramasObra || [])].sort((a, b) => {
    if (a.wbs && b.wbs) {
      return a.wbs.localeCompare(b.wbs, undefined, { numeric: true });
    }
    return (a.ordem || 0) - (b.ordem || 0);
  });

  if (etapasOrdenadas.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Nenhuma tarefa cadastrada para visualizar timeline</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular caminho crítico
  const tarefasCriticas = etapasOrdenadas.filter(t => t.caminho_critico);

  return (
    <div className="space-y-6">
      {/* Resumo do Projeto */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total de Tarefas</p>
              <p className="text-2xl font-bold text-gray-900">{etapasOrdenadas.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Caminho Crítico</p>
              <p className="text-2xl font-bold text-red-700">{tarefasCriticas.length} tarefas</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Marcos (Milestones)</p>
              <p className="text-2xl font-bold text-purple-700">
                {etapasOrdenadas.filter(t => t.eh_marco).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-blue-700">
                {etapasOrdenadas.filter(t => t.status === 'em_andamento').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {etapasOrdenadas.map((etapa, index) => {
        const unidade = (unidades || []).find(u => u.id === etapa.unidade_id);
        const dataInicio = parseISO(etapa.data_inicio_prevista);
        const dataFim = parseISO(etapa.data_fim_prevista);
        const duracaoTotal = differenceInDays(dataFim, dataInicio);
        
        const indentacao = (etapa.nivel_hierarquia - 1) * 32;
        const ehCritico = etapa.caminho_critico;

        return (
          <div key={etapa.id} className="relative" style={{ marginLeft: `${indentacao}px` }}>
            {/* Linha conectora */}
            {index < etapasOrdenadas.length - 1 && (
              <div className="absolute left-6 top-20 w-0.5 h-full bg-gray-200 -z-10" />
            )}

            <div className="flex gap-4">
              {/* Indicador */}
              <div className="flex flex-col items-center">
                {etapa.eh_marco ? (
                  <div className="w-12 h-12 rotate-45 bg-purple-600 flex items-center justify-center shadow-lg z-10">
                    <Target className="w-6 h-6 text-white -rotate-45" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full ${statusColors[etapa.status]} ${ehCritico ? 'ring-4 ring-red-300' : ''} flex items-center justify-center text-white font-bold shadow-lg z-10`}>
                    {etapa.wbs || etapa.ordem || index + 1}
                  </div>
                )}
              </div>

              {/* Card da tarefa */}
              <Card className={`flex-1 hover:shadow-lg transition-shadow ${ehCritico ? 'border-2 border-red-500' : ''}`}>
                <CardHeader className={ehCritico ? 'bg-red-50' : ''}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {etapa.wbs && (
                          <Badge variant="outline" className="font-mono">
                            {etapa.wbs}
                          </Badge>
                        )}
                        {ehCritico && (
                          <Badge className="bg-red-600 text-white">
                            CAMINHO CRÍTICO
                          </Badge>
                        )}
                        {etapa.eh_marco && (
                          <Badge className="bg-purple-600 text-white">
                            <Target className="w-3 h-3 mr-1" />
                            MARCO
                          </Badge>
                        )}
                        <Badge className={prioridadeCores[etapa.prioridade]}>
                          {etapa.prioridade}
                        </Badge>
                      </div>
                      
                      <CardTitle className={`text-lg ${etapa.eh_tarefa_resumo ? 'text-blue-700 font-bold' : 'text-[var(--wine-700)]'} mb-2`}>
                        {etapa.etapa}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{unidade?.codigo || "Unidade não especificada"}</p>
                      
                      {etapa.restricao_tipo !== 'nenhuma' && (
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                            ⚠️ Restrição: {etapa.restricao_tipo.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[var(--wine-700)]">
                        {etapa.percentual_conclusao || 0}%
                      </div>
                      <Badge variant="outline" className={`${statusColors[etapa.status]} text-white border-0 mt-2`}>
                        {etapa.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {etapa.descricao && (
                    <p className="text-sm text-gray-600">{etapa.descricao}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-[var(--wine-500)]" />
                      <span>Previsto: {format(dataInicio, "dd/MM/yy")} - {format(dataFim, "dd/MM/yy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-[var(--wine-500)]" />
                      <span>Duração: {etapa.duracao_prevista_dias || duracaoTotal} dias</span>
                    </div>
                  </div>

                  {etapa.data_inicio_real && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Calendar className="w-4 h-4" />
                      <span>Iniciado em: {format(parseISO(etapa.data_inicio_real), "dd/MM/yyyy")}</span>
                      {etapa.data_fim_real && (
                        <span className="ml-2">- Concluído em: {format(parseISO(etapa.data_fim_real), "dd/MM/yyyy")}</span>
                      )}
                    </div>
                  )}

                  {etapa.responsavel && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Responsável:</span> {etapa.responsavel}
                    </div>
                  )}

                  {etapa.equipe && etapa.equipe.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>{etapa.equipe.length} membro(s) alocado(s)</span>
                    </div>
                  )}

                  {/* Predecessoras */}
                  {etapa.predecessoras && etapa.predecessoras.length > 0 && (
                    <div className="text-sm">
                      <p className="text-gray-600 font-semibold mb-1">Dependências:</p>
                      <div className="flex flex-wrap gap-1">
                        {etapa.predecessoras.map((pred, idx) => {
                          const tarefaPred = (cronogramasObra || []).find(t => t.id === pred.tarefa_id);
                          return (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tarefaPred?.wbs || tarefaPred?.etapa?.substring(0, 15)} ({pred.tipo_relacao})
                              {pred.defasagem_dias !== 0 && ` +${pred.defasagem_dias}d`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Folga */}
                  {etapa.folga_total !== undefined && etapa.folga_total >= 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Folga Total:</span>
                      <Badge className={etapa.folga_total === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {etapa.folga_total} dias
                      </Badge>
                      {etapa.folga_total === 0 && (
                        <span className="text-xs text-red-600">⚠️ Sem margem de atraso</span>
                      )}
                    </div>
                  )}

                  {/* EVM - Indicadores */}
                  {etapa.custo_planejado > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border">
                      <p className="text-xs font-semibold text-gray-700 mb-2">📊 Earned Value Management (EVM)</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600">Planejado (BCWS)</p>
                          <p className="font-bold text-blue-700">R$ {(etapa.custo_planejado / 1000).toFixed(1)}k</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Real (ACWP)</p>
                          <p className="font-bold text-purple-700">R$ {((etapa.custo_real || 0) / 1000).toFixed(1)}k</p>
                        </div>
                        <div>
                          <p className="text-gray-600">CPI</p>
                          <p className={`font-bold ${(etapa.cpi || 0) >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                            {(etapa.cpi || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Riscos */}
                  {etapa.riscos && etapa.riscos.length > 0 && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-xs font-semibold text-orange-900 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {etapa.riscos.length} Risco(s) Identificado(s)
                      </p>
                      {etapa.riscos.slice(0, 2).map((risco, idx) => (
                        <p key={idx} className="text-xs text-orange-800">
                          • {risco.descricao}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Progresso */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progresso da Tarefa</span>
                      <span className="font-semibold text-[var(--wine-700)]">
                        {etapa.percentual_conclusao || 0}%
                      </span>
                    </div>
                    <Progress value={etapa.percentual_conclusao || 0} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}