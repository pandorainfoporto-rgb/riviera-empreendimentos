import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, DollarSign, BarChart, LogOut, User, Menu, X, Bell, TrendingUp, Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "./socios/NotificationCenter";
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

export default function LayoutSocio({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socio } = useQuery({
    queryKey: ['meu_socio', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return null;
      return await base44.entities.Socio.get(user.socio_id);
    },
    enabled: !!user?.socio_id,
  });

  const { data: notificacoesNaoLidas = [] } = useQuery({
    queryKey: ['notificacoes_nao_lidas', user?.socio_id],
    queryFn: async () => {
      if (!user?.socio_id) return [];
      return await base44.entities.NotificacaoSocio.filter({
        socio_id: user.socio_id,
        lida: false
      });
    },
    enabled: !!user?.socio_id,
    refetchInterval: 30000,
  });

  // Registrar log de acesso
  useEffect(() => {
    const registrarAcesso = async () => {
      if (!user?.socio_id || !socio) return;
      
      let acao = 'visualizou_dashboard';
      const path = location.pathname.toLowerCase();
      
      if (path.includes('aportes')) acao = 'visualizou_aportes';
      else if (path.includes('atas')) acao = 'visualizou_atas';
      else if (path.includes('relatorios')) acao = 'visualizou_relatorios';

      try {
        await base44.entities.LogAcessoSocio.create({
          socio_id: user.socio_id,
          user_id: user.id,
          nome_socio: socio.nome,
          email: user.email,
          acao,
          descricao: `Acessou ${path}`,
          data_hora: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erro ao registrar log:', error);
      }
    };

    registrarAcesso();
  }, [location.pathname, user, socio]);

  const handleLogout = async () => {
    if (user?.socio_id && socio) {
      try {
        await base44.entities.LogAcessoSocio.create({
          socio_id: user.socio_id,
          user_id: user.id,
          nome_socio: socio.nome,
          email: user.email,
          acao: 'logout',
          descricao: 'Saiu do sistema',
          data_hora: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erro ao registrar logout:', error);
      }
    }
    base44.auth.logout();
  };

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SC';

  const menuItems = [
    { title: "Dashboard", url: createPageUrl("PortalSocioDashboard"), icon: LayoutDashboard },
    { title: "Aportes", url: createPageUrl("PortalSocioAportes"), icon: DollarSign },
    { title: "Documentos", url: createPageUrl("PortalSocioAtas"), icon: FileText },
    { title: "Relatórios", url: createPageUrl("PortalSocioRelatorios"), icon: BarChart },
    { title: "Relatórios Financeiros", url: createPageUrl("PortalSocioRelatoriosFinanceiros"), icon: TrendingUp },
    { title: "Notificações", url: createPageUrl("PortalSocioNotificacoes"), icon: Bell },
  ];

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17875_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <style>{`
        :root {
          --wine-900: #4A1625;
          --wine-800: #6B1F34;
          --wine-700: #7C2D3E;
          --wine-600: #922B3E;
          --wine-500: #A63446;
          --grape-600: #7D5999;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-xl flex items-center justify-center bg-gradient-to-br from-[#2C3E2F] to-[#1a2419] p-2 border border-gray-200">
                <img 
                  src={logoUrl}
                  alt="Riviera Logo" 
                  className="w-full h-full object-contain filter brightness-110 contrast-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23922B3E"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle" font-family="Arial">R</text></svg>';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[var(--wine-700)]">Portal do Sócio</h1>
                <p className="text-xs text-gray-600">{socio?.nome || 'Carregando...'}</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
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
              <div className="relative">
                <NotificationCenter socioId={user?.socio_id} />
                {notificacoesNaoLidas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {notificacoesNaoLidas.length}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                      <AvatarFallback className="text-white font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.full_name}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('PortalSocioPerfil')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          © 2026 Riviera Incorporadora - Portal do Sócio v4.6.0
        </div>
      </footer>
    </div>
  );
}