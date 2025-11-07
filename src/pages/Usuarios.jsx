
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Users, Edit, Trash2, Search, Shield, UserX, UserCheck, Plus } from "lucide-react";
import { AuditoriaHelper } from "../components/auditoria/RegistrarLog";
import ConvidarUsuarioDialog from "../components/usuarios/ConvidarUsuarioDialog";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConvidarDialog, setShowConvidarDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios_sistema'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date');
      return users || [];
    },
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_permissoes'],
    queryFn: async () => {
      const result = await base44.entities.GrupoUsuario.list();
      return result || [];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Buscar dados anteriores para auditoria
      const usuarioAtual = usuarios.find(u => u.id === id);
      const resultado = await base44.entities.User.update(id, data);
      
      // Registrar log de auditoria
      await AuditoriaHelper.atualizar(
        'User',
        id,
        usuarioAtual,
        data,
        {
          origem: 'Gerenciamento de Usuários',
          campos_sensiveis: ['tipo_acesso', 'grupo_id', 'ativo']
        }
      );
      
      return resultado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_sistema'] });
      setShowEditDialog(false);
      setEditingUser(null);
    },
  });

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      tipo_acesso: user.tipo_acesso || 'usuario',
      grupo_id: user.grupo_id || '',
      ativo: user.ativo !== false,
      cargo: user.cargo || '',
      telefone: user.telefone || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    const { id, ...userData } = editingUser;
    updateUserMutation.mutate({ id, data: userData });
  };

  const filteredUsers = usuarios.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.cargo?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTipoAcessoLabel = (tipo) => {
    const labels = {
      admin: 'Administrador',
      usuario: 'Usuário',
      cliente: 'Cliente',
      imobiliaria: 'Imobiliária',
    };
    return labels[tipo] || tipo;
  };

  const getTipoAcessoColor = (tipo) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 border-red-300',
      usuario: 'bg-blue-100 text-blue-700 border-blue-300',
      cliente: 'bg-green-100 text-green-700 border-green-300',
      imobiliaria: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Usuários do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie os níveis de acesso dos usuários</p>
        </div>
        <Button
          onClick={() => setShowConvidarDialog(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo de Acesso</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">Nenhum usuário encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              {user.telefone && (
                                <p className="text-xs text-gray-500">{user.telefone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getTipoAcessoColor(user.tipo_acesso)}>
                            {getTipoAcessoLabel(user.tipo_acesso)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.cargo || '-'}</TableCell>
                        <TableCell>
                          {user.ativo !== false ? (
                            <Badge className="bg-green-100 text-green-700">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              <UserX className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Nível de Acesso</DialogTitle>
            <DialogDescription>
              Configure o tipo de acesso e permissões do usuário
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white text-xl">
                    {getInitials(editingUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{editingUser.full_name}</p>
                  <p className="text-sm text-gray-600">{editingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_acesso">Tipo de Acesso *</Label>
                  <Select
                    value={editingUser.tipo_acesso}
                    onValueChange={(value) => setEditingUser({ ...editingUser, tipo_acesso: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="usuario">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Usuário</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cliente">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span>Cliente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="imobiliaria">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>Imobiliária</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grupo_id">Grupo de Permissões</Label>
                  <Select
                    value={editingUser.grupo_id}
                    onValueChange={(value) => setEditingUser({ ...editingUser, grupo_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={editingUser.cargo}
                    onChange={(e) => setEditingUser({ ...editingUser, cargo: e.target.value })}
                    placeholder="Ex: Gerente, Vendedor..."
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={editingUser.telefone}
                    onChange={(e) => setEditingUser({ ...editingUser, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={editingUser.ativo ? "true" : "false"}
                  onValueChange={(value) => setEditingUser({ ...editingUser, ativo: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="true">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        <span>Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-red-600" />
                        <span>Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Sobre os tipos de acesso:</strong>
                </p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                  <li><strong>Administrador:</strong> Acesso total ao sistema</li>
                  <li><strong>Usuário:</strong> Acesso operacional conforme grupo de permissões</li>
                  <li><strong>Cliente:</strong> Acesso ao Portal do Cliente</li>
                  <li><strong>Imobiliária:</strong> Acesso ao Portal da Imobiliária</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Convidar Usuário */}
      {showConvidarDialog && (
        <ConvidarUsuarioDialog
          open={showConvidarDialog}
          onClose={() => setShowConvidarDialog(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['usuarios_sistema'] });
            setShowConvidarDialog(false);
          }}
        />
      )}
    </div>
  );
}
