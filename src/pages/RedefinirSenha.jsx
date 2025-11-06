import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [tokenInvalido, setTokenInvalido] = useState(false);

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const token = urlParams.get('token');
  const portalTipo = urlParams.get('portal') || 'admin';

  useEffect(() => {
    if (!token) {
      setTokenInvalido(true);
      setErro("Link inválido ou expirado. Solicite um novo link de recuperação.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    try {
      const response = await base44.functions.invoke('redefinirSenha', {
        token,
        novaSenha
      });

      if (response.data.success) {
        setSucesso(true);
        setTimeout(() => {
          if (portalTipo === 'cliente') {
            window.location.href = createPageUrl('PortalClienteLogin');
          } else if (portalTipo === 'imobiliaria') {
            window.location.href = createPageUrl('PortalImobiliariaLogin');
          } else {
            window.location.href = '/';
          }
        }, 3000);
      } else {
        setErro(response.data.error || "Erro ao redefinir senha");
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCorGradiente = () => {
    if (portalTipo === 'cliente') return 'from-[var(--wine-600)] to-[var(--grape-600)]';
    if (portalTipo === 'imobiliaria') return 'from-purple-600 to-indigo-600';
    return 'from-gray-700 to-gray-900';
  };

  const getLinkVoltar = () => {
    if (portalTipo === 'cliente') return createPageUrl('PortalClienteLogin');
    if (portalTipo === 'imobiliaria') return createPageUrl('PortalImobiliariaLogin');
    return '/';
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/eed99d7e7_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${getCorGradiente()} p-4`}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#3D3A35] to-[#2A2823] p-2.5">
              <img 
                src={logoUrl}
                alt="Riviera Logo" 
                className="w-full h-full object-contain filter brightness-110 contrast-110"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <KeyRound className="w-6 h-6" />
            Redefinir Senha
          </CardTitle>
        </CardHeader>

        <CardContent>
          {tokenInvalido ? (
            <div className="space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Link inválido ou expirado. Solicite um novo link de recuperação.
                </AlertDescription>
              </Alert>
              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <a href={createPageUrl('EsqueciSenha') + `?portal=${portalTipo}`}>
                  Solicitar Novo Link
                </a>
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
                  <p className="font-semibold mb-2">Senha redefinida com sucesso!</p>
                  <p className="text-sm">
                    Você será redirecionado para o login em instantes...
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Digite e confirme sua nova senha. Ela deve ter pelo menos 6 caracteres.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="novaSenha"
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {novaSenha && novaSenha.length < 6 && (
                  <p className="text-xs text-red-600">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmarSenha"
                    type={mostrarConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className={`w-full bg-gradient-to-r ${getCorGradiente()} hover:opacity-90 h-11`}
                  disabled={isLoading || novaSenha !== confirmarSenha || novaSenha.length < 6}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Redefinir Senha
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = getLinkVoltar()}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}