import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, Circle, AlertCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import ChecklistForm from "./ChecklistForm";
import ChecklistItemCard from "./ChecklistItemCard";

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

export default function ChecklistObra({ unidades, cronogramasObra, selectedUnidade }) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedEtapa, setSelectedEtapa] = useState(null);
  const [expandedEtapas, setExpandedEtapas] = useState({});
  const queryClient = useQueryClient();

  const { data: checklistItems = [], isLoading } = useQuery({
    queryKey: ['checklistObra'],
    queryFn: () => base44.entities.ChecklistObra.list('ordem'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChecklistObra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistObra'] });
      setShowForm(false);
      setEditingItem(null);
      setSelectedEtapa(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistObra'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistObra'] });
    },
  });

  const filteredCronogramas = selectedUnidade === "todas" 
    ? cronogramasObra 
    : cronogramasObra.filter(c => c.unidade_id === selectedUnidade);

  const toggleEtapa = (etapaId) => {
    setExpandedEtapas(prev => ({
      ...prev,
      [etapaId]: !prev[etapaId]
    }));
  };

  const getChecklistPorEtapa = (etapaId) => {
    return checklistItems.filter(item => item.cronograma_obra_id === etapaId);
  };

  const calcularProgresso = (etapaId) => {
    const items = getChecklistPorEtapa(etapaId);
    if (items.length === 0) return 0;
    const concluidos = items.filter(item => item.status === 'concluido').length;
    return (concluidos / items.length) * 100;
  };

  const getStatusEtapa = (etapaId) => {
    const items = getChecklistPorEtapa(etapaId);
    if (items.length === 0) return null;
    
    const bloqueados = items.filter(item => item.status === 'bloqueado').length;
    const concluidos = items.filter(item => item.status === 'concluido').length;
    const emAndamento = items.filter(item => item.status === 'em_andamento').length;
    
    if (bloqueados > 0) return { label: 'Bloqueado', color: 'text-red-600', icon: AlertCircle };
    if (concluidos === items.length) return { label: 'Concluído', color: 'text-green-600', icon: CheckCircle2 };
    if (emAndamento > 0) return { label: 'Em Andamento', color: 'text-blue-600', icon: Clock };
    return { label: 'Pendente', color: 'text-yellow-600', icon: Circle };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[var(--wine-700)]">Checklist de Execução</h2>
          <p className="text-gray-600 mt-1">Acompanhe todas as etapas da obra conforme cronograma</p>
        </div>
      </div>

      {filteredCronogramas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhuma etapa cadastrada no cronograma</p>
            <p className="text-sm text-gray-400">
              Acesse o módulo "Cronograma de Obra" para criar as tarefas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCronogramas.map((etapa) => {
            const unidade = unidades.find(u => u.id === etapa.unidade_id);
            const items = getChecklistPorEtapa(etapa.id);
            const progresso = calcularProgresso(etapa.id);
            const statusEtapa = getStatusEtapa(etapa.id);
            const isExpanded = expandedEtapas[etapa.id];

            return (
              <Card key={etapa.id} className="shadow-md hover:shadow-lg transition-all duration-200">
                <Collapsible open={isExpanded} onOpenChange={() => toggleEtapa(etapa.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-[var(--wine-600)]" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-[var(--wine-600)]" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {etapa.wbs && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {etapa.wbs}
                                </Badge>
                              )}
                              {etapa.eh_marco && (
                                <Badge className="bg-purple-600 text-white text-xs">
                                  MARCO
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg text-[var(--wine-700)]">
                              {etapa.etapa}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{unidade?.codigo}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {statusEtapa && (
                            <div className="flex items-center gap-2">
                              <statusEtapa.icon className={`w-5 h-5 ${statusEtapa.color}`} />
                              <span className={`text-sm font-medium ${statusEtapa.color}`}>
                                {statusEtapa.label}
                              </span>
                            </div>
                          )}
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[var(--wine-700)]">
                              {items.length}
                            </p>
                            <p className="text-xs text-gray-500">itens</p>
                          </div>
                        </div>
                      </div>
                      
                      {items.length > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-semibold text-[var(--wine-700)]">
                              {progresso.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={progresso} className="h-2" />
                        </div>
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="flex justify-end mb-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEtapa(etapa);
                            setEditingItem(null);
                            setShowForm(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Item
                        </Button>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum item no checklist</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <ChecklistItemCard
                              key={item.id}
                              item={item}
                              onEdit={(item) => {
                                setSelectedEtapa(etapa);
                                setEditingItem(item);
                                setShowForm(true);
                              }}
                              onDelete={(id) => deleteMutation.mutate(id)}
                              onUpdateStatus={(id, status, data_conclusao) => {
                                updateMutation.mutate({
                                  id,
                                  data: { status, data_conclusao }
                                });
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && selectedEtapa && (
        <ChecklistForm
          item={editingItem}
          etapa={selectedEtapa}
          unidades={unidades}
          checklistItems={checklistItems}
          onSubmit={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
            setSelectedEtapa(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}