import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell, MessageSquare, FileText, CreditCard, HardHat, 
  Settings, CheckCheck, Trash2, X
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const tipoIcons = {
  mensagem: MessageSquare,
  negociacao: FileText,
  pagamento: CreditCard,
  documento: FileText,
  obra: HardHat,
  sistema: Settings,
};

const tipoColors = {
  mensagem: "text-blue-600 bg-blue-100",
  negociacao: "text-purple-600 bg-purple-100",
  pagamento: "text-green-600 bg-green-100",
  documento: "text-orange-600 bg-orange-100",
  obra: "text-yellow-600 bg-yellow-100",
  sistema: "text-gray-600 bg-gray-100",
};

const prioridadeColors = {
  baixa: "border-l-gray-300",
  normal: "border-l-blue-400",
  alta: "border-l-orange-400",
  critica: "border-l-red-500",
};

export default function NotificationCenter({ clienteId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notificacoes = [], refetch } = useQuery({
    queryKey: ['notificacoes', clienteId],
    queryFn: () => base44.entities.Notificacao.filter({ cliente_id: clienteId }),
    enabled: !!clienteId,
    refetchInterval: 15000, // Atualizar a cada 15 segundos
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: async (notificacaoId) => {
      await base44.entities.Notificacao.update(notificacaoId, {
        lida: true,
        data_leitura: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
  });

  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: async () => {
      const naoLidas = notificacoes.filter(n => !n.lida);
      await Promise.all(
        naoLidas.map(n => 
          base44.entities.Notificacao.update(n.id, {
            lida: true,
            data_leitura: new Date().toISOString(),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  const excluirNotificacaoMutation = useMutation({
    mutationFn: async (notificacaoId) => {
      await base44.entities.Notificacao.delete(notificacaoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      toast.success("Notificação excluída");
    },
  });

  const handleNotificacaoClick = (notificacao) => {
    // Marcar como lida
    if (!notificacao.lida) {
      marcarComoLidaMutation.mutate(notificacao.id);
    }

    // Navegar para o link se existir
    if (notificacao.link) {
      navigate(notificacao.link);
      setOpen(false);
    }
  };

  const notificacoesOrdenadas = [...notificacoes].sort((a, b) => {
    // Prioridade: não lidas primeiro
    if (a.lida !== b.lida) {
      return a.lida ? 1 : -1;
    }
    // Depois por data
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {naoLidas > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 p-0 flex items-center justify-center rounded-full">
              {naoLidas > 9 ? '9+' : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notificações</h3>
          <div className="flex items-center gap-2">
            {naoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => marcarTodasComoLidasMutation.mutate()}
                disabled={marcarTodasComoLidasMutation.isPending}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notificacoesOrdenadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoesOrdenadas.map((notif) => {
                const Icon = tipoIcons[notif.tipo] || Bell;
                const colorClass = tipoColors[notif.tipo] || "text-gray-600 bg-gray-100";
                const prioridadeClass = prioridadeColors[notif.prioridade] || "border-l-blue-400";

                return (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${prioridadeClass} ${
                      !notif.lida ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificacaoClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-semibold text-sm ${!notif.lida ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notif.titulo}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              excluirNotificacaoMutation.mutate(notif.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notif.mensagem}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(parseISO(notif.created_date), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                          {!notif.lida && (
                            <Badge className="bg-blue-500 text-white text-xs">Nova</Badge>
                          )}
                          {notif.prioridade === 'critica' && (
                            <Badge className="bg-red-500 text-white text-xs">Urgente</Badge>
                          )}
                          {notif.prioridade === 'alta' && (
                            <Badge className="bg-orange-500 text-white text-xs">Importante</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notificacoes.length > 0 && (
          <div className="p-3 border-t text-center">
            <Button
              variant="link"
              size="sm"
              className="text-[var(--wine-600)]"
              onClick={() => {
                navigate(createPageUrl('PortalClienteNotificacoes'));
                setOpen(false);
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}