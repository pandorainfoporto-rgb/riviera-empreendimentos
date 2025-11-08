import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  User,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LayoutCliente({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUserCliente'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      return userData;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Verificar autenticação uma única vez
  useEffect(() => {
    const verificar = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin();
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setVerificandoAuth(false);
      }
    };

    verificar();
  }, []);

  const { data: cliente } = useQuery({
    queryKey: ['clienteLogado', user?.email],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.filter({ email: user.email });
      return clientes[0] || null;
    },
    enabled: !!user?.email && !verificandoAuth,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: mensagensNaoLidas = [] } = useQuery({
    queryKey: ['mensagensNaoLidasCliente', cliente?.id],
    queryFn: async () => {
      const msgs = await base44.entities.Mensagem.filter({
        cliente_id: cliente.id,
        lida: false,
        remetente_tipo: 'admin'
      });
      return msgs || [];
    },
    enabled: !!cliente?.id,
    retry: false,
  });

  const menuItems = [
    { name: "Início", icon: Home, path: "PortalClienteDashboard" },
    { name: "Minha Unidade", icon: Building2, path: "PortalClienteUnidade" },
    { name: "Cronograma", icon: Calendar, path: "PortalClienteCronograma" },
    { name: "Financeiro", icon: DollarSign, path: "PortalClienteFinanceiro" },
    { name: "Documentos", icon: FileText, path: "PortalClienteDocumentos" },
    { name: "Mensagens", icon: MessageSquare, path: "PortalClienteMensagens", badge: mensagensNaoLidas.length },
  ];

  const getInitials = (name) => {
    if (!name) return "C";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading || verificandoAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando Portal do Cliente...</p>
        </div>
      </div>
    );
  }

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
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[var(--wine-50)] to-[var(--grape-50)]">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo & Menu Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[var(--wine-600)] hover:bg-gray-100"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] flex items-center justify-center text-white font-bold text-lg shadow-md">
                    R
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="font-bold text-lg text-[var(--wine-700)]">Riviera</h1>
                    <p className="text-xs text-gray-500">Portal do Cliente</p>
                  </div>
                </div>
              </div>

              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center gap-2">
                {menuItems.map((item) => (
                  <Link key={item.path} to={createPageUrl(item.path)}>
                    <Button
                      variant="ghost"
                      className="relative gap-2 hover:bg-[var(--wine-50)] hover:text-[var(--wine-700)]"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.badge > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[var(--wine-600)] text-white text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 hover:bg-[var(--wine-50)]">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-sm">
                          {getInitials(user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm font-medium">{user?.full_name?.split(' ')[0] || 'Cliente'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{user?.full_name || 'Cliente'}</p>
                        <p className="text-xs text-gray-500">{user?.email || ''}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('PortalClientePerfil')} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white">
              <nav className="px-4 py-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 relative hover:bg-[var(--wine-50)] hover:text-[var(--wine-700)]"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      {item.badge > 0 && (
                        <Badge className="ml-auto bg-[var(--wine-600)] text-white">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                © 2024 Riviera Incorporadora. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <a href="#" className="hover:text-[var(--wine-600)]">Termos de Uso</a>
                <span>•</span>
                <a href="#" className="hover:text-[var(--wine-600)]">Privacidade</a>
                <span>•</span>
                <a href="#" className="hover:text-[var(--wine-600)]">Suporte</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}