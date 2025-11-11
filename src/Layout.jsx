import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  UserSquare2,
  CreditCard,
  Wallet,
  HardHat,
  FileText,
  CircleDollarSign,
  Receipt,
  DollarSign,
  ChevronRight,
  FolderOpen,
  Landmark,
  BadgeDollarSign,
  TrendingUp,
  Coins,
  Calendar,
  Award,
  Package,
  LogOut,
  User,
  Key,
  ArrowRightLeft,
  Building,
  Shield,
  UsersRound,
  Plug,
  Clock,
  BookOpen,
  MessageSquare,
  ShoppingCart,
  BarChart,
  Database,
  Mail,
  Store,
  Settings,
  RefreshCw,
  FileCheck,
  Sparkles
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const TOKEN_KEY = 'auth_token_custom';
const USER_DATA_KEY = 'user_data_custom';

const CustomAuth = {
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    return !!(token && userData);
  },

  validateToken: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return { success: false };

      const response = await base44.functions.invoke('validarTokenCustom', { token });

      if (response.data?.success) {
        return { success: true, usuario: response.data.usuario };
      }
      
      CustomAuth.logout();
      return { success: false };
    } catch (error) {
      CustomAuth.logout();
      return { success: false };
    }
  },

  getUserData: () => {
    try {
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },
};

const MenuItem = ({ item }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <Link to={createPageUrl(item.path)} className="flex items-center gap-3">
        <item.icon className="w-4 h-4" />
        <span>{item.name}</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

const CollapsibleMenuItem = ({ title, icon: Icon, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-10">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{title}</span>
            <ChevronRight className={`ml-auto w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="space-y-1 ml-1 mt-2 mb-3">
            {items.map((item) => (
              <SidebarMenuSubItem key={item.path}>
                <SidebarMenuSubButton asChild>
                  <Link to={createPageUrl(item.path)} className="py-3 px-3 min-h-[44px] flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-sm leading-tight">{item.name}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

function RedirectToLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/Login');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const paginasPublicas = [
    'Login',
    'Home',
    'PortalClienteLogin',
    'PortalClienteDashboard',
    'PortalClienteUnidade',
    'PortalClienteCronograma',
    'PortalClienteFinanceiro',
    'PortalClienteDocumentos',
    'PortalClienteMensagens',
    'PortalClientePerfil',
    'PortalImobiliariaLogin',
    'PortalImobiliariaDashboard',
    'PortalImobiliariaLotes',
    'PortalImobiliariaMensagens',
    'PortalImobiliariaPerfil',
  ];

  if (paginasPublicas.includes(currentPageName)) {
    return <>{children}</>;
  }

  const isAuth = CustomAuth.isAuthenticated();
  
  if (!isAuth) {
    return <RedirectToLogin />;
  }
  
  return <LayoutAdmin children={children} currentPageName={currentPageName} />;
}

function LayoutAdmin({ children, currentPageName }) {
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  
  const determinarTabAtiva = () => {
    const paginasConfig = ['Empresas', 'IntegracaoBancaria', 'TemplatesEmail', 'CentrosCusto', 'TiposDespesa', 'Colaboradores', 'FolhaPagamento', 'ConfiguracaoGateways', 'ConfiguracaoBackup', 'GerenciarUsuarios', 'ConfiguracaoIntegracoes'];
    const paginasRelatorios = ['RelatoriosConsolidado', 'RelatorioDRE', 'RelatorioFluxoCaixa', 'RelatorioReceitasDespesas', 'RelatorioAportes', 'RelatorioMovimentacoesCaixa', 'RelatorioGateways', 'RelatorioTaxasCustos', 'RelatorioSaldosCaixas', 'RelatorioUnidades', 'RelatorioVendas', 'RelatorioCronograma', 'RelatorioExecucao', 'RelatorioConsorcios', 'RelatorioContemplacoes', 'RelatorioEstoque', 'RelatorioCompras', 'RelatorioClientes', 'RelatorioFornecedores', 'RelatorioSocios', 'DocumentosTemplates', 'DocumentosGerados', 'RelatorioEngajamentoComunicacao', 'RelatorioTemplatesResposta', 'RelatorioDocumentosGerados'];
    
    if (paginasConfig.includes(currentPageName)) return 'config';
    if (paginasRelatorios.includes(currentPageName)) return 'relatorios';
    return 'gestao';
  };

  const [activeTab, setActiveTab] = useState(determinarTabAtiva());

  useEffect(() => {
    setActiveTab(determinarTabAtiva());
  }, [currentPageName]);

  useEffect(() => {
    const validar = async () => {
      const validation = await CustomAuth.validateToken();

      if (!validation.success) {
        navigate('/Login');
        return;
      }

      setUsuario(validation.usuario);
      setVerificando(false);
    };

    validar();
  }, [navigate]);

  const { data: pagamentosClientesPendentes = [] } = useQuery({
    queryKey: ['pagamentosClientesPendentes'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      return await base44.entities.PagamentoCliente.filter({
        status: { $in: ['pendente', 'atrasado'] },
        data_vencimento: { $lte: hoje }
      }, '-data_vencimento', 5);
    },
    enabled: !verificando && !!usuario,
    retry: false,
  });

  const { data: notificacoesNaoLidas = [] } = useQuery({
    queryKey: ['notificacoesNaoLidas'],
    queryFn: async () => {
      return await base44.entities.Notificacao.filter({ lida: false }, '-created_date', 10);
    },
    enabled: !verificando && !!usuario,
    retry: false,
  });

  if (verificando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    CustomAuth.logout();
    navigate('/Login');
  };

  return (
    <>
      <style>{`
        :root {
          --wine-900: #4A1625;
          --wine-800: #6B1F34;
          --wine-700: #7C2D3E;
          --wine-600: #922B3E;
          --wine-500: #A63446;
          --wine-400: #C85566;
          --wine-300: #D97B8A;
          --wine-200: #E9A5AF;
          --wine-100: #F4CDD4;
          --wine-50: #FBF1F3;
          --grape-700: #6B4984;
          --grape-600: #7D5999;
          --grape-500: #8B5A9B;
          --grape-400: #A176B8;
        }
        
        body {
          zoom: 0.8;
        }

        @media (max-width: 640px) {
          body {
            zoom: 1;
          }
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-gray-50">
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-xl font-bold">
                  R
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg text-[var(--wine-700)]">Riviera</h2>
                  <p className="text-xs text-gray-500">Incorporadora</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="grid grid-cols-4 gap-2 mb-6 px-2">
                  <Button
                    variant={activeTab === "gestao" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("gestao")}
                    className={activeTab === "gestao" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "relatorios" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("relatorios")}
                    className={activeTab === "relatorios" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                  >
                    <BarChart className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "config" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("config")}
                    className={activeTab === "config" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "sobre" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("sobre")}
                    className={activeTab === "sobre" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                  >
                    <BookOpen className="w-5 h-5" />
                  </Button>
                </div>

                <TabsContent value="gestao" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" }} />
                        
                        <CollapsibleMenuItem 
                          title="Cadastros" 
                          icon={FolderOpen}
                          items={[
                            { name: "Loteamentos", icon: Building2, path: "Loteamentos" },
                            { name: "Unidades", icon: Building, path: "Unidades" },
                            { name: "Lotes", icon: Package, path: "Lotes" },
                            { name: "Sócios", icon: UserSquare2, path: "Socios" },
                            { name: "Clientes", icon: Users, path: "Clientes" },
                            { name: "Fornecedores", icon: Briefcase, path: "Fornecedores" },
                            { name: "Imobiliárias", icon: Store, path: "Imobiliarias" },
                            { name: "Corretores", icon: UsersRound, path: "Corretores" },
                            { name: "Produtos", icon: Package, path: "Produtos" },
                            { name: "Serviços", icon: Award, path: "Servicos" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Financeiro" 
                          icon={Wallet}
                          items={[
                            { name: "Caixas", icon: Wallet, path: "Caixas" },
                            { name: "Bancos e Integrações", icon: Landmark, path: "Bancos" },
                            { name: "Boletos", icon: FileText, path: "Boletos" },
                            { name: "Conciliação Bancária", icon: RefreshCw, path: "ConciliacaoBancaria" },
                            { name: "Contas", icon: CreditCard, path: "Contas" },
                            { name: "Corretoras", icon: BadgeDollarSign, path: "Corretoras" },
                            { name: "Tipo de Ativos", icon: TrendingUp, path: "TipoAtivos" },
                            { name: "Administradoras", icon: Building, path: "Administradoras" },
                          ]}
                        />

                        <MenuItem item={{ name: "Locações", icon: Key, path: "Alugueis" }} />

                        <CollapsibleMenuItem 
                          title="Operacional" 
                          icon={HardHat}
                          items={[
                            { name: "Cronograma de Obra", icon: Calendar, path: "CronogramaObra" },
                            { name: "Execução de Obra", icon: HardHat, path: "ExecucaoObra" },
                            { name: "Custos de Obra", icon: DollarSign, path: "CustosObra" },
                            { name: "Orçamentos de Compra", icon: FileText, path: "OrcamentosCompra" },
                            { name: "Compras", icon: ShoppingCart, path: "Compras" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Fluxo Financeiro" 
                          icon={DollarSign}
                          items={[
                            { name: "Fluxo por Unidade", icon: TrendingUp, path: "FluxoPorUnidade" },
                            { name: "Transferências entre Caixas", icon: ArrowRightLeft, path: "TransferenciasCaixas" },
                            { name: "Posição de Caixa", icon: Wallet, path: "PosicaoCaixa" },
                            { name: "Orçamentos", icon: BarChart, path: "Orcamentos" },
                            { name: "Aportes Sócios", icon: Coins, path: "AportesSocios" },
                            { name: "Negociações", icon: FileText, path: "Negociacoes" },
                            { name: "Recebimentos Clientes", icon: CreditCard, path: "PagamentosClientes" },
                            { name: "Pagamentos Fornecedores", icon: Receipt, path: "PagamentosFornecedores" },
                            { name: "Investimentos", icon: TrendingUp, path: "Investimentos" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Documentos" 
                          icon={FileText}
                          items={[
                            { name: "Templates", icon: FileText, path: "DocumentosTemplates" },
                            { name: "Documentos Gerados", icon: FileCheck, path: "DocumentosGerados" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Comunicação" 
                          icon={MessageSquare}
                          items={[
                            { name: "Mensagens Clientes", icon: MessageSquare, path: "MensagensClientes" },
                            { name: "Respostas Rápidas", icon: Sparkles, path: "RespostasRapidas" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Consórcios" 
                          icon={CircleDollarSign}
                          items={[
                            { name: "Cadastro Cotas", icon: CircleDollarSign, path: "Consorcios" },
                            { name: "Comercialização", icon: ShoppingCart, path: "ComercializacaoConsorcios" },
                            { name: "Transferências", icon: ArrowRightLeft, path: "TransferenciasConsorcios" },
                            { name: "Resgates", icon: DollarSign, path: "ResgateConsorcios" },
                            { name: "Parcelas", icon: Receipt, path: "ParcelasConsorcios" },
                            { name: "Lances", icon: TrendingUp, path: "LancesConsorcios" },
                            { name: "Resultados", icon: Award, path: "ResultadosConsorcios" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Imobiliárias" 
                          icon={Store}
                          items={[
                            { name: "CRM - Leads", icon: TrendingUp, path: "CRM" },
                            { name: "Leads de Pré-Venda", icon: TrendingUp, path: "LeadsImobiliarias" },
                            { name: "Mensagens", icon: MessageSquare, path: "MensagensImobiliarias" },
                            { name: "Relatório de Conversão", icon: BarChart, path: "RelatorioConversoesImobiliarias" },
                          ]}
                        />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "Integrações Externas", icon: Plug, path: "ConfiguracaoIntegracoes" }} />
                        <MenuItem item={{ name: "Integração Bancária", icon: Landmark, path: "IntegracaoBancaria" }} />
                        <MenuItem item={{ name: "Gateways Pagamento", icon: CreditCard, path: "ConfiguracaoGateways" }} />
                        <MenuItem item={{ name: "Templates Email", icon: Mail, path: "TemplatesEmail" }} />
                        <MenuItem item={{ name: "Backup Automático", icon: Database, path: "ConfiguracaoBackup" }} />
                        <MenuItem item={{ name: "Centros de Custo", icon: DollarSign, path: "CentrosCusto" }} />
                        <MenuItem item={{ name: "Tipos de Despesa", icon: Receipt, path: "TiposDespesa" }} />
                        <MenuItem item={{ name: "Gerenciar Usuários", icon: Users, path: "GerenciarUsuarios" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

              </Tabs>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 p-4">
              {usuario && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full flex flex-col items-center gap-2 h-auto py-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                          {getInitials(usuario.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className="text-sm font-medium truncate">{usuario.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <div className="flex flex-col items-center gap-3 p-6 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-3xl">
                          {getInitials(usuario.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className="font-semibold text-gray-900">{usuario.nome}</p>
                        <p className="text-sm text-gray-500 mt-1">{usuario.email}</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                          {usuario.tipo_acesso}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Perfil')} className="flex items-center gap-2 py-3">
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="py-3 text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold text-gray-900">{currentPageName}</h1>
              </div>

              <div className="flex items-center gap-3">
                {pagamentosClientesPendentes.length > 0 && (
                  <Link to={createPageUrl('PagamentosClientes')}>
                    <Button variant="outline" size="sm">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pendentes
                      <Badge className="ml-2 bg-red-600 text-white">
                        {pagamentosClientesPendentes.length}
                      </Badge>
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <MessageSquare className="w-5 h-5" />
                      {notificacoesNaoLidas.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-600 text-white text-xs">
                          {notificacoesNaoLidas.length > 9 ? '9+' : notificacoesNaoLidas.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notificacoesNaoLidas.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notificacoesNaoLidas.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                          <p className="font-medium text-sm">{notif.titulo}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.mensagem}</p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}