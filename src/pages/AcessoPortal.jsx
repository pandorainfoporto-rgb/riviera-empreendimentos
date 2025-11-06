
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, CheckCircle2, XCircle, Send, Trash2, Edit, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AcessoPortal() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [linkCopiado, setLinkCopiado] = useState(null);
  const [formData, setFormData] = useState({
    cliente_id: "",
    email: "",
  });

  const queryClient = useQueryClient();

  const { data: acessos = [] } = useQuery({
    queryKey: ['acessos_portal'], // Changed queryKey from 'user_clients' to 'acessos_portal' for consistency
    queryFn: () => base44.entities.UserClient.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🚀 CRIANDO ACESSO:', data);
      
      // Verificar se email já existe em UserClient
      const emailExistenteUserClient = acessos.find(a => a.email.toLowerCase() === data.email.toLowerCase());
      if (emailExistenteUserClient) {
        throw new Error('Este email já está cadastrado no Portal do Cliente');
      }

      // Verificar se email já existe em UsuarioSistema
      const usuariosSistema = await base44.entities.UsuarioSistema.filter({ email: data.email.toLowerCase() });
      if (usuariosSistema && usuariosSistema.length > 0) {
        throw new Error('Este email já está cadastrado como Usuário do Sistema');
      }
      
      const novoAcesso = await base44.entities.UserClient.create(data);
      console.log('✅ ACESSO CRIADO:', novoAcesso);
      
      if (!novoAcesso || !novoAcesso.id) {
        throw new Error('Erro ao criar acesso - ID não retornado');
      }
      
      // Enviar email de boas-vindas automaticamente
      try {
        console.log('📧 CHAMANDO FUNÇÃO enviarBoasVindasPortal, user_client_id:', novoAcesso.id);
        await base44.functions.invoke('enviarBoasVindasPortal', {
          user_client_id: novoAcesso.id
        });
        toast.success('Acesso criado e e-mail de boas-vindas enviado!');
        console.log('✅ EMAIL ENVIADO PARA:', novoAcesso.email);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de boas-vindas:', emailError);
        toast.warning('Acesso criado, mas houve erro ao enviar o e-mail de boas-vindas');
      }
      
      return novoAcesso;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos_portal'] }); // Changed queryKey for invalidation
      setShowForm(false);
      setEditingItem(null);
      setFormData({ cliente_id: "", email: "" }); // Retained for functionality to clear form
    },
    onError: (error) => {
      console.error('❌ ERRO:', error);
      toast.error('❌ ' + (error.message || 'Erro desconhecido'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos_portal'] }); // Changed queryKey for invalidation
      setShowForm(false);
      setEditingItem(null);
      setFormData({ cliente_id: "", email: "" });
      toast.success('Acesso atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos_portal'] }); // Changed queryKey for invalidation
      toast.success('Acesso removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (cliente) {
      setFormData({
        cliente_id: clienteId,
        email: cliente.email || "",
      });
      
      if (!cliente.email) {
        toast.warning('⚠️ Este cliente não possui email cadastrado');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 SUBMIT DO FORMULÁRIO:', formData);
    
    if (!formData.cliente_id) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (!formData.email) {
      toast.error('Email é obrigatório');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    // Verificar se já existe acesso para este cliente (apenas se não estiver editando)
    if (!editingItem) {
      const acessoExistente = acessos.find(a => a.cliente_id === formData.cliente_id);
      if (acessoExistente) {
        toast.error('⚠️ Já existe um acesso para este cliente');
        return;
      }
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      console.log('🎯 CHAMANDO createMutation.mutate');
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      cliente_id: item.cliente_id,
      email: item.email,
    });
    setShowForm(true);
  };

  const copiarLinkPrimeiroAcesso = (acesso) => {
    const cliente = clientes.find(c => c.id === acesso.cliente_id);
    const appOrigin = window.location.origin;
    const portalUrl = `${appOrigin}/#/PortalClienteLogin`;
    
    const mensagem = `Olá ${cliente?.nome || 'Cliente'}!

Seu acesso ao Portal do Cliente da Riviera Incorporadora foi criado! 🎉

📧 *Login:* ${acesso.email}
🔐 *Senha:* Você criará no primeiro acesso

🌐 *Link do Portal:*
${portalUrl}

No primeiro acesso, você será solicitado a criar uma senha segura.

Qualquer dúvida, estamos à disposição!

*Riviera Incorporadora*`;

    navigator.clipboard.writeText(mensagem).then(() => {
      setLinkCopiado(acesso.id);
      toast.success('✅ Mensagem copiada! Cole no WhatsApp do cliente.');
      
      setTimeout(() => {
        setLinkCopiado(null);
      }, 3000);
    }).catch(() => {
      toast.error('Erro ao copiar');
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Acesso Portal do Cliente</h1>
          <p className="text-gray-600 mt-1">Gerencie os acessos ao portal</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setFormData({ cliente_id: "", email: "" });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <User className="w-4 h-4 mr-2" />
          Novo Acesso
        </Button>
      </div>

      {/* Lista de Acessos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {acessos.map((acesso) => {
          const cliente = clientes.find(c => c.id === acesso.cliente_id);
          
          return (
            <Card key={acesso.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{cliente?.nome || 'Cliente não encontrado'}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{acesso.email}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {acesso.senha_definida ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" title="Senha definida" />
                    ) : (
                      <XCircle className="w-5 h-5 text-orange-600" title="Aguardando primeiro acesso" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {acesso.ativo ? (
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                  {acesso.primeiro_acesso && (
                    <Badge className="bg-yellow-100 text-yellow-800">Primeiro Acesso</Badge>
                  )}
                </div>
                
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => copiarLinkPrimeiroAcesso(acesso)}
                    size="sm"
                    variant="outline"
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    {linkCopiado === acesso.id ? (
                      <>
                        <Check className="w-3 h-3 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-2" />
                        Copiar Link Primeiro Acesso
                      </>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(acesso)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Remover acesso?')) {
                          deleteMutation.mutate(acesso.id);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog Formulário */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Acesso' : 'Novo Acesso ao Portal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={handleClienteChange}
                  required
                  disabled={!!editingItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.cpf_cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Email (Login) *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.cliente_id && !formData.email && "⚠️ Cliente sem email cadastrado"}
                </p>
              </div>

              {!editingItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <Send className="w-4 h-4 inline mr-1" />
                    <strong>Ao criar:</strong> Email automático será enviado (se SMTP estiver configurado).
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 Você pode copiar o link manualmente para enviar via WhatsApp.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingItem ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingItem ? 'Atualizar' : 'Criar Acesso'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
