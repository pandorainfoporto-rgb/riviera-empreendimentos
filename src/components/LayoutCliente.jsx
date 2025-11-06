
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Home, DollarSign, FileText,
  LogOut, User, MessageSquare, HardHat, Key
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DialogAlterarSenha from "./DialogAlterarSenha"; // Assuming this path for the custom component

export default function LayoutCliente({ children }) {
  const location = useLocation();
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: cliente } = useQuery({
    queryKey: ['cliente_logado'],
    queryFn: async () => {
      if (!user?.email) return null;
      const clientes = await base44.entities.Cliente.filter({ email: user.email });
      return clientes[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes_cliente', cliente?.id],
    queryFn: () => base44.entities.Notificacao.filter({ cliente_id: cliente.id, lida: false }),
    enabled: !!cliente?.id,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17875_525981935_17846132280535972_4105371699080593471_n.jpg";

  const menuItems = [
    { title: "Dashboard", url: createPageUrl("PortalClienteDashboard"), icon: LayoutDashboard },
    { title: "Minha Unidade", url: createPageUrl("PortalClienteUnidade"), icon: Home },
    { title: "Acompanhar Obra", url: createPageUrl("PortalClienteCronograma"), icon: HardHat },
    { title: "Financeiro", url: createPageUrl("PortalClienteFinanceiro"), icon: DollarSign },
    { title: "Documentos", url: createPageUrl("PortalClienteDocumentos"), icon: FileText },
    { title: "Mensagens", url: createPageUrl("PortalClienteMensagens"), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-gray-50 to-gray-100">
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

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xl flex items-center justify-center bg-gradient-to-br from-[#2C3E2F] to-[#1a2419] p-2.5 border-2 border-gray-200">
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
              <div>
                <h1 className="text-xl font-bold text-[var(--wine-700)]">Riviera Incorporadora</h1>
                <p className="text-xs text-gray-600">Portal do Cliente</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                      <AvatarFallback className="text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {notificacoes.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center rounded-full">
                        {notificacoes.length > 9 ? '9+' : notificacoes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('PortalClientePerfil')} className="cursor-pointer flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAlterarSenha(true)} className="flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.url;
              
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.title === "Mensagens" && notificacoes.length > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {notificacoes.length}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center">
        <p className="text-xs text-gray-500">
          © 2025 Riviera Iguaçu Incorporadora • Portal do Cliente v1.1.0
        </p>
      </footer>

      {showAlterarSenha && (
        <DialogAlterarSenha
          onClose={() => setShowAlterarSenha(false)}
        />
      )}
    </div>
  );
}
