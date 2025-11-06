import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PortalClienteLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [etapa, setEtapa] = useState("email"); // email, criar_senha, login
  const [clienteNome, setClienteNome] = useState("");
  const navigate = useNavigate();

  const handleVerificarEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('verificarPrimeiroAcesso', { email });
      
      if (!response.data.existe) {
        setError("Email não encontrado. Verifique com a incorporadora.");
        setLoading(false);
        return;
      }

      if (!response.data.ativo) {
        setError("Acesso desativado. Entre em contato com a incorporadora.");
        setLoading(false);
        return;
      }

      setClienteNome(response.data.cliente_nome);

      if (response.data.primeiro_acesso || !response.data.senha_definida) {
        setEtapa("criar_senha");
      } else {
        setEtapa("login");
      }
      
    } catch (error) {
      setError("Erro ao verificar email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarSenha = async (e) => {
    e.preventDefault();
    setError("");

    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('criarSenhaPrimeiroAcesso', {
        email,
        senha: novaSenha
      });

      if (response.data.success) {
        alert("✅ Senha criada com sucesso!\n\nAgora você pode fazer login.");
        setEtapa("login");
        setSenha(novaSenha);
      } else {
        setError(response.data.error || "Erro ao criar senha");
      }
      
    } catch (error) {
      setError("Erro ao criar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await base44.auth.signInWithPassword(email, senha);
      
      const user = await base44.auth.me();
      if (user.tipo_acesso !== 'cliente') {
        await base44.auth.logout();
        setError("Este portal é exclusivo para clientes");
        setLoading(false);
        return;
      }

      navigate(createPageUrl('PortalClienteDashboard'));
      
    } catch (error) {
      setError("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fb7e38ed631a4c4f0c76ea/669c17872_525981935_17846132280535972_4105371699080593471_n.jpg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--wine-600)] via-[var(--grape-600)] to-[var(--wine-700)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg bg-white p-3">
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
          <CardTitle className="text-2xl font-bold text-[var(--wine-700)]">
            Portal do Cliente
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">Riviera Incorporadora</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ETAPA 1: Verificar Email */}
          {etapa === "email" && (
            <form onSubmit={handleVerificarEmail} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Continuar"}
              </Button>
            </form>
          )}

          {/* ETAPA 2: Criar Senha (Primeiro Acesso) */}
          {etapa === "criar_senha" && (
            <form onSubmit={handleCriarSenha} className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <User className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Bem-vindo, {clienteNome}!</strong><br/>
                  Este é seu primeiro acesso. Crie uma senha segura.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="novaSenha"
                    type={showPassword ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmarSenha"
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                disabled={loading}
              >
                {loading ? "Criando..." : "Criar Senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setEtapa("email");
                  setEmail("");
                  setNovaSenha("");
                  setConfirmarSenha("");
                }}
              >
                Voltar
              </Button>
            </form>
          )}

          {/* ETAPA 3: Login Normal */}
          {etapa === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <User className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Bem-vindo de volta, <strong>{clienteNome}</strong>!
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="emailLogin">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="emailLogin"
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setEtapa("email");
                  setEmail("");
                  setSenha("");
                }}
              >
                Usar outro email
              </Button>

              <div className="text-center">
                <a
                  href={createPageUrl('EsqueciSenha')}
                  className="text-sm text-[var(--wine-600)] hover:underline"
                >
                  Esqueci minha senha
                </a>
              </div>
            </form>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              © 2024 Riviera Incorporadora. Todos os direitos reservados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}