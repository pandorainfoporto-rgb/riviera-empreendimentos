
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
import { 
  MessageSquare, Send, Plus, Search, AlertCircle, 
  CheckCircle, Clock, Paperclip, User, Shield
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PortalClienteMensagens() {
  const [user, setUser] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Formulário nova conversa
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoAssunto, setNovoAssunto] = useState("geral");
  const [novaMensagem, setNovaMensagem] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const clientes = await base44.entities.Cliente.filter({ email: currentUser.email });
        if (clientes && clientes.length > 0) {
          setCliente(clientes[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: mensagens = [], refetch } = useQuery({
    queryKey: ['mensagens', cliente?.id],
    queryFn: () => base44.entities.Mensagem.filter({ cliente_id: cliente.id }),
    enabled: !!cliente,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Agrupar mensagens por conversa
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
      // Atualizar data da última mensagem
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
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mensagens.some(m => m.mensagem.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const enviarMensagemMutation = useMutation({
    mutationFn: async (data) => {
      const novaMensagem = await base44.entities.Mensagem.create({
        ...data,
        remetente_tipo: 'cliente',
        remetente_email: user.email,
        remetente_nome: cliente.nome,
        lida: false,
      });
      return novaMensagem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
      setMensagemTexto("");
      toast.success("Mensagem enviada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });

  const criarConversaMutation = useMutation({
    mutationFn: async (data) => {
      const conversaId = `conv_${Date.now()}`;
      const novaMensagem = await base44.entities.Mensagem.create({
        ...data,
        conversa_id: conversaId,
        remetente_tipo: 'cliente',
        remetente_email: user.email,
        remetente_nome: cliente.nome,
        lida: false,
      });
      
      // Criar notificação para admins sobre nova mensagem de cliente
      try {
        await base44.functions.invoke('notificarCliente', {
          cliente_id: cliente.id,
          tipo: 'mensagem',
          titulo: `Nova mensagem: ${data.titulo}`,
          mensagem: `O cliente ${cliente.nome} iniciou uma nova conversa sobre ${data.assunto}`,
          link: '/MensagensClientes',
          referencia_id: conversaId,
          referencia_tipo: 'Mensagem',
          prioridade: 'normal',
          enviar_email: false,
        });
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError);
        // Do not block the main mutation success even if notification fails
      }
      
      return novaMensagem;
    },
    onSuccess: (novaMensagem) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
      setShowNovaConversa(false);
      setNovoTitulo("");
      setNovoAssunto("geral");
      setNovaMensagem("");
      toast.success("Conversa iniciada com sucesso!");
      
      setTimeout(() => {
        const novaConversa = conversas.find(c => c.id === novaMensagem.conversa_id);
        if (novaConversa) {
          setConversaSelecionada(novaConversa);
        }
      }, 500);
    },
    onError: (error) => {
      toast.error("Erro ao criar conversa: " + error.message);
    },
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: async (mensagemId) => {
      await base44.entities.Mensagem.update(mensagemId, {
        lida: true,
        data_leitura: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
    },
  });

  const handleEnviarMensagem = () => {
    if (!mensagemTexto.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    enviarMensagemMutation.mutate({
      cliente_id: cliente.id,
      conversa_id: conversaSelecionada.id,
      titulo: conversaSelecionada.titulo,
      assunto: conversaSelecionada.assunto,
      mensagem: mensagemTexto,
      status: conversaSelecionada.status,
      prioridade: conversaSelecionada.prioridade,
    });
  };

  const handleCriarConversa = () => {
    if (!novoTitulo.trim() || !novaMensagem.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    criarConversaMutation.mutate({
      cliente_id: cliente.id,
      titulo: novoTitulo,
      assunto: novoAssunto,
      mensagem: novaMensagem,
    });
  };

  // Marcar mensagens como lidas ao selecionar conversa
  useEffect(() => {
    if (conversaSelecionada) {
      conversaSelecionada.mensagens.forEach(msg => {
        if (!msg.lida && msg.remetente_tipo === 'admin') {
          marcarComoLidaMutation.mutate(msg.id);
        }
      });
    }
  }, [conversaSelecionada?.id]);

  if (!user || !cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const totalNaoLidas = conversas.reduce((sum, c) => sum + c.naoLidas, 0);

  const getAssuntoLabel = (assunto) => {
    const labels = {
      geral: "Geral",
      negociacao: "Negociação",
      pagamento: "Pagamento",
      documento: "Documento",
      obra: "Obra",
      financeiro: "Financeiro",
      suporte: "Suporte",
    };
    return labels[assunto] || assunto;
  };

  const getAssuntoColor = (assunto) => {
    const colors = {
      geral: "bg-gray-100 text-gray-700",
      negociacao: "bg-blue-100 text-blue-700",
      pagamento: "bg-green-100 text-green-700",
      documento: "bg-purple-100 text-purple-700",
      obra: "bg-orange-100 text-orange-700",
      financeiro: "bg-red-100 text-red-700",
      suporte: "bg-yellow-100 text-yellow-700",
    };
    return colors[assunto] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status) => {
    const colors = {
      aberto: "bg-blue-100 text-blue-700",
      em_andamento: "bg-yellow-100 text-yellow-700",
      resolvido: "bg-green-100 text-green-700",
      fechado: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Mensagens</h1>
            <p className="text-gray-600 mt-1">Converse com nossa equipe</p>
          </div>
          <Button
            onClick={() => setShowNovaConversa(true)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {totalNaoLidas > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800">
              Você tem <strong>{totalNaoLidas}</strong> mensagem{totalNaoLidas > 1 ? 's' : ''} não lida{totalNaoLidas > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar conversas..."
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
                    <p className="text-gray-500 text-sm">
                      {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                    </p>
                  </div>
                ) : (
                  conversasFiltradas.map((conversa) => (
                    <div
                      key={conversa.id}
                      onClick={() => setConversaSelecionada(conversa)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        conversaSelecionada?.id === conversa.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm line-clamp-1">{conversa.titulo}</h4>
                        {conversa.naoLidas > 0 && (
                          <Badge className="bg-red-500 text-white ml-2">{conversa.naoLidas}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={getAssuntoColor(conversa.assunto)}>
                          {getAssuntoLabel(conversa.assunto)}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(conversa.status)}>
                          {conversa.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {conversa.mensagens[conversa.mensagens.length - 1]?.mensagem}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(parseISO(conversa.ultimaMensagem), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="lg:col-span-2 shadow-lg">
            {!conversaSelecionada ? (
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Selecione uma conversa para começar</p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{conversaSelecionada.titulo}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getAssuntoColor(conversaSelecionada.assunto)}>
                          {getAssuntoLabel(conversaSelecionada.assunto)}
                        </Badge>
                        <Badge className={getStatusColor(conversaSelecionada.status)}>
                          {conversaSelecionada.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                    {conversaSelecionada.mensagens
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                      .map((msg) => {
                        const isCliente = msg.remetente_tipo === 'cliente';
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${isCliente ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isCliente && (
                              <Avatar className="w-8 h-8 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                                <AvatarFallback className="text-white text-xs">
                                  <Shield className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-[70%] ${isCliente ? 'order-first' : ''}`}>
                              <div
                                className={`rounded-lg p-3 ${
                                  isCliente
                                    ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 px-1">
                                <p className="text-xs text-gray-500">
                                  {format(parseISO(msg.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
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

                  {conversaSelecionada.status !== 'fechado' && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={mensagemTexto}
                        onChange={(e) => setMensagemTexto(e.target.value)}
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
                        disabled={!mensagemTexto.trim() || enviarMensagemMutation.isPending}
                        className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {conversaSelecionada.status === 'fechado' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Esta conversa foi fechada. Para continuar, inicie uma nova conversa.
                      </p>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog Nova Conversa */}
      {showNovaConversa && (
        <Dialog open={showNovaConversa} onOpenChange={setShowNovaConversa}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Nova Conversa
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Dúvida sobre parcela de março"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto *</Label>
                <Select value={novoAssunto} onValueChange={setNovoAssunto}>
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
                    <SelectItem value="suporte">Suporte Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Descreva sua dúvida ou solicitação..."
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Nossa equipe responde em até 24 horas úteis.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNovaConversa(false)}
                disabled={criarConversaMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarConversa}
                disabled={criarConversaMutation.isPending}
                className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
              >
                {criarConversaMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
