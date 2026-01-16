import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, Plus, Edit, Trash2, MessageSquare, DollarSign, 
  FileText, Receipt, Mail, Hash, Search, Filter
} from "lucide-react";
import { toast } from "sonner";

export default function RespostasRapidasChat() {
  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const queryClient = useQueryClient();

  const { data: respostas = [] } = useQuery({
    queryKey: ['respostas_rapidas_chat'],
    queryFn: () => base44.entities.RespostaRapidaChat.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RespostaRapidaChat.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_chat']);
      setShowDialog(false);
      toast.success("Resposta rápida criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RespostaRapidaChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_chat']);
      setShowDialog(false);
      setEditando(null);
      toast.success("Resposta rápida atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RespostaRapidaChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_chat']);
      toast.success("Resposta rápida removida!");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      atalho: formData.get('atalho').trim().toLowerCase().replace(/\s+/g, '-'),
      titulo: formData.get('titulo'),
      mensagem: formData.get('mensagem'),
      tipo_funcao: formData.get('tipo_funcao'),
      categoria: formData.get('categoria'),
      ativo: true,
      uso_contador: editando?.uso_contador || 0,
    };

    if (editando) {
      updateMutation.mutate({ id: editando.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getIconByFuncao = (tipo) => {
    const icons = {
      mensagem_simples: MessageSquare,
      enviar_boleto: Receipt,
      enviar_pix: DollarSign,
      enviar_nota: FileText,
      enviar_contrato: FileText,
      enviar_email_atendimento: Mail,
      enviar_protocolo: Hash,
    };
    return icons[tipo] || MessageSquare;
  };

  const respostasFiltradas = respostas.filter(r => {
    const matchBusca = r.atalho.toLowerCase().includes(busca.toLowerCase()) ||
                       r.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === 'todos' || r.categoria === filtroCategoria;
    return matchBusca && matchCategoria;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            Respostas Rápidas - Chat Omnichannel
          </h1>
          <p className="text-gray-600 mt-1">
            Use "/" no chat para acessar respostas rápidas e funções especiais
          </p>
        </div>
        <Button onClick={() => {
          setEditando(null);
          setShowDialog(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Resposta
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Digite o atalho ou título..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="saudacao">Saudação</SelectItem>
                  <SelectItem value="informacao">Informação</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="finalizacao">Finalização</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Respostas */}
      <div className="grid gap-4">
        {respostasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma resposta rápida encontrada</p>
              <Button onClick={() => setShowDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Resposta
              </Button>
            </CardContent>
          </Card>
        ) : (
          respostasFiltradas.map((resposta) => {
            const Icon = getIconByFuncao(resposta.tipo_funcao);
            return (
              <Card key={resposta.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-blue-600 text-white font-mono">
                          /{resposta.atalho}
                        </Badge>
                        {resposta.titulo}
                        <Badge variant="outline">{resposta.categoria}</Badge>
                        {resposta.tipo_funcao !== 'mensagem_simples' && (
                          <Badge className="bg-purple-600">
                            <Icon className="w-3 h-3 mr-1" />
                            {resposta.tipo_funcao.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditando(resposta);
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Remover esta resposta rápida?')) {
                            deleteMutation.mutate(resposta.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{resposta.mensagem}</p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-gray-500">
                      Usado {resposta.uso_contador || 0} vezes
                    </span>
                    {resposta.ativo ? (
                      <Badge className="bg-green-600">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Atalho *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">/</span>
                  <Input
                    name="atalho"
                    defaultValue={editando?.atalho}
                    placeholder="Ex: boas-vindas"
                    className="pl-7"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use apenas letras, números e hífen
                </p>
              </div>

              <div>
                <Label>Categoria *</Label>
                <Select name="categoria" defaultValue={editando?.categoria || "outros"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saudacao">Saudação</SelectItem>
                    <SelectItem value="informacao">Informação</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="documentacao">Documentação</SelectItem>
                    <SelectItem value="finalizacao">Finalização</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Título *</Label>
              <Input
                name="titulo"
                defaultValue={editando?.titulo}
                placeholder="Ex: Mensagem de boas-vindas"
                required
              />
            </div>

            <div>
              <Label>Tipo de Função</Label>
              <Select name="tipo_funcao" defaultValue={editando?.tipo_funcao || "mensagem_simples"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensagem_simples">
                    💬 Mensagem Simples
                  </SelectItem>
                  <SelectItem value="enviar_boleto">
                    🧾 Enviar Boleto (Segunda Via)
                  </SelectItem>
                  <SelectItem value="enviar_pix">
                    💰 Enviar Dados PIX
                  </SelectItem>
                  <SelectItem value="enviar_nota">
                    📄 Enviar Nota Fiscal
                  </SelectItem>
                  <SelectItem value="enviar_contrato">
                    📋 Enviar Contrato
                  </SelectItem>
                  <SelectItem value="enviar_email_atendimento">
                    📧 Enviar Email de Atendimento
                  </SelectItem>
                  <SelectItem value="enviar_protocolo">
                    #️⃣ Gerar e Enviar Protocolo
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Funções especiais executam ações automáticas além de enviar a mensagem
              </p>
            </div>

            <div>
              <Label>Mensagem *</Label>
              <Textarea
                name="mensagem"
                defaultValue={editando?.mensagem}
                placeholder="Digite a mensagem que será enviada ao usar este atalho..."
                rows={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Variáveis disponíveis: {'{nome}'}, {'{protocolo}'}, {'{data}'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editando ? 'Salvar Alterações' : 'Criar Resposta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Informações de Uso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Como Usar no Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p>1. No chat omnichannel, digite <strong>/</strong> para ver todas as respostas rápidas</p>
          <p>2. Digite <strong>/nome-do-atalho</strong> e pressione Enter para enviar</p>
          <p>3. Funções especiais serão executadas automaticamente (boleto, PIX, protocolo, etc)</p>
          <p>4. Todas as interações são automaticamente protocoladas para rastreamento</p>
        </CardContent>
      </Card>
    </div>
  );
}