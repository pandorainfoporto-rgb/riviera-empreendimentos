import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function AceitarConvite() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [dadosConvite, setDadosConvite] = useState(null);

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setErro("Link inválido. Solicite um novo convite.");
      setIsLoading(false);
      return;
    }

    verificarConvite();
  }, [token]);

  const verificarConvite = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se é convite de cliente ou usuário do sistema
      // Primeiro tentar buscar em Cliente
      const clientes = await base44.entities.Cliente.filter({ convite_token: token });
      
      if (clientes && clientes.length > 0) {
        const cliente = clientes[0];
        
        if (cliente.convite_aceito) {
          setErro("Este convite já foi utilizado. Faça login no Portal do Cliente.");
          setIsLoading(false);
          return;
        }

        if (cliente.convite_data_envio) {
          const dataEnvio = new Date(cliente.convite_data_envio);
          const agora = new Date();
          const diasPassados = (agora - dataEnvio) / (1000 * 60 * 60 * 24);
          
          if (diasPassados > 7) {
            setErro("Este convite expirou. Solicite um novo convite.");
            setIsLoading(false);
            return;
          }
        }

        setDadosConvite({
          tipo: 'cliente',
          nome: cliente.nome,
          email: cliente.email,
          id: cliente.id
        });
        setIsLoading(false);
        return;
      }

      // Tentar buscar em User (convites de admin/usuário)
      const { data: usuarios } = await base44.asServiceRole.client
        .from('User')
        .select('*')
        .eq('convite_token', token)
        .limit(1);

      if (usuarios && usuarios.length > 0) {
        const usuario = usuarios[0];
        
        if (usuario.convite_aceito) {
          setErro("Este convite já foi utilizado. Faça login no sistema.");
          setIsLoading(false);
          return;
        }

        if (usuario.convite_data_envio) {
          const dataEnvio = new Date(usuario.convite_data_envio);
          const agora = new Date();
          const diasPassados = (agora - dataEnvio) / (1000 * 60 * 60 * 24);
          
          if (diasPassados > 7) {
            setErro("Este convite expirou. Solicite um novo convite.");
            setIsLoading(false);
            return;
          }
        }

        setDadosConvite({
          tipo: 'usuario',
          nome: usuario.full_name,
          email: usuario.email,
          id: usuario.id,
          tipo_acesso: usuario.tipo_acesso,
          cargo: usuario.cargo
        });
        setIsLoading(false);
        return;
      }

      setErro("Convite não encontrado ou inválido.");
      setIsLoading(false);

    } catch (error) {
      console.error("Erro ao verificar convite:", error);
      setErro("Erro ao verificar convite. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleAceitarConvite = async (e) => {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    setIsProcessing(true);

    try {
      if (dadosConvite.tipo === 'cliente') {
        // Usar a função existente para clientes
        const response = await base44.functions.invoke('aceitarConviteCliente', {
          token,
          senha: novaSenha
        });

        if (response.data.success) {
          setSucesso(true);
          setTimeout(() => {
            window.location.href = createPageUrl('PortalClienteLogin');
          }, 2000);
        } else {
          setErro(response.data.error || "Erro ao aceitar convite");
        }
      } else if (dadosConvite.tipo === 'usuario') {
        // Atualizar senha do usuário no auth
        const { error: updateError } = await base44.asServiceRole.client.auth.admin.updateUserById(
          dadosConvite.id,
          { password: novaSenha }
        );

        if (updateError) {
          setErro("Erro ao definir senha. Tente novamente.");
          setIsProcessing(false);
          return;
        }

        // Atualizar registro do usuário
        await base44.asServiceRole.client
          .from('User')
          .update({
            convite_aceito: true,
            convite_data_aceite: new Date().toISOString(),
            convite_token: null,
            ativo: true,
            primeiro_acesso: false
          })
          .eq('id', dadosConvite.id);

        setSucesso(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao processar convite. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17872_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--wine-600)] via-[var(--grape-600)] to-[var(--wine-700)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg bg-white p-3">
            <img 
              src={logoUrl}
              alt="Riviera Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23922B3E"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle" font-family="Arial">R</text></svg>';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--wine-700)] flex items-center justify-center gap-2">
            <UserCheck className="w-6 h-6" />
            Aceitar Convite
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
              <p className="text-gray-600">Verificando convite...</p>
            </div>
          ) : erro ? (
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {erro}
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                Voltar para o Início
              </Button>
            </div>
          ) : sucesso ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <p className="font-semibold mb-2">✅ Convite aceito com sucesso!</p>
                  <p className="text-sm">
                    Sua senha foi criada. Redirecionando para o login...
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleAceitarConvite} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Bem-vindo(a), {dadosConvite.nome}!</strong><br/>
                  <span className="text-sm">Email: {dadosConvite.email}</span>
                  {dadosConvite.cargo && (
                    <><br/><span className="text-sm">Cargo: {dadosConvite.cargo}</span></>
                  )}
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] p-4 rounded-lg border border-[var(--wine-200)]">
                <p className="text-sm text-[var(--wine-800)] font-medium">
                  🔐 Crie uma senha segura para acessar o sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="novaSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    required
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {novaSenha && novaSenha.length < 6 && (
                  <p className="text-xs text-red-600">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmarSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente"
                    className="pl-10"
                    required
                    disabled={isProcessing}
                  />
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Dica:</strong> Use uma combinação de letras, números e símbolos para maior segurança.
                </p>
              </div>

              {erro && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 h-11"
                disabled={isProcessing || novaSenha !== confirmarSenha || novaSenha.length < 6}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando Acesso...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Criar Senha e Acessar
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}