import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, DollarSign, FileText, TrendingUp, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const tipoIcons = {
  novo_aporte: DollarSign,
  vencimento_aporte: Clock,
  pagamento_confirmado: CheckCircle,
  nova_ata: FileText,
  alerta_financeiro: TrendingUp,
  comunicado_diretoria: MessageSquare,
};

export default function NotificationCenter({ socioId }) {
  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoesSocio', socioId],
    queryFn: async () => {
      if (!socioId) return [];
      return await base44.entities.NotificacaoSocio.filter({ socio_id: socioId, lida: false }, '-created_date', 10);
    },
    enabled: !!socioId,
    refetchInterval: 30000,
  });

  const naoLidas = notificacoes.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {naoLidas > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center rounded-full">
              {naoLidas > 9 ? '9+' : naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Badge variant="outline" className="text-xs">{naoLidas} nova(s)</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notificacoes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Nenhuma notificação nova
          </div>
        ) : (
          <>
            {notificacoes.slice(0, 5).map(notif => {
              const Icon = tipoIcons[notif.tipo] || Bell;
              return (
                <DropdownMenuItem key={notif.id} className="flex items-start gap-3 p-3 cursor-pointer">
                  <Icon className="w-4 h-4 mt-0.5 text-[var(--wine-600)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notif.titulo}</p>
                    <p className="text-xs text-gray-500 truncate">{notif.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notif.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to={createPageUrl('PortalSocioNotificacoes')} 
                className="w-full text-center text-[var(--wine-600)] font-medium"
              >
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}