import React, { useEffect, useState } from "react";
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
  Home, FileText, CreditCard, DollarSign, Menu, User, Key, LogOut,
  AlertCircle, CheckCircle2, Clock, TrendingUp, Package, MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PortalClienteDashboard() {
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [acessoNegado, setAcessoNegado] = useState(false);

  // Buscar usuário atual
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Buscar cliente vinculado ao email
  const { data: clientes = [], isLoading: clientesLoading } = useQuery({
    queryKey: ['meuCliente', user?.email],
    queryFn: async () => {
      if (user?.email) {
        const porEmail = await base44.entities.Cliente.filter({ email: user.email });
        console.log('Cliente encontrado:', porEmail[0]);
        return porEmail;
      }
      return [];
    },
    enabled: !!user,
    retry: false,
  });

  const cliente = clientes[0];

  // Verificar acesso
  useEffect(() => {
    if (userLoading || clientesLoading) return;

    if (!user) {
      console.log('❌ Não autenticado - redirecionando para login');
      window.location.href = '#/PortalClienteLogin';
      return;
    }

    // Se for admin, redirecionar para admin
    if (user.role === 'admin') {
      console.log('❌ Usuário é ADMIN - redirecionando para Dashboard');
      window.location.href = '#/Dashboard';
      return;
    }

    // Se não encontrou cliente vinculado
    if (!cliente) {
      console.log('❌ Cliente não encontrado para:', user.email);
      setAcessoNegado(true);
      setVerificandoAcesso(false);
      return;
    }

    // Cliente encontrado!
    console.log('✅ Acesso liberado para cliente:', cliente.nome);
    setVerificandoAcesso(false);
  }, [user, userLoading, cliente, clientesLoading]);

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['minhasNegociacoes', cliente?.id],
    queryFn: () => base44.entities.Negociacao.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['meusPagamentos', cliente?.id],
    queryFn: () => base44.entities.PagamentoCliente.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
  });

  // Loading
  if (userLoading || clientesLoading || verificandoAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
        <style>{`
          :root {
            --wine-600: #922B3E;
            --wine-50: #FBF1F3;
            --grape-50: #F3EEF7;
          }
        `}</style>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  // Acesso negado
  if (acessoNegado || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
        <style>{`
          :root {
            --wine-600: #922B3E;
            --wine-50: #FBF1F3;
            --grape-50: #F3EEF7;
          }
        `}</style>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Acesso Negado
            </h3>
            <p className="text-red-700 mb-4">
              Não encontramos um cadastro de cliente vinculado à sua conta.
            </p>
            <p className="text-sm text-red-600">
              Email: {user?.email || 'N/A'}
            </p>
            <Button
              onClick={() => {
                base44.auth.logout();
                window.location.href = '#/PortalClienteLogin';
              }}
              className="mt-6 bg-red-600 hover:bg-red-700"
            >
              Sair
            </Button>
          </div>
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

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17872_525981935_17846132280535972_4105371699080593471_n.jpg";

  const getInitials = (name) => {
    if (!name) return "C";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { title: "Dashboard", url: createPageUrl("PortalClienteDashboard"), icon: Home },
    { title: "Minha Unidade", url: createPageUrl("PortalClienteUnidade"), icon: Package },
    { title: "Financeiro", url: createPageUrl("PortalClienteFinanceiro"), icon: CreditCard },
    { title: "Cronograma", url: createPageUrl("PortalClienteCronograma"), icon: Clock },
    { title: "Documentos", url: createPageUrl("PortalClienteDocumentos"), icon: FileText },
    { title: "Mensagens", url: createPageUrl("PortalClienteMensagens"), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --wine-50: #FBF1F3;
          --grape-600: #7D5999;
          --grape-50: #F3EEF7;
        }
      `}</style>

      {/* Header/Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-xl flex items-center justify-center bg-white p-2 border border-gray-200">
                <img 
                  src={logoUrl}
                  alt="Riviera Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[var(--wine-700)]">Portal do Cliente</h1>
                <p className="text-xs text-gray-600">Riviera Incorporadora</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.hash === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                      <AvatarFallback className="text-white font-bold text-xs">
                        {getInitials(cliente?.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{cliente?.nome}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('PortalClientePerfil')} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      base44.auth.logout();
                      window.location.href = '#/PortalClienteLogin';
                    }} 
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Home className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Bem-vindo, {cliente.nome.split(' ')[0]}!</h1>
                <p className="text-white/90 mt-1">Acompanhe seu investimento</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-t-4 border-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Ativo</Badge>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Sua Unidade</h3>
                <p className="text-2xl font-bold">{unidadeAtiva?.codigo || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-green-500">
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

            <Card className="border-t-4 border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">{pagamentosPendentes}</Badge>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Pendentes</h3>
                <p className="text-2xl font-bold text-orange-700">
                  R$ {(totalPendente / 1000).toFixed(0)}k
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <Badge className="bg-red-100 text-red-700">{pagamentosVencidos}</Badge>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Vencidos</h3>
                <p className="text-2xl font-bold text-red-700">{pagamentosVencidos}</p>
              </CardContent>
            </Card>
          </div>

          {negociacaoAtiva && totalGeral > 0 && (
            <Card>
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

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Acesso Rápido</h3>
                <div className="space-y-3">
                  <Link to={createPageUrl('PortalClienteFinanceiro')}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 h-16 text-lg">
                      <CreditCard className="w-6 h-6 mr-3" />
                      Pagar Parcelas Online
                    </Button>
                  </Link>
                  <Link to={createPageUrl('PortalClienteUnidade')}>
                    <Button variant="outline" className="w-full h-14">
                      <Home className="w-5 h-5 mr-2" />
                      Detalhes da Unidade
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Próximos Pagamentos</h3>
                </div>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 text-center">
            © 2024 Riviera Incorporadora
          </p>
        </div>
      </footer>
    </div>
  );
}