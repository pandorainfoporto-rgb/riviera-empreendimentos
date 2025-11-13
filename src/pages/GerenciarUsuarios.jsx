import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserCog, Search, Plus, Shield, User, Mail, Calendar,
  Edit, Trash2, Key, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciarUsuarios() {
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState("todos");
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
  });
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date');
      return users;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      await base44.entities.User.update(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setMensagem({ tipo: "success", texto: "Usuário atualizado com sucesso!" });
      setTimeout(() => setMensagem({ tipo: "", texto: "" }), 3000);
      setShowDialog(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (error) => {
      setMensagem({ tipo: "error", texto: `Erro: ${error.message}` });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setMensagem({ tipo: "success", texto: "Usuário removido com sucesso!" });
      setTimeout(() => setMensagem({ tipo: "", texto: "" }), 3000);
    },
    onError: (error) => {
      setMensagem({ tipo: "error", texto: `Erro ao remover: ${error.message}` });
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "user",
    });
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      full_name: usuario.full_name || "",
      email: usuario.email || "",
      role: usuario.role || "user",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.full_name || !formData.email) {
      setMensagem({ tipo: "error", texto: "Preencha todos os campos obrigatórios" });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser.id,
        data: formData
      });
    }
  };

  const handleDelete = (usuario) => {
    if (usuario.id === currentUser?.id) {
      setMensagem({ tipo: "error", texto: "Você não pode remover sua própria conta" });
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o usuário ${usuario.full_name}?`)) {
      deleteUserMutation.mutate(usuario.id);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = !busca || 
      u.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase());
    const matchRole = filtroRole === "todos" || u.role === filtroRole;
    return matchBusca && matchRole;
  });

  const totalAdmins = usuarios.filter(u => u.role === 'admin').length;
  const totalUsers = usuarios.filter(u => u.role === 'user').length;
  const totalAtivos = usuarios.length;

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Alert className="max-w-md">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-3">
            <UserCog className="w-8 h-8" />
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600 mt-1">Controle completo de usuários e permissões</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowDialog(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          disabled
        >
          <Plus className="w-4 h-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {mensagem.texto && (
        <Alert className={mensagem.tipo === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          {mensagem.tipo === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription className={mensagem.tipo === "success" ? "text-green-800" : "text-red-800"}>
            {mensagem.texto}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold text-blue-900">{totalAtivos}</p>
              </div>
              <User className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Administradores</p>
                <p className="text-3xl font-bold text-purple-900">{totalAdmins}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usuários Padrão</p>
                <p className="text-3xl font-bold text-green-900">{totalUsers}</p>
              </div>
              <User className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filtroRole} onValueChange={setFiltroRole}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="admin">Admins</TabsTrigger>
                <TabsTrigger value="user">Usuários</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Carregando usuários...</p>
            </CardContent>
          </Card>
        ) : usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white flex items-center justify-center font-bold text-lg">
                      {usuario.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{usuario.full_name}</h3>
                        {usuario.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Administrador
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <User className="w-3 h-3 mr-1" />
                            Usuário
                          </Badge>
                        )}
                        {usuario.id === currentUser?.id && (
                          <Badge className="bg-green-100 text-green-800">Você</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{usuario.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Cadastrado em {format(new Date(usuario.created_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {usuario.id !== currentUser?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(usuario)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Convidar Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Atualize as informações do usuário abaixo'
                : 'Preencha os dados para convidar um novo usuário ao sistema'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={!!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-gray-500">O email não pode ser alterado</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Usuário - Acesso padrão ao sistema
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrador - Acesso total
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Permissões:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Usuário:</strong> Acesso aos módulos operacionais</li>
                  <li>• <strong>Administrador:</strong> Acesso total + gerenciamento de usuários</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}