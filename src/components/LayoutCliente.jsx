import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Bell,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export default function LayoutCliente({ children, currentPageName }) {
  const location = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoesCliente', cliente?.id],
    queryFn: () => base44.entities.Notificacao.filter({ 
      destinatario_id: cliente.id,
      destinatario_tipo: 'cliente'
    }),
    enabled: !!cliente?.id,
    refetchInterval: 10000,
  });

  const { data: mensagensNaoLidas = [] } = useQuery({
    queryKey: ['mensagensNaoLidasCliente', cliente?.id],
    queryFn: async () => {
      const msgs = await base44.entities.Mensagem.filter({ 
        cliente_id: cliente.id,
        lida: false,
        remetente_tipo: 'admin'
      });
      return msgs;
    },
    enabled: !!cliente?.id,
    refetchInterval: 10000,
  });

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  useEffect(() => {
    if (notificacoesNaoLidas.length > 0) {
      const latestNotif = notificacoesNaoLidas[0];
      if (Notification.permission === "granted") {
        new Notification("Nova Atualização - Riviera", {
          body: latestNotif.mensagem,
          icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c836b77120dd82ca042f8/a86e3fbbe_525981935_17846132280535972_4105371699080593471_n.jpg"
        });
      }
    }
  }, [notificacoesNaoLidas.length]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { name: "Início", icon: Home, path: "PortalClienteDashboard" },
    { name: "Intenção de Compra", icon: FileText, path: "PortalClienteIntencaoCompra" },
    { name: "Negociações", icon: CreditCard, path: "PortalClienteNegociacoes" },
    { name: "Minhas Unidades", icon: Building, path: "PortalClienteUnidade" },
    { name: "Financeiro", icon: CreditCard, path: "PortalClienteFinanceiro" },
    { name: "Doc. da Obra", icon: Calendar, path: "PortalClienteCronograma" },
    { 
      name: "Mensagens", 
      icon: MessageSquare, 
      path: "PortalClienteMensagens",
      badge: mensagensNaoLidas.length > 0 ? mensagensNaoLidas.length : null
    },
  ];

  const isCurrentPage = (path) => {
    return location.pathname.toLowerCase().includes(path.toLowerCase());
  };

  const marcarTodasComoLidas = async () => {
    for (const notif of notificacoesNaoLidas) {
      await base44.entities.Notificacao.update(notif.id, { lida: true });
    }
    toast.success("Notificações marcadas como lidas");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c836b77120dd82ca042f8/a86e3fbbe_525981935_17846132280535972_4105371699080593471_n.jpg" 
                alt="Riviera Logo"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-bold">Portal do Cliente</h1>
                <p className="text-sm text-white/80">Riviera Incorporadora</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/20 relative">
                    <Bell className="w-5 h-5" />
                    {notificacoesNaoLidas.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {notificacoesNaoLidas.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notificações</h3>
                      {notificacoesNaoLidas.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={marcarTodasComoLidas}
                          className="text-xs"
                        >
                          Marcar todas como lidas
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    ) : (
                      notificacoes.slice(0, 10).map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-4 border-b hover:bg-gray-50 ${!notif.lida ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${!notif.lida ? 'bg-blue-600' : 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{notif.titulo}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.mensagem}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {format(parseISO(notif.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-white text-[var(--wine-600)]">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user?.full_name}</span>
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
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-[88px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = isCurrentPage(item.path);
              
              return (
                <Link key={item.path} to={createPageUrl(item.path)}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 whitespace-nowrap relative ${
                      isActive ? 'bg-[var(--wine-600)] text-white hover:bg-[var(--wine-700)]' : ''
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                    {item.badge && (
                      <Badge className="bg-red-500 text-white h-4 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © 2026 Riviera Incorporadora - Portal do Cliente v4.7.0
        </div>
      </footer>

      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --grape-600: #7D5999;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}