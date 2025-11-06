import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, LogIn, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PortalImobiliariaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se já está logado
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        base44.auth.me().then(user => {
          if (user && user.tipo_acesso === 'imobiliaria') {
            navigate(createPageUrl('PortalImobiliariaDashboard'));
          }
        });
      }
    });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      // Fazer login
      const { data, error } = await base44.client.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: senha,
      });

      if (error) {
        setErro("Email ou senha incorretos");
        setIsLoading(false);
        return;
      }

      // Verificar se é imobiliária
      const user = await base44.auth.me();
      
      if (!user) {
        setErro("Erro ao carregar dados do usuário");
        setIsLoading(false);
        return;
      }

      if (user.tipo_acesso !== 'imobiliaria') {
        await base44.auth.logout();
        setErro("Este acesso é exclusivo para imobiliárias");
        setIsLoading(false);
        return;
      }

      if (user.ativo === false) {
        await base44.auth.logout();
        setErro("Usuário inativo. Entre em contato com o suporte.");
        setIsLoading(false);
        return;
      }

      navigate(createPageUrl('PortalImobiliariaDashboard'));

    } catch (error) {
      console.error("Erro no login:", error);
      setErro("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/eed99d7e7_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#3D3A35] to-[#2A2823] p-3">
              <img 
                src={logoUrl}
                alt="Riviera Logo" 
                className="w-full h-full object-contain filter brightness-110 contrast-110"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Building className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-2xl font-bold text-purple-700">
              Portal Imobiliária
            </CardTitle>
          </div>
          <p className="text-sm text-gray-600">
            Acesse para gerenciar leads e vendas
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {erro && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 text-sm">
                  {erro}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a
                href={createPageUrl('EsqueciSenha') + '?portal=imobiliaria'}
                className="text-sm text-purple-600 hover:underline font-medium"
              >
                Esqueceu sua senha?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600">
              Ainda não é parceiro?{' '}
              <span className="text-purple-600 font-medium">
                Entre em contato
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}