import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Key, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Perfil() {
  const queryClient = useQueryClient();
  const [sucessoMensagem, setSucessoMensagem] = useState("");
  const [erroMensagem, setErroMensagem] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Estado para dados do perfil
  const [dadosPerfil, setDadosPerfil] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  // Estado para troca de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  // Atualizar dados quando user carregar
  React.useEffect(() => {
    if (user) {
      setDadosPerfil({
        full_name: user.full_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const atualizarPerfilMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSucessoMensagem("Perfil atualizado com sucesso!");
      setErroMensagem("");
      setTimeout(() => setSucessoMensagem(""), 3000);
    },
    onError: (error) => {
      setErroMensagem("Erro ao atualizar perfil: " + error.message);
      setSucessoMensagem("");
    },
  });

  const handleAtualizarPerfil = (e) => {
    e.preventDefault();
    
    if (!dadosPerfil.full_name) {
      setErroMensagem("Nome completo é obrigatório");
      return;
    }
    
    atualizarPerfilMutation.mutate(dadosPerfil);
  };

  if (isLoading) {
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
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
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

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAtualizarPerfil} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={dadosPerfil.full_name}
                onChange={(e) => setDadosPerfil({ ...dadosPerfil, full_name: e.target.value })}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={dadosPerfil.email}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">O email não pode ser alterado</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Função:</strong> {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
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
    </div>
  );
}