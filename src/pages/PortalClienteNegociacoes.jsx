import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Eye, Download, CheckCircle2, Clock, AlertCircle,
  DollarSign, Calendar, Building2, TrendingUp, User, File
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  ativa: { label: "Em Andamento", color: "#3b82f6", icon: Clock },
  aguardando_assinatura_contrato: { label: "Aguardando Assinatura", color: "#f59e0b", icon: FileText },
  contrato_assinado: { label: "Contrato Assinado", color: "#10b981", icon: CheckCircle2 },
  finalizada: { label: "Finalizada", color: "#6b7280", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", color: "#ef4444", icon: AlertCircle },
};

export default function PortalClienteNegociacoes() {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [negociacaoSelecionada, setNegociacaoSelecionada] = useState(null);

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

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }, '-created_date'),
    enabled: !!cliente?.id,
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades_neg'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_neg'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: contratos = [] } = useQuery({
    queryKey: ['meusContratos', negociacoes.map(n => n.id)],
    queryFn: async () => {
      try {
        const negIds = negociacoes.map(n => n.id);
        if (negIds.length === 0) return [];
        return await base44.entities.Contrato.filter({ negociacao_id: { $in: negIds } });
      } catch {
        return [];
      }
    },
    enabled: negociacoes.length > 0,
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

  const negociacaoAtiva = negociacoes.find(n => ['ativa', 'aguardando_assinatura_contrato', 'contrato_assinado'].includes(n.status));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 md:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Minhas Negociações</h1>
            <p className="text-white/90 mt-1">Acompanhe suas negociações e contratos</p>
          </div>
        </div>
      </div>

      {negociacoes.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma Negociação Registrada
            </h3>
            <p className="text-gray-500">
              Aguardando formalização da negociação pela Riviera.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {negociacaoAtiva && (
            <Card className="shadow-2xl border-t-4 border-[var(--wine-600)]">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-xl">Negociação Atual</CardTitle>
                  <Badge 
                    style={{ backgroundColor: STATUS_CONFIG[negociacaoAtiva.status]?.color }}
                    className="text-white px-4 py-2 text-sm"
                  >
                    {STATUS_CONFIG[negociacaoAtiva.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações da Unidade */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Imóvel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const unidade = unidades.find(u => u.id === negociacaoAtiva.unidade_id);
                        const loteamento = loteamentos.find(l => l.id === unidade?.loteamento_id);
                        return (
                          <>
                            <p className="font-bold text-lg mb-1">{unidade?.codigo || 'Unidade'}</p>
                            <p className="text-sm text-gray-600">{loteamento?.nome || 'Loteamento'}</p>
                            {unidade?.area_total && (
                              <p className="text-sm text-gray-600 mt-2">Área: {unidade.area_total}m²</p>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Valores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                      <p className="font-bold text-2xl text-green-700">
                        R$ {(negociacaoAtiva.valor_total || 0).toLocaleString('pt-BR')}
                      </p>
                      {negociacaoAtiva.valor_entrada > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Entrada: R$ {(negociacaoAtiva.valor_entrada || 0).toLocaleString('pt-BR')} ({negociacaoAtiva.percentual_entrada}%)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Condições de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Condições de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Parcelas Mensais</p>
                        <p className="text-xl font-bold">{negociacaoAtiva.quantidade_parcelas_mensais || 0}x</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Valor da Parcela</p>
                        <p className="text-xl font-bold text-blue-600">
                          R$ {(negociacaoAtiva.valor_parcela_mensal || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Dia de Vencimento</p>
                        <p className="text-xl font-bold">{negociacaoAtiva.dia_vencimento || 10}</p>
                      </div>
                    </div>
                    {negociacaoAtiva.tipo_correcao !== 'nenhuma' && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-900">
                          Correção: {negociacaoAtiva.tabela_correcao?.toUpperCase() || 'Personalizada'} 
                          ({negociacaoAtiva.tipo_correcao})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contrato */}
                {(() => {
                  const contrato = contratos.find(c => c.negociacao_id === negociacaoAtiva.id);
                  if (!contrato) return null;
                  return (
                    <Card className="bg-purple-50 border-2 border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <File className="w-5 h-5 text-purple-600" />
                          Contrato de Compra e Venda
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold mb-1">{contrato.titulo}</p>
                            {negociacaoAtiva.data_assinatura_contrato && (
                              <p className="text-sm text-gray-600">
                                Assinado em {format(parseISO(negociacaoAtiva.data_assinatura_contrato), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          {contrato.arquivo_url && (
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => window.open(contrato.arquivo_url, '_blank')}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Datas Importantes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[var(--wine-600)]" />
                      Datas Importantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Início da Negociação</p>
                        <p className="font-semibold">
                          {format(parseISO(negociacaoAtiva.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {negociacaoAtiva.data_prevista_entrega && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Entrega Prevista</p>
                          <p className="font-semibold text-green-700">
                            {format(parseISO(negociacaoAtiva.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          {negociacoes.length > 1 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Negociações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {negociacoes.filter(n => n.id !== negociacaoAtiva?.id).map((negociacao) => {
                    const statusConfig = STATUS_CONFIG[negociacao.status];
                    const unidade = unidades.find(u => u.id === negociacao.unidade_id);
                    return (
                      <div key={negociacao.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{unidade?.codigo || 'Unidade'}</p>
                            <Badge style={{ backgroundColor: statusConfig?.color }} className="text-white">
                              {statusConfig?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Iniciada em {format(parseISO(negociacao.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            R$ {(negociacao.valor_total || 0).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setNegociacaoSelecionada(negociacao);
                            setShowDetalhes(true);
                          }}
                        >
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Negociação
            </DialogTitle>
          </DialogHeader>

          {negociacaoSelecionada && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {(negociacaoSelecionada.valor_total || 0).toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <Badge style={{ backgroundColor: STATUS_CONFIG[negociacaoSelecionada.status]?.color }} className="text-white">
                      {STATUS_CONFIG[negociacaoSelecionada.status]?.label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {negociacaoSelecionada.valor_entrada > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">Entrada</p>
                    <p className="font-bold text-blue-700">
                      R$ {(negociacaoSelecionada.valor_entrada || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Parcelas</p>
                  <p className="font-bold text-purple-700">{negociacaoSelecionada.quantidade_parcelas_mensais}x</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Valor Parcela</p>
                  <p className="font-bold text-green-700">
                    R$ {(negociacaoSelecionada.valor_parcela_mensal || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}