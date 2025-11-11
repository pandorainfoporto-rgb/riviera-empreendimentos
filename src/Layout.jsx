
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import * as CustomAuth from "./CustomAuth"; // Changed from "@/CustomAuth" to "./CustomAuth"
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

export default function Layout({ children, currentPageName }) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 LAYOUT CARREGADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 Página atual:', currentPageName);

  // ⚡ LISTA DE PÁGINAS QUE NÃO USAM LAYOUT (PÚBLICAS)
  const paginasSemLayout = [
    'Home',
    'LoginCustom',
    'LoginSistemaCustom',
    'LoginPortalCustom',
    'AutenticacaoCustom',
    // Portal do Cliente
    'PortalClienteLogin',
    'PortalClienteDashboard',
    'PortalClienteUnidade',
    'PortalClienteCronograma',
    'PortalClienteFinanceiro',
    'PortalClienteDocumentos',
    'PortalClienteMensagens',
    'PortalClientePerfil',
    // Portal da Imobiliária
    'PortalImobiliariaLogin',
    'PortalImobiliariaDashboard',
    'PortalImobiliariaLotes',
    'PortalImobiliariaMensagens',
    'PortalImobiliariaPerfil',
  ];

  // ⚡ SE FOR PÁGINA SEM LAYOUT - RENDERIZAR DIRETO!
  if (paginasSemLayout.includes(currentPageName)) {
    console.log('✅ Página PÚBLICA - Renderizando sem layout');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return <>{children}</>;
  }

  // Páginas admin precisam de autenticação customizada
  console.log('🔐 Página ADMIN detectada - Verificando autenticação...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return <LayoutAdmin children={children} currentPageName={currentPageName} />;
}

// Layout Admin - APENAS para páginas administrativas COM autenticação customizada
function LayoutAdmin({ children, currentPageName }) {
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioCustom, setUsuarioCustom] = useState(null);
  
  const determinarTabAtiva = () => {
    const paginasConfig = ['Empresas', 'IntegracaoBancaria', 'TemplatesEmail', 'CentrosCusto', 'TiposDespesa', 'Colaboradores', 'FolhaPagamento', 'ConfiguracaoGateways', 'ConfiguracaoBackup', 'GerenciarUsuarios'];
    const paginasRelatorios = [
      'RelatoriosConsolidado', 'RelatorioDRE', 'RelatorioFluxoCaixa', 'RelatorioReceitasDespesas',
      'RelatorioAportes', 'RelatorioMovimentacoesCaixa', 'RelatorioGateways', 'RelatorioTaxasCustos',
      'RelatorioSaldosCaixas', 'RelatorioUnidades', 'RelatorioVendas', 'RelatorioCronograma',
      'RelatorioExecucao', 'RelatorioConsorcios', 'RelatorioContemplacoes', 'RelatorioEstoque',
      'RelatorioCompras', 'RelatorioClientes', 'RelatorioFornecedores', 'RelatorioSocios',
      'DocumentosTemplates', 'DocumentosGerados',
      'RelatorioEngajamentoComunicacao', 'RelatorioTemplatesResposta', 'RelatorioDocumentosGerados'
    ];
    const paginasSobre = ['Wiki', 'Documentacao', 'Changelog'];
    
    if (paginasConfig.includes(currentPageName)) return 'config';
    if (paginasRelatorios.includes(currentPageName)) return 'relatorios';
    if (paginasSobre.includes(currentPageName)) return 'sobre';
    return 'gestao';
  };

  const [activeTab, setActiveTab] = useState(determinarTabAtiva());

  useEffect(() => {
    setActiveTab(determinarTabAtiva());
  }, [currentPageName]);

  // 🔥 VERIFICAÇÃO DE AUTENTICAÇÃO CUSTOMIZADA
  useEffect(() => {
    const verificarAcessoCustomizado = async () => {
      console.log('');
      console.log('🔍 ═══════════════════════════════════════');
      console.log('🔍 VERIFICANDO AUTENTICAÇÃO CUSTOMIZADA');
      console.log('🔍 ═══════════════════════════════════════');
      
      // Verificar se tem token
      if (!CustomAuth.isAuthenticated()) {
        console.log('❌ Não autenticado - sem token no localStorage');
        console.log('🔄 Redirecionando para Home...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        CustomAuth.redirectToLogin();
        return;
      }

      console.log('✅ Token encontrado no localStorage');
      console.log('📡 Validando token com backend...');

      // Validar token
      const validation = await CustomAuth.validateToken();

      if (!validation.success) {
        console.log('❌ Token inválido:', validation.error);
        console.log('🔄 Redirecionando para Home...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        CustomAuth.redirectToLogin();
        return;
      }

      console.log('✅ ═══════════════════════════════════════');
      console.log('✅ TOKEN VÁLIDO! ACESSO LIBERADO!');
      console.log('✅ ═══════════════════════════════════════');
      console.log('👤 Usuário:', validation.usuario.nome);
      console.log('📧 Email:', validation.usuario.email);
      console.log('🎭 Tipo:', validation.usuario.tipo_acesso);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setUsuarioCustom(validation.usuario);
      setVerificandoAcesso(false);
    };

    verificarAcessoCustomizado();
  }, []);

  // Queries para dados do dashboard (habilitadas apenas após autenticação)
  const { data: pagamentosClientesPendentes = [] } = useQuery({
    queryKey: ['pagamentosClientesPendentes'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      return await base44.entities.PagamentoCliente.filter({
        status: { $in: ['pendente', 'atrasado'] },
        data_vencimento: { $lte: hoje }
      }, '-data_vencimento', 5);
    },
    enabled: !verificandoAcesso && !!usuarioCustom,
    retry: false,
  });

  const { data: notificacoesNaoLidas = [] } = useQuery({
    queryKey: ['notificacoesNaoLidas'],
    queryFn: async () => {
      return await base44.entities.Notificacao.filter({ lida: false }, '-created_date', 10);
    },
    enabled: !verificandoAcesso && !!usuarioCustom,
    retry: false,
  });

  if (verificandoAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Verificando autenticação customizada...</p>
          <p className="text-gray-500 text-sm mt-2">Validando token de sessão</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    console.log('🚪 Realizando logout...');
    CustomAuth.logout();
    window.location.href = '#/Home';
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
              <div className="flex items-center justify-start text-xs">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  🔐 100% Custom Auth
                </Badge>
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
                    title="Gestão"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "relatorios" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("relatorios")}
                    className={activeTab === "relatorios" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                    title="Relatórios"
                  >
                    <BarChart className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "config" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("config")}
                    className={activeTab === "config" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                    title="Configurações"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={activeTab === "sobre" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setActiveTab("sobre")}
                    className={activeTab === "sobre" ? "bg-[var(--wine-600)] hover:bg-[var(--wine-700)]" : ""}
                    title="Sobre"
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

                <TabsContent value="relatorios" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "📊 Consolidado", icon: BarChart, path: "RelatoriosConsolidado" }} />

                        <CollapsibleMenuItem 
                          title="Financeiros" 
                          icon={DollarSign}
                          items={[
                            { name: "DRE", icon: FileText, path: "RelatorioDRE" },
                            { name: "Fluxo de Caixa", icon: TrendingUp, path: "RelatorioFluxoCaixa" },
                            { name: "Receitas x Despesas", icon: BarChart, path: "RelatorioReceitasDespesas" },
                            { name: "Aportes Sócios", icon: Coins, path: "RelatorioAportes" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Caixas e Gateways" 
                          icon={Wallet}
                          items={[
                            { name: "Movimentações por Caixa", icon: ArrowRightLeft, path: "RelatorioMovimentacoesCaixa" },
                            { name: "Análise de Gateways", icon: Plug, path: "RelatorioGateways" },
                            { name: "Taxas e Custos", icon: DollarSign, path: "RelatorioTaxasCustos" },
                            { name: "Comparativo de Saldos", icon: BarChart, path: "RelatorioSaldosCaixas" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Unidades" 
                          icon={Building}
                          items={[
                            { name: "Status Unidades", icon: Building, path: "RelatorioUnidades" },
                            { name: "Vendas", icon: TrendingUp, path: "RelatorioVendas" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Obras" 
                          icon={HardHat}
                          items={[
                            { name: "Cronograma", icon: Calendar, path: "RelatorioCronograma" },
                            { name: "Execução", icon: HardHat, path: "RelatorioExecucao" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Consórcios" 
                          icon={CircleDollarSign}
                          items={[
                            { name: "Cotas", icon: CircleDollarSign, path: "RelatorioConsorcios" },
                            { name: "Contemplações", icon: Award, path: "RelatorioContemplacoes" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Estoque" 
                          icon={Package}
                          items={[
                            { name: "Produtos", icon: Package, path: "RelatorioEstoque" },
                            { name: "Compras", icon: ShoppingCart, path: "RelatorioCompras" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Cadastros" 
                          icon={Users}
                          items={[
                            { name: "Clientes", icon: Users, path: "RelatorioClientes" },
                            { name: "Fornecedores", icon: Briefcase, path: "RelatorioFornecedores" },
                            { name: "Sócios", icon: UserSquare2, path: "RelatorioSocios" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Comunicação" 
                          icon={MessageSquare}
                          items={[
                            { name: "Engajamento", icon: TrendingUp, path: "RelatorioEngajamentoComunicacao" },
                            { name: "Uso de Templates", icon: Sparkles, path: "RelatorioTemplatesResposta" },
                          ]}
                        />

                        <MenuItem item={{ name: "Documentos Gerados", icon: FileCheck, path: "RelatorioDocumentosGerados" }} />

                        <CollapsibleMenuItem 
                          title="Documentos" 
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
                        <MenuItem item={{ name: "Empresas", icon: Building, path: "Empresas" }} />
                        <MenuItem item={{ name: "Integração Bancária", icon: Plug, path: "IntegracaoBancaria" }} />
                        <MenuItem item={{ name: "Templates de Email", icon: Mail, path: "TemplatesEmail" }} />
                        
                        <CollapsibleMenuItem 
                          title="Contabilidade" 
                          icon={DollarSign}
                          items={[
                            { name: "Centros de Custo", icon: FolderOpen, path: "CentrosCusto" },
                            { name: "Tipos de Despesa", icon: Receipt, path: "TiposDespesa" },
                          ]}
                        />

                        <CollapsibleMenuItem 
                          title="Recursos Humanos" 
                          icon={Users}
                          items={[
                            { name: "Colaboradores", icon: Users, path: "Colaboradores" },
                            { name: "Folha de Pagamento", icon: Receipt, path: "FolhaPagamento" },
                          ]}
                        />

                        <MenuItem item={{ name: "Gateways de Pagamento", icon: Plug, path: "ConfiguracaoGateways" }} />
                        <MenuItem item={{ name: "Backup e Recuperação", icon: Database, path: "ConfiguracaoBackup" }} />
                        <MenuItem item={{ name: "👥 Gerenciar Usuários", icon: Shield, path: "GerenciarUsuarios" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="sobre" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        <MenuItem item={{ name: "Wiki do Sistema", icon: BookOpen, path: "Wiki" }}/>
                        <MenuItem item={{ name: "Documentação Técnica", icon: FileText, path: "Documentacao" }} />
                        <MenuItem item={{ name: "Changelog", icon: Clock, path: "Changelog" }} />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>
              </Tabs>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 p-4">
              {usuarioCustom && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full flex flex-col items-center gap-2 h-auto py-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                          {getInitials(usuarioCustom.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className="text-sm font-medium truncate">{usuarioCustom.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{usuarioCustom.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 min-h-[280px]">
                    <div className="flex flex-col items-center gap-3 p-6 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-3xl">
                          {getInitials(usuarioCustom.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center w-full">
                        <p className="font-semibold text-gray-900 text-base">{usuarioCustom.nome}</p>
                        <p className="text-sm text-gray-500 mt-1 break-words px-2">{usuarioCustom.email}</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-300">
                          {usuarioCustom.tipo_acesso}
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
                      Sair do Sistema
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b border-gray-200 bg-white px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <SidebarTrigger />
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{currentPageName}</h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {pagamentosClientesPendentes.length > 0 && (
                  <Link to={createPageUrl('PagamentosClientes')}>
                    <Button variant="outline" size="sm" className="relative hidden sm:flex">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Pendentes</span>
                      <Badge className="ml-2 bg-red-600 text-white">
                        {pagamentosClientesPendentes.length}
                      </Badge>
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative flex-shrink-0">
                      <MessageSquare className="w-5 h-5" />
                      {notificacoesNaoLidas.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                          {notificacoesNaoLidas.length > 9 ? '9+' : notificacoesNaoLidas.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 sm:w-80">
                    <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notificacoesNaoLidas.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Nenhuma notificação nova
                      </div>
                    ) : (
                      notificacoesNaoLidas.map((notif) => (
                        <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                          <p className="font-medium text-sm">{notif.titulo}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.mensagem}</p>
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
