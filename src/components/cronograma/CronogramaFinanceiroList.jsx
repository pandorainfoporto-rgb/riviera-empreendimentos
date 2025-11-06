import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Calendar, DollarSign, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriasLabels = {
  projeto: "Projeto",
  mao_de_obra: "Mão de Obra",
  materiais: "Materiais",
  equipamentos: "Equipamentos",
  servicos: "Serviços",
  impostos: "Impostos",
  administrativo: "Administrativo",
  financeiro: "Financeiro",
  contingencia: "Contingência",
  outros: "Outros",
};

const categoriasCores = {
  projeto: "bg-purple-100 text-purple-700 border-purple-200",
  mao_de_obra: "bg-blue-100 text-blue-700 border-blue-200",
  materiais: "bg-orange-100 text-orange-700 border-orange-200",
  equipamentos: "bg-yellow-100 text-yellow-700 border-yellow-200",
  servicos: "bg-teal-100 text-teal-700 border-teal-200",
  impostos: "bg-red-100 text-red-700 border-red-200",
  administrativo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  financeiro: "bg-green-100 text-green-700 border-green-200",
  contingencia: "bg-amber-100 text-amber-700 border-amber-200",
  outros: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusColors = {
  nao_iniciado: "bg-gray-100 text-gray-700 border-gray-200",
  em_andamento: "bg-blue-100 text-blue-700 border-blue-200",
  concluido: "bg-green-100 text-green-700 border-green-200",
  atrasado: "bg-red-100 text-red-700 border-red-200",
  pausado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelado: "bg-gray-400 text-white border-gray-500",
};

const statusLabels = {
  nao_iniciado: "Não Iniciado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

const prioridadeCores = {
  baixa: "bg-gray-500",
  media: "bg-blue-500",
  alta: "bg-orange-500",
  critica: "bg-red-500",
};

export default function CronogramaFinanceiroList({ 
  items = [], 
  unidades = [], 
  cronogramasObra = [], 
  fornecedores = [], 
  isLoading, 
  onEdit, 
  onDelete 
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum item financeiro cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(items || []).map((item) => {
        const uni = (unidades || []).find(u => u.id === item.unidade_id);
        const etapa = (cronogramasObra || []).find(c => c.id === item.cronograma_obra_id);
        const fornecedor = (fornecedores || []).find(f => f.id === item.fornecedor_id);
        
        const bcws = item.custo_planejado || 0;
        const bcwp = item.valor_agregado || 0;
        const acwp = item.custo_real || 0;
        const cv = item.cv || 0;
        const cpi = item.cpi || 0;
        
        return (
          <Card key={item.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-[var(--wine-600)]">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {item.eh_marco_financeiro && <Target className="w-4 h-4 text-purple-600" />}
                    <Badge className={categoriasCores[item.categoria] || categoriasCores.outros}>
                      {categoriasLabels[item.categoria] || item.categoria}
                    </Badge>
                    <Badge className={statusColors[item.status] || statusColors.nao_iniciado}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    {item.caminho_critico_financeiro && (
                      <Badge className="bg-red-600 text-white">
                        🔴 Caminho Crítico
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg text-[var(--wine-700)]">
                    {item.wbs && <span className="text-sm text-gray-600 mr-2">{item.wbs}</span>}
                    {item.descricao}
                  </CardTitle>
                  
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${prioridadeCores[item.prioridade] || 'bg-gray-500'}`} />
                      {item.prioridade}
                    </span>
                    <span>•</span>
                    <span>{uni?.codigo || 'N/A'}</span>
                    {item.responsavel_financeiro && (
                      <>
                        <span>•</span>
                        <span>{item.responsavel_financeiro}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja excluir este item?")) {
                        onDelete(item.id);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Datas e Prazo */}
              {item.data_prevista_inicio && item.data_prevista_fim && (
                <div className="grid md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Período Previsto</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>
                        {format(parseISO(item.data_prevista_inicio), "dd/MM/yy")} → {format(parseISO(item.data_prevista_fim), "dd/MM/yy")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Duração: {item.duracao_prevista_dias || 0} dias
                    </p>
                  </div>
                  
                  {item.data_real_inicio && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Período Real</p>
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(parseISO(item.data_real_inicio), "dd/MM/yy")}
                          {item.data_real_fim && ` → ${format(parseISO(item.data_real_fim), "dd/MM/yy")}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Análise EVM */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Análise de Valor Agregado (EVM)
                </h4>

                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">BCWS (Planejado)</p>
                    <p className="text-lg font-bold text-gray-900">
                      R$ {bcws.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">BCWP (Agregado)</p>
                    <p className="text-lg font-bold text-blue-700">
                      R$ {bcwp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">ACWP (Real)</p>
                    <p className="text-lg font-bold text-purple-700">
                      R$ {acwp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {bcws > 0 && acwp > 0 && (
                  <div className="grid md:grid-cols-4 gap-2">
                    <div className="p-2 bg-white rounded border text-center">
                      <p className="text-xs text-gray-600">CPI</p>
                      <p className={`text-sm font-bold ${cpi >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                        {cpi.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cpi >= 1 ? '✅' : '⚠️'}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded border text-center">
                      <p className="text-xs text-gray-600">SPI</p>
                      <p className={`text-sm font-bold ${(item.spi || 0) >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                        {(item.spi || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded border text-center">
                      <p className="text-xs text-gray-600">CV</p>
                      <p className={`text-sm font-bold ${cv >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {cv >= 0 ? '+' : ''}R$ {(cv / 1000).toFixed(1)}k
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded border text-center">
                      <p className="text-xs text-gray-600">EAC</p>
                      <p className="text-sm font-bold text-orange-700">
                        R$ {((item.eac || 0) / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                )}

                {/* Barra de Progresso */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Progresso Financeiro</span>
                    <span className="font-semibold">{item.percentual_financeiro_completo || 0}%</span>
                  </div>
                  <Progress value={item.percentual_financeiro_completo || 0} className="h-2" />
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {etapa && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="truncate">Tarefa: {etapa.etapa}</span>
                  </div>
                )}
                {fornecedor && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="truncate">{fornecedor.nome}</span>
                  </div>
                )}
                {item.centro_custo && (
                  <div className="text-gray-600">
                    <span className="font-medium">Centro Custo:</span> {item.centro_custo}
                  </div>
                )}
                {(item.riscos_financeiros || []).length > 0 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{item.riscos_financeiros.length} risco(s) identificado(s)</span>
                  </div>
                )}
              </div>

              {/* Condições de Pagamento */}
              {item.condicoes_pagamento && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-900 mb-1">Condições de Pagamento</p>
                  <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-700">
                    <div>Forma: {item.condicoes_pagamento.forma_pagamento?.replace('_', ' ')}</div>
                    {item.condicoes_pagamento.quantidade_parcelas > 1 && (
                      <div>{item.condicoes_pagamento.quantidade_parcelas}x parcelas</div>
                    )}
                    {item.condicoes_pagamento.desconto_percentual > 0 && (
                      <div className="text-green-700 font-semibold">
                        Desconto: {item.condicoes_pagamento.desconto_percentual}%
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.observacoes && (
                <p className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3">
                  {item.observacoes}
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)] hover:border-[var(--wine-400)]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}