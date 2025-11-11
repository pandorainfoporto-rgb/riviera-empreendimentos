import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Shield, Users as UsersIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import UsuariosList from "../components/usuarios/UsuariosList";
import UsuarioForm from "../components/usuarios/UsuarioForm";

export default function GerenciarUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuariosCustom'],
    queryFn: () => base44.entities.UsuarioCustom.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UsuarioCustom.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuariosCustom'] });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }) => base44.entities.UsuarioCustom.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuariosCustom'] });
    },
  });

  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = 
      u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cargo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === "todos" || u.tipo_acesso === tipoFilter;
    
    return matchesSearch && matchesTipo;
  });

  const handleEditar = (usuario) => {
    setSelectedUsuario(usuario);
    setShowForm(true);
  };

  const handleDelete = async (usuario) => {
    if (window.confirm(`Tem certeza que deseja deletar o usuário ${usuario.nome}?`)) {
      deleteMutation.mutate(usuario.id);
    }
  };

  const handleToggleAtivo = async (usuario) => {
    toggleAtivoMutation.mutate({
      id: usuario.id,
      ativo: !usuario.ativo
    });
  };

  const totalAdmins = usuarios.filter(u => u.tipo_acesso === 'admin').length;
  const totalColaboradores = usuarios.filter(u => u.tipo_acesso === 'colaborador').length;
  const totalClientes = usuarios.filter(u => u.tipo_acesso === 'cliente').length;

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
        <p className="text-gray-600">Apenas administradores podem gerenciar usuários</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">Sistema de autenticação customizado</p>
        </div>
        <Button
          onClick={() => {
            setSelectedUsuario(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-red-600">{totalAdmins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Colaboradores</p>
              <p className="text-2xl font-bold text-blue-600">{totalColaboradores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-green-600">{totalClientes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nome, email ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="colaborador">Colaboradores</TabsTrigger>
              <TabsTrigger value="cliente">Clientes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <UsuariosList
        usuarios={filteredUsuarios}
        clientes={clientes}
        isLoading={isLoading}
        onEditar={handleEditar}
        onDelete={handleDelete}
        onToggleAtivo={handleToggleAtivo}
      />

      {showForm && (
        <UsuarioForm
          usuario={selectedUsuario}
          clientes={clientes}
          onClose={() => {
            setShowForm(false);
            setSelectedUsuario(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['usuariosCustom'] });
            setShowForm(false);
            setSelectedUsuario(null);
          }}
        />
      )}
    </div>
  );
}