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
  Home,
  Search // Added Search icon
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
import { Input } from "@/components/ui/input"; // Added Input component

import LayoutCliente from "./components/LayoutCliente";
import LayoutImobiliaria from "./components/LayoutImobiliaria";
import AssistenteRiviera from "./components/AssistenteRiviera";

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

  if (!items || items.length === 0) {
    return null;
  }

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
                  <Link to={createPageUrl(item.path)} className="py-3 px-3 flex items-center gap-2 w-full">
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="text-sm">{item.name}</span>
                    {item.badge && ( // Conditionally render badge
                      <Badge className="ml-auto flex-shrink-0 bg-red-600 text-white h-4 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
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
  const [menuSearch, setMenuSearch] = useState(""); // Added menuSearch state
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
    staleTime: 1000 * 60 * 5,
  });

  const { data: grupoPermissoes } = useQuery({
    queryKey: ['grupo_permissoes', user?.grupo_usuario_id],
    queryFn: async () => {
      if (!user?.grupo_usuario_id || user?.role === 'admin' || user?.tipo_usuario !== 'sistema') {
        return null;
      }
      try {
        const grupo = await base44.entities.GrupoUsuario.get(user.grupo_usuario_id);
        return grupo;
      } catch (error) {
        console.error("Failed to fetch grupoPermissoes:", error);
        return null;
      }
    },
    enabled: !!user?.grupo_usuario_id && user?.role !== 'admin' && user?.tipo_usuario === 'sistema',
    staleTime: 1000 * 60 * 5,
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

  const { data: mensagensNaoLidasClientes = [] } = useQuery({
    queryKey: ['mensagensNaoLidasClientes'],
    queryFn: async () => {
      try {
        return await base44.entities.Mensagem.filter({
          lida: false,
          remetente_tipo: 'cliente'
        });
      } catch {
        return [];
      }
    },
    refetchInterval: 10000,
    enabled: user?.tipo_usuario === 'sistema',
  });

  const { data: mensagensNaoLidasImobiliarias = [] } = useQuery({
    queryKey: ['mensagensNaoLidasImobiliarias'],
    queryFn: async () => {
      try {
        return await base44.entities.MensagemImobiliaria.filter({
          lida: false,
          remetente_tipo: 'imobiliaria'
        });
      } catch {
        return [];
      }
    },
    refetchInterval: 10000,
    enabled: user?.tipo_usuario === 'sistema',
  });

  const temPermissao = (categoria, campo) => {
    if (user?.role === 'admin') return true;
    if (user?.tipo_usuario !== 'sistema') return true; 
    if (loadingUser || !grupoPermissoes) return false;
    
    const perms = grupoPermissoes.permissoes || {};
    
    if (campo) {
      return perms[categoria]?.[campo] === true;
    }
    if (typeof perms[categoria] === 'object' && perms[categoria] !== null) {
        return Object.values(perms[categoria]).some(val => val === true);
    }
    return perms[categoria] === true;
  };

  useEffect(() => {
    if (user && !loadingUser) {
      const currentPath = window.location.pathname.toLowerCase();
      
      if (user.tipo_usuario === 'cliente') {
        if (!currentPath.includes('portalcliente')) {
          navigate(createPageUrl('PortalClienteDashboard'));
        }
      } else if (user.tipo_usuario === 'imobiliaria') {
        if (!currentPath.includes('portalimobiliaria')) {
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

  if (user?.tipo_usuario === 'cliente') {
    return <LayoutCliente currentPageName={currentPageName}>{children}</LayoutCliente>;
  }

  if (user?.tipo_usuario === 'imobiliaria') {
    return <LayoutImobiliaria currentPageName={currentPageName}>{children}</LayoutImobiliaria>;
  }

  const allMenuItems = [
    temPermissao('dashboard') && { name: "Dashboard", icon: LayoutDashboard, path: "Dashboard", category: "Gestão" },
    temPermissao('fluxo_financeiro', 'negociacoes') && { name: "Negociações", icon: FileText, path: "Negociacoes", category: "Gestão" },
    temPermissao('fluxo_financeiro', 'recebimentos_clientes') && { name: "Receber", icon: TrendingUp, path: "PagamentosClientes", category: "Gestão" },
    temPermissao('fluxo_financeiro', 'pagamentos_fornecedores') && { name: "Pagar", icon: DollarSign, path: "Pagar", category: "Gestão" },
    
    // Cadastros
    temPermissao('cadastros', 'loteamentos') && { name: "Loteamentos", icon: Building2, path: "Loteamentos", category: "Cadastros" },
    temPermissao('cadastros', 'unidades') && { name: "Unidades", icon: Building, path: "Unidades", category: "Cadastros" },
    temPermissao('cadastros', 'lotes') && { name: "Lotes", icon: MapPin, path: "Lotes", category: "Cadastros" },
    temPermissao('cadastros', 'socios') && { name: "Sócios", icon: UserSquare2, path: "Socios", category: "Cadastros" },
    temPermissao('cadastros', 'clientes') && { name: "Clientes", icon: Users, path: "Clientes", category: "Cadastros" },
    temPermissao('cadastros', 'fornecedores') && { name: "Fornecedores", icon: Briefcase, path: "Fornecedores", category: "Cadastros" },
    temPermissao('cadastros', 'imobiliarias') && { name: "Imobiliárias", icon: Store, path: "Imobiliarias", category: "Cadastros" },
    temPermissao('cadastros', 'corretores') && { name: "Corretores", icon: UsersRound, path: "Corretores", category: "Cadastros" },
    temPermissao('cadastros', 'estoque') && { name: "Estoque", icon: Package, path: "Estoque", category: "Cadastros" },

    // Financeiro
    temPermissao('financeiro', 'caixas') && { name: "Caixas", icon: Wallet, path: "Caixas", category: "Financeiro" },
    temPermissao('financeiro', 'bancos') && { name: "Bancos e Integrações", icon: Landmark, path: "IntegracaoBancaria", category: "Financeiro" },
    temPermissao('financeiro', 'boletos') && { name: "Boletos", icon: Receipt, path: "Boletos", category: "Financeiro" },
    temPermissao('financeiro', 'conciliacao') && { name: "Conciliação Bancária", icon: RefreshCw, path: "ConciliacaoBancaria", category: "Financeiro" },
    temPermissao('financeiro', 'contas') && { name: "Contas", icon: CreditCard, path: "Contas", category: "Financeiro" },
    temPermissao('financeiro', 'corretoras') && { name: "Corretoras", icon: TrendingUp, path: "Corretoras", category: "Financeiro" },
    temPermissao('financeiro', 'tipo_ativos') && { name: "Tipo de Ativos", icon: Coins, path: "TipoAtivos", category: "Financeiro" },
    temPermissao('financeiro', 'administradoras') && { name: "Administradoras", icon: Building, path: "Administradoras", category: "Financeiro" },
    temPermissao('financeiro', 'locacoes') && { name: "Locações", icon: Key, path: "Alugueis", category: "Financeiro" },

    // Operacional
    temPermissao('operacional', 'cronograma_obra') && { name: "Cronograma de Obra", icon: Calendar, path: "CronogramaObra", category: "Operacional" },
    temPermissao('operacional', 'execucao_obra') && { name: "Execução de Obra", icon: HardHat, path: "ExecucaoObra", category: "Operacional" },
    temPermissao('operacional', 'custos_obra') && { name: "Custos de Obra", icon: DollarSign, path: "CustosObra", category: "Operacional" },
    temPermissao('operacional', 'orcamentos_compra') && { name: "Orçamentos de Compra", icon: FileBarChart, path: "OrcamentosCompra", category: "Operacional" },
    temPermissao('operacional', 'compras') && { name: "Compras", icon: ShoppingCart, path: "Compras", category: "Operacional" },

    // Fluxo Financeiro
    temPermissao('fluxo_financeiro', 'fluxo_unidade') && { name: "Fluxo por Unidade", icon: Building, path: "FluxoPorUnidade", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'transferencias_caixas') && { name: "Transferências entre Caixas", icon: ArrowRightLeft, path: "TransferenciasCaixas", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'posicao_caixa') && { name: "Posição de Caixa", icon: Wallet, path: "PosicaoCaixa", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'orcamentos') && { name: "Orçamentos", icon: FileCheck, path: "Orcamentos", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'aportes_socios') && { name: "Aportes Sócios", icon: BadgeDollarSign, path: "AportesSocios", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'negociacoes') && { name: "Negociações", icon: FileText, path: "Negociacoes", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'recebimentos_clientes') && { name: "Recebimentos Clientes", icon: CreditCard, path: "PagamentosClientes", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'pagamentos_fornecedores') && { name: "Pagamentos Fornecedores", icon: Receipt, path: "PagamentosFornecedores", category: "Fluxo Financeiro" },
    temPermissao('fluxo_financeiro', 'investimentos') && { name: "Investimentos", icon: TrendingUp, path: "Investimentos", category: "Fluxo Financeiro" },

    // Consórcios
    temPermissao('consorcios', 'cadastro_cotas') && { name: "Cadastro Cotas", icon: CircleDollarSign, path: "Consorcios", category: "Consórcios" },
    temPermissao('consorcios', 'comercializacao') && { name: "Comercialização", icon: Store, path: "ComercializacaoConsorcios", category: "Consórcios" },
    temPermissao('consorcios', 'transferencias') && { name: "Transferências", icon: ArrowRightLeft, path: "TransferenciasConsorcios", category: "Consórcios" },
    temPermissao('consorcios', 'resgates') && { name: "Resgates", icon: TrendingDown, path: "ResgateConsorcios", category: "Consórcios" },
    temPermissao('consorcios', 'parcelas') && { name: "Parcelas", icon: Receipt, path: "ParcelasConsorcios", category: "Consórcios" },
    temPermissao('consorcios', 'lances') && { name: "Lances", icon: Award, path: "LancesConsorcios", category: "Consórcios" },
    temPermissao('consorcios', 'resultados') && { name: "Resultados", icon: Award, path: "ContemplacoesConsorcios", category: "Consórcios" },

    // Mensagens
    temPermissao('mensagens', 'crm') && { name: "CRM", icon: Users, path: "CRM", category: "Mensagens" },
    temPermissao('mensagens', 'leads_imobiliarias') && { name: "Leads Imobiliárias", icon: UserCheck, path: "LeadsImobiliarias", category: "Mensagens" },
    temPermissao('mensagens', 'mensagens_clientes') && { name: "Mensagens Clientes", icon: MessageSquare, path: "MensagensClientes", category: "Mensagens" },
    temPermissao('mensagens', 'mensagens_imobiliarias') && { name: "Mensagens Imobiliárias", icon: Store, path: "MensagensImobiliarias", category: "Mensagens" },
    temPermissao('mensagens', 'templates_email') && { name: "Templates Email", icon: Mail, path: "TemplatesEmail", category: "Mensagens" },
    temPermissao('mensagens', 'respostas_rapidas') && { name: "Respostas Rápidas", icon: Zap, path: "RespostasRapidas", category: "Mensagens" },

    // Documentação
    temPermissao('documentacao', 'templates') && { name: "Templates", icon: FileText, path: "DocumentosTemplates", category: "Documentação" },
    temPermissao('documentacao', 'documentos_gerados') && { name: "Documentos Gerados", icon: FileCheck, path: "DocumentosGerados", category: "Documentação" },

    // Configurações -> Administração
    temPermissao('configuracoes', 'gerenciar_usuarios') && { name: "Gerenciar Usuários", icon: UserCog, path: "GerenciarUsuarios", category: "Configurações" },
    temPermissao('configuracoes', 'grupos_permissoes') && { name: "Grupos de Permissões", icon: Shield, path: "GruposPermissoes", category: "Configurações" },

    // Configurações -> Empresas
    temPermissao('configuracoes', 'integracao_bancaria_empresa') && { name: "Integração Bancária", icon: Landmark, path: "IntegracaoBancaria", category: "Configurações" },
    temPermissao('configuracoes', 'templates_email_empresa') && { name: "Templates de Email", icon: Mail, path: "TemplatesEmail", category: "Configurações" },
    temPermissao('configuracoes', 'gateways_pagamento') && { name: "Gateways de Pagamento", icon: CreditCard, path: "ConfiguracaoGateways", category: "Configurações" },

    // Configurações -> Contabilidade
    temPermissao('configuracoes', 'centros_custo') && { name: "Centros de Custo", icon: FolderOpen, path: "CentrosCusto", category: "Configurações" },
    temPermissao('configuracoes', 'tipos_despesa') && { name: "Tipos de Despesa", icon: FileText, path: "TiposDespesa", category: "Configurações" },

    // Configurações -> Recursos Humanos
    temPermissao('configuracoes', 'colaboradores') && { name: "Colaboradores", icon: Users, path: "Colaboradores", category: "Configurações" },
    temPermissao('configuracoes', 'folha_pagamento') && { name: "Folha de Pagamento", icon: Calculator, path: "FolhaPagamento", category: "Configurações" },

    // Configurações -> Sistema
    temPermissao('configuracoes', 'backup') && { name: "Backup e Recuperação", icon: Database, path: "ConfiguracaoBackup", category: "Configurações" },
    temPermissao('configuracoes', 'integracoes') && { name: "Integrações", icon: Plug, path: "ConfiguracaoIntegracoes", category: "Configurações" },

    // Relatórios
    temPermissao('relatorios', 'geral') && { name: "Relatórios Geral", icon: BarChart, path: "Relatorios", category: "Relatórios" },
    temPermissao('relatorios', 'dre') && { name: "DRE", icon: PieChart, path: "RelatorioDRE", category: "Relatórios" },
    temPermissao('relatorios', 'fluxo_caixa') && { name: "Fluxo de Caixa", icon: TrendingUp, path: "RelatorioFluxoCaixa", category: "Relatórios" },
    temPermissao('relatorios', 'receitas_despesas') && { name: "Receitas/Despesas", icon: DollarSign, path: "RelatorioReceitasDespesas", category: "Relatórios" },
    temPermissao('relatorios', 'aportes_socios') && { name: "Aportes Sócios", icon: BadgeDollarSign, path: "RelatorioAportes", category: "Relatórios" },
    temPermissao('relatorios', 'movimentacoes_caixa') && { name: "Movimentações Caixa", icon: ArrowRightLeft, path: "RelatorioMovimentacoesCaixa", category: "Relatórios" },
    temPermissao('relatorios', 'gateways') && { name: "Gateways", icon: CreditCard, path: "RelatorioGateways", category: "Relatórios" },
    temPermissao('relatorios', 'unidades_vendas') && { name: "Unidades", icon: Building, path: "RelatorioUnidades", category: "Relatórios" },
    temPermissao('relatorios', 'vendas') && { name: "Vendas", icon: TrendingUp, path: "RelatorioVendas", category: "Relatórios" },
    temPermissao('relatorios', 'clientes') && { name: "Clientes", icon: Users, path: "RelatorioClientes", category: "Relatórios" },
    temPermissao('relatorios', 'conversoes_imobiliarias') && { name: "Conversões Imobiliárias", icon: Store, path: "RelatorioConversoesImobiliarias", category: "Relatórios" },
    temPermissao('relatorios', 'cronograma_obra_relatorio') && { name: "Cronograma Obra", icon: Calendar, path: "RelatorioCronograma", category: "Relatórios" },
    temPermissao('relatorios', 'execucao_obra_relatorio') && { name: "Execução Obra", icon: HardHat, path: "RelatorioExecucao", category: "Relatórios" },
    temPermissao('relatorios', 'custos_obra_relatorio') && { name: "Custos de Obra", icon: Hammer, path: "RelatorioCustosObra", category: "Relatórios" },
    temPermissao('relatorios', 'orcamentos_compra_relatorio') && { name: "Orçamentos Compra", icon: FileBarChart, path: "RelatorioOrcamentosCompra", category: "Relatórios" },
    temPermissao('relatorios', 'compras_relatorio') && { name: "Compras", icon: ShoppingCart, path: "RelatorioCompras", category: "Relatórios" },
    temPermissao('relatorios', 'estoque') && { name: "Estoque", icon: Package, path: "RelatorioEstoque", category: "Relatórios" },
    temPermissao('relatorios', 'consorcios_relatorio') && { name: "Consórcios", icon: CircleDollarSign, path: "RelatorioConsorcios", category: "Relatórios" },
    temPermissao('relatorios', 'contemplacoes') && { name: "Contemplações", icon: Award, path: "RelatorioContemplacoes", category: "Relatórios" },
    temPermissao('relatorios', 'fornecedores') && { name: "Fornecedores", icon: Briefcase, path: "RelatorioFornecedores", category: "Relatórios" },
    temPermissao('relatorios', 'socios') && { name: "Sócios", icon: UserSquare2, path: "RelatorioSocios", category: "Relatórios" },
    temPermissao('relatorios', 'engajamento') && { name: "Engajamento", icon: MessageSquare, path: "RelatorioEngajamentoComunicacao", category: "Relatórios" },
    temPermissao('relatorios', 'documentos_gerados') && { name: "Documentos Gerados", icon: FileCheck, path: "RelatorioDocumentosGerados", category: "Relatórios" },
    temPermissao('relatorios', 'templates_resposta') && { name: "Templates Resposta", icon: Zap, path: "RelatorioTemplatesResposta", category: "Relatórios" },
    temPermissao('relatorios', 'consolidado') && { name: "Relatório Consolidado", icon: PieChart, path: "RelatoriosConsolidado", category: "Relatórios" },
    temPermissao('relatorios', 'dashboard_financeiro') && { name: "Dashboard Financeiro", icon: PieChart, path: "DashboardFinanceiro", category: "Relatórios" },
    temPermissao('relatorios', 'dashboard_consorcios') && { name: "Dashboard Consórcios", icon: CircleDollarSign, path: "DashboardConsorcios", category: "Relatórios" },

    // Sobre
    temPermissao('sobre', 'wiki') && { name: "Wiki / Documentação", icon: BookOpen, path: "Wiki", category: "Sobre" },
    temPermissao('sobre', 'changelog') && { name: "Changelog / Versões", icon: History, path: "Changelog", category: "Sobre" },

    // Portais Externos (Admin only)
    user?.role === 'admin' && { name: "Portal Imobiliária", icon: Store, path: "PortalImobiliariaDashboard", category: "Portais Externos" },
    user?.role === 'admin' && { name: "Portal Cliente", icon: User, path: "PortalClienteDashboard", category: "Portais Externos" },
  ].filter(Boolean); // Filter out any falsey values (permissions not met)

  const filteredMenuItems = menuSearch 
    ? allMenuItems.filter(item => 
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(menuSearch.toLowerCase())
      )
    : [];

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
        
        @keyframes pulse-red {
          0%, 100% { opacity: 1; background-color: rgb(220, 38, 38); }
          50% { opacity: 0.5; background-color: rgb(239, 68, 68); }
        }
        
        .pulse-red {
          animation: pulse-red 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

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
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c836b77120dd82ca042f8/a86e3fbbe_525981935_17846132280535972_4105371699080593471_n.jpg" 
                  alt="Logo Riviera"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <h2 className="font-bold text-lg text-black">Riviera</h2>
                  <p className="text-xs text-gray-600">Incorporadora</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-mono">v4.1.0 • 2025</p>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
              {/* Barra de Pesquisa */}
              <div className="px-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar menu..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {menuSearch && filteredMenuItems.length > 0 && (
                  <div className="absolute z-50 w-[calc(100%-1rem)] bg-white border rounded-lg shadow-lg max-h-[300px] overflow-y-auto mt-1">
                    {filteredMenuItems.map((item, idx) => (
                      <Link
                        key={idx}
                        to={createPageUrl(item.path)}
                        onClick={() => setMenuSearch("")}
                        className="block px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

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
                        {temPermissao('dashboard') && (
                              <MenuItem item={{ name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" }} />
                            )}

                            {temPermissao('cadastros', 'unidades') && (
                              <MenuItem item={{ name: "Unidades", icon: Building, path: "Unidades" }} />
                            )}

                            {temPermissao('fluxo_financeiro', 'negociacoes') && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to={createPageUrl('Negociacoes')} className="flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                <span>Negociações</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}

                        {temPermissao('fluxo_financeiro', 'recebimentos_clientes') && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to={createPageUrl('PagamentosClientes')} className="flex items-center gap-3">
                                <TrendingUp className="w-4 h-4" />
                                <span>Receber</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}

                        {temPermissao('fluxo_financeiro', 'pagamentos_fornecedores') && (
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to={createPageUrl('Pagar')} className="flex items-center gap-3">
                                <DollarSign className="w-4 h-4" />
                                <span>Pagar</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )}
                        
                        <CollapsibleMenuItem 
                            title="Cadastros" 
                            icon={FolderOpen}
                            items={[
                              temPermissao('cadastros', 'loteamentos') && { name: "Loteamentos", icon: Building2, path: "Loteamentos" },
                              temPermissao('cadastros', 'lotes') && { name: "Lotes", icon: MapPin, path: "Lotes" },
                            temPermissao('cadastros', 'socios') && { name: "Sócios", icon: UserSquare2, path: "Socios" },
                            temPermissao('cadastros', 'clientes') && { name: "Clientes", icon: Users, path: "Clientes" },
                            temPermissao('cadastros', 'fornecedores') && { name: "Fornecedores", icon: Briefcase, path: "Fornecedores" },
                            temPermissao('cadastros', 'imobiliarias') && { name: "Imobiliárias", icon: Store, path: "Imobiliarias" },
                            temPermissao('cadastros', 'corretores') && { name: "Corretores", icon: UsersRound, path: "Corretores" },
                            temPermissao('cadastros', 'estoque') && { name: "Estoque", icon: Package, path: "Estoque" },
                          ].filter(Boolean)}
                        />

                        <CollapsibleMenuItem 
                          title="Financeiro" 
                          icon={Wallet}
                          items={[
                            temPermissao('financeiro', 'caixas') && { name: "Caixas", icon: Wallet, path: "Caixas" },
                            temPermissao('financeiro', 'bancos') && { name: "Bancos e Integrações", icon: Landmark, path: "IntegracaoBancaria" },
                            temPermissao('financeiro', 'boletos') && { name: "Boletos", icon: Receipt, path: "Boletos" },
                            temPermissao('financeiro', 'conciliacao') && { name: "Conciliação Bancária", icon: RefreshCw, path: "ConciliacaoBancaria" },
                            temPermissao('financeiro', 'contas') && { name: "Contas", icon: CreditCard, path: "Contas" },
                            temPermissao('financeiro', 'corretoras') && { name: "Corretoras", icon: TrendingUp, path: "Corretoras" },
                            temPermissao('financeiro', 'tipo_ativos') && { name: "Tipo de Ativos", icon: Coins, path: "TipoAtivos" },
                            temPermissao('financeiro', 'administradoras') && { name: "Administradoras", icon: Building, path: "Administradoras" },
                            temPermissao('financeiro', 'locacoes') && { name: "Locações", icon: Key, path: "Alugueis" },
                          ].filter(Boolean)}
                        />

                        <CollapsibleMenuItem 
                          title="Operacional" 
                          icon={Wrench}
                          items={[
                            temPermissao('operacional', 'cronograma_obra') && { name: "Cronograma de Obra", icon: Calendar, path: "CronogramaObra" },
                            temPermissao('operacional', 'execucao_obra') && { name: "Execução de Obra", icon: HardHat, path: "ExecucaoObra" },
                            temPermissao('operacional', 'custos_obra') && { name: "Custos de Obra", icon: DollarSign, path: "CustosObra" },
                            temPermissao('operacional', 'orcamentos_compra') && { name: "Orçamentos de Compra", icon: FileBarChart, path: "OrcamentosCompra" },
                            temPermissao('operacional', 'compras') && { name: "Compras", icon: ShoppingCart, path: "Compras" },
                          ].filter(Boolean)}
                        />

                        <CollapsibleMenuItem 
                          title="Fluxo Financeiro" 
                          icon={TrendingUp}
                          items={[
                            temPermissao('fluxo_financeiro', 'fluxo_unidade') && { name: "Fluxo por Unidade", icon: Building, path: "FluxoPorUnidade" },
                            temPermissao('fluxo_financeiro', 'transferencias_caixas') && { name: "Transferências entre Caixas", icon: ArrowRightLeft, path: "TransferenciasCaixas" },
                            temPermissao('fluxo_financeiro', 'posicao_caixa') && { name: "Posição de Caixa", icon: Wallet, path: "PosicaoCaixa" },
                            temPermissao('fluxo_financeiro', 'orcamentos') && { name: "Orçamentos", icon: FileCheck, path: "Orcamentos" },
                            temPermissao('fluxo_financeiro', 'aportes_socios') && { name: "Aportes Sócios", icon: BadgeDollarSign, path: "AportesSocios" },
                            temPermissao('fluxo_financeiro', 'negociacoes') && { name: "Negociações", icon: FileText, path: "Negociacoes" },
                            temPermissao('fluxo_financeiro', 'recebimentos_clientes') && { name: "Recebimentos Clientes", icon: CreditCard, path: "PagamentosClientes" },
                            temPermissao('fluxo_financeiro', 'pagamentos_fornecedores') && { name: "Pagamentos Fornecedores", icon: Receipt, path: "PagamentosFornecedores" },
                            temPermissao('fluxo_financeiro', 'investimentos') && { name: "Investimentos", icon: TrendingUp, path: "Investimentos" },
                          ].filter(Boolean)}
                        />

                        <CollapsibleMenuItem 
                          title="Consórcios" 
                          icon={CircleDollarSign}
                          items={[
                            temPermissao('consorcios', 'cadastro_cotas') && { name: "Cadastro Cotas", icon: CircleDollarSign, path: "Consorcios" },
                            temPermissao('consorcios', 'comercializacao') && { name: "Comercialização", icon: Store, path: "ComercializacaoConsorcios" },
                            temPermissao('consorcios', 'transferencias') && { name: "Transferências", icon: ArrowRightLeft, path: "TransferenciasConsorcios" },
                            temPermissao('consorcios', 'resgates') && { name: "Resgates", icon: TrendingDown, path: "ResgateConsorcios" },
                            temPermissao('consorcios', 'parcelas') && { name: "Parcelas", icon: Receipt, path: "ParcelasConsorcios" },
                            temPermissao('consorcios', 'lances') && { name: "Lances", icon: Award, path: "LancesConsorcios" },
                            temPermissao('consorcios', 'resultados') && { name: "Resultados", icon: Award, path: "ContemplacoesConsorcios" },
                          ].filter(Boolean)}
                        />

                        {user?.role === 'admin' && (
                          <>
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
                          </>
                        )}

                        {(temPermissao('mensagens', 'mensagens_clientes') || temPermissao('mensagens', 'mensagens_imobiliarias')) && (
                          <div className="relative">
                            {(mensagensNaoLidasClientes.length > 0 || mensagensNaoLidasImobiliarias.length > 0) && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full pulse-red z-10"></div>
                            )}
                            <CollapsibleMenuItem 
                              title="Mensagens" 
                              icon={MessageSquare}
                              items={[
                                temPermissao('mensagens', 'crm') && { name: "CRM", icon: Users, path: "CRM" },
                                temPermissao('mensagens', 'leads_imobiliarias') && { name: "Leads Imobiliárias", icon: UserCheck, path: "LeadsImobiliarias" },
                                temPermissao('mensagens', 'mensagens_clientes') && { 
                                  name: "Mensagens Clientes", 
                                  icon: MessageSquare, 
                                  path: "MensagensClientes",
                                  badge: mensagensNaoLidasClientes.length > 0 ? mensagensNaoLidasClientes.length : null
                                },
                                temPermissao('mensagens', 'mensagens_imobiliarias') && { 
                                  name: "Mensagens Imobiliárias", 
                                  icon: Store, 
                                  path: "MensagensImobiliarias",
                                  badge: mensagensNaoLidasImobiliarias.length > 0 ? mensagensNaoLidasImobiliarias.length : null
                                },
                                temPermissao('mensagens', 'templates_email') && { name: "Templates Email", icon: Mail, path: "TemplatesEmail" },
                                temPermissao('mensagens', 'respostas_rapidas') && { name: "Respostas Rápidas", icon: Zap, path: "RespostasRapidas" },
                              ].filter(Boolean)}
                            />
                          </div>
                        )}

                        <CollapsibleMenuItem 
                          title="Documentação" 
                          icon={FileText}
                          items={[
                            temPermissao('documentacao', 'templates') && { name: "Templates", icon: FileText, path: "DocumentosTemplates" },
                            temPermissao('documentacao', 'documentos_gerados') && { name: "Documentos Gerados", icon: FileCheck, path: "DocumentosGerados" },
                          ].filter(Boolean)}
                        />
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {(temPermissao('configuracoes', 'gerenciar_usuarios') || temPermissao('configuracoes', 'grupos_permissoes')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Administração</div>
                            {temPermissao('configuracoes', 'gerenciar_usuarios') && (
                              <MenuItem item={{ name: "Gerenciar Usuários", icon: UserCog, path: "GerenciarUsuarios" }} />
                            )}
                            {temPermissao('configuracoes', 'grupos_permissoes') && (
                              <MenuItem item={{ name: "Grupos de Permissões", icon: Shield, path: "GruposPermissoes" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('configuracoes', 'integracao_bancaria_empresa') || temPermissao('configuracoes', 'templates_email_empresa') || temPermissao('configuracoes', 'gateways_pagamento')) && (
                          <>
                            <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Empresas</div>
                            {temPermissao('configuracoes', 'integracao_bancaria_empresa') && (
                              <MenuItem item={{ name: "Integração Bancária", icon: Landmark, path: "IntegracaoBancaria" }} />
                            )}
                            {temPermissao('configuracoes', 'templates_email_empresa') && (
                              <MenuItem item={{ name: "Templates de Email", icon: Mail, path: "TemplatesEmail" }} />
                            )}
                            {temPermissao('configuracoes', 'gateways_pagamento') && (
                              <MenuItem item={{ name: "Gateways de Pagamento", icon: CreditCard, path: "ConfiguracaoGateways" }} />
                            )}
                          </>
                        )}

                        {(temPermissao('configuracoes', 'centros_custo') || temPermissao('configuracoes', 'tipos_despesa')) && (
                          <>
                            <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Contabilidade</div>
                            {temPermissao('configuracoes', 'centros_custo') && (
                              <MenuItem item={{ name: "Centros de Custo", icon: FolderOpen, path: "CentrosCusto" }} />
                            )}
                            {temPermissao('configuracoes', 'tipos_despesa') && (
                              <MenuItem item={{ name: "Tipos de Despesa", icon: FileText, path: "TiposDespesa" }} />
                            )}
                          </>
                        )}

                        {(temPermissao('configuracoes', 'colaboradores') || temPermissao('configuracoes', 'folha_pagamento')) && (
                          <>
                            <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Recursos Humanos</div>
                            {temPermissao('configuracoes', 'colaboradores') && (
                              <MenuItem item={{ name: "Colaboradores", icon: Users, path: "Colaboradores" }} />
                            )}
                            {temPermissao('configuracoes', 'folha_pagamento') && (
                              <MenuItem item={{ name: "Folha de Pagamento", icon: Calculator, path: "FolhaPagamento" }} />
                            )}
                          </>
                        )}

                        {(temPermissao('configuracoes', 'backup') || temPermissao('configuracoes', 'integracoes')) && (
                          <>
                            <div className="px-3 py-2 mt-4 text-xs font-bold text-gray-500 uppercase">Sistema</div>
                            {temPermissao('configuracoes', 'backup') && (
                              <MenuItem item={{ name: "Backup e Recuperação", icon: Database, path: "ConfiguracaoBackup" }} />
                            )}
                            {temPermissao('configuracoes', 'integracoes') && (
                              <MenuItem item={{ name: "Integrações", icon: Plug, path: "ConfiguracaoIntegracoes" }} />
                            )}
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="relatorios" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {temPermissao('relatorios', 'geral') && (
                          <MenuItem item={{ name: "📊 Relatórios Geral", icon: BarChart, path: "Relatorios" }} />
                        )}
                        
                        {(temPermissao('relatorios', 'dre') || temPermissao('relatorios', 'fluxo_caixa') || temPermissao('relatorios', 'receitas_despesas') || temPermissao('relatorios', 'aportes_socios') || temPermissao('relatorios', 'movimentacoes_caixa') || temPermissao('relatorios', 'gateways')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Financeiros</div>
                            {temPermissao('relatorios', 'dre') && (
                              <MenuItem item={{ name: "DRE", icon: PieChart, path: "RelatorioDRE" }} />
                            )}
                            {temPermissao('relatorios', 'fluxo_caixa') && (
                              <MenuItem item={{ name: "Fluxo de Caixa", icon: TrendingUp, path: "RelatorioFluxoCaixa" }} />
                            )}
                            {temPermissao('relatorios', 'receitas_despesas') && (
                              <MenuItem item={{ name: "Receitas/Despesas", icon: DollarSign, path: "RelatorioReceitasDespesas" }} />
                            )}
                            {temPermissao('relatorios', 'aportes_socios') && (
                              <MenuItem item={{ name: "Aportes Sócios", icon: BadgeDollarSign, path: "RelatorioAportes" }} />
                            )}
                            {temPermissao('relatorios', 'movimentacoes_caixa') && (
                              <MenuItem item={{ name: "Movimentações Caixa", icon: ArrowRightLeft, path: "RelatorioMovimentacoesCaixa" }} />
                            )}
                            {temPermissao('relatorios', 'gateways') && (
                              <MenuItem item={{ name: "Gateways", icon: CreditCard, path: "RelatorioGateways" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'unidades_vendas') || temPermissao('relatorios', 'vendas') || temPermissao('relatorios', 'clientes') || temPermissao('relatorios', 'conversoes_imobiliarias')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Vendas & Imóveis</div>
                            {temPermissao('relatorios', 'unidades_vendas') && (
                              <MenuItem item={{ name: "Unidades", icon: Building, path: "RelatorioUnidades" }} />
                            )}
                            {temPermissao('relatorios', 'vendas') && (
                              <MenuItem item={{ name: "Vendas", icon: TrendingUp, path: "RelatorioVendas" }} />
                            )}
                            {temPermissao('relatorios', 'clientes') && (
                              <MenuItem item={{ name: "Clientes", icon: Users, path: "RelatorioClientes" }} />
                            )}
                            {temPermissao('relatorios', 'conversoes_imobiliarias') && (
                              <MenuItem item={{ name: "Conversões Imobiliárias", icon: Store, path: "RelatorioConversoesImobiliarias" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'cronograma_obra_relatorio') || temPermissao('relatorios', 'execucao_obra_relatorio') || temPermissao('relatorios', 'custos_obra_relatorio') || temPermissao('relatorios', 'orcamentos_compra_relatorio') || temPermissao('relatorios', 'compras_relatorio') || temPermissao('relatorios', 'estoque')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Obras</div>
                            {temPermissao('relatorios', 'cronograma_obra_relatorio') && (
                              <MenuItem item={{ name: "Cronograma Obra", icon: Calendar, path: "RelatorioCronograma" }} />
                            )}
                            {temPermissao('relatorios', 'execucao_obra_relatorio') && (
                              <MenuItem item={{ name: "Execução Obra", icon: HardHat, path: "RelatorioExecucao" }} />
                            )}
                            {temPermissao('relatorios', 'custos_obra_relatorio') && (
                              <MenuItem item={{ name: "Custos de Obra", icon: Hammer, path: "RelatorioCustosObra" }} />
                            )}
                            {temPermissao('relatorios', 'orcamentos_compra_relatorio') && (
                              <MenuItem item={{ name: "Orçamentos Compra", icon: FileBarChart, path: "RelatorioOrcamentosCompra" }} />
                            )}
                            {temPermissao('relatorios', 'compras_relatorio') && (
                              <MenuItem item={{ name: "Compras", icon: ShoppingCart, path: "RelatorioCompras" }} />
                            )}
                            {temPermissao('relatorios', 'estoque') && (
                              <MenuItem item={{ name: "Estoque", icon: Package, path: "RelatorioEstoque" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'consorcios_relatorio') || temPermissao('relatorios', 'contemplacoes')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Consórcios</div>
                            {temPermissao('relatorios', 'consorcios_relatorio') && (
                              <MenuItem item={{ name: "Consórcios", icon: CircleDollarSign, path: "RelatorioConsorcios" }} />
                            )}
                            {temPermissao('relatorios', 'contemplacoes') && (
                              <MenuItem item={{ name: "Contemplações", icon: Award, path: "RelatorioContemplacoes" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'fornecedores') || temPermissao('relatorios', 'socios')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Parceiros</div>
                            {temPermissao('relatorios', 'fornecedores') && (
                              <MenuItem item={{ name: "Fornecedores", icon: Briefcase, path: "RelatorioFornecedores" }} />
                            )}
                            {temPermissao('relatorios', 'socios') && (
                              <MenuItem item={{ name: "Sócios", icon: UserSquare2, path: "RelatorioSocios" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'engajamento') || temPermissao('relatorios', 'documentos_gerados') || temPermissao('relatorios', 'templates_resposta')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Comunicação</div>
                            {temPermissao('relatorios', 'engajamento') && (
                              <MenuItem item={{ name: "Engajamento", icon: MessageSquare, path: "RelatorioEngajamentoComunicacao" }} />
                            )}
                            {temPermissao('relatorios', 'documentos_gerados') && (
                              <MenuItem item={{ name: "Documentos Gerados", icon: FileCheck, path: "RelatorioDocumentosGerados" }} />
                            )}
                            {temPermissao('relatorios', 'templates_resposta') && (
                              <MenuItem item={{ name: "Templates Resposta", icon: Zap, path: "RelatorioTemplatesResposta" }} />
                            )}
                          </>
                        )}
                        
                        {(temPermissao('relatorios', 'consolidado') || temPermissao('relatorios', 'dashboard_financeiro') || temPermissao('relatorios', 'dashboard_consorcios')) && (
                          <>
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase mt-3">Consolidado</div>
                            {temPermissao('relatorios', 'consolidado') && (
                              <MenuItem item={{ name: "📈 Relatório Consolidado", icon: PieChart, path: "RelatoriosConsolidado" }} />
                            )}
                            {temPermissao('relatorios', 'dashboard_financeiro') && (
                              <MenuItem item={{ name: "Dashboard Financeiro", icon: PieChart, path: "DashboardFinanceiro" }} />
                            )}
                            {temPermissao('relatorios', 'dashboard_consorcios') && (
                              <MenuItem item={{ name: "Dashboard Consórcios", icon: CircleDollarSign, path: "DashboardConsorcios" }} />
                            )}
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </TabsContent>

                <TabsContent value="sobre" className="mt-0">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-2">
                        {temPermissao('sobre', 'wiki') && (
                          <MenuItem item={{ name: "📚 Wiki / Documentação", icon: BookOpen, path: "Wiki" }} />
                        )}
                        {temPermissao('sobre', 'changelog') && (
                          <MenuItem item={{ name: "🔄 Changelog / Versões", icon: History, path: "Changelog" }} />
                        )}
                        
                        <div className="px-3 py-4 mt-4">
                          <div className="p-4 bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg border border-[var(--wine-200)]">
                            <p className="text-xs font-bold text-[var(--wine-700)] mb-2">Sistema Riviera</p>
                            <p className="text-xs text-gray-600 mb-1">Versão: <strong>4.1.0</strong></p>
                            <p className="text-xs text-gray-600 mb-1">Build: <strong>2025.01</strong></p>
                            <p className="text-xs text-gray-600">© 2025 Riviera Incorporadora</p>
                          </div>
                        </div>

                        <div className="px-3">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">💡 Novidades v4.1</p>
                            <ul className="text-xs text-blue-800 space-y-1">
                              <li>• Portal do Cliente Aprimorado</li>
                              <li>• Notificações Push em Tempo Real</li>
                              <li>• Central de Documentos Completa</li>
                              <li>• Cronograma com Fotos Automáticas</li>
                              <li>• Download de Boletos e Comprovantes</li>
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

                {pagamentosClientesPendentes.length > 0 && temPermissao('fluxo_financeiro', 'recebimentos_clientes') && (
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

        {/* Assistente Riviera - aparece para todos usuários */}
        {user && (
          <AssistenteRiviera currentPage={currentPageName} />
        )}
      </SidebarProvider>
    </>
  );
}