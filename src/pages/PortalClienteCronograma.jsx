
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, Circle, AlertCircle, Image as ImageIcon, Eye, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fasesLabels = {
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

const statusColors = {
  nao_iniciada: "bg-gray-100 text-gray-700",
  em_andamento: "bg-blue-100 text-blue-700",
  concluida: "bg-green-100 text-green-700",
  atrasada: "bg-red-100 text-red-700",
  pausada: "bg-yellow-100 text-yellow-700",
};

const statusLabels = {
  nao_iniciada: "Não Iniciada",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
  pausada: "Pausada",
};

const statusIcons = {
  nao_iniciada: Circle,
  em_andamento: Clock,
  concluida: CheckCircle,
  atrasada: AlertCircle,
  pausada: Clock,
};

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-700",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  critica: "bg-red-100 text-red-700",
};

const checklistStatusColors = {
  pendente: "bg-yellow-100 text-yellow-700",
  em_andamento: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  bloqueado: "bg-red-100 text-red-700",
};

export default function PortalClienteCronograma() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      if (!user?.cliente_id) return null; // Prevent listing all clients if cliente_id is not available
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: negociacoes = [], isLoading: isLoadingNegociacoes } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidades = [], isLoading: isLoadingUnidades } = useQuery({
    queryKey: ['unidadesPortalCliente'],
    queryFn: () => base44.entities.Unidade.list(),
    staleTime: 1000 * 60 * 5,
  });

  const negociacaoAtiva = negociacoes.find(n => n.status === 'ativa');
  const unidadeAtiva = negociacaoAtiva ? unidades.find(u => u.id === negociacaoAtiva.unidade_id) : null;

  // Renamed from 'cronograma' to 'cronogramas' to match existing component usage
  const { data: cronogramas = [], isLoading: isLoadingCronogramas } = useQuery({
    queryKey: ['cronogramaUnidade', unidadeAtiva?.id],
    queryFn: () => base44.entities.CronogramaObra.filter({ unidade_id: unidadeAtiva.id }),
    enabled: !!unidadeAtiva?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: fotos = [], isLoading: isLoadingFotos } = useQuery({
    queryKey: ['fotosUnidade', unidadeAtiva?.id],
    queryFn: () => base44.entities.DocumentoObra.filter({ 
      unidade_id: unidadeAtiva.id, 
      tipo: 'foto' 
    }),
    enabled: !!unidadeAtiva?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Renamed from 'checklists' to 'checklistItems' to match existing component usage
  const { data: checklistItems = [], isLoading: isLoadingChecklists } = useQuery({
    queryKey: ['checklistsUnidade', unidadeAtiva?.id],
    queryFn: () => base44.entities.ChecklistObra.filter({ unidade_id: unidadeAtiva.id }),
    enabled: !!unidadeAtiva?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Adjusted initial loading checks
  if (isLoadingUser || isLoadingCliente || isLoadingNegociacoes || isLoadingUnidades) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do cliente...</p>
        </div>
      </div>
    );
  }

  // Adjusted check for active unit
  if (!user || !cliente || !unidadeAtiva) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600">Nenhuma unidade ativa vinculada ao seu cadastro.</p>
        <p className="text-gray-500 text-sm mt-2">
          Verifique se há uma negociação ativa para sua unidade.
        </p>
      </div>
    );
  }

  if (isLoadingCronogramas) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando cronograma...</p>
      </div>
    );
  }

  if (cronogramas.length === 0) {
    return (
      <div className="p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhuma etapa cadastrada para sua unidade ativa ({unidadeAtiva.codigo})</p>
      </div>
    );
  }

  const progressoGeral = cronogramas.reduce((sum, c) => sum + (c.percentual_conclusao || 0), 0) / cronogramas.length;

  const groupedByFase = cronogramas.reduce((acc, item) => {
    if (!acc[item.fase]) acc[item.fase] = [];
    acc[item.fase].push(item);
    return acc;
  }, {});

  // Agrupar fotos por etapa
  const getFotosPorEtapa = (etapaId) => {
    return fotos.filter(f => f.cronograma_obra_id === etapaId);
  };

  // Agrupar checklist por etapa
  const getChecklistPorEtapa = (etapaId) => {
    return checklistItems.filter(c => c.cronograma_obra_id === etapaId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Cronograma da Obra</h1>
          <p className="text-gray-600 mt-1">Acompanhe o andamento da construção</p>
          <p className="text-sm text-gray-500 mt-1">Unidade Ativa: <span className="font-semibold">{unidadeAtiva.codigo}</span></p>
        </div>

        <Card className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Progresso Geral</p>
                <p className="text-4xl font-bold">{progressoGeral.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-16 h-16 opacity-75" />
            </div>
            <Progress value={progressoGeral} className="h-3 bg-white/20" />
            <p className="text-sm mt-2 opacity-90">{cronogramas.length} etapas no total</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {Object.entries(groupedByFase).map(([fase, etapas]) => (
            <div key={fase}>
              <h3 className="text-lg font-bold text-[var(--wine-700)] mb-3 flex items-center gap-2">
                <div className="w-2 h-8 bg-[var(--wine-600)] rounded"></div>
                {fasesLabels[fase]}
              </h3>
              <div className="space-y-3 pl-4">
                {etapas.map((etapa) => {
                  const StatusIcon = statusIcons[etapa.status];
                  const fotosEtapa = getFotosPorEtapa(etapa.id);
                  const checklistEtapa = getChecklistPorEtapa(etapa.id);
                  const checklistConcluidos = checklistEtapa.filter(c => c.status === 'concluido').length;
                  
                  return (
                    <Card key={etapa.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg text-gray-900">{etapa.etapa}</h4>
                              <Badge className={statusColors[etapa.status]}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusLabels[etapa.status]}
                              </Badge>
                            </div>
                            {etapa.descricao && (
                              <p className="text-sm text-gray-600 mt-1">{etapa.descricao}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Unidade: {unidadeAtiva?.codigo || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Previsto: {format(parseISO(etapa.data_inicio_prevista), "dd/MM/yy")} - {format(parseISO(etapa.data_fim_prevista), "dd/MM/yy")}
                            </span>
                          </div>
                          {etapa.data_inicio_real && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Iniciado em: {format(parseISO(etapa.data_inicio_real), "dd/MM/yy")}
                                {etapa.data_fim_real && ` - Concluído em: ${format(parseISO(etapa.data_fim_real), "dd/MM/yy")}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Conclusão</span>
                            <span className="font-bold text-[var(--wine-700)]">
                              {etapa.percentual_conclusao || 0}%
                            </span>
                          </div>
                          <Progress value={etapa.percentual_conclusao || 0} className="h-2" />
                        </div>

                        {etapa.responsavel && (
                          <p className="text-xs text-gray-500 mb-3">
                            Responsável: {etapa.responsavel}
                          </p>
                        )}

                        {/* Tabs para Checklist e Fotos */}
                        {(checklistEtapa.length > 0 || fotosEtapa.length > 0) && (
                          <Tabs defaultValue="checklist" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="checklist">
                                Checklist ({checklistConcluidos}/{checklistEtapa.length})
                              </TabsTrigger>
                              <TabsTrigger value="fotos">
                                Fotos ({fotosEtapa.length})
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="checklist" className="mt-4">
                              {checklistEtapa.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhum item no checklist</p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {checklistEtapa.map((item) => (
                                    <div 
                                      key={item.id}
                                      className={`p-3 rounded-lg border ${
                                        item.status === 'concluido' 
                                          ? 'bg-green-50 border-green-200' 
                                          : 'bg-white border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                          {item.status === 'concluido' ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                          ) : item.status === 'em_andamento' ? (
                                            <Clock className="w-5 h-5 text-blue-600" />
                                          ) : item.status === 'bloqueado' ? (
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                          ) : (
                                            <Circle className="w-5 h-5 text-gray-400" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`font-medium text-sm ${
                                            item.status === 'concluido' ? 'line-through text-gray-500' : 'text-gray-900'
                                          }`}>
                                            {item.item}
                                          </p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            <Badge variant="outline" className={prioridadeColors[item.prioridade]}>
                                              {item.prioridade}
                                            </Badge>
                                            <Badge variant="outline" className={checklistStatusColors[item.status]}>
                                              {item.status}
                                            </Badge>
                                          </div>
                                          {item.observacoes && (
                                            <p className="text-xs text-gray-500 mt-1">{item.observacoes}</p>
                                          )}
                                          {item.data_conclusao && (
                                            <p className="text-xs text-green-600 mt-1">
                                              Concluído em: {format(parseISO(item.data_conclusao), "dd/MM/yyyy")}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="fotos" className="mt-4">
                              {fotosEtapa.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhuma foto disponível</p>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fotosEtapa.map((foto) => (
                                    <div 
                                      key={foto.id}
                                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow group"
                                      onClick={() => setSelectedPhoto(foto)}
                                    >
                                      <img
                                        src={foto.arquivo_url}
                                        alt={foto.titulo}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                        <p className="text-white text-xs truncate">{foto.titulo}</p>
                                        <p className="text-white/70 text-[10px]">
                                          {format(parseISO(foto.data_documento), "dd/MM/yyyy")}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog de Foto em Tela Cheia */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedPhoto.arquivo_url}
                alt={selectedPhoto.titulo}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              <div className="p-4 bg-white">
                <h3 className="font-bold text-gray-900">{selectedPhoto.titulo}</h3>
                {selectedPhoto.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{selectedPhoto.descricao}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Data: {format(parseISO(selectedPhoto.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
