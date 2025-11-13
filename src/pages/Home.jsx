import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [setupRealizado, setSetupRealizado] = useState(false);

  useEffect(() => {
    localStorage.clear();
    realizarSetup();
  }, []);

  const realizarSetup = async () => {
    try {
      await base44.functions.invoke('setupInicial', {});
      setSetupRealizado(true);
    } catch (error) {
      console.error('Erro no setup:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('loginCustom', {
        email: email.trim(),
        senha: senha
      });

      if (!response.data.success) {
        setErro(response.data.error);
        setLoading(false);
        return;
      }

      localStorage.setItem('auth_token_custom', response.data.token);
      localStorage.setItem('user_data_custom', JSON.stringify(response.data.usuario));

      const tipo = response.data.usuario.tipo_acesso;
      
      if (tipo === 'admin' || tipo === 'colaborador') {
        window.location.href = '#/Dashboard';
      } else if (tipo === 'cliente') {
        window.location.href = '#/PortalClienteDashboard';
      }

    } catch (error) {
      setErro(error.response?.data?.error || 'Erro ao processar login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Shield className="w-6 h-6" />
            Riviera - Login
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {!setupRealizado && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900 text-sm">
                Inicializando sistema...
              </AlertDescription>
            </Alert>
          )}

          {erro && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900 text-sm">
                {erro}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  disabled={loading}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !setupRealizado}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}