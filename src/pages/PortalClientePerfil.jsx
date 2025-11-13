
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Key, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Phone, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function PortalClientePerfil() {
  const queryClient = useQueryClient();
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroMensagem, setErroMensagem] = useState("");

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      // Fetch all clients and then find the one that matches user.cliente_id
      // This is less efficient than filtering on the server if the API supported it,
      // but aligns with fetching "my" client based on the user's client_id.
      if (!user?.cliente_id) {
        throw new Error("User client ID is not available.");
      }
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id, // Only run this query if user.cliente_id exists
    staleTime: 1000 * 60 * 5,
  });

  // Estado para dados do perfil
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: cliente?.nome || "",
    telefone: cliente?.telefone || "",
    endereco: cliente?.endereco || "",
  });

  // Estado para troca de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Atualizar dados quando cliente carregar
  React.useEffect(() => {
    if (cliente) {
      setDadosPerfil({
        nome: cliente.nome || "",
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
      });
    }
  }, [cliente]);

  const atualizarPerfilMutation = useMutation({
    mutationFn: async (data) => {
      if (cliente?.id) {
        await base44.entities.Cliente.update(cliente.id, data);
      }
    },
    onSuccess: () => {
      // Invalidate the 'meuCliente' query to refetch updated client data
      queryClient.invalidateQueries({ queryKey: ['meuCliente'] });
      setSucessoMensagem("Perfil atualizado com sucesso!");
      setErroMensagem("");
      setTimeout(() => setSucessoMensagem(""), 3000);
    },
    onError: (error) => {
      setErroMensagem("Erro ao atualizar perfil: " + error.message);
      setSucessoMensagem("");
    },
  });

  const alterarSenhaMutation = useMutation({
    mutationFn: async ({ senhaAtual, novaSenha }) => {
      const response = await base44.functions.invoke('alterarSenha', {
        senhaAtual,
        novaSenha
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao alterar senha');
      }
      
      return response.data;
    },
    onSuccess: () => {
      setSucessoMensagem("Senha alterada com sucesso!");
      setErroMensagem("");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(() => setSucessoMensagem(""), 3000);
    },
    onError: (error) => {
      setErroMensagem(error.message || "Erro ao alterar senha. Verifique se a senha atual está correta.");
      setSucessoMensagem("");
    },
  });

  const handleAtualizarPerfil = (e) => {
    e.preventDefault();
    
    if (!dadosPerfil.nome) {
      setErroMensagem("Nome é obrigatório");
      return;
    }
    
    atualizarPerfilMutation.mutate(dadosPerfil);
  };

  const handleAlterarSenha = (e) => {
    e.preventDefault();
    setErroMensagem("");
    setSucessoMensagem("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErroMensagem("Preencha todos os campos de senha");
      return;
    }

    if (novaSenha.length < 6) {
      setErroMensagem("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroMensagem("As senhas não coincidem");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErroMensagem("A nova senha deve ser diferente da senha atual");
      return;
    }

    alterarSenhaMutation.mutate({ senhaAtual, novaSenha });
  };

  if (loadingUser || loadingCliente) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações e segurança</p>
      </div>

      {sucessoMensagem && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {sucessoMensagem}
          </AlertDescription>
        </Alert>
      )}

      {erroMensagem && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {erroMensagem}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full md:w-96 grid-cols-2">
          <TabsTrigger value="dados">Meus Dados</TabsTrigger>
          <TabsTrigger value="senha">Alterar Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAtualizarPerfil} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="nome"
                      value={dadosPerfil.nome}
                      onChange={(e) => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={cliente?.cpf_cnpj || ""}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="telefone"
                      value={dadosPerfil.telefone}
                      onChange={(e) => setDadosPerfil({ ...dadosPerfil, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      id="endereco"
                      value={dadosPerfil.endereco}
                      onChange={(e) => setDadosPerfil({ ...dadosPerfil, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade"
                      rows={3}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={atualizarPerfilMutation.isPending}
                    className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {atualizarPerfilMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="senha">
          <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
                <Key className="w-5 h-5" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAlterarSenha} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual *</Label>
                  <div className="relative">
                    <Input
                      id="senhaAtual"
                      type={mostrarSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="novaSenha"
                      type={mostrarNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {novaSenha && novaSenha.length < 6 && (
                    <p className="text-xs text-red-600">A senha deve ter pelo menos 6 caracteres</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Digite novamente"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmarSenha && novaSenha !== confirmarSenha && (
                    <p className="text-xs text-red-600">As senhas não coincidem</p>
                  )}
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-xs text-blue-900">
                    💡 <strong>Dica:</strong> Use uma senha forte com letras, números e caracteres especiais.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={alterarSenhaMutation.isPending}
                    className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {alterarSenhaMutation.isPending ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
