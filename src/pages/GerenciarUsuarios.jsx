import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserCog, Search, Plus, Shield, User, Mail, Calendar,
  Edit, Trash2, Key, CheckCircle2, XCircle, AlertCircle, Store, Users as UsersIcon
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
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    tipo_usuario: "sistema",
    grupo_usuario_id: "",
    cliente_id: "",
    imobiliaria_id: "",
    socio_id: "",
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

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  // Added query for user groups
  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_permissoes'],
    queryFn: () => base44.entities.GrupoUsuario.filter({ ativo: true }),
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
      tipo_usuario: "sistema",
      grupo_usuario_id: "",
      cliente_id: "",
      imobiliaria_id: "",
      socio_id: "",
    });
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      full_name: usuario.full_name || "",
      email: usuario.email || "",
      role: usuario.role || "user",
      tipo_usuario: usuario.tipo_usuario || "sistema",
      grupo_usuario_id: usuario.grupo_usuario_id || "",
      cliente_id: usuario.cliente_id || "",
      imobiliaria_id: usuario.imobiliaria_id || "",
      socio_id: usuario.socio_id || "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.full_name || !formData.email) {
      setMensagem({ tipo: "error", texto: "Preencha todos os campos obrigatórios" });
      return;
    }

    if (formData.tipo_usuario === 'cliente' && !formData.cliente_id) {
      setMensagem({ tipo: "error", texto: "Selecione um cliente para vincular" });
      return;
    }

    if (formData.tipo_usuario === 'imobiliaria' && !formData.imobiliaria_id) {
      setMensagem({ tipo: "error", texto: "Selecione uma imobiliária para vincular" });
      return;
    }

    if (formData.tipo_usuario === 'socio' && !formData.socio_id) {
      setMensagem({ tipo: "error", texto: "Selecione um sócio para vincular" });
      return;
    }

    // New validation for grupo_usuario_id
    if (formData.tipo_usuario === 'sistema' && formData.role !== 'admin' && !formData.grupo_usuario_id) {
      setMensagem({ tipo: "error", texto: "Selecione um grupo de permissões para usuários do sistema" });
      return;
    }

    const dataToSave = { ...formData };
    
    // Limpar campos não utilizados
    if (formData.tipo_usuario === 'sistema') {
      dataToSave.cliente_id = null;
      dataToSave.imobiliaria_id = null;
      // Admin não precisa de grupo
      if (formData.role === 'admin') {
        dataToSave.grupo_usuario_id = null;
      }
    } else if (formData.tipo_usuario === 'cliente') {
      dataToSave.imobiliaria_id = null;
      dataToSave.grupo_usuario_id = null; // Clear grupo_usuario_id
    } else if (formData.tipo_usuario === 'imobiliaria') {
      dataToSave.cliente_id = null;
      dataToSave.grupo_usuario_id = null;
      dataToSave.socio_id = null;
    } else if (formData.tipo_usuario === 'socio') {
      dataToSave.cliente_id = null;
      dataToSave.imobiliaria_id = null;
      dataToSave.grupo_usuario_id = null;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        userId: editingUser.id,
        data: dataToSave
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
    const matchTipo = filtroTipo === "todos" || u.tipo_usuario === filtroTipo;
    return matchBusca && matchTipo;
  });

  const totalSistema = usuarios.filter(u => u.tipo_usuario === 'sistema' || !u.tipo_usuario).length;
  const totalClientes = usuarios.filter(u => u.tipo_usuario === 'cliente').length;
  const totalImobiliarias = usuarios.filter(u => u.tipo_usuario === 'imobiliaria').length;
  const totalSocios = usuarios.filter(u => u.tipo_usuario === 'socio').length;

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'sistema':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Sistema</Badge>;
      case 'cliente':
        return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" />Cliente</Badge>;
      case 'imobiliaria':
        return <Badge className="bg-green-100 text-green-800"><Store className="w-3 h-3 mr-1" />Imobiliária</Badge>;
      case 'socio':
        return <Badge className="bg-orange-100 text-orange-800"><UsersIcon className="w-3 h-3 mr-1" />Sócio</Badge>;
      default:
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Sistema</Badge>;
    }
  };

  const getSocioNome = (socioId) => {
    const socio = socios.find(s => s.id === socioId);
    return socio?.nome || 'N/A';
  };

  const getClienteNome = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || 'N/A';
  };

  const getImobiliariaNome = (imobiliariaId) => {
    const imobiliaria = imobiliarias.find(i => i.id === imobiliariaId);
    return imobiliaria?.nome || 'N/A';
  };

  // Added helper function for group name
  const getGrupoNome = (grupoId) => {
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo?.nome || 'N/A';
  };

  if (currentUser?.role !== 'admin' && currentUser?.tipo_usuario !== 'sistema') {
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
          <p className="text-gray-600 mt-1">Controle completo de usuários e permissões por tipo de acesso</p>
        </div>
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
        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Usuários Sistema</p>
                <p className="text-3xl font-bold text-purple-900">{totalSistema}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clientes</p>
                <p className="text-3xl font-bold text-blue-900">{totalClientes}</p>
              </div>
              <User className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Imobiliárias</p>
                <p className="text-3xl font-bold text-green-900">{totalImobiliarias}</p>
              </div>
              <Store className="w-12 h-12 text-green-500 opacity-50" />
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
            <Tabs value={filtroTipo} onValueChange={setFiltroTipo}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="sistema">Sistema</TabsTrigger>
                <TabsTrigger value="cliente">Clientes</TabsTrigger>
                <TabsTrigger value="imobiliaria">Imobiliárias</TabsTrigger>
                <TabsTrigger value="socio">Sócios</TabsTrigger>
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-900">{usuario.full_name}</h3>
                        {getTipoBadge(usuario.tipo_usuario)}
                        {usuario.role === 'admin' && (
                          <Badge className="bg-orange-100 text-orange-800">Admin</Badge>
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
                        {/* Display group name for system users */}
                        {usuario.tipo_usuario === 'sistema' && usuario.grupo_usuario_id && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Grupo: {getGrupoNome(usuario.grupo_usuario_id)}</span>
                          </div>
                        )}
                        {usuario.tipo_usuario === 'cliente' && usuario.cliente_id && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Cliente: {getClienteNome(usuario.cliente_id)}</span>
                          </div>
                        )}
                        {usuario.tipo_usuario === 'imobiliaria' && usuario.imobiliaria_id && (
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            <span>Imobiliária: {getImobiliariaNome(usuario.imobiliaria_id)}</span>
                          </div>
                        )}
                        {usuario.tipo_usuario === 'socio' && usuario.socio_id && (
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4" />
                            <span>Sócio: {getSocioNome(usuario.socio_id)}</span>
                          </div>
                        )}
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
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações e permissões do usuário
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
              <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
              <Select value={formData.tipo_usuario} onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value, grupo_usuario_id: "", cliente_id: "", imobiliaria_id: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sistema">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Sistema - Acesso completo ao sistema
                    </div>
                  </SelectItem>
                  <SelectItem value="cliente">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente - Portal do Cliente
                    </div>
                  </SelectItem>
                  <SelectItem value="imobiliaria">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Imobiliária - Portal da Imobiliária
                    </div>
                  </SelectItem>
                  <SelectItem value="socio">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      Sócio - Portal do Sócio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo_usuario === 'sistema' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, grupo_usuario_id: value === 'admin' ? '' : formData.grupo_usuario_id })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário - Acesso via grupo</SelectItem>
                      <SelectItem value="admin">Administrador - Acesso total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role !== 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="grupo_usuario_id">Grupo de Permissões *</Label>
                    <Select value={formData.grupo_usuario_id} onValueChange={(value) => setFormData({ ...formData, grupo_usuario_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {grupos.map(grupo => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      O grupo define quais módulos o usuário poderá acessar
                    </p>
                  </div>
                )}
              </>
            )}

            {formData.tipo_usuario === 'cliente' && (
              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente Vinculado *</Label>
                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
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
            )}

            {formData.tipo_usuario === 'imobiliaria' && (
              <div className="space-y-2">
                <Label htmlFor="imobiliaria_id">Imobiliária Vinculada *</Label>
                <Select value={formData.imobiliaria_id} onValueChange={(value) => setFormData({ ...formData, imobiliaria_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a imobiliária" />
                  </SelectTrigger>
                  <SelectContent>
                    {imobiliarias.map(imobiliaria => (
                      <SelectItem key={imobiliaria.id} value={imobiliaria.id}>
                        {imobiliaria.nome} - {imobiliaria.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.tipo_usuario === 'socio' && (
              <div className="space-y-2">
                <Label htmlFor="socio_id">Sócio Vinculado *</Label>
                <Select value={formData.socio_id} onValueChange={(value) => setFormData({ ...formData, socio_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sócio" />
                  </SelectTrigger>
                  <SelectContent>
                    {socios.map(socio => (
                      <SelectItem key={socio.id} value={socio.id}>
                        {socio.nome} - {socio.cpf_cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Tipos de Usuário:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Sistema:</strong> Acesso administrativo com permissões por grupo</li>
                  <li>• <strong>Cliente:</strong> Acesso apenas ao Portal do Cliente (seus dados)</li>
                  <li>• <strong>Imobiliária:</strong> Acesso apenas ao Portal da Imobiliária</li>
                  <li>• <strong>Sócio:</strong> Acesso apenas ao Portal do Sócio (visualização)</li>
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