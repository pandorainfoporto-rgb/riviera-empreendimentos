
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Plus, Search, CheckCircle, Clock, User, Shield, XCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PortalClienteMensagens() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [showNovaConversaDialog, setShowNovaConversaDialog] = useState(false);
  const [novaConversaTitulo, setNovaConversaTitulo] = useState("");
  const [novaConversaAssunto, setNovaConversaAssunto] = useState("geral");
  const [novaConversaMensagem, setNovaConversaMensagem] = useState("");
  const [encerrandoConversa, setEncerrandoConversa] = useState(false);

  const queryClient = useQueryClient();

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

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagensCliente', cliente?.id],
    queryFn: () => base44.entities.Mensagem.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    refetchInterval: 5000,
  });

  // Marcar como lida automaticamente quando visualizar
  const marcarComoLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.Mensagem.update(id, { 
      lida: true, 
      data_leitura: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagensCliente'] });
    },
  });

  useEffect(() => {
    if (selectedConversa) {
      const mensagensNaoLidas = selectedConversa.mensagens.filter(
        m => !m.lida && m.remetente_tipo === 'admin'
      );

      mensagensNaoLidas.forEach(msg => {
        marcarComoLidaMutation.mutate(msg.id);
      });
    }
  }, [selectedConversa?.id, selectedConversa?.mensagens]); // Added selectedConversa.mensagens to dependencies

  const conversas = React.useMemo(() => {
    const grouped = mensagens.reduce((acc, msg) => {
      const conversaId = msg.conversa_id || msg.id;
      if (!acc[conversaId]) {
        acc[conversaId] = {
          id: conversaId,
          titulo: msg.titulo,
          assunto: msg.assunto,
          status: msg.status,
          prioridade: msg.prioridade,
          mensagens: [],
          ultimaMensagem: msg.created_date,
          naoLidas: 0,
        };
      }
      acc[conversaId].mensagens.push(msg);
      if (!msg.lida && msg.remetente_tipo === 'admin') {
        acc[conversaId].naoLidas++;
      }
      if (new Date(msg.created_date) > new Date(acc[conversaId].ultimaMensagem)) {
        acc[conversaId].ultimaMensagem = msg.created_date;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
      new Date(b.ultimaMensagem) - new Date(a.ultimaMensagem)
    );
  }, [mensagens]);

  const conversasFiltradas = conversas.filter(c =>
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enviarMensagemMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Mensagem.create({
        ...data,
        remetente_tipo: 'cliente',
        remetente_email: user.email,
        remetente_nome: cliente.nome,
        lida: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagensCliente'] });
      setNovaMensagem("");
      toast.success("Mensagem enviada!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar: " + error.message);
    },
  });

  const criarConversaMutation = useMutation({
    mutationFn: async (data) => {
      const conversaId = `conv_${Date.now()}_${cliente.id}`;
      return await base44.entities.Mensagem.create({
        ...data,
        conversa_id: conversaId,
        remetente_tipo: 'cliente',
        remetente_email: user.email,
        remetente_nome: cliente.nome,
        lida: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagensCliente'] });
      setShowNovaConversaDialog(false);
      setNovaConversaTitulo("");
      setNovaConversaAssunto("geral");
      setNovaConversaMensagem("");
      toast.success("Conversa iniciada!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const encerrarConversaMutation = useMutation({
    mutationFn: async () => {
      setEncerrandoConversa(true);
      const resultado = await base44.functions.invoke('encerrarConversaCliente', {
        conversa_id: selectedConversa.id,
        cliente_id: cliente.id
      });
      return resultado.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagensCliente'] });
      toast.success('Conversa encerrada! Você receberá o histórico por email.');
      setSelectedConversa(null); // Deselect conversation after it's closed
      setEncerrandoConversa(false);
    },
    onError: (error) => {
      toast.error('Erro ao encerrar: ' + error.message);
      setEncerrandoConversa(false);
    }
  });

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    enviarMensagemMutation.mutate({
      cliente_id: cliente.id,
      conversa_id: selectedConversa.id,
      titulo: selectedConversa.titulo,
      assunto: selectedConversa.assunto,
      mensagem: novaMensagem,
      status: selectedConversa.status,
      prioridade: selectedConversa.prioridade,
    });
  };

  const handleCriarConversa = () => {
    if (!novaConversaTitulo.trim() || !novaConversaMensagem.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    criarConversaMutation.mutate({
      cliente_id: cliente.id,
      titulo: novaConversaTitulo,
      assunto: novaConversaAssunto,
      mensagem: novaConversaMensagem,
    });
  };

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)]"></div>
      </div>
    );
  }

  const totalNaoLidas = conversas.reduce((sum, c) => sum + c.naoLidas, 0);

  const getAssuntoLabel = (assunto) => {
    const labels = {
      geral: "Geral", negociacao: "Negociação", pagamento: "Pagamento",
      documento: "Documento", obra: "Obra", financeiro: "Financeiro", suporte: "Suporte",
    };
    return labels[assunto] || assunto;
  };

  const getAssuntoColor = (assunto) => {
    const colors = {
      geral: "bg-gray-100 text-gray-700", negociacao: "bg-blue-100 text-blue-700",
      pagamento: "bg-green-100 text-green-700", documento: "bg-purple-100 text-purple-700",
      obra: "bg-orange-100 text-orange-700", financeiro: "bg-red-100 text-red-700",
      suporte: "bg-yellow-100 text-yellow-700",
    };
    return colors[assunto] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    const colors = {
      aberto: "bg-blue-100 text-blue-700", em_andamento: "bg-yellow-100 text-yellow-700",
      resolvido: "bg-green-100 text-green-700", fechado: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const conversaEncerrada = selectedConversa?.status === 'fechado';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {totalNaoLidas > 0 && (
            <Badge className="bg-red-500 text-white mb-2">
              {totalNaoLidas} não lida{totalNaoLidas > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setShowNovaConversaDialog(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {conversasFiltradas.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">Nenhuma conversa</p>
                </div>
              ) : (
                conversasFiltradas.map((conversa) => (
                  <div
                    key={conversa.id}
                    onClick={() => setSelectedConversa(conversa)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedConversa?.id === conversa.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{conversa.titulo}</h4>
                      {conversa.naoLidas > 0 && (
                        <Badge className="bg-red-500 text-white">{conversa.naoLidas}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className={getAssuntoColor(conversa.assunto)}>
                        {getAssuntoLabel(conversa.assunto)}
                      </Badge>
                      <Badge className={getStatusColor(conversa.status)}>
                        {conversa.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(conversa.ultimaMensagem), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          {!selectedConversa ? (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Selecione uma conversa</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedConversa.titulo}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getAssuntoColor(selectedConversa.assunto)}>
                        {getAssuntoLabel(selectedConversa.assunto)}
                      </Badge>
                      <Badge className={getStatusColor(selectedConversa.status)}>
                        {selectedConversa.status}
                      </Badge>
                    </div>
                  </div>
                  {!conversaEncerrada && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Deseja encerrar esta conversa? O histórico será enviado para seu email.')) {
                          encerrarConversaMutation.mutate();
                        }
                      }}
                      disabled={encerrandoConversa}
                    >
                      {encerrandoConversa ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Encerrando...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Encerrar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {conversaEncerrada && (
                  <Alert className="mb-4 bg-gray-100 border-gray-300">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Esta conversa foi encerrada. O histórico foi enviado para seu email.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                  {selectedConversa.mensagens
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg) => {
                      const isCliente = msg.remetente_tipo === 'cliente';
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isCliente ? 'justify-end' : 'justify-start'}`}>
                          {!isCliente && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                              <AvatarFallback className="text-white text-xs">
                                <Shield className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isCliente ? 'order-first' : ''}`}>
                            <div className={`rounded-lg p-3 ${
                              isCliente
                                ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1">
                              <p className="text-xs text-gray-500">
                                {format(parseISO(msg.created_date), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                              {isCliente && msg.lida && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                          {isCliente && (
                            <Avatar className="w-8 h-8 bg-blue-100">
                              <AvatarFallback className="text-blue-700 text-xs">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                </div>

                {!conversaEncerrada ? (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviarMensagem();
                        }
                      }}
                    />
                    <Button
                      onClick={handleEnviarMensagem}
                      disabled={!novaMensagem.trim()}
                      className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Esta conversa foi encerrada
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {showNovaConversaDialog && (
        <Dialog open={showNovaConversaDialog} onOpenChange={setShowNovaConversaDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Conversa</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: Dúvida sobre parcela"
                  value={novaConversaTitulo}
                  onChange={(e) => setNovaConversaTitulo(e.target.value)}
                />
              </div>

              <div>
                <Label>Assunto *</Label>
                <Select value={novaConversaAssunto} onValueChange={setNovaConversaAssunto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="obra">Obra</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mensagem *</Label>
                <Textarea
                  placeholder="Descreva sua dúvida..."
                  value={novaConversaMensagem}
                  onChange={(e) => setNovaConversaMensagem(e.target.value)}
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNovaConversaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarConversa} className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
