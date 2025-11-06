import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AceitarConvite() {
  const [token, setToken] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Pegar token da URL
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setErro('Link de convite inválido');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    if (!token) {
      setErro("Token de convite não encontrado");
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      const response = await base44.functions.invoke('aceitarConviteCliente', {
        token,
        senha
      });

      if (response.data.success) {
        setSucesso(true);
        setEmail(response.data.email);
        setTimeout(() => {
          navigate(createPageUrl('PortalClienteLogin'));
        }, 3000);
      } else {
        setErro(response.data.error || 'Erro ao processar convite');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro(error.response?.data?.error || 'Erro ao processar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17875_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <style>{`
        :root {
          --wine-700: #7C2D3E;
          --wine-600: #922B3E;
          --grape-600: #7D5999;
        }
      `}</style>

      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-xl flex items-center justify-center bg-gradient-to-br from-[#2C3E2F] to-[#1a2419] p-3 border-2 border-gray-200">
              <img 
                src={logoUrl}
                alt="Riviera Logo" 
                className="w-full h-full object-contain filter brightness-110 contrast-110"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23922B3E"/><text x="50" y="60" font-size="40" fill="white" text-anchor="middle" font-family="Arial">R</text></svg>';
                }}
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--wine-700)]">
            Bem-vindo ao Portal!
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Crie sua senha de acesso
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          {sucesso ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800 ml-2">
                <strong>Acesso criado com sucesso! ✅</strong>
                <p className="mt-2">
                  Email: <strong>{email}</strong>
                </p>
                <p className="mt-2">
                  Redirecionando para o login...
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 ml-2">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={loading || !token}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {senha && senha.length < 6 && (
                  <p className="text-xs text-red-600">A senha deve ter pelo menos 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={mostrarConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente"
                    required
                    disabled={loading || !token}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmarSenha && senha !== confirmarSenha && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-xs text-blue-900">
                  💡 <strong>Dica:</strong> Use uma senha forte que você consiga lembrar.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={loading || !token || !senha || !confirmarSenha}
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando acesso...
                  </>
                ) : (
                  'Criar Minha Senha'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}