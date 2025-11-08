import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home, Building2, Calendar, DollarSign, FileText, MessageSquare,
  User, LogOut, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PortalClienteNav({ user, cliente }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: "Início", icon: Home, path: "PortalClienteDashboard" },
    { name: "Minha Unidade", icon: Building2, path: "PortalClienteUnidade" },
    { name: "Cronograma", icon: Calendar, path: "PortalClienteCronograma" },
    { name: "Financeiro", icon: DollarSign, path: "PortalClienteFinanceiro" },
    { name: "Documentos", icon: FileText, path: "PortalClienteDocumentos" },
    { name: "Mensagens", icon: MessageSquare, path: "PortalClienteMensagens" },
  ];

  const getInitials = (name) => {
    if (!name) return "C";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --wine-50: #FBF1F3;
          --grape-600: #7D5999;
        }
      `}</style>

      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[var(--wine-600)]"
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

            <nav className="hidden lg:flex items-center gap-2">
              {menuItems.map((item) => (
                <Link key={item.path} to={createPageUrl(item.path)}>
                  <Button variant="ghost" className="gap-2 hover:bg-[var(--wine-50)]">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-sm">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.full_name?.split(' ')[0] || 'Cliente'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
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

        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}