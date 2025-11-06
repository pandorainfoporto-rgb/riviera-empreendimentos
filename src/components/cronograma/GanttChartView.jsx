import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, AlertTriangle, TrendingUp } from "lucide-react";
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const statusColors = {
  nao_iniciada: "bg-gray-400",
  em_andamento: "bg-blue-500",
  concluida: "bg-green-500",
  atrasada: "bg-red-500",
  pausada: "bg-yellow-500",
  cancelada: "bg-gray-300",
};

const prioridadeCores = {
  baixa: "border-gray-300",
  media: "border-blue-400",
  alta: "border-orange-400",
  critica: "border-red-500",
};

export default function GanttChartView({ cronogramasObra = [], unidades = [] }) {
  const [zoomLevel, setZoomLevel] = React.useState("mes"); // mes, quinzena, semana
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const tarefasOrdenadas = useMemo(() => {
    return [...(cronogramasObra || [])].sort((a, b) => {
      if (a.wbs && b.wbs) {
        return a.wbs.localeCompare(b.wbs, undefined, { numeric: true });
      }
      return (a.ordem || 0) - (b.ordem || 0);
    });
  }, [cronogramasObra]);

  // Calcular período de exibição
  const periodo = useMemo(() => {
    if (tarefasOrdenadas.length === 0) {
      return {
        inicio: startOfMonth(currentDate),
        fim: endOfMonth(currentDate),
      };
    }

    const datasInicio = tarefasOrdenadas
      .map(t => t.data_inicio_prevista)
      .filter(Boolean)
      .map(d => parseISO(d));
    
    const datasFim = tarefasOrdenadas
      .map(t => t.data_fim_prevista)
      .filter(Boolean)
      .map(d => parseISO(d));

    const menorData = new Date(Math.min(...datasInicio));
    const maiorData = new Date(Math.max(...datasFim));

    return {
      inicio: startOfMonth(menorData),
      fim: endOfMonth(addDays(maiorData, 30)),
    };
  }, [tarefasOrdenadas, currentDate]);

  const dias = useMemo(() => {
    return eachDayOfInterval({ start: periodo.inicio, end: periodo.fim });
  }, [periodo]);

  // Configuração de zoom
  const configuracaoZoom = {
    mes: { dias: dias.filter((_, i) => i % 7 === 0), width: 40 },
    quinzena: { dias: dias.filter((_, i) => i % 3 === 0), width: 60 },
    semana: { dias: dias.filter((_, i) => i % 1 === 0), width: 30 },
  };

  const diasExibidos = configuracaoZoom[zoomLevel].dias;
  const larguraDia = configuracaoZoom[zoomLevel].width;

  const calcularPosicao = (tarefa) => {
    if (!tarefa.data_inicio_prevista || !tarefa.data_fim_prevista) {
      return null;
    }

    const inicio = parseISO(tarefa.data_inicio_prevista);
    const fim = parseISO(tarefa.data_fim_prevista);
    
    const diasDesdeInicio = differenceInDays(inicio, periodo.inicio);
    const duracao = differenceInDays(fim, inicio) + 1;

    const left = (diasDesdeInicio / dias.length) * 100;
    const width = (duracao / dias.length) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  if (tarefasOrdenadas.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma tarefa para exibir no Gantt</p>
        </CardContent>
      </Card>
    );
  }

  const hoje = new Date();

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={zoomLevel === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoomLevel("mes")}
          >
            Mês
          </Button>
          <Button
            variant={zoomLevel === "quinzena" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoomLevel("quinzena")}
          >
            Quinzena
          </Button>
          <Button
            variant={zoomLevel === "semana" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoomLevel("semana")}
          >
            Semana
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {format(periodo.inicio, "dd/MM/yyyy")} - {format(periodo.fim, "dd/MM/yyyy")}
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <div className="min-w-[1200px]">
            {/* Header com datas */}
            <div className="flex border-b bg-gray-50 sticky top-0 z-10">
              <div className="w-80 p-3 border-r bg-white font-semibold text-gray-700">
                Tarefa
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {diasExibidos.map((dia, index) => {
                    const ehHoje = isSameDay(dia, hoje);
                    return (
                      <div
                        key={index}
                        className={`flex-shrink-0 p-2 text-center border-r text-xs ${
                          ehHoje ? 'bg-blue-100 font-bold text-blue-700' : ''
                        }`}
                        style={{ width: `${larguraDia}px` }}
                      >
                        <div>{format(dia, "dd")}</div>
                        <div className="text-[10px] text-gray-500">{format(dia, "MMM", { locale: ptBR })}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tarefas */}
            {tarefasOrdenadas.map((tarefa, tarefaIndex) => {
              const unidade = unidades.find(u => u.id === tarefa.unidade_id);
              const posicao = calcularPosicao(tarefa);
              const indentacao = (tarefa.nivel_hierarquia - 1) * 16;

              return (
                <div
                  key={tarefa.id}
                  className={`flex border-b hover:bg-gray-50 ${tarefaIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  {/* Nome da Tarefa */}
                  <div className="w-80 p-3 border-r" style={{ paddingLeft: `${12 + indentacao}px` }}>
                    <div className="flex items-center gap-2 mb-1">
                      {tarefa.wbs && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {tarefa.wbs}
                        </Badge>
                      )}
                      {tarefa.eh_marco && (
                        <Target className="w-3 h-3 text-purple-600" />
                      )}
                      {tarefa.caminho_critico && (
                        <Badge className="bg-red-600 text-white text-[10px]">
                          CRÍTICO
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm font-medium text-gray-900 ${tarefa.eh_tarefa_resumo ? 'font-bold' : ''}`}>
                      {tarefa.etapa}
                    </p>
                    <p className="text-xs text-gray-500">{unidade?.codigo}</p>
                    <div className="mt-2">
                      <Progress value={tarefa.percentual_conclusao || 0} className="h-1" />
                      <p className="text-xs text-gray-500 mt-1">
                        {tarefa.percentual_conclusao || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Barra de Gantt */}
                  <div className="flex-1 relative p-3">
                    {/* Grade de fundo */}
                    <div className="absolute inset-0 flex">
                      {diasExibidos.map((dia, index) => {
                        const ehHoje = isSameDay(dia, hoje);
                        return (
                          <div
                            key={index}
                            className={`flex-shrink-0 border-r ${
                              ehHoje ? 'bg-blue-50' : ''
                            }`}
                            style={{ width: `${larguraDia}px` }}
                          />
                        );
                      })}
                    </div>

                    {/* Linha do tempo hoje */}
                    {(() => {
                      const diasDesdeInicio = differenceInDays(hoje, periodo.inicio);
                      const posicaoHoje = (diasDesdeInicio / dias.length) * 100;
                      if (posicaoHoje >= 0 && posicaoHoje <= 100) {
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
                            style={{ left: `${posicaoHoje}%` }}
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Barra da tarefa */}
                    {posicao && (
                      <div className="relative">
                        <div
                          className={`absolute h-8 rounded-md shadow-md ${statusColors[tarefa.status]} ${
                            tarefa.caminho_critico ? 'ring-2 ring-red-500 ring-offset-1' : ''
                          } border-l-4 ${prioridadeCores[tarefa.prioridade]} flex items-center px-2 z-10`}
                          style={{
                            left: posicao.left,
                            width: posicao.width,
                            minWidth: '40px',
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-white truncate">
                              {tarefa.percentual_conclusao || 0}%
                            </span>
                            {tarefa.eh_marco && (
                              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600 absolute -top-2 right-1/2 transform translate-x-1/2" />
                            )}
                          </div>
                        </div>

                        {/* Progresso dentro da barra */}
                        {tarefa.percentual_conclusao > 0 && (
                          <div
                            className="absolute h-8 rounded-md bg-black bg-opacity-20"
                            style={{
                              left: posicao.left,
                              width: `calc(${posicao.width} * ${tarefa.percentual_conclusao / 100})`,
                              minWidth: '2px',
                            }}
                          />
                        )}

                        {/* Setas de dependência */}
                        {tarefa.predecessoras?.map((pred, idx) => {
                          const tarefaPred = tarefasOrdenadas.find(t => t.id === pred.tarefa_id);
                          if (!tarefaPred) return null;

                          const posicaoPred = calcularPosicao(tarefaPred);
                          if (!posicaoPred) return null;

                          return (
                            <svg
                              key={idx}
                              className="absolute top-0 left-0 w-full h-full pointer-events-none"
                              style={{ zIndex: 5 }}
                            >
                              <defs>
                                <marker
                                  id={`arrowhead-${idx}`}
                                  markerWidth="10"
                                  markerHeight="10"
                                  refX="9"
                                  refY="3"
                                  orient="auto"
                                >
                                  <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                                </marker>
                              </defs>
                              <line
                                x1={`${parseFloat(posicaoPred.left) + parseFloat(posicaoPred.width)}%`}
                                y1="50%"
                                x2={posicao.left}
                                y2="50%"
                                stroke="#6366f1"
                                strokeWidth="2"
                                strokeDasharray="4"
                                markerEnd={`url(#arrowhead-${idx})`}
                              />
                            </svg>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400" />
          <span>Não Iniciada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Atrasada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-4 border-red-500" />
          <span>Caminho Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-purple-600" />
          <span>Marco (Milestone)</span>
        </div>
      </div>
    </div>
  );
}