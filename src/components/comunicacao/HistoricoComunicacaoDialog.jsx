import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail, Phone, FileText, Calendar, Clock } from "lucide-react";

export default function HistoricoComunicacaoDialog({ open, onClose, cliente }) {
  const { data: mensagens = [] } = useQuery({
    queryKey: ['historico_cliente', cliente?.id],
    queryFn: () => base44.entities.Mensagem.filter({ cliente_id: cliente.id }, '-created_date'),
    enabled: !!cliente,
  });

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes_cliente', cliente?.id],
    queryFn: () => base44.entities.Notificacao.filter({ cliente_id: cliente.id }, '-created_date'),
    enabled: !!cliente,
  });

  // Combinar e ordenar por data
  const timeline = [
    ...mensagens.map(m => ({
      tipo: 'mensagem',
      data: m.created_date,
      titulo: m.titulo,
      descricao: m.mensagem,
      remetente: m.remetente_tipo,
      email_enviado: m.email_enviado,
      status: m.status,
      ...m
    })),
    ...notificacoes.map(n => ({
      tipo: 'notificacao',
      data: n.created_date,
      titulo: n.titulo,
      descricao: n.mensagem,
      lida: n.lida,
      ...n
    }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  const tipoIcons = {
    mensagem: MessageSquare,
    notificacao: Bell,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Comunicação - {cliente?.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {timeline.map((item, idx) => {
            const Icon = tipoIcons[item.tipo] || MessageSquare;
            
            return (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.tipo === 'mensagem' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.titulo}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.data).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 justify-end">
                          {item.email_enviado && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {item.status && (
                            <Badge variant="secondary" className="text-xs">
                              {item.status}
                            </Badge>
                          )}
                          {item.remetente && (
                            <Badge variant="outline" className="text-xs">
                              {item.remetente === 'admin' ? 'Equipe' : 'Cliente'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.descricao}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {timeline.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhum histórico de comunicação encontrado</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}