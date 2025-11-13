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
  UsersRound,
  Plug,
  MessageSquare,
  ShoppingCart,
  BarChart,
  Database,
  Mail,
  Store,
  Settings,
  RefreshCw,
  FileCheck,
  PieChart,
  TrendingDown,
  Zap,
  Hammer,
  FileBarChart,
  Info,
  History,
  BookOpen,
  ExternalLink,
  UserCheck,
  MapPin,
  UserCog,
  Wrench,
  Shield,
  Calculator,
  Moon,
  Sun,
  Home
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

// Layout para Portal do Cliente
import LayoutCliente from "./components/LayoutCliente";

// Layout para Portal da Imobiliária
import LayoutImobiliaria from "./components/LayoutImobiliaria";

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
          <SidebarMenuButton>
            <Icon className="w-4 h-4" />
            <span>{title}</span>
            <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="space-y-1 ml-1 mt-2 mb-3">
            {items.map((item) => (
              <SidebarMenuSubItem key={item.path}>
                <SidebarMenuSubButton asChild>
                  <Link to={createPageUrl(item.path)} className="py-3 px-3 flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="text-sm">{item.name}</span>
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

export default function Layout({ children, currentPageName }) {
  const [activeTab, setActiveTab] = useState('gestao');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pagamentosClientesPendentes = [] } = useQuery({
    queryKey: ['pagamentosClientesPendentes'],
    queryFn: async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        return await base44.entities.PagamentoCliente.filter({
          status: { $in: ['pendente', 'atrasado'] },
          data_vencimento: { $lte: hoje }
        }, '-data_vencimento', 5);
      } catch {
        return [];
      }
    },
    retry: false,
    enabled: user?.tipo_usuario === 'sistema',
  });

  // Redirecionar usuários baseado no tipo
  useEffect(() => {
    if (user && !loadingUser) {
      const currentPath = window.location.pathname;
      
      if (user.tipo_usuario === 'cliente') {
        // Cliente só acessa portal do cliente
        if (!currentPath.includes('PortalCliente')) {
          navigate(createPageUrl('PortalClienteDashboard'));
        }
      } else if (user.tipo_usuario === 'imobiliaria') {
        // Imobiliária só acessa portal da imobiliária
        if (!currentPath.includes('PortalImobiliaria')) {
          navigate(createPageUrl('PortalImobiliariaDashboard'));
        }
      }
    }
  }, [user, loadingUser, navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Se for cliente, usar layout do portal do cliente
  if (user?.tipo_usuario === 'cliente') {
    return <LayoutCliente currentPageName={currentPageName}>{children}</LayoutCliente>;
  }

  // Se for imobiliária, usar layout do portal da imobiliária
  if (user?.tipo_usuario === 'imobiliaria') {
    return <LayoutImobiliaria currentPageName={currentPageName}>{children}</LayoutImobiliaria>;
  }

  // Layout padrão para usuários do tipo "sistema"
  return (
    <>
      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --grape-600: #7D5999;
        }
        body { 
          zoom: 0.92;
          color: #000000;
        }
        @media (max-width: 640px) { 
          body { zoom: 1; } 
        }
        
        /* Dark Mode */
        .dark {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        .dark * {
          color: #ffffff !important;
        }
        .dark .bg-white {
          background-color: #2d2d2d !important;
        }
        .dark .bg-gray-50 {
          background-color: #1f1f1f !important;
        }
        .dark .bg-gray-100 {
          background-color: #2a2a2a !important;
        }
        .dark .text-gray-900,
        .dark .text-gray-800,
        .dark .text-gray-700,
        .dark .text-black {
          color: #ffffff !important;
        }
        .dark .text-gray-600,
        .dark .text-gray-500 {
          color: #b8b8b8 !important;
        }
        .dark .text-gray-400 {
          color: #888888 !important;
        }
        .dark .border-gray-200,
        .dark .border {
          border-color: #404040 !important;
        }
        .dark input, 
        .dark textarea, 
        .dark select,
        .dark [role="combobox"] {
          background-color: #2d2d2d !important;
          color: #ffffff !important;
          border-color: #404040 !important;
        }
        .dark [data-sidebar] {
          background-color: #2d2d2d !important;
          border-color: #404040 !important;
        }
        .dark header {
          background-color: #2d2d2d !important;
          border-color: #404040 !important;
        }
        .dark button {
          color: #ffffff !important;
        }
        .dark .bg-blue-50,
        .dark .bg-green-50,
        .dark .bg-purple-50,
        .dark .bg-orange-50,
        .dark .bg-red-50,
        .dark .bg-yellow-50 {
          background-color: #2a2a2a !important;
        }
        .dark .bg-blue-600,
        .dark .bg-green-600,
        .dark .bg-purple-600,
        .dark .bg-orange-600,
        .dark .bg-red-600,
        .dark .bg-yellow-600 {
          color: #ffffff !important;
        }
        .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 {
          color: #ffffff !important;
        }
        .dark p, .dark span, .dark label, .dark div {
          color: #ffffff !important;
        }
        .dark a {
          color: #60a5fa !important;
        }
        .dark svg {
          color: inherit !important;
        }
      `}</style>

      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-gray-50">
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="border-b p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white flex items-center justify-center font-bold text-xl">
                  R
                </div>
                <div>
                  <h2 className="font-bold text-lg text-black">Riviera</h2>
                  <p className="text-xs text-gray-600">Incorporadora</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-mono">v3.8.3 • 2024</p>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="grid grid-cols-4 gap-1 mb-4 px-2">
                  <Button
                    variant={activeTab === "gestao" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("gestao")}
                    className="text-xs"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTab === "config" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("config")}
                    className="text-xs"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTab === "relatorios" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("relatorios")}
                    className="text-xs"
                  >
                    <BarChart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTab === "sobre" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("sobre")}
                    className="text-xs"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>

                <TabsContent value="gestao" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {/* Dashboard */}
                        <MenuItem item={{ name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" }} />
                        
                        {/* Cadastros */}
                        <CollapsibleMenuItem 
                          title="Cadastros" 
                          icon={FolderOpen}
                          items={[
                            { name: "Loteamentos", icon: Building2, path: "Loteamentos" },
                            { name: "Unidades", icon: Building, path: "Unidades" },
                            { name: "Lotes", icon: MapPin, path: "Lotes" },
                            { name: "Sócios", icon: UserSquare2, path: "Socios" },
                            { name: "Clientes", icon: Users, path: "Clientes" },
                            { name: "Fornecedores", icon: Briefcase, path: "Fornecedores" },
                            { name: "Imobiliárias", icon: Store, path: "Imobiliarias" },
                            { name: "Corretores", icon: UsersRound, path: "Corretores" },
                            { name: "Produtos", icon: Package, path: "Produtos" },
                            { name: "Serviços", icon: Hammer, path: "Servicos" },
                          ]}
                        />

                        {/* Financeiro */}
                        <CollapsibleMenuItem 
                          title="Financeiro" 
                          icon={Wallet}
                          items={[
                            { name: "Caixas", icon: Wallet, path: "Caixas" },
                            { name: "Bancos e Integrações", icon: Landmark, path: "IntegracaoBancaria" },
                            { name: "Boletos", icon: Receipt, path: "Boletos" },
                            { name: "Conciliação Bancária", icon: RefreshCw, path: "ConciliacaoBancaria" },
                            { name: "Contas", icon: CreditCard, path: "Contas" },
                            { name: "Corretoras", icon: TrendingUp, path: "Corretoras" },
                            { name: "Tipo de Ativos", icon: Coins, path: "TipoAtivos" },
                            { name: "Administradoras", icon: Building, path: "Administradoras" },
                            { name: "Locações", icon: Key, path: "Alugueis" },
                          ]}
                        />

                        {/* Operacional */}
                        <CollapsibleMenuItem 
                          title="Operacional" 
                          icon={Wrench}
                          items={[
                            { name: "Cronograma de Obra", icon: Calendar, path: "CronogramaObra" },
                            { name: "Execução de Obra", icon: HardHat, path: "ExecucaoObra" },
                            { name: "Custos de Obra", icon: DollarSign, path: "CustosObra" },
                            { name: "Orçamentos de Compra", icon: FileBarChart, path: "OrcamentosCompra" },
                            { name: "Compras", icon: ShoppingCart, path: "Compras" },
                          ]}
                        />

                        {/* Fluxo Financeiro */}
                        <CollapsibleMenuItem 
                          title="Fluxo Financeiro" 
                          icon={TrendingUp}
                          items={[
                            { name: "Fluxo por Unidade", icon: Building, path: "FluxoPorUnidade" },
                            { name: "Transferências entre Caixas", icon: ArrowRightLeft, path: "TransferenciasCaixas" },
                            { name: "Posição de Caixa", icon: Wallet, path: "PosicaoCaixa" },
                            { name: "Orçamentos", icon: FileCheck, path: "Orcamentos" },
                            { name: "Aportes Sócios", icon: BadgeDollarSign, path: "AportesSocios" },
                            { name: "Negociações", icon: FileText, path: "Negociacoes" },
                            { name: "Recebimentos Clientes", icon: CreditCard, path: "PagamentosClientes" },
                            { name: "Pagamentos Fornecedores", icon: Receipt, path: "PagamentosFornecedores" },
                            { name: "Investimentos", icon: TrendingUp, path: "Investimentos" },
                          ]}
                        />

                        {/* Consórcios */}
                        <CollapsibleMenuItem 
                          title="Consórcios" 
                          icon={CircleDollarSign}
                          items={[
                            { name: "Cadastro Cotas", icon: CircleDollarSign, path: "Consorcios" },
                            { name: "Comercialização", icon: Store, path: "ComercializacaoConsorcios" },
                            { name: "Transferências", icon: ArrowRightLeft, path: "TransferenciasConsorcios" },
                            { name: "Resgates", icon: TrendingDown, path: "ResgateConsorcios" },
                            { name: "Parcelas", icon: Receipt, path: "ParcelasConsorcios" },
                            { name: "Lances", icon: Award, path: "LancesConsorcios" },
                            { name: "Resultados", icon: Award, path: "ContemplacoesConsorcios" },
                          ]}
                        />

                        {/* Portais Externos */}
                        <div className="px-3 py-2 mt-4">
                          <div className="h-px bg-gray-200"></div>
                        </div>

                        <CollapsibleMenuItem 
                          title="Portais Externos" 
                          icon={ExternalLink}
                          items={[
                            { name: "🏢 Portal Imobiliária", icon: Store, path: "PortalImobiliariaDashboard" },
                            { name: "👤 Portal Cliente", icon: User, path: "PortalClienteDashboard" },
                          ]}
                        />

                        {/* Mensagens */}
                        <CollapsibleMenuItem 
                          title="Mensagens" 
                          icon={MessageSquare}
                          items={[
                            { name: "CRM", icon: Users, path: "CRM" },
                            { name: "Leads Imobiliárias", icon: UserCheck, path: "LeadsImobiliarias" },
                            { name: "Mensagens Clientes", icon: MessageSquare, path: "MensagensClientes" },
                            { name: "Mensagens Imobiliárias", icon: Store, path: "MensagensImobiliarias" },
                            { name: "Templates Email", icon: Mail, path: "TemplatesEmail" },
                            { name: "Respostas Rápidas", icon: Zap, path: "RespostasRapidas" },
                          ]}
                        />

                        {/* Documentação */}
                        <CollapsibleMenuItem 
                          title="Documentação" 
                          icon={FileText}
                          items={[
                            { name: "Templates", icon: FileText, path: "DocumentosTemplates" },
                            { name: "Documentos Gerados", icon: FileCheck, path: "DocumentosGerados" },
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
                        {/* Administração */}
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Administração</div>
                        <MenuItem item={{ name: "Gerenciar Usuários", icon: UserCog, path: "GerenciarUsuarios" }} />
                        
                        {/* Empresas */}
                        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Empresas</div>
                        <MenuItem item={{ name: "Integração Bancária", icon: Landmark, path: "IntegracaoBancaria" }} />
                        <MenuItem item={{ name: "Templates de Email", icon: Mail, path: "TemplatesEmail" }} />
                        <MenuItem item={{ name: "Gateways de Pagamento", icon: CreditCard, path: "ConfiguracaoGateways" }} />

                        {/* Contabilidade */}
                        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Contabilidade</div>
                        <MenuItem item={{ name: "Centros de Custo", icon: FolderOpen, path: "CentrosCusto" }} />
                        <MenuItem item={{ name: "Tipos de Despesa", icon: FileText, path: "TiposDespesa" }} />

                        {/* Recursos Humanos */}
                        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Recursos Humanos</div>
                        <MenuItem item={{ name: "Colaboradores", icon: Users, path: "Colaboradores" }} />
                        <MenuItem item={{ name: "Folha de Pagamento", icon: Calculator, path: "FolhaPagamento" }} />

                        {/* Sistema */}
                        <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Sistema</div>
                        <MenuItem item={{ name: "Backup e Recuperação", icon: Database, path: "ConfiguracaoBackup" }} />
                        <MenuItem item={{ name: "Integrações", icon: Plug, path: "ConfiguracaoIntegracoes" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="relatorios" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "📊 Relatórios Geral", icon: BarChart, path: "Relatorios" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Financeiros</div>
                        <MenuItem item={{ name: "DRE", icon: PieChart, path: "RelatorioDRE" }} />
                        <MenuItem item={{ name: "Fluxo de Caixa", icon: TrendingUp, path: "RelatorioFluxoCaixa" }} />
                        <MenuItem item={{ name: "Receitas/Despesas", icon: DollarSign, path: "RelatorioReceitasDespesas" }} />
                        <MenuItem item={{ name: "Aportes Sócios", icon: BadgeDollarSign, path: "RelatorioAportes" }} />
                        <MenuItem item={{ name: "Movimentações Caixa", icon: ArrowRightLeft, path: "RelatorioMovimentacoesCaixa" }} />
                        <MenuItem item={{ name: "Gateways", icon: CreditCard, path: "RelatorioGateways" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Vendas & Imóveis</div>
                        <MenuItem item={{ name: "Unidades", icon: Building, path: "RelatorioUnidades" }} />
                        <MenuItem item={{ name: "Vendas", icon: TrendingUp, path: "RelatorioVendas" }} />
                        <MenuItem item={{ name: "Clientes", icon: Users, path: "RelatorioClientes" }} />
                        <MenuItem item={{ name: "Conversões Imobiliárias", icon: Store, path: "RelatorioConversoesImobiliarias" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Obras</div>
                        <MenuItem item={{ name: "Cronograma Obra", icon: Calendar, path: "RelatorioCronograma" }} />
                        <MenuItem item={{ name: "Execução Obra", icon: HardHat, path: "RelatorioExecucao" }} />
                        <MenuItem item={{ name: "Custos de Obra", icon: DollarSign, path: "RelatorioCustosObra" }} />
                        <MenuItem item={{ name: "Orçamentos Compra", icon: FileBarChart, path: "RelatorioOrcamentosCompra" }} />
                        <MenuItem item={{ name: "Compras", icon: ShoppingCart, path: "RelatorioCompras" }} />
                        <MenuItem item={{ name: "Estoque", icon: Package, path: "RelatorioEstoque" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Consórcios</div>
                        <MenuItem item={{ name: "Consórcios", icon: CircleDollarSign, path: "RelatorioConsorcios" }} />
                        <MenuItem item={{ name: "Contemplações", icon: Award, path: "RelatorioContemplacoes" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Parceiros</div>
                        <MenuItem item={{ name: "Fornecedores", icon: Briefcase, path: "RelatorioFornecedores" }} />
                        <MenuItem item={{ name: "Sócios", icon: UserSquare2, path: "RelatorioSocios" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Comunicação</div>
                        <MenuItem item={{ name: "Engajamento", icon: MessageSquare, path: "RelatorioEngajamentoComunicacao" }} />
                        <MenuItem item={{ name: "Documentos Gerados", icon: FileCheck, path: "RelatorioDocumentosGerados" }} />
                        <MenuItem item={{ name: "Templates Resposta", icon: Zap, path: "RelatorioTemplatesResposta" }} />
                        
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Consolidado</div>
                        <MenuItem item={{ name: "📈 Relatório Consolidado", icon: PieChart, path: "RelatoriosConsolidado" }} />
                        <MenuItem item={{ name: "Dashboard Financeiro", icon: PieChart, path: "DashboardFinanceiro" }} />
                        <MenuItem item={{ name: "Dashboard Consórcios", icon: CircleDollarSign, path: "DashboardConsorcios" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="sobre" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "📚 Wiki / Documentação", icon: BookOpen, path: "Wiki" }} />
                        <MenuItem item={{ name: "🔄 Changelog / Versões", icon: History, path: "Changelog" }} />
                        
                        <div className="px-3 py-4 mt-4">
                          <div className="p-4 bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg border border-[var(--wine-200)]">
                            <p className="text-xs font-bold text-[var(--wine-700)] mb-2">Sistema Riviera</p>
                            <p className="text-xs text-gray-600 mb-1">Versão: <strong>3.8.3</strong></p>
                            <p className="text-xs text-gray-600 mb-1">Build: <strong>2024.12</strong></p>
                            <p className="text-xs text-gray-600">© 2024 Riviera Incorporadora</p>
                          </div>
                        </div>

                        <div className="px-3">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Novidades v3.8</p>
                            <ul className="text-xs text-blue-800 space-y-1">
                              <li>• Custos de Obra Avançado</li>
                              <li>• Orçamentos de Compra</li>
                              <li>• Conciliação Bancária IA</li>
                              <li>• Modo Escuro</li>
                              <li>• Gestão de Usuários</li>
                            </ul>
                          </div>
                        </div>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

              </Tabs>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <p className="text-sm font-medium truncate w-full text-black">{user?.full_name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500 truncate w-full">{user?.email}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Perfil')}>
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleDarkMode}>
                    {darkMode ? (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Modo Claro
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Modo Escuro
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair do Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col">
            <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold text-black">{currentPageName}</h1>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </Button>

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