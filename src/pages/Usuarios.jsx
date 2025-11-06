
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  ExternalLink,
  Shield, 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['grupos_usuario'],
    queryFn: () => base44.entities.GrupoUsuario.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getNomeGrupo = (grupoId) => {
    const grupo = grupos.find(g => g.id === grupoId);
    return grupo?.nome || 'Sem grupo';
  };

  const tipoLabels = {
    admin: { label: 'Administrador', color: 'bg-red-100 text-red-800', icon: Shield },
    usuario: { label: 'Usuário', color: 'bg-blue-100 text-blue-800', icon: User },
    cliente: { label: 'Cliente', color: 'bg-green-100 text-green-800', icon: User },
    imobiliaria: { label: 'Imobiliária', color: 'bg-purple-100 text-purple-800', icon: Briefcase },
  };

  const usuariosFiltrados = usuarios.filter(user => {
    const matchSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = filterTipo === 'todos' || user.tipo_acesso === filterTipo;
    const matchStatus = filterStatus === 'todos' || 
      (filterStatus === 'ativo' && user.ativo !== false) ||
      (filterStatus === 'inativo' && user.ativo === false);

    return matchSearch && matchTipo && matchStatus;
  });

  const handleToggleStatus = (user) => {
    updateMutation.mutate({
      id: user.id,
      data: { ativo: !user.ativo }
    });
  };

  // Verificar se usuário pode fazer login
  // Um usuário pode fazer login se foi criado VIA Base44 (tem o campo 'created_date' recente E 'email_confirmed_at')
  // Mas como não temos esses campos, vamos assumir que usuários SEM dados completos precisam ser convidados
  const precisaSerConvidado = (user) => {
    // Se não tem email, definitivamente precisa
    if (!user.email) return true;
    
    // Heurística: se foi criado muito recentemente (hoje) mas não tem vários campos preenchidos,
    // provavelmente foi criado pela função antiga
    // Mas não temos como saber com certeza sem acessar o sistema de auth
    // Então vamos adicionar uma mensagem genérica
    return false; // Não podemos determinar com certeza
  };

  const usuariosPrecisamConvite = usuarios.filter(u => !u.email || u.email === '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Usuários do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários e permissões</p>
        </div>
      </div>

      {/* Alerta importante */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <p className="font-semibold mb-2">⚠️ IMPORTANTE - Como os usuários fazem login:</p>
          <div className="space-y-2 text-sm">
            <p><strong>1. Usuários já cadastrados aqui</strong> que <strong>NÃO conseguem fazer login:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Eles foram cadastrados apenas nesta tabela de dados</li>
              <li>Ainda NÃO foram criados no sistema de autenticação do Base44</li>
              <li><strong>Solução:</strong> Convide-os pelo Dashboard do Base44 usando o MESMO email</li>
            </ul>
            
            <p className="mt-3"><strong>2. Para criar NOVOS usuários que possam fazer login:</strong></p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Acesse o <strong>Dashboard do Base44</strong></li>
              <li>Vá em <strong>Settings → Users → Invite User</strong></li>
              <li>Preencha o email e nome do novo usuário</li>
              <li>O usuário receberá um email para criar sua senha</li>
              <li>Após o login, você pode configurar as permissões aqui</li>
            </ol>
            
            <Button
              onClick={() => window.open('https://www.base44.app/', '_blank')}
              className="mt-3 bg-amber-600 hover:bg-amber-700"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Dashboard Base44 para Convidar Usuários
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {usuariosPrecisamConvite.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <p className="font-semibold">🚨 {usuariosPrecisamConvite.length} usuário(s) sem email cadastrado</p>
            <p className="text-sm mt-1">Estes usuários não podem ser convidados. Edite-os para adicionar um email válido.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="imobiliaria">Imobiliária</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 gap-4">
        {usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          usuariosFiltrados.map((user) => {
            const tipoInfo = tipoLabels[user.tipo_acesso] || tipoLabels.usuario;
            const TipoIcon = tipoInfo.icon;
            const semEmail = !user.email || user.email === '';

            return (
              <Card key={user.id} className={`hover:shadow-lg transition-shadow ${semEmail ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] text-white">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {user.full_name || 'Sem nome'}
                          </h3>
                          <Badge className={tipoInfo.color}>
                            <TipoIcon className="w-3 h-3 mr-1" />
                            {tipoInfo.label}
                          </Badge>
                          {user.ativo !== false ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                          {semEmail && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Sem Email
                            </Badge>
                          )}
                        </div>

                        {semEmail && (
                          <Alert className="mb-3 bg-red-50 border-red-200 py-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <AlertDescription className="text-xs text-red-800">
                              <strong>Este usuário não pode fazer login!</strong> Adicione um email válido para poder convidá-lo.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email || 'Email não cadastrado'}</span>
                          </div>
                          
                          {user.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{user.telefone}</span>
                            </div>
                          )}

                          {user.cargo && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              <span>{user.cargo}</span>
                            </div>
                          )}

                          {user.grupo_id && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span>Grupo: {getNomeGrupo(user.grupo_id)}</span>
                            </div>
                          )}
                        </div>

                        {!semEmail && (
                          <Alert className="mt-3 bg-blue-50 border-blue-200 py-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <AlertDescription className="text-xs text-blue-800">
                              <p><strong>Se este usuário NÃO consegue fazer login:</strong></p>
                              <p className="mt-1">Convide-o pelo Dashboard do Base44 usando o email: <strong>{user.email}</strong></p>
                              <Button
                                onClick={() => window.open('https://www.base44.app/', '_blank')}
                                size="sm"
                                variant="outline"
                                className="mt-2 h-7 text-xs border-blue-300 hover:bg-blue-100"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Abrir Base44
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.ativo !== false ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{usuarios.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {usuarios.filter(u => u.tipo_acesso === 'admin').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {usuarios.filter(u => u.tipo_acesso === 'usuario').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {usuarios.filter(u => u.ativo !== false).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
