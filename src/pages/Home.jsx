import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Shield, AlertCircle, Sparkles, Wrench, TestTube, Bug } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  const [diagnostico, setDiagnostico] = useState(null);

  useEffect(() => {
    localStorage.removeItem('auth_token_custom');
    localStorage.removeItem('user_data_custom');
    console.log('🏠 HOME - Página de Login carregada');
  }, []);

  const testarHash = async () => {
    try {
      const response = await base44.functions.invoke('testarHashSenha', {
        senha: 'redotk6969'
      });
      
      console.log('🧪 TESTE HASH:', response.data);
      alert('Hash gerado:\n\n' + response.data.hash);
    } catch (error) {
      console.error('💥 Erro teste:', error);
    }
  };

  const diagnosticarLogin = async () => {
    try {
      const response = await base44.functions.invoke('diagnosticoLogin', {
        email: email
      });
      
      console.log('🔍 DIAGNÓSTICO:', response.data);
      setDiagnostico(response.data);
      
      if (response.data.success) {
        const msg = `
✅ USUÁRIO ENCONTRADO!

Total de registros: ${response.data.total_usuarios}

${response.data.usuarios.map((u, i) => `
[${i+1}] ${u.nome}
    Email: ${u.email}
    Tipo: ${u.tipo_acesso}
    Hash: ${u.hash_tipo}
    Preview: ${u.hash_preview}
    Criado: ${u.created_date}
`).join('\n')}
        `;
        alert(msg);
      } else {
        alert('❌ ' + response.data.mensagem);
      }
    } catch (error) {
      console.error('💥 Erro diagnóstico:', error);
      alert('Erro ao diagnosticar: ' + error.message);
    }
  };

  const corrigirUsuarios = async () => {
    setCorrigindo(true);
    setErro("");
    
    try {
      console.log('🔧 Corrigindo usuários...');
      
      const response = await base44.functions.invoke('corrigirUsuarioAdmin', {});
      
      console.log('📡 Resposta:', response.data);
      
      if (response.data.success) {
        const resultados = response.data.resultados
          .filter(r => r.status === 'corrigido')
          .map(r => `✅ ${r.email}\n   Hash: ${r.hash_preview}`)
          .join('\n\n');
        
        alert('✅ Usuários corrigidos!\n\n' + resultados + '\n\nAgora você pode fazer login!');
      } else {
        setErro('Erro: ' + response.data.error);
      }
      
    } catch (error) {
      console.error('💥 Erro:', error);
      setErro('Erro ao corrigir: ' + (error.response?.data?.error || error.message));
    } finally {
      setCorrigindo(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      console.log('🚀 Tentando login...', email);
      console.log('🔑 Senha:', senha);
      
      const response = await base44.functions.invoke('loginCustom', {
        email: email.trim(),
        senha: senha
      });

      console.log('📡 Response:', response.data);

      if (!response.data.success) {
        setErro(response.data.error || 'Erro na autenticação');
        setLoading(false);
        return;
      }

      console.log('✅ Login OK!');

      localStorage.setItem('auth_token_custom', response.data.token);
      localStorage.setItem('user_data_custom', JSON.stringify(response.data.usuario));

      const tipo = response.data.usuario.tipo_acesso;
      
      setTimeout(() => {
        if (tipo === 'admin' || tipo === 'colaborador') {
          window.location.href = '#/Dashboard';
        } else if (tipo === 'cliente') {
          window.location.href = '#/PortalClienteDashboard';
        }
      }, 500);

    } catch (error) {
      console.error('💥 Erro:', error);
      const mensagem = error.response?.data?.error || error.message;
      setErro(mensagem);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-4 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
          <CardTitle className="text-3xl text-center flex items-center justify-center gap-3">
            <Shield className="w-8 h-8" />
            LOGIN
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-8">
          {erro && (
            <Alert className="mb-6 bg-red-100 border-2 border-red-500">
              <AlertCircle className="w-5 h-5 text-red-700" />
              <AlertDescription className="text-red-900 font-bold whitespace-pre-line">
                {erro}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-bold">
                📧 Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 border-2"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-gray-800 font-bold">
                🔑 Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 border-2 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  disabled={loading}
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  ENTRAR
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <Button
              onClick={diagnosticarLogin}
              disabled={!email}
              variant="outline"
              className="w-full border-2 border-blue-400 hover:bg-blue-50"
            >
              <Bug className="w-5 h-5 text-blue-600 mr-2" />
              🔍 Diagnosticar Email
            </Button>

            <Button
              onClick={corrigirUsuarios}
              disabled={corrigindo}
              variant="outline"
              className="w-full border-2 border-orange-400 hover:bg-orange-50"
            >
              {corrigindo ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                  Corrigindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  🔧 Corrigir Senhas dos Usuários
                </div>
              )}
            </Button>

            <Button
              onClick={testarHash}
              variant="outline"
              className="w-full border-2 border-purple-400 hover:bg-purple-50"
            >
              <TestTube className="w-5 h-5 text-purple-600 mr-2" />
              🧪 Testar Geração de Hash
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400">
            <p className="text-sm font-bold text-yellow-900 mb-2">
              🔐 CREDENCIAIS DE TESTE:
            </p>
            <div className="space-y-2">
              <div className="text-sm font-mono bg-white p-3 rounded">
                <p className="text-yellow-900">👤 <strong>Admin:</strong></p>
                <p className="text-yellow-900">📧 atendimento@pandorainternet.net</p>
                <p className="text-yellow-900">🔑 123456</p>
              </div>
              <div className="text-sm font-mono bg-white p-3 rounded">
                <p className="text-yellow-900">👤 <strong>Cliente:</strong></p>
                <p className="text-yellow-900">📧 pandorainfoporto@gmail.com</p>
                <p className="text-yellow-900">🔑 redotk6969</p>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-3">
              ⚠️ Se o login falhar, clique em "Diagnosticar Email" primeiro!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center w-full">
        <p className="text-white font-bold drop-shadow-lg">
          © 2024 Riviera Incorporadora
        </p>
      </div>
    </div>
  );
}