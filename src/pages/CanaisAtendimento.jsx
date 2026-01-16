import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, MessageSquare, Instagram, Facebook, Phone, Mail, Globe,
  Settings, TrendingUp, Clock, Users, Zap, CheckCircle2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function CanaisAtendimento() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCanal, setEditingCanal] = useState(null);
  const queryClient = useQueryClient();

  const { data: canais = [] } = useQuery({
    queryKey: ['canais_atendimento'],
    queryFn: () => base44.entities.CanalAtendimento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CanalAtendimento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['canais_atendimento']);
      setShowDialog(false);
      setEditingCanal(null);
      toast.success("Canal criado com sucesso!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CanalAtendimento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['canais_atendimento']);
      setShowDialog(false);
      setEditingCanal(null);
      toast.success("Canal atualizado!");
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }) => base44.entities.CanalAtendimento.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['canais_atendimento']);
      toast.success("Status atualizado!");
    },
  });

  const getIconByType = (tipo) => {
    const icons = {
      whatsapp: Phone,
      instagram: Instagram,
      facebook: Facebook,
      site: Globe,
      email: Mail,
    };
    return icons[tipo] || MessageSquare;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      nome: formData.get('nome'),
      tipo: formData.get('tipo'),
      plataforma: formData.get('plataforma'),
      ia_habilitada: formData.get('ia_habilitada') === 'on',
      mensagem_boas_vindas: formData.get('mensagem_boas_vindas'),
      configuracao: {
        phone_number_id: formData.get('phone_number_id'),
        instagram_account_id: formData.get('instagram_account_id'),
        page_id: formData.get('page_id'),
        access_token: formData.get('access_token'),
        webhook_verify_token: formData.get('webhook_verify_token'),
      },
      ativo: true,
    };

    if (editingCanal?.id) {
      updateMutation.mutate({ id: editingCanal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            Canais de Atendimento Omnichannel
          </h1>
          <p className="text-gray-600 mt-1">Gerencie todos os seus canais de comunicação integrados</p>
        </div>
        <Button onClick={() => { setEditingCanal(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Canal
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Canais Ativos</p>
                <p className="text-2xl font-bold">{canais.filter(c => c.ativo).length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversas</p>
                <p className="text-2xl font-bold">
                  {canais.reduce((acc, c) => acc + (c.estatisticas?.total_conversas || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com IA Habilitada</p>
                <p className="text-2xl font-bold">{canais.filter(c => c.ia_habilitada).length}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">2.5min</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Canais */}
      <div className="grid gap-4">
        {canais.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum canal configurado ainda</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Configurar Primeiro Canal
              </Button>
            </CardContent>
          </Card>
        ) : (
          canais.map((canal) => {
            const Icon = getIconByType(canal.tipo);
            return (
              <Card key={canal.id} className={canal.ativo ? 'border-green-200' : 'border-gray-200'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        canal.ativo ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          canal.ativo ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {canal.nome}
                          {canal.ativo && (
                            <Badge className="bg-green-600">Ativo</Badge>
                          )}
                          {!canal.ativo && (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                          {canal.ia_habilitada && (
                            <Badge className="bg-purple-600">
                              <Zap className="w-3 h-3 mr-1" />
                              IA Habilitada
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {canal.tipo.toUpperCase()} • {canal.plataforma}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={canal.ativo}
                        onCheckedChange={(checked) => 
                          toggleAtivoMutation.mutate({ id: canal.id, ativo: checked })
                        }
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => { setEditingCanal(canal); setShowDialog(true); }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Conversas</p>
                      <p className="text-lg font-bold">{canal.estatisticas?.total_conversas || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Mensagens</p>
                      <p className="text-lg font-bold">{canal.estatisticas?.total_mensagens || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Taxa IA</p>
                      <p className="text-lg font-bold">{canal.estatisticas?.taxa_resposta_ia || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tempo Médio</p>
                      <p className="text-lg font-bold">{canal.estatisticas?.tempo_medio_resposta || 0}s</p>
                    </div>
                  </div>

                  {canal.mensagem_boas_vindas && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Mensagem de Boas-Vindas:</p>
                      <p className="text-sm text-gray-900">{canal.mensagem_boas_vindas}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog Criar/Editar Canal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCanal?.id ? 'Editar Canal' : 'Novo Canal de Atendimento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome do Canal</label>
                <Input 
                  name="nome" 
                  defaultValue={editingCanal?.nome}
                  placeholder="Ex: WhatsApp Vendas"
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select name="tipo" defaultValue={editingCanal?.tipo || "whatsapp"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Plataforma</label>
              <Select name="plataforma" defaultValue={editingCanal?.plataforma || "meta"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta (WhatsApp, Instagram, Facebook)</SelectItem>
                  <SelectItem value="interno">Interno</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Configurações da Integração Meta</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Phone Number ID (WhatsApp)</label>
                  <Input 
                    name="phone_number_id" 
                    defaultValue={editingCanal?.configuracao?.phone_number_id}
                    placeholder="ID do número no Meta Business"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Instagram Account ID</label>
                  <Input 
                    name="instagram_account_id" 
                    defaultValue={editingCanal?.configuracao?.instagram_account_id}
                    placeholder="ID da conta Instagram"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Facebook Page ID</label>
                  <Input 
                    name="page_id" 
                    defaultValue={editingCanal?.configuracao?.page_id}
                    placeholder="ID da página Facebook"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Access Token</label>
                  <Input 
                    name="access_token" 
                    type="password"
                    defaultValue={editingCanal?.configuracao?.access_token}
                    placeholder="Token de acesso permanente"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Webhook Verify Token</label>
                  <Input 
                    name="webhook_verify_token" 
                    defaultValue={editingCanal?.configuracao?.webhook_verify_token}
                    placeholder="Token para verificação do webhook"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Configurações de IA</h3>
              
              <div className="flex items-center gap-2 mb-4">
                <Switch 
                  name="ia_habilitada" 
                  id="ia_habilitada"
                  defaultChecked={editingCanal?.ia_habilitada !== false}
                />
                <label htmlFor="ia_habilitada" className="text-sm font-medium">
                  Habilitar atendimento automático por IA
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Mensagem de Boas-Vindas</label>
                <Textarea 
                  name="mensagem_boas_vindas" 
                  defaultValue={editingCanal?.mensagem_boas_vindas}
                  placeholder="Olá! Bem-vindo à Riviera Incorporadora..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCanal?.id ? 'Salvar Alterações' : 'Criar Canal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}