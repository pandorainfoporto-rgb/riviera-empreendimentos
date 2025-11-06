
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, User, Building, Edit, Mail, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";

import ConvidarUsuarioDialog from "../components/usuarios/ConvidarUsuarioDialog";

export default function Usuarios() {
  const [showForm, setShowForm] = useState(false);
  const [showConviteDialog, setShowConviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    nome_completo: '',
    tipo_acesso: 'usuario',
    grupo_id: '',
    imobiliaria_id: '',
    telefone: '',
    cargo: '',
    ativo: true,
  });

  const queryClient = useQueryClient();

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios_sistema'],
    queryFn: () => base44.entities.UsuarioSistema.list('-created_date'),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const handleOpenForm = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      nome_completo: usuario.nome_completo,
      tipo_acesso: usuario.tipo_acesso || 'usuario',
      grupo_id: usuario.grupo_id || '',
      imobiliaria_id: usuario.imobiliaria_id || '',
      telefone: usuario.telefone || '',
      cargo: usuario.cargo || '',
      ativo: usuario.ativo !== undefined ? usuario.ativo : true,
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const updateData = {
        nome_completo: data.nome_completo,
        tipo_acesso: data.tipo_acesso,
        telefone: data.telefone || null,
        cargo: data.cargo || null,
        ativo: data.ativo,
      };
      
      updateData.grupo_id = data.grupo_id || null;
      updateData.imobiliaria_id = data.imobiliaria_id || null;
      
      return await base44.entities.UsuarioSistema.update(editingUser.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_sistema'] });
      setShowForm(false);
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.tipo_acesso === 'imobiliaria' && !formData.imobiliaria_id) {
      toast.error('Selecione uma imobiliária para vincular');
      return;
    }
    
    saveMutation.mutate(formData);
  };

  const tipoAcessoColors = {
    admin: 'bg-red-100 text-red-800',
    usuario: 'bg-blue-100 text-blue-800',
    imobiliaria: 'bg-purple-100 text-purple-800',
  };

  const tipoAcessoLabels = {
    admin: 'Administrador',
    usuario: 'Usuário Operacional',
    imobiliaria: 'Portal Imobiliária',
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Usuários do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie os acessos e permissões com autonomia total</p>
        </div>
        <Button
          onClick={() => setShowConviteDialog(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-red-700">
                  {usuarios.filter(u => u.tipo_acesso === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Usuários Operacionais</p>
                <p className="text-2xl font-bold text-blue-700">
                  {usuarios.filter(u => u.tipo_acesso === 'usuario').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Imobiliárias</p>
                <p className="text-2xl font-bold text-purple-700">
                  {usuarios.filter(u => u.tipo_acesso === 'imobiliaria').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      {usuarios.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Verifique e cadastre novos usuários se necessário
            </p>
            <Button
              onClick={() => setShowConviteDialog(true)}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Usuário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {usuarios.map((usuario) => {
            const initials = usuario.nome_completo
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'US';

            const imobiliaria = imobiliarias.find(i => i.id === usuario.imobiliaria_id);
            const grupo = grupos.find(g => g.id === usuario.id); // Bug: should be grupo_id
            // Corrected: const grupo = grupos.find(g => g.id === usuario.grupo_id);

            return (
              <Card key={usuario.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                        <AvatarFallback className="text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-gray-900">{usuario.nome_completo}</h3>
                          <Badge className={tipoAcessoColors[usuario.tipo_acesso || 'usuario']}>
                            {tipoAcessoLabels[usuario.tipo_acesso || 'usuario']}
                          </Badge>
                          {grupos.find(g => g.id === usuario.grupo_id) && ( // Use find directly here
                            <Badge style={{ backgroundColor: grupos.find(g => g.id === usuario.grupo_id)?.cor, color: 'white' }}>
                              {grupos.find(g => g.id === usuario.grupo_id)?.nome}
                            </Badge>
                          )}
                          {!usuario.ativo && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              Inativo
                            </Badge>
                          )}
                          {!usuario.senha_definida && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              Aguardando 1º Acesso
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{usuario.email}</span>
                          </div>
                          
                          {usuario.telefone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{usuario.telefone}</span>
                            </div>
                          )}

                          {usuario.cargo && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{usuario.cargo}</span>
                            </div>
                          )}

                          {usuario.tipo_acesso === 'imobiliaria' && imobiliaria && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>Imobiliária: {imobiliaria.nome}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenForm(usuario)}
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Editar */}
      {showForm && (
        <Dialog open onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                </div>

                <div>
                  <Label>Tipo de Acesso *</Label>
                  <Select
                    value={formData.tipo_acesso}
                    onValueChange={(val) => setFormData({ ...formData, tipo_acesso: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Administrador</SelectItem>
                      <SelectItem value="usuario">👤 Usuário Operacional</SelectItem>
                      <SelectItem value="imobiliaria">🏢 Portal Imobiliária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Grupo</Label>
                  <Select
                    value={formData.grupo_id || "sem_grupo"}
                    onValueChange={(val) => setFormData({ ...formData, grupo_id: val === "sem_grupo" ? '' : val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_grupo">Sem grupo</SelectItem>
                      {grupos.map(grupo => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: grupo.cor }}
                            />
                            {grupo.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_acesso === 'imobiliaria' && (
                  <div className="col-span-2">
                    <Label>Imobiliária Vinculada *</Label>
                    <Select
                      value={formData.imobiliaria_id}
                      onValueChange={(val) => setFormData({ ...formData, imobiliaria_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {imobiliarias.map(i => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Cargo</Label>
                  <Input
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.ativo ? 'ativo' : 'inativo'}
                    onValueChange={(val) => setFormData({ ...formData, ativo: val === 'ativo' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">✓ Ativo</SelectItem>
                      <SelectItem value="inativo">✗ Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[var(--wine-600)]">
                  Atualizar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Convidar */}
      <ConvidarUsuarioDialog
        open={showConviteDialog}
        onClose={() => setShowConviteDialog(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['usuarios_sistema'] })}
      />
    </div>
  );
}
