
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
  AlertCircle, CheckCircle2, Clock, TrendingUp, Package, MessageSquare, Phone
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
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Buscar cliente DIRETAMENTE pelo ID
  const { data: cliente, isLoading: clienteLoading } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      if (!user?.cliente_id) return null;
      
      try {
        // Buscar diretamente pelo ID do cliente
        const clientesData = await base44.entities.Cliente.list();
        const clienteEncontrado = clientesData.find(c => c.id === user.cliente_id);
        
        console.log('🔍 Buscando cliente:', user.cliente_id);
        console.log('✅ Cliente encontrado:', clienteEncontrado);
        
        return clienteEncontrado || null;
      } catch (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        return null;
      }
    },
    enabled: !!user?.cliente_id,
    retry: false,
  });

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

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = '#/PortalClienteLogin';
    }
  }, [user, userLoading]);

  // Loading
  if (userLoading || (user?.cliente_id && clienteLoading)) {
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

  // Cliente não vinculado - mensagem informativa
  if (!user?.cliente_id || !cliente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
        <style>{`
          :root {
            --wine-600: #922B3E;
            --wine-700: #7C2D3E;
            --wine-50: #FBF1F3;
            --grape-50: #F3EEF7;
          }
        `}</style>
        
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-[var(--wine-700)]">Portal do Cliente</h1>
              <Button
                onClick={() => {
                  base44.auth.logout();
                  window.location.href = '#/PortalClienteLogin';
                }}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Cadastro em Processamento
                </h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-900 font-medium mb-2">
                    Olá, <strong>{user?.full_name || user?.email}</strong>!
                  </p>
                  <p className="text-sm text-blue-700">
                    Seu acesso foi criado, mas a vinculação com o cadastro de cliente precisa ser finalizada.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🔧 Para Administradores:</h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[var(--wine-600)]">1.</span>
                        <span>Vá em <strong>Configuração → Gerenciar Usuários</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[var(--wine-600)]">2.</span>
                        <span>Edite o usuário <strong>{user?.email}</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[var(--wine-600)]">3.</span>
                        <span>Selecione o <strong>Cliente Vinculado</strong> correto</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-[var(--wine-600)]">4.</span>
                        <span>Salve e peça ao cliente para fazer login novamente</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 mb-1">Precisa de Ajuda?</h3>
                        <p className="text-sm text-green-700 mb-2">
                          Entre em contato com nossa equipe:
                        </p>
                        <p className="text-sm font-medium text-green-900">
                          📧 Email: contato@riviera.com.br<br/>
                          📱 WhatsApp: (51) 99999-9999
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-4">
                    Informações de Debug:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-left">
                    <p className="text-gray-700"><strong>Email:</strong> {user?.email}</p>
                    <p className="text-gray-700"><strong>Nome:</strong> {user?.full_name || 'Não informado'}</p>
                    <p className="text-gray-700"><strong>Tipo:</strong> {user?.tipo_usuario || 'sistema'}</p>
                    <p className="text-gray-700"><strong>Cliente ID:</strong> {user?.cliente_id || 'Não vinculado ❌'}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    base44.auth.logout();
                    window.location.href = '#/PortalClienteLogin';
                  }}
                  variant="outline"
                  className="mt-6 w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="bg-white border-t py-6">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm text-gray-600 text-center">
              © 2024 Riviera Incorporadora - Portal do Cliente
            </p>
          </div>
        </footer>
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
