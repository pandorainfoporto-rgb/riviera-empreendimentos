import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Home, FileText, CreditCard, Calendar, DollarSign, 
  AlertCircle, CheckCircle2, Clock, TrendingUp, Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PortalClienteDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUserCliente'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: cliente } = useQuery({
    queryKey: ['clienteLogado', user?.email],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.filter({ email: user.email });
      return clientes[0] || null;
    },
    enabled: !!user?.email,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoesCliente', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    retry: false,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidadesCliente'],
    queryFn: () => base44.entities.Unidade.list(),
    retry: false,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentosClientePortal', cliente?.id],
    queryFn: () => base44.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    retry: false,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentosCliente', cliente?.id],
    queryFn: async () => {
      const negociacoesCliente = await base44.entities.Negociacao.filter({ cliente_id: cliente.id });
      const unidadesIds = negociacoesCliente.map(n => n.unidade_id);
      
      if (unidadesIds.length === 0) return [];
      
      const docs = await base44.entities.DocumentoObra.list();
      return docs.filter(d => 
        unidadesIds.includes(d.unidade_id) && 
        (d.tipo === 'documento_geral' || d.tipo === 'contrato' || d.tipo === 'negociacao')
      );
    },
    enabled: !!cliente?.id,
    retry: false,
  });

  if (!cliente) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Perfil de Cliente Não Encontrado
          </h3>
          <p className="text-yellow-700">
            Não encontramos um cadastro de cliente vinculado ao seu email ({user?.email}).
            Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  const negociacaoAtiva = negociacoes.find(n => n.status === 'ativa');
  const unidadeAtiva = negociacaoAtiva ? unidades.find(u => u.id === negociacaoAtiva.unidade_id) : null;

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

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 md:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bem-vindo, {cliente.nome.split(' ')[0]}!</h1>
            <p className="text-white/90 mt-1">Acompanhe seu investimento em tempo real</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">Ativo</Badge>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Sua Unidade</h3>
            <p className="text-2xl font-bold text-gray-900">
              {unidadeAtiva?.codigo || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700">{pagamentosPagos}</Badge>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Pagamentos Realizados</h3>
            <p className="text-2xl font-bold text-green-700">
              R$ {(totalPago / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">{pagamentosPendentes}</Badge>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Pagamentos Pendentes</h3>
            <p className="text-2xl font-bold text-orange-700">
              R$ {(totalPendente / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-all border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <Badge className="bg-red-100 text-red-700">{pagamentosVencidos}</Badge>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Pagamentos Vencidos</h3>
            <p className="text-2xl font-bold text-red-700">
              {pagamentosVencidos}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Pagamento */}
      {negociacaoAtiva && totalGeral > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
              <TrendingUp className="w-5 h-5" />
              Progresso do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Valor Total do Imóvel</span>
                  <span className="font-bold text-gray-900">
                    R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Já Pago</span>
                  <span className="font-bold text-green-600">
                    R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-600">Saldo Restante</span>
                  <span className="font-bold text-orange-600">
                    R$ {(totalGeral - totalPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <Progress value={percentualPago} className="h-4 mb-2" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progresso</span>
                  <span className="font-semibold text-[var(--wine-700)]">
                    {percentualPago.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas e Próximos Pagamentos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-[var(--wine-700)]">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl('PortalClienteFinanceiro')}>
              <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90 h-16 text-lg">
                <CreditCard className="w-6 h-6 mr-3" />
                Pagar Parcelas Online
              </Button>
            </Link>
            
            <Link to={createPageUrl('PortalClienteDocumentos')}>
              <Button variant="outline" className="w-full h-14">
                <FileText className="w-5 h-5 mr-2" />
                Meus Documentos ({documentos.length})
              </Button>
            </Link>
            
            <Link to={createPageUrl('PortalClienteUnidade')}>
              <Button variant="outline" className="w-full h-14">
                <Home className="w-5 h-5 mr-2" />
                Detalhes da Unidade
              </Button>
            </Link>
            
            <Link to={createPageUrl('PortalClienteCronograma')}>
              <Button variant="outline" className="w-full h-14">
                <Calendar className="w-5 h-5 mr-2" />
                Cronograma da Obra
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Próximos Pagamentos */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Próximos Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosPagamentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Nenhum pagamento pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosPagamentos.map((pag) => (
                  <div 
                    key={pag.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      pag.status === 'atrasado' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {pag.tipo === 'entrada' ? 'Entrada' : 
                           pag.tipo === 'parcela' ? 'Parcela' : pag.tipo}
                        </p>
                        <p className="text-sm text-gray-600">
                          Venc: {format(parseISO(pag.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge className={pag.status === 'atrasado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                        {pag.status === 'atrasado' ? 'Vencido' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {(pag.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Link to={createPageUrl('PortalClienteFinanceiro')}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Pagar Agora
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}