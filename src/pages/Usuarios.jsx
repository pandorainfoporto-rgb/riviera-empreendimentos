import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserPlus, Search, Mail, Shield, User, Trash2, Edit, MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ConvidarUsuarioDialog from "../components/usuarios/ConvidarUsuarioDialog";

const tipoAcessoColors = {
  admin: "bg-red-100 text-red-700",
  usuario: "bg-blue-100 text-blue-700",
  cliente: "bg-green-100 text-green-700",
  imobiliaria: "bg-purple-100 text-purple-700"
};

const tipoAcessoLabels = {
  admin: "Administrador",
  usuario: "Usuário",
  cliente: "Cliente",
  imobiliaria: "Imobiliária"
};

export default function UsuariosPage() {
  const [busca, setBusca] = useState("");
  const [showConviteDialog, setShowConviteDialog] = useState(false);
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState(null);
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const deletarMutation = useMutation({
    mutationFn: async (usuario) => {
      // Deletar do auth do Base44
      await base44.asServiceRole.client.auth.admin.deleteUser(usuario.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      setUsuarioParaDeletar(null);
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }) => {
      return base44.entities.User.update(id, { ativo: !ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
    },
  });

  const usuariosFiltrados = usuarios.filter(u =>
    u.full_name?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.cargo?.toLowerCase().includes(busca.toLowerCase())
  );

  const getClienteNome = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente?.nome || "N/A";
  };

  const getImobiliariaNome = (imobiliariaId) => {
    const imobiliaria = imobiliarias.find(i => i.id === imobiliariaId);
    return imobiliaria?.nome || "N/A";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Usuários do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os usuários e permissões</p>
        </div>
        <Button
          onClick={() => setShowConviteDialog(true)}
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar usuários..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total de Usuários</p>
            <p className="text-2xl font-bold">{usuarios.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Administradores</p>
            <p className="text-2xl font-bold text-red-600">
              {usuarios.filter(u => u.tipo_acesso === 'admin' || u.role === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Usuários</p>
            <p className="text-2xl font-bold text-blue-600">
              {usuarios.filter(u => u.tipo_acesso === 'usuario').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {usuarios.filter(u => u.ativo !== false).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </h3>
            <p className="text-gray-600">
              {busca ? 'Tente ajustar sua busca' : 'Convide o primeiro usuário para a plataforma'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuariosFiltrados.map((usuario) => (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                        {getInitials(usuario.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{usuario.full_name}</CardTitle>
                      <p className="text-xs text-gray-600">{usuario.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleAtivoMutation.mutate({ id: usuario.id, ativo: usuario.ativo })}
                      >
                        {usuario.ativo !== false ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setUsuarioParaDeletar(usuario)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <Badge className={tipoAcessoColors[usuario.tipo_acesso || (usuario.role === 'admin' ? 'admin' : 'usuario')]}>
                      {tipoAcessoLabels[usuario.tipo_acesso || (usuario.role === 'admin' ? 'admin' : 'usuario')]}
                    </Badge>
                  </div>

                  {usuario.cargo && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cargo:</span>
                      <span className="text-sm font-medium">{usuario.cargo}</span>
                    </div>
                  )}

                  {usuario.tipo_acesso === 'cliente' && usuario.cliente_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cliente:</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {getClienteNome(usuario.cliente_id)}
                      </span>
                    </div>
                  )}

                  {usuario.tipo_acesso === 'imobiliaria' && usuario.imobiliaria_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Imobiliária:</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {getImobiliariaNome(usuario.imobiliaria_id)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant={usuario.ativo !== false ? "default" : "secondary"}>
                      {usuario.ativo !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showConviteDialog && (
        <ConvidarUsuarioDialog
          open={showConviteDialog}
          onClose={() => setShowConviteDialog(false)}
        />
      )}

      <AlertDialog open={!!usuarioParaDeletar} onOpenChange={() => setUsuarioParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{usuarioParaDeletar?.full_name}"?
              Esta ação não pode ser desfeita e o usuário perderá todo acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletarMutation.mutate(usuarioParaDeletar)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}