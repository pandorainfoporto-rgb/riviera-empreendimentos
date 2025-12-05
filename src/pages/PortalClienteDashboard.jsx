import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Home, CreditCard, DollarSign, AlertCircle, CheckCircle2, 
  Clock, TrendingUp, Package, MessageSquare, FileText,
  Construction, Calendar, Image as ImageIcon
} from "lucide-react";

export default function PortalClienteDashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: cliente, isLoading: clienteLoading } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['minhasUnidades', cliente?.id],
    queryFn: () => base44.entities.Unidade.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['meusPagamentos', cliente?.id],
    queryFn: () => base44.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const unidadeIds = unidades.map(u => u.id);

  const { data: cronogramas = [] } = useQuery({
    queryKey: ['cronogramasCliente', unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      return await base44.entities.CronogramaObra.filter({ 
        unidade_id: { $in: unidadeIds }
      });
    },
    enabled: unidadeIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const { data: fotos = [] } = useQuery({
    queryKey: ['fotosObraCliente', unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      return await base44.entities.DocumentoObra.filter({ 
        unidade_id: { $in: unidadeIds },
        tipo: 'foto'
      });
    },
    enabled: unidadeIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const { data: mensagensNaoLidas = [] } = useQuery({
    queryKey: ['mensagensNaoLidasDash', cliente?.id],
    queryFn: async () => {
      const msgs = await base44.entities.Mensagem.filter({ 
        cliente_id: cliente.id,
        lida: false,
        remetente_tipo: 'admin'
      });
      return msgs;
    },
    enabled: !!cliente?.id,
    refetchInterval: 10000,
  });

  if (userLoading || clienteLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const negociacaoAtiva = negociacoes.find(n => n.status === 'ativa' || n.status === 'contrato_assinado');

  const pagamentosVencidos = pagamentos.filter(p => p.status === 'atrasado').length;
  const pagamentosPendentes = pagamentos.filter(p => p.status === 'pendente').length;
  const pagamentosPagos = pagamentos.filter(p => p.status === 'pago').length;

  const totalPago = pagamentos
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

  const totalPendente = pagamentos
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const totalGeral = negociacaoAtiva?.valor_total || 0;
  const percentualPago = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;

  const proximosPagamentos = pagamentos
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
    .slice(0, 3);

  const progressoObra = cronogramas.length > 0 
    ? cronogramas.reduce((sum, c) => sum + (c.percentual_conclusao || 0), 0) / cronogramas.length 
    : 0;

  const fotosRecentes = [...fotos]
    .sort((a, b) => new Date(b.data_documento) - new Date(a.data_documento))
    .slice(0, 4);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Bem-vindo, {cliente.nome.split(' ')[0]}!</h1>
            <p className="text-white/90 mt-1 text-sm sm:text-base">Acompanhe seu investimento em tempo real</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 text-xs">{unidades.length}</Badge>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-600 mb-1">
              {unidades.length === 1 ? 'Unidade' : 'Unidades'}
            </h3>
            <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              {unidades.length > 0 ? unidades.map(u => u.codigo).join(', ') : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700 text-xs">{pagamentosPagos}</Badge>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-600 mb-1">Pagos</h3>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700">
              R$ {(totalPago / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-orange-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 text-xs">{pagamentosPendentes}</Badge>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-600 mb-1">Pendentes</h3>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-700">
              R$ {(totalPendente / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-red-500">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <Badge className="bg-red-100 text-red-700 text-xs">{pagamentosVencidos}</Badge>
            </div>
            <h3 className="text-xs sm:text-sm text-gray-600 mb-1">Vencidos</h3>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-700">{pagamentosVencidos}</p>
          </CardContent>
        </Card>
      </div>

      {negociacaoAtiva && totalGeral > 0 && (
        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--wine-700)]" />
              <h3 className="font-bold text-lg">Progresso do Pagamento</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Valor Total</span>
                <span className="font-bold">R$ {totalGeral.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Já Pago</span>
                <span className="font-bold text-green-600">R$ {totalPago.toLocaleString('pt-BR')}</span>
              </div>
              <Progress value={percentualPago} className="h-4" />
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-bold text-[var(--wine-700)]">{percentualPago.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <Construction className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--wine-700)]" />
              Andamento da Obra
            </h3>
            
            {cronogramas.length === 0 ? (
              <div className="text-center py-8">
                <Construction className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Cronograma em preparação</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Progresso Geral</span>
                    <span className="font-bold text-[var(--wine-700)]">{progressoObra.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressoObra} className="h-3" />
                </div>

                <div className="space-y-2">
                  {cronogramas
                    .filter(c => c.status === 'em_andamento' || c.status === 'concluida')
                    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
                    .slice(0, 3)
                    .map((etapa) => (
                      <div key={etapa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {etapa.status === 'concluida' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Construction className="w-4 h-4 text-blue-600 animate-pulse" />
                          )}
                          <span className="text-sm font-medium">{etapa.etapa}</span>
                        </div>
                        <Badge className={etapa.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                          {etapa.percentual_conclusao || 0}%
                        </Badge>
                      </div>
                    ))}
                </div>

                <Link to={createPageUrl('PortalClienteCronograma')}>
                  <Button variant="outline" className="w-full mt-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Cronograma Completo
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Próximos Pagamentos
            </h3>
            {proximosPagamentos.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-gray-500">Nenhum pagamento pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosPagamentos.map((pag) => (
                  <div key={pag.id} className={`p-4 rounded-lg border-l-4 ${
                    pag.status === 'atrasado' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
                  }`}>
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-semibold">{pag.tipo || 'Parcela'}</p>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(pag.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className={pag.status === 'atrasado' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}>
                        {pag.status === 'atrasado' ? 'Vencido' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      R$ {(pag.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                <Link to={createPageUrl('PortalClienteFinanceiro')}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 mt-2">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar Agora
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              Últimas Fotos
            </h3>
            
            {fotosRecentes.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Fotos serão adicionadas em breve</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {fotosRecentes.map((foto) => (
                    <div 
                      key={foto.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => window.open(foto.arquivo_url, '_blank')}
                    >
                      <img
                        src={foto.arquivo_url}
                        alt={foto.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                        <p className="text-xs truncate">{foto.titulo}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl('PortalClienteCronograma')}>
                  <Button variant="outline" className="w-full">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Ver Todas as Fotos ({fotos.length})
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Mensagens</span>
              {mensagensNaoLidas.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {mensagensNaoLidas.length} nova{mensagensNaoLidas.length > 1 ? 's' : ''}
                </Badge>
              )}
            </h3>
            
            <div className="space-y-3">
              <Link to={createPageUrl('PortalClienteMensagens')}>
                <Button className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-16 text-lg">
                  <MessageSquare className="w-6 h-6 mr-3" />
                  Enviar Mensagem
                  {mensagensNaoLidas.length > 0 && (
                    <Badge className="ml-auto bg-white text-[var(--wine-700)]">
                      {mensagensNaoLidas.length}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <Link to={createPageUrl('PortalClienteDocumentos')}>
                  <Button variant="outline" className="w-full h-14">
                    <FileText className="w-5 h-5 mr-2" />
                    Documentos
                  </Button>
                </Link>
                <Link to={createPageUrl('PortalClienteUnidade')}>
                  <Button variant="outline" className="w-full h-14">
                    <Home className="w-5 h-5 mr-2" />
                    Minha Unidade
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}