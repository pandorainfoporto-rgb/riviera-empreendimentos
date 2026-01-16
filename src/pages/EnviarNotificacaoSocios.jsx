import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Send, Users, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EnviarNotificacaoSocios() {
  const [notificacao, setNotificacao] = useState({
    tipo: "anuncio",
    titulo: "",
    mensagem: "",
    link_acao: "",
    texto_link: "",
    para_todos: true,
    socios_selecionados: [],
  });

  const queryClient = useQueryClient();

  const { data: socios = [] } = useQuery({
    queryKey: ['socios_lista'],
    queryFn: () => base44.entities.Socio.list('nome'),
  });

  const enviarNotificacaoMutation = useMutation({
    mutationFn: async (dados) => {
      const sociosParaEnviar = dados.para_todos 
        ? socios.map(s => s.id) 
        : dados.socios_selecionados;

      const promises = sociosParaEnviar.map(socioId => 
        base44.entities.NotificacaoSocio.create({
          socio_id: socioId,
          tipo: dados.tipo,
          titulo: dados.titulo,
          mensagem: dados.mensagem,
          lida: false,
          data_envio: new Date().toISOString(),
          link_acao: dados.link_acao || null,
          texto_link: dados.texto_link || null,
        })
      );

      await Promise.all(promises);
      return sociosParaEnviar.length;
    },
    onSuccess: (qtd) => {
      queryClient.invalidateQueries(['notificacoes_socios']);
      toast.success(`Notificação enviada para ${qtd} sócio(s)!`);
      setNotificacao({
        tipo: "anuncio",
        titulo: "",
        mensagem: "",
        link_acao: "",
        texto_link: "",
        para_todos: true,
        socios_selecionados: [],
      });
    },
    onError: () => toast.error("Erro ao enviar notificação"),
  });

  const handleToggleSocio = (socioId) => {
    setNotificacao(prev => ({
      ...prev,
      socios_selecionados: prev.socios_selecionados.includes(socioId)
        ? prev.socios_selecionados.filter(id => id !== socioId)
        : [...prev.socios_selecionados, socioId]
    }));
  };

  const handleEnviar = () => {
    if (!notificacao.titulo || !notificacao.mensagem) {
      toast.error("Preencha título e mensagem");
      return;
    }

    if (!notificacao.para_todos && notificacao.socios_selecionados.length === 0) {
      toast.error("Selecione ao menos um sócio");
      return;
    }

    enviarNotificacaoMutation.mutate(notificacao);
  };

  const tiposNotificacao = {
    anuncio: "Anúncio Geral",
    documento: "Novo Documento",
    evento: "Evento/Assembleia",
    financeiro: "Informação Financeira",
    urgente: "Urgente",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-600" />
            Enviar Notificação aos Sócios
          </h1>
          <p className="text-gray-600 mt-1">
            Envie notificações sobre documentos, anúncios ou eventos importantes
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Notificação *</Label>
                <Select 
                  value={notificacao.tipo} 
                  onValueChange={(v) => setNotificacao({...notificacao, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tiposNotificacao).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: Novo Contrato Social Disponível"
                  value={notificacao.titulo}
                  onChange={(e) => setNotificacao({...notificacao, titulo: e.target.value})}
                />
              </div>

              <div>
                <Label>Mensagem *</Label>
                <Textarea
                  placeholder="Digite a mensagem da notificação..."
                  value={notificacao.mensagem}
                  onChange={(e) => setNotificacao({...notificacao, mensagem: e.target.value})}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link de Ação (Opcional)</Label>
                  <Input
                    placeholder="Ex: PortalSocioDocumentos"
                    value={notificacao.link_acao}
                    onChange={(e) => setNotificacao({...notificacao, link_acao: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Texto do Botão (Opcional)</Label>
                  <Input
                    placeholder="Ex: Ver Documento"
                    value={notificacao.texto_link}
                    onChange={(e) => setNotificacao({...notificacao, texto_link: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destinatários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Checkbox
                  checked={notificacao.para_todos}
                  onCheckedChange={(v) => setNotificacao({
                    ...notificacao, 
                    para_todos: v,
                    socios_selecionados: v ? [] : notificacao.socios_selecionados
                  })}
                />
                <Label className="cursor-pointer">
                  <Users className="w-4 h-4 inline mr-2" />
                  Enviar para todos os sócios
                </Label>
              </div>

              {!notificacao.para_todos && (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                  <p className="text-sm font-semibold mb-3">Selecione os sócios:</p>
                  {socios.map(socio => (
                    <div key={socio.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={notificacao.socios_selecionados.includes(socio.id)}
                        onCheckedChange={() => handleToggleSocio(socio.id)}
                      />
                      <Label className="cursor-pointer flex-1">
                        {socio.nome}
                        <span className="text-xs text-gray-500 ml-2">{socio.email}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleEnviar}
              disabled={enviarNotificacaoMutation.isPending}
            >
              {enviarNotificacaoMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Enviar Notificação
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}