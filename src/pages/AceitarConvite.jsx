import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";

export default function AceitarConvite() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [convite, setConvite] = useState(null);

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!token) {
      setErro("Link inválido. Solicite um novo convite.");
      setIsLoading(false);
      return;
    }

    validarToken();
  }, [token]);

  const validarToken = async () => {
    try {
      setIsLoading(true);
      
      const response = await base44.functions.invoke('validarConvite', { token });

      if (!response.data.success) {
        setErro(response.data.error || "Convite inválido");
        setIsLoading(false);
        return;
      }

      setConvite(response.data.convite);
      setIsLoading(false);

    } catch (error) {
      console.error("Erro ao validar convite:", error);
      setErro("Erro ao validar convite. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleCriarSenha = async (e) => {
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
      const response = await base44.functions.invoke('finalizarConvite', {
        token,
        senha: novaSenha
      });

      if (response.data.success) {
        setSucesso(true);
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setErro(response.data.error || "Erro ao criar acesso");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao processar. Tente novamente.");
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
            Criar Acesso
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
                Ir para o Login
              </Button>
            </div>
          ) : sucesso ? (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-2">
                  ✅ Acesso Criado!
                </h3>
                <p className="text-gray-600">
                  Sua senha foi criada com sucesso.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirecionando para o login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCriarSenha} className="space-y-4">
              <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <div>
                    <p className="font-bold mb-1">Bem-vindo(a), {convite?.full_name}!</p>
                    <p className="text-sm">📧 {convite?.email}</p>
                    {convite?.cargo && (
                      <p className="text-sm mt-1">💼 {convite.cargo}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] p-4 rounded-lg border border-[var(--wine-200)]">
                <p className="text-sm text-[var(--wine-800)] font-medium text-center">
                  🔐 Crie uma senha segura para acessar o sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha" className="text-gray-700">Nova Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="novaSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={isProcessing}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {novaSenha && novaSenha.length < 6 && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha" className="text-gray-700">Confirmar Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmarSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pl-10 h-11"
                    required
                    disabled={isProcessing}
                  />
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    As senhas não coincidem
                  </p>
                )}
                {confirmarSenha && novaSenha === confirmarSenha && novaSenha.length >= 6 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Senhas coincidem
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos.
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
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 h-12 text-base font-semibold"
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