import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Paperclip } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import LayoutImobiliaria from "../components/LayoutImobiliaria";

export default function PortalImobiliariaMensagens() {
  const [conversaSelecionada, setConversaSelecionada] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [showNovaConversa, setShowNovaConversa] = useState(false);
  const [novaConversaForm, setNovaConversaForm] = useState({
    titulo: '',
    assunto: 'geral',
    mensagem: '',
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_imobiliaria'],
    queryFn: async () => {
      if (!user?.imobiliaria_id) return [];
      return await base44.entities.MensagemImobiliaria.filter({ imobiliaria_id: user.imobiliaria_id });
    },
    enabled: !!user?.imobiliaria_id,
  });

  // Agrupar mensagens por conversa
  const conversas = mensagens.reduce((acc, msg) => {
    const convId = msg.conversa_id || msg.id;
    if (!acc[convId]) {
      acc[convId] = {
        id: convId,
        titulo: msg.titulo,
        mensagens: [],
        naoLidas: 0,
        ultimaMensagem: null,
      };
    }
    acc[convId].mensagens.push(msg);
    if (!msg.lida && msg.remetente_tipo === 'incorporadora') {
      acc[convId].naoLidas++;
    }
    if (!acc[convId].ultimaMensagem || new Date(msg.created_date) > new Date(acc[convId].ultimaMensagem.created_date)) {
      acc[convId].ultimaMensagem = msg;
    }
    return acc;
  }, {});

  const conversasArray = Object.values(conversas).sort((a, b) => 
    new Date(b.ultimaMensagem.created_date) - new Date(a.ultimaMensagem.created_date)
  );

  const enviarMensagemMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemImobiliaria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliaria'] });
      setNovaMensagem('');
      toast.success('Mensagem enviada!');
    },
  });

  const criarConversaMutation = useMutation({
    mutationFn: (data) => base44.entities.MensagemImobiliaria.create(data),
    onSuccess: (novaMensagem) => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliaria'] });
      setShowNovaConversa(false);
      setNovaConversaForm({ titulo: '', assunto: 'geral', mensagem: '' });
      setConversaSelecionada(novaMensagem.id);
      toast.success('Conversa criada!');
    },
  });

  const marcarComoLidaMutation = useMutation({
    mutationFn: (id) => base44.entities.MensagemImobiliaria.update(id, { lida: true, data_leitura: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens_imobiliaria'] });
    },
  });

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) return;

    const conversa = conversasArray.find(c => c.id === conversaSelecionada);
    
    enviarMensagemMutation.mutate({
      imobiliaria_id: user.imobiliaria_id,
      conversa_id: conversaSelecionada,
      titulo: conversa.titulo,
      assunto: conversa.ultimaMensagem.assunto,
      mensagem: novaMensagem,
      remetente_tipo: 'imobiliaria',
      remetente_email: user.email,
      remetente_nome: user.full_name,
      status: 'aberto',
    });
  };

  const handleCriarConversa = (e) => {
    e.preventDefault();
    
    criarConversaMutation.mutate({
      imobiliaria_id: user.imobiliaria_id,
      titulo: novaConversaForm.titulo,
      assunto: novaConversaForm.assunto,
      mensagem: novaConversaForm.mensagem,
      remetente_tipo: 'imobiliaria',
      remetente_email: user.email,
      remetente_nome: user.full_name,
      status: 'aberto',
    });
  };

  const handleSelecionarConversa = (convId) => {
    setConversaSelecionada(convId);
    
    // Marcar mensagens como lidas
    const conversa = conversasArray.find(c => c.id === convId);
    conversa.mensagens.forEach(msg => {
      if (!msg.lida && msg.remetente_tipo === 'incorporadora') {
        marcarComoLidaMutation.mutate(msg.id);
      }
    });
  };

  const conversaSelecionadaObj = conversasArray.find(c => c.id === conversaSelecionada);

  return (
    <LayoutImobiliaria>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[var(--wine-700)]">Mensagens</h1>
            <p className="text-gray-600 mt-1">Comunique-se com a incorporadora</p>
          </div>
          <Button
            onClick={() => setShowNovaConversa(true)}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {conversasArray.map((conversa) => (
                  <div
                    key={conversa.id}
                    onClick={() => handleSelecionarConversa(conversa.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      conversaSelecionada === conversa.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{conversa.titulo}</h4>
                      {conversa.naoLidas > 0 && (
                        <Badge className="bg-red-500 text-white">{conversa.naoLidas}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {conversa.ultimaMensagem.mensagem}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(parseISO(conversa.ultimaMensagem.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}

                {conversasArray.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma conversa ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversa Selecionada */}
          <Card className="lg:col-span-2">
            {conversaSelecionadaObj ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">{conversaSelecionadaObj.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                    {conversaSelecionadaObj.mensagens
                      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                      .map((msg) => {
                        const isImobiliaria = msg.remetente_tipo === 'imobiliaria';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isImobiliaria ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                isImobiliaria
                                  ? 'bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{msg.mensagem}</p>
                              <p className={`text-xs mt-1 ${isImobiliaria ? 'text-white/70' : 'text-gray-500'}`}>
                                {format(parseISO(msg.created_date), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => {
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
                </CardContent>
              </>
            ) : (
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Selecione uma conversa ou inicie uma nova</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog Nova Conversa */}
      {showNovaConversa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Nova Conversa</CardTitle>
            </CardHeader>
            <form onSubmit={handleCriarConversa}>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={novaConversaForm.titulo}
                    onChange={(e) => setNovaConversaForm({...novaConversaForm, titulo: e.target.value})}
                    placeholder="Ex: Dúvida sobre Lote 15"
                    required
                  />
                </div>

                <div>
                  <Label>Assunto</Label>
                  <Select
                    value={novaConversaForm.assunto}
                    onValueChange={(val) => setNovaConversaForm({...novaConversaForm, assunto: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="lote">Lote</SelectItem>
                      <SelectItem value="comissao">Comissão</SelectItem>
                      <SelectItem value="documentacao">Documentação</SelectItem>
                      <SelectItem value="duvida">Dúvida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={novaConversaForm.mensagem}
                    onChange={(e) => setNovaConversaForm({...novaConversaForm, mensagem: e.target.value})}
                    placeholder="Escreva sua mensagem..."
                    rows={5}
                    required
                  />
                </div>
              </CardContent>
              <div className="p-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNovaConversa(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]">
                  Enviar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </LayoutImobiliaria>
  );
}