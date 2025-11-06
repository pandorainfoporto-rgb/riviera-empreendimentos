import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Image, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ProgressTracker({ cronogramaObra, unidade }) {
  const queryClient = useQueryClient();

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklistObra', cronogramaObra.id],
    queryFn: () => base44.entities.ChecklistObra.filter({ cronograma_obra_id: cronogramaObra.id }),
    initialData: [],
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentosObra', cronogramaObra.id],
    queryFn: () => base44.entities.DocumentoObra.filter({ cronograma_obra_id: cronogramaObra.id }),
    initialData: [],
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CronogramaObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasObra'] });
      toast.success('Progresso atualizado!');
    },
  });

  // Calcular progresso automático baseado no checklist
  const progressoChecklist = checklistItems.length > 0
    ? (checklistItems.filter(i => i.status === 'concluido').length / checklistItems.length) * 100
    : 0;

  const handleAtualizarProgresso = (novoPercentual) => {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const updates = {
      percentual_conclusao: novoPercentual,
    };

    // Calcular valor agregado (EVM)
    const valorAgregado = (cronogramaObra.custo_planejado || 0) * (novoPercentual / 100);
    updates.valor_agregado = valorAgregado;

    // Calcular CPI e SPI
    if (cronogramaObra.custo_real > 0) {
      updates.cpi = valorAgregado / cronogramaObra.custo_real;
    }

    if (cronogramaObra.custo_planejado > 0) {
      updates.spi = valorAgregado / cronogramaObra.custo_planejado;
    }

    // Atualizar status baseado no progresso
    if (novoPercentual === 0) {
      updates.status = 'nao_iniciada';
    } else if (novoPercentual === 100) {
      updates.status = 'concluida';
      updates.data_fim_real = dataAtual;
    } else {
      updates.status = 'em_andamento';
      if (!cronogramaObra.data_inicio_real) {
        updates.data_inicio_real = dataAtual;
      }
    }

    updateProgressMutation.mutate({
      id: cronogramaObra.id,
      data: updates
    });
  };

  const itensChecklist = {
    total: checklistItems.length,
    concluidos: checklistItems.filter(i => i.status === 'concluido').length,
    emAndamento: checklistItems.filter(i => i.status === 'em_andamento').length,
    bloqueados: checklistItems.filter(i => i.status === 'bloqueado').length,
  };

  const documentosTipo = {
    fotos: documentos.filter(d => d.tipo === 'foto').length,
    projetos: documentos.filter(d => d.tipo === 'projeto').length,
    notasFiscais: documentos.filter(d => d.tipo === 'nota_fiscal').length,
    contratos: documentos.filter(d => d.tipo === 'contrato').length,
  };

  const percentualAtual = cronogramaObra.percentual_conclusao || 0;
  const sugestaoProgresso = Math.round(progressoChecklist);

  return (
    <div className="space-y-6">
      {/* Card Principal de Progresso */}
      <Card className="border-t-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Acompanhamento de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progresso Manual */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Progresso Atual da Tarefa</Label>
              <span className="text-3xl font-bold text-[var(--wine-700)]">
                {percentualAtual}%
              </span>
            </div>
            <Progress value={percentualAtual} className="h-4 mb-4" />
            
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0-100%"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const valor = parseInt(e.target.value);
                    if (valor >= 0 && valor <= 100) {
                      handleAtualizarProgresso(valor);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <Button
                onClick={() => handleAtualizarProgresso(percentualAtual + 10)}
                disabled={percentualAtual >= 100}
                variant="outline"
              >
                +10%
              </Button>
              <Button
                onClick={() => handleAtualizarProgresso(100)}
                disabled={percentualAtual === 100}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Concluir (100%)
              </Button>
            </div>
          </div>

          {/* Sugestão baseada em checklist */}
          {checklistItems.length > 0 && Math.abs(sugestaoProgresso - percentualAtual) > 10 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">
                    Sugestão de Atualização
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Baseado no checklist ({itensChecklist.concluidos}/{itensChecklist.total} itens), 
                    o progresso sugerido é de {sugestaoProgresso}%
                  </p>
                  <Button
                    onClick={() => handleAtualizarProgresso(sugestaoProgresso)}
                    size="sm"
                    className="mt-3 bg-amber-600 hover:bg-amber-700"
                  >
                    Aplicar Sugestão ({sugestaoProgresso}%)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Indicadores */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <p className="font-semibold text-blue-900">Checklist</p>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-blue-700">
                  ✅ Concluídos: {itensChecklist.concluidos}/{itensChecklist.total}
                </p>
                <p className="text-gray-600">
                  🔄 Em Andamento: {itensChecklist.emAndamento}
                </p>
                {itensChecklist.bloqueados > 0 && (
                  <p className="text-red-600">
                    🚫 Bloqueados: {itensChecklist.bloqueados}
                  </p>
                )}
              </div>
              <Progress value={progressoChecklist} className="h-2 mt-3" />
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <p className="font-semibold text-purple-900">Documentação</p>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-purple-700">
                  📸 Fotos: {documentosTipo.fotos}
                </p>
                <p className="text-gray-600">
                  📋 Projetos: {documentosTipo.projetos}
                </p>
                <p className="text-gray-600">
                  🧾 Notas Fiscais: {documentosTipo.notasFiscais}
                </p>
                <p className="text-gray-600">
                  📄 Contratos: {documentosTipo.contratos}
                </p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 mb-1">📅 Previsto</p>
              <p className="font-semibold">
                {format(parseISO(cronogramaObra.data_inicio_prevista), "dd/MM/yyyy")} - {format(parseISO(cronogramaObra.data_fim_prevista), "dd/MM/yyyy")}
              </p>
            </div>

            {cronogramaObra.data_inicio_real && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-700 mb-1">✅ Real</p>
                <p className="font-semibold">
                  Iniciado: {format(parseISO(cronogramaObra.data_inicio_real), "dd/MM/yyyy")}
                  {cronogramaObra.data_fim_real && ` - ${format(parseISO(cronogramaObra.data_fim_real), "dd/MM/yyyy")}`}
                </p>
              </div>
            )}
          </div>

          {/* EVM Indicators */}
          {cronogramaObra.custo_planejado > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
              <p className="font-semibold text-gray-900 mb-3">📊 Earned Value Management (EVM)</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">BCWS (Planejado)</p>
                  <p className="font-bold text-blue-700">
                    R$ {(cronogramaObra.custo_planejado / 1000).toFixed(1)}k
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">BCWP (Agregado)</p>
                  <p className="font-bold text-purple-700">
                    R$ {((cronogramaObra.valor_agregado || 0) / 1000).toFixed(1)}k
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">ACWP (Real)</p>
                  <p className="font-bold text-orange-700">
                    R$ {((cronogramaObra.custo_real || 0) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              
              {cronogramaObra.custo_real > 0 && (
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">CPI (Custo)</p>
                    <p className={`font-bold ${(cronogramaObra.cpi || 0) >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                      {(cronogramaObra.cpi || 0).toFixed(2)}
                      <span className="text-xs ml-2">
                        {(cronogramaObra.cpi || 0) >= 1 ? '✅ Eficiente' : '⚠️ Acima do orçado'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">SPI (Prazo)</p>
                    <p className={`font-bold ${(cronogramaObra.spi || 0) >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                      {(cronogramaObra.spi || 0).toFixed(2)}
                      <span className="text-xs ml-2">
                        {(cronogramaObra.spi || 0) >= 1 ? '✅ No prazo' : '⚠️ Atrasado'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}