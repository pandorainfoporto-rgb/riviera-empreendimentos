import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText, Eye, Download, CheckCircle2, Clock, AlertCircle,
  Calendar, Home, Palette, Settings, DollarSign, User,
  ArrowRight, Building2, Bed, Bath, Car
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  rascunho: { label: "Em Preenchimento", color: "#6b7280", icon: Clock },
  aguardando_projeto: { label: "Aguardando Projeto", color: "#f59e0b", icon: Clock },
  aguardando_reuniao: { label: "Projeto Pronto - Agendar Reunião", color: "#3b82f6", icon: Calendar },
  alteracao_projeto: { label: "Solicitação de Alteração", color: "#8b5cf6", icon: AlertCircle },
  aprovado: { label: "Projeto Aprovado", color: "#10b981", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "#ef4444", icon: AlertCircle },
};

const PADRAO_LABELS = {
  economico: "Econômico",
  medio_baixo: "Médio Baixo",
  medio: "Médio",
  medio_alto: "Médio Alto",
  alto: "Alto Padrão",
  luxo: "Luxo",
};

export default function PortalClienteIntencaoCompra() {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [intencaoSelecionada, setIntencaoSelecionada] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
  });

  const { data: intencoes = [] } = useQuery({
    queryKey: ['minhasIntencoes', cliente?.id],
    queryFn: () => base44.entities.IntencaoCompra.filter({ cliente_id: cliente.id }, '-created_date'),
    enabled: !!cliente?.id,
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Nenhum cliente vinculado à sua conta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const intencaoAtual = intencoes.find(i => !['aprovado', 'cancelado'].includes(i.status)) || intencoes[0];

  const verDetalhes = (intencao) => {
    setIntencaoSelecionada(intencao);
    setShowDetalhes(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 md:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sua Intenção de Compra</h1>
            <p className="text-white/90 mt-1">Acompanhe o desenvolvimento do seu projeto</p>
          </div>
        </div>
      </div>

      {intencoes.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma Intenção de Compra Registrada
            </h3>
            <p className="text-gray-500">
              Entre em contato com a Riviera para iniciar seu projeto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {intencaoAtual && (
            <Card className="shadow-2xl border-t-4 border-[var(--wine-600)]">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-xl">Status Atual do Projeto</CardTitle>
                  <Badge 
                    style={{ backgroundColor: STATUS_CONFIG[intencaoAtual.status]?.color }}
                    className="text-white px-4 py-2 text-sm"
                  >
                    {STATUS_CONFIG[intencaoAtual.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timeline */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {[
                      { status: 'rascunho', label: 'Intenção Cadastrada', concluido: true },
                      { status: 'aguardando_projeto', label: 'Projeto em Desenvolvimento', concluido: ['aguardando_reuniao', 'aprovado'].includes(intencaoAtual.status) },
                      { status: 'aguardando_reuniao', label: 'Reunião de Apresentação', concluido: intencaoAtual.status === 'aprovado' },
                      { status: 'aprovado', label: 'Projeto Aprovado', concluido: intencaoAtual.status === 'aprovado' },
                    ].map((etapa, idx) => {
                      const Icon = STATUS_CONFIG[etapa.status]?.icon || Clock;
                      return (
                        <div key={idx} className="relative pl-12 pb-2">
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            etapa.concluido ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {etapa.concluido ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <Icon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className={`font-semibold ${etapa.concluido ? 'text-gray-900' : 'text-gray-400'}`}>
                              {etapa.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resumo do Projeto */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Seu Projeto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-500">Área</span>
                        </div>
                        <p className="text-xl font-bold">{intencaoAtual.area_construida_desejada || 0}m²</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Bed className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-500">Quartos</span>
                        </div>
                        <p className="text-xl font-bold">{(intencaoAtual.quantidade_quartos || 0) + (intencaoAtual.quantidade_suites || 0)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Bath className="w-4 h-4 text-cyan-600" />
                          <span className="text-xs text-gray-500">Banheiros</span>
                        </div>
                        <p className="text-xl font-bold">{intencaoAtual.quantidade_banheiros || 0}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-500">Garagem</span>
                        </div>
                        <p className="text-xl font-bold">{intencaoAtual.vagas_garagem || 0} vagas</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Padrão Escolhido</p>
                        <p className="font-bold text-lg">{PADRAO_LABELS[intencaoAtual.padrao_imovel] || intencaoAtual.padrao_imovel}</p>
                      </div>
                      <Button variant="outline" onClick={() => verDetalhes(intencaoAtual)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes Completos
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Projeto Arquitetônico */}
                {intencaoAtual.projeto_arquitetonico_url && (
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Projeto Arquitetônico
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold mb-1">Versão {intencaoAtual.projeto_arquitetonico_versao || 1}</p>
                          {intencaoAtual.data_entrega_projeto && (
                            <p className="text-sm text-gray-600">
                              Enviado em {format(parseISO(intencaoAtual.data_entrega_projeto), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => window.open(intencaoAtual.projeto_arquitetonico_url, '_blank')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar Projeto
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = intencaoAtual.projeto_arquitetonico_url;
                              a.download = 'projeto_arquitetonico.pdf';
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>

                      {intencaoAtual.historico_projetos?.length > 1 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-semibold mb-2">Versões Anteriores</p>
                          <div className="space-y-2">
                            {intencaoAtual.historico_projetos.slice(0, -1).reverse().map((hist, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                                <span className="text-sm">Versão {hist.versao}</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => window.open(hist.url, '_blank')}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Reunião Agendada */}
                {intencaoAtual.data_reuniao_alinhamento && intencaoAtual.status === 'aguardando_reuniao' && (
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Reunião de Apresentação Agendada
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {format(parseISO(intencaoAtual.data_reuniao_alinhamento), "dd", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(intencaoAtual.data_reuniao_alinhamento), "MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">
                            {format(parseISO(intencaoAtual.data_reuniao_alinhamento), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {intencaoAtual.participantes_reuniao?.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Participantes: {intencaoAtual.participantes_reuniao.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Próximos Passos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-[var(--wine-600)]" />
                      Próximos Passos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {intencaoAtual.status === 'aguardando_projeto' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-semibold text-blue-900">
                            ⏳ Nosso time está desenvolvendo o projeto arquitetônico conforme suas preferências.
                          </p>
                          <p className="text-sm text-blue-700 mt-2">
                            Você será notificado assim que o projeto estiver pronto para apresentação.
                          </p>
                        </div>
                      )}
                      {intencaoAtual.status === 'aguardando_reuniao' && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="font-semibold text-purple-900">
                            ✅ Projeto pronto! Aguardando agendamento da reunião de apresentação.
                          </p>
                          <p className="text-sm text-purple-700 mt-2">
                            Entraremos em contato em breve para agendar.
                          </p>
                        </div>
                      )}
                      {intencaoAtual.status === 'aprovado' && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-semibold text-green-900">
                            🎉 Projeto aprovado! Próximo passo: formalização da negociação.
                          </p>
                          <p className="text-sm text-green-700 mt-2">
                            Você pode acompanhar a negociação na aba "Negociações".
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Intenções */}
          {intencoes.length > 1 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Intenções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intencoes.slice(1).map((intencao) => {
                    const statusConfig = STATUS_CONFIG[intencao.status];
                    const loteamento = loteamentos.find(l => l.id === intencao.loteamento_id);
                    return (
                      <div key={intencao.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{loteamento?.nome || 'Loteamento'}</p>
                            <Badge style={{ backgroundColor: statusConfig?.color }} className="text-white">
                              {statusConfig?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Criada em {format(parseISO(intencao.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => verDetalhes(intencao)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Intenção de Compra
            </DialogTitle>
          </DialogHeader>

          {intencaoSelecionada && (
            <Tabs defaultValue="estrutura" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="estrutura">
                  <Home className="w-4 h-4 mr-1" />
                  Estrutura
                </TabsTrigger>
                <TabsTrigger value="acabamentos">
                  <Palette className="w-4 h-4 mr-1" />
                  Acabamentos
                </TabsTrigger>
                <TabsTrigger value="adicionais">
                  <Settings className="w-4 h-4 mr-1" />
                  Adicionais
                </TabsTrigger>
                <TabsTrigger value="orcamento">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Orçamento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="estrutura" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Área Construída</p>
                    <p className="text-2xl font-bold">{intencaoSelecionada.area_construida_desejada || 0}m²</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Pavimentos</p>
                    <p className="text-2xl font-bold">{intencaoSelecionada.quantidade_pavimentos || 1}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Padrão</p>
                    <p className="text-lg font-bold">{PADRAO_LABELS[intencaoSelecionada.padrao_imovel]}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">Quartos</p>
                    <p className="text-xl font-bold text-blue-600">{intencaoSelecionada.quantidade_quartos || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600">Suítes</p>
                    <p className="text-xl font-bold text-purple-600">{intencaoSelecionada.quantidade_suites || 0}</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <p className="text-xs text-gray-600">Banheiros</p>
                    <p className="text-xl font-bold text-cyan-600">{intencaoSelecionada.quantidade_banheiros || 0}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600">Garagem</p>
                    <p className="text-xl font-bold text-green-600">{intencaoSelecionada.vagas_garagem || 0}</p>
                  </div>
                </div>

                {/* Cômodos */}
                <div>
                  <h4 className="font-semibold mb-3">Cômodos Selecionados</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(intencaoSelecionada.comodos || {})
                      .filter(([key, value]) => value)
                      .map(([key]) => (
                        <Badge key={key} variant="outline">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="acabamentos" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {intencaoSelecionada.tipo_telhado && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Tipo de Telhado</p>
                      <p className="font-semibold">{intencaoSelecionada.tipo_telhado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  )}
                  {intencaoSelecionada.tipo_piso_interno && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Piso Interno</p>
                      <p className="font-semibold">{intencaoSelecionada.tipo_piso_interno.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  )}
                  {intencaoSelecionada.tipo_piso_externo && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Piso Externo</p>
                      <p className="font-semibold">{intencaoSelecionada.tipo_piso_externo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  )}
                  {intencaoSelecionada.tipo_revestimento_parede && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Revestimento</p>
                      <p className="font-semibold">{intencaoSelecionada.tipo_revestimento_parede.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  )}
                </div>

                {intencaoSelecionada.preferencias_cores && Object.values(intencaoSelecionada.preferencias_cores).some(v => v) && (
                  <div>
                    <h4 className="font-semibold mb-3">Preferências de Cores</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(intencaoSelecionada.preferencias_cores)
                        .filter(([key, value]) => value && key !== 'observacoes_cores')
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="adicionais" className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(intencaoSelecionada.adicionais || {})
                    .filter(([key, value]) => value)
                    .map(([key]) => (
                      <Badge key={key} className="bg-green-100 text-green-800">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                </div>
                {intencaoSelecionada.detalhes_especificos && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Detalhes Específicos</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{intencaoSelecionada.detalhes_especificos}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orcamento" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-green-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Orçamento Mínimo</p>
                      <p className="text-2xl font-bold text-green-700">
                        R$ {(intencaoSelecionada.orcamento_minimo || 0).toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Orçamento Máximo</p>
                      <p className="text-2xl font-bold text-blue-700">
                        R$ {(intencaoSelecionada.orcamento_maximo || 0).toLocaleString('pt-BR')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {intencaoSelecionada.gerar_custo_projeto && intencaoSelecionada.valor_custo_projeto && (
                  <Card className="bg-yellow-50 border border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-base">Custo do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-yellow-700">
                        R$ {(intencaoSelecionada.valor_custo_projeto || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Condição: {intencaoSelecionada.condicao_pagamento_projeto?.replace('_', ' ') || 'À vista'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}