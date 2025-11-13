import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Building,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  User,
  LogOut,
  CircleDollarSign
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

export default function LayoutCliente({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { name: "Dashboard", icon: Home, path: "PortalClienteDashboard" },
    { name: "Minha Unidade", icon: Building, path: "PortalClienteUnidade" },
    { name: "Cronograma de Obra", icon: Calendar, path: "PortalClienteCronograma" },
    { name: "Financeiro", icon: CreditCard, path: "PortalClienteFinanceiro" },
    { name: "Documentos", icon: FileText, path: "PortalClienteDocumentos" },
    { name: "Mensagens", icon: MessageSquare, path: "PortalClienteMensagens" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center font-bold text-2xl">
                R
              </div>
              <div>
                <h1 className="text-xl font-bold">Portal do Cliente</h1>
                <p className="text-sm text-white/80">Riviera Incorporadora</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-white text-[var(--wine-600)]">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user?.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('PortalClientePerfil')}>
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {menuItems.map((item) => (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <Button
                  variant={currentPageName === item.name ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © 2024 Riviera Incorporadora - Portal do Cliente v3.8.3
        </div>
      </footer>

      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --grape-600: #7D5999;
        }
      `}</style>
    </div>
  );
}