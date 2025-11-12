import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  Sparkles,
  PieChart,
  TrendingDown,
  Zap,
  Home,
  Hammer,
  FileBarChart
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

const PAGINAS_SEM_LAYOUT = ['Home'];

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
  if (PAGINAS_SEM_LAYOUT.includes(currentPageName)) {
    return <>{children}</>;
  }

  return <LayoutAdmin children={children} currentPageName={currentPageName} />;
}

function LayoutAdmin({ children, currentPageName }) {
  const [activeTab, setActiveTab] = useState('gestao');
  
  const getUserData = () => {
    try {
      const data = localStorage.getItem('user_data_custom');
      return data ? JSON.parse(data) : { nome: 'Usuário', email: 'user@system.com' };
    } catch {
      return { nome: 'Usuário', email: 'user@system.com' };
    }
  };

  const usuario = getUserData();

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
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token_custom');
    localStorage.removeItem('user_data_custom');
    window.location.href = '#/Home';
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --grape-600: #7D5999;
        }
        body { zoom: 0.8; }
        @media (max-width: 640px) { body { zoom: 1; } }
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
                  <h2 className="font-bold text-lg">Riviera</h2>
                  <p className="text-xs text-gray-500">Incorporadora</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="grid grid-cols-3 gap-2 mb-4 px-2">
                  <Button
                    variant={activeTab === "gestao" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("gestao")}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTab === "config" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("config")}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTab === "relatorios" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("relatorios")}
                  >
                    <BarChart className="w-4 h-4" />
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
                            { name: "Clientes", icon: Users, path: "Clientes" },
                            { name: "Fornecedores", icon: Briefcase, path: "Fornecedores" },
                            { name: "Sócios", icon: UserSquare2, path: "Socios" },
                            { name: "Imobiliárias", icon: Store, path: "Imobiliarias" },
                            { name: "Corretores", icon: UsersRound, path: "Corretores" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Financeiro" 
                          icon={Wallet}
                          items={[
                            { name: "Dashboard Financeiro", icon: PieChart, path: "DashboardFinanceiro" },
                            { name: "Fluxo de Caixa", icon: TrendingUp, path: "FluxoCaixa" },
                            { name: "Caixas", icon: Wallet, path: "Caixas" },
                            { name: "Negociações", icon: FileText, path: "Negociacoes" },
                            { name: "Pagamentos Clientes", icon: CreditCard, path: "PagamentosClientes" },
                            { name: "Pagamentos Fornecedores", icon: Receipt, path: "PagamentosFornecedores" },
                            { name: "Aportes Sócios", icon: BadgeDollarSign, path: "AportesSocios" },
                            { name: "Investimentos", icon: TrendingUp, path: "Investimentos" },
                            { name: "Orçamentos", icon: FileCheck, path: "Orcamentos" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Obras" 
                          icon={HardHat}
                          items={[
                            { name: "Cronograma", icon: Calendar, path: "CronogramaObra" },
                            { name: "Execução", icon: HardHat, path: "ExecucaoObra" },
                            { name: "📊 Custos de Obra", icon: DollarSign, path: "CustosObra" },
                            { name: "📦 Orçamentos Compra", icon: FileBarChart, path: "OrcamentosCompra" },
                            { name: "🛒 Compras", icon: ShoppingCart, path: "Compras" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Consórcios" 
                          icon={CircleDollarSign}
                          items={[
                            { name: "Consórcios", icon: CircleDollarSign, path: "Consorcios" },
                            { name: "Dashboard Consórcios", icon: PieChart, path: "DashboardConsorcios" },
                            { name: "Parcelas", icon: Receipt, path: "ParcelasConsorcios" },
                            { name: "Lances", icon: Award, path: "LancesConsorcios" },
                            { name: "Contemplações", icon: Award, path: "ContemplacoesConsorcios" },
                            { name: "Transferências", icon: ArrowRightLeft, path: "TransferenciasConsorcios" },
                            { name: "Resgates", icon: TrendingDown, path: "ResgateConsorcios" },
                            { name: "Comercialização", icon: Store, path: "ComercializacaoConsorcios" },
                            { name: "Administradoras", icon: Building, path: "Administradoras" },
                          ]}
                        />

                        <MenuItem item={{ name: "Locações", icon: Key, path: "Alugueis" }} />
                        
                        <CollapsibleMenuItem 
                          title="Estoque & Produtos" 
                          icon={Package}
                          items={[
                            { name: "Produtos", icon: Package, path: "Produtos" },
                            { name: "Serviços", icon: Hammer, path: "Servicos" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="CRM & Comunicação" 
                          icon={MessageSquare}
                          items={[
                            { name: "CRM", icon: Users, path: "CRM" },
                            { name: "Mensagens Clientes", icon: MessageSquare, path: "MensagensClientes" },
                            { name: "Templates Email", icon: Mail, path: "TemplatesEmail" },
                            { name: "Respostas Rápidas", icon: Zap, path: "RespostasRapidas" },
                          ]}
                        />

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
                        <MenuItem item={{ name: "Integrações", icon: Plug, path: "ConfiguracaoIntegracoes" }} />
                        <MenuItem item={{ name: "Integração Bancária", icon: Landmark, path: "IntegracaoBancaria" }} />
                        <MenuItem item={{ name: "Boletos", icon: Receipt, path: "Boletos" }} />
                        <MenuItem item={{ name: "Conciliação Bancária", icon: RefreshCw, path: "ConciliacaoBancaria" }} />
                        <MenuItem item={{ name: "Gateways Pagamento", icon: CreditCard, path: "ConfiguracaoGateways" }} />
                        <MenuItem item={{ name: "Backup", icon: Database, path: "ConfiguracaoBackup" }} />
                        <MenuItem item={{ name: "Usuários", icon: Users, path: "GerenciarUsuarios" }} />
                        <MenuItem item={{ name: "Centros de Custo", icon: FolderOpen, path: "CentrosCusto" }} />
                        <MenuItem item={{ name: "Tipos de Despesa", icon: FileText, path: "TiposDespesa" }} />
                        <MenuItem item={{ name: "Bancos", icon: Landmark, path: "Bancos" }} />
                        <MenuItem item={{ name: "Contas Bancárias", icon: CreditCard, path: "Contas" }} />
                        <MenuItem item={{ name: "Corretoras", icon: TrendingUp, path: "Corretoras" }} />
                        <MenuItem item={{ name: "Tipos de Ativos", icon: Coins, path: "TipoAtivos" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="relatorios" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "Relatórios", icon: BarChart, path: "Relatorios" }} />
                        <MenuItem item={{ name: "DRE", icon: PieChart, path: "RelatorioDRE" }} />
                        <MenuItem item={{ name: "Fluxo de Caixa", icon: TrendingUp, path: "RelatorioFluxoCaixa" }} />
                        <MenuItem item={{ name: "Receitas/Despesas", icon: DollarSign, path: "RelatorioReceitasDespesas" }} />
                        <MenuItem item={{ name: "Aportes", icon: BadgeDollarSign, path: "RelatorioAportes" }} />
                        <MenuItem item={{ name: "Unidades", icon: Building, path: "RelatorioUnidades" }} />
                        <MenuItem item={{ name: "Vendas", icon: TrendingUp, path: "RelatorioVendas" }} />
                        <MenuItem item={{ name: "Cronograma Obra", icon: Calendar, path: "RelatorioCronograma" }} />
                        <MenuItem item={{ name: "Execução Obra", icon: HardHat, path: "RelatorioExecucao" }} />
                        <MenuItem item={{ name: "Consórcios", icon: CircleDollarSign, path: "RelatorioConsorcios" }} />
                        <MenuItem item={{ name: "Contemplações", icon: Award, path: "RelatorioContemplacoes" }} />
                        <MenuItem item={{ name: "Estoque", icon: Package, path: "RelatorioEstoque" }} />
                        <MenuItem item={{ name: "Compras", icon: ShoppingCart, path: "RelatorioCompras" }} />
                        <MenuItem item={{ name: "Clientes", icon: Users, path: "RelatorioClientes" }} />
                        <MenuItem item={{ name: "Fornecedores", icon: Briefcase, path: "RelatorioFornecedores" }} />
                        <MenuItem item={{ name: "Sócios", icon: UserSquare2, path: "RelatorioSocios" }} />
                        <MenuItem item={{ name: "Movimentações Caixa", icon: ArrowRightLeft, path: "RelatorioMovimentacoesCaixa" }} />
                        <MenuItem item={{ name: "Gateways", icon: CreditCard, path: "RelatorioGateways" }} />
                        <MenuItem item={{ name: "Consolidado", icon: PieChart, path: "RelatoriosConsolidado" }} />
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
                      <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <p className="text-sm font-medium truncate w-full">{usuario.nome}</p>
                      <p className="text-xs text-gray-500 truncate w-full">{usuario.email}</p>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col">
            <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">{currentPageName}</h1>
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