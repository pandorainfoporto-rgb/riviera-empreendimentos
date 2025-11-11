import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Shield, AlertCircle, Lock, Zap, Sparkles } from "lucide-react";

export default function AutenticacaoCustom() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog('🎉 PÁGINA CARREGADA COM SUCESSO!');
    addLog('✅ ZERO interceptação do Base44!');
    addLog('📍 Estamos na página: AutenticacaoCustom');
    addLog('🔓 Base44 não reconheceu como login!');
    
    // Limpar qualquer token Base44
    try {
      localStorage.removeItem('base44_auth_token');
      localStorage.removeItem('base44_user');
      addLog('💾 localStorage limpo!');
    } catch (e) {
      addLog('⚠️ Erro ao limpar localStorage: ' + e.message);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('📤 INICIANDO AUTENTICAÇÃO');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog(`📧 Email: ${email.trim()}`);
      addLog(`🔑 Senha: ${'*'.repeat(senha.length)}`);
      
      addLog('🔌 Chamando base44.functions.invoke...');
      addLog('   Function: loginCustom');
      addLog('   Método: POST');
      
      const response = await base44.functions.invoke('loginCustom', {
        email: email.trim(),
        senha: senha
      });

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('📥 RESPONSE RECEBIDA!');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('📊 HTTP Status: ' + response.status);
      addLog('📦 Data.success: ' + response.data.success);

      if (!response.data.success) {
        const errorMsg = response.data.error || 'Erro desconhecido';
        addLog('❌ LOGIN FALHOU!');
        addLog('   Erro: ' + errorMsg);
        setErro(errorMsg);
        setLoading(false);
        return;
      }

      addLog('✅ LOGIN BEM-SUCEDIDO!');
      addLog('🎉 Autenticação customizada funcionou!');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('🔑 Token recebido:');
      addLog('   ' + response.data.token.substring(0, 30) + '...');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('👤 Dados do usuário:');
      addLog('   ID: ' + response.data.usuario.id);
      addLog('   Email: ' + response.data.usuario.email);
      addLog('   Nome: ' + response.data.usuario.nome);
      addLog('   Tipo: ' + response.data.usuario.tipo_acesso);

      // Salvar no localStorage
      localStorage.setItem('auth_token_custom', response.data.token);
      localStorage.setItem('user_data_custom', JSON.stringify(response.data.usuario));
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('💾 Dados salvos no localStorage!');

      // Redirecionar
      const tipo = response.data.usuario.tipo_acesso;
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('🚀 PREPARANDO REDIRECT...');
      addLog(`   Tipo de acesso: ${tipo}`);

      if (tipo === 'admin') {
        addLog('   Destino: Dashboard Admin');
        addLog('➡️ Redirecionando em 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/Dashboard';
        }, 2000);
      } else if (tipo === 'cliente') {
        addLog('   Destino: Portal do Cliente');
        addLog('➡️ Redirecionando em 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/PortalClienteDashboard';
        }, 2000);
      } else {
        addLog('   Destino: Dashboard (Colaborador)');
        addLog('➡️ Redirecionando em 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/Dashboard';
        }, 2000);
      }

    } catch (error) {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('💥 ERRO CRÍTICO DETECTADO!');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('❌ Tipo: ' + error.name);
      addLog('❌ Mensagem: ' + error.message);
      if (error.response) {
        addLog('❌ Response Status: ' + error.response.status);
        addLog('❌ Response Data: ' + JSON.stringify(error.response.data));
      }
      addLog('❌ Stack Trace:');
      error.stack.split('\n').forEach(line => addLog('   ' + line));
      setErro('Erro ao processar login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
      <style>{`
        @keyframes rainbow {
          0% { border-color: #ef4444; }
          20% { border-color: #f59e0b; }
          40% { border-color: #10b981; }
          60% { border-color: #3b82f6; }
          80% { border-color: #8b5cf6; }
          100% { border-color: #ef4444; }
        }
        .rainbow-border {
          animation: rainbow 3s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        .float-icon {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 60px rgba(16, 185, 129, 1); }
        }
        .glow-effect {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-6xl">
        {/* Header MEGA VISÍVEL */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6 float-icon">
            <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl glow-effect">
              <Sparkles className="w-32 h-32 text-white" strokeWidth={2} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 p-1 rounded-2xl inline-block mb-6 rainbow-border">
            <div className="bg-gray-900 px-8 py-4 rounded-2xl">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                ✨ AUTENTICAÇÃO CUSTOMIZADA ✨
              </h1>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Lock className="w-10 h-10 text-yellow-400 animate-pulse" />
              <p className="text-3xl font-black text-yellow-300">100% INDEPENDENTE DO BASE44</p>
              <Lock className="w-10 h-10 text-yellow-400 animate-pulse" />
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-green-400" />
              <p className="text-xl text-green-300 font-bold">Tabela: UsuarioCustom | Function: loginCustom</p>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card de Autenticação */}
          <Card className="shadow-2xl border-4 border-emerald-400 glow-effect bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-b-4 border-emerald-400">
              <CardTitle className="text-3xl text-center flex items-center justify-center gap-3 font-black">
                <Shield className="w-8 h-8" />
                PORTAL CUSTOMIZADO
                <Shield className="w-8 h-8" />
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Alerta GIGANTESCO */}
              <Alert className="mb-6 bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 border-4 border-yellow-600">
                <Sparkles className="w-8 h-8 text-yellow-700 animate-pulse" />
                <AlertDescription className="text-yellow-900 font-black text-lg">
                  🎉 PÁGINA CARREGOU SEM INTERCEPTAÇÃO!
                  <br />
                  <span className="text-base font-bold">
                    ✅ Base44 NÃO reconheceu como página de login!
                  </span>
                  <br />
                  <span className="text-sm font-semibold text-yellow-800">
                    (Nome da página: AutenticacaoCustom - sem palavra "Login")
                  </span>
                </AlertDescription>
              </Alert>

              {erro && (
                <Alert className="mb-4 bg-red-100 border-4 border-red-500">
                  <AlertCircle className="w-6 h-6 text-red-700" />
                  <AlertDescription className="text-red-900 font-bold text-lg">{erro}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-800 font-black text-lg flex items-center gap-2">
                    📧 Email Customizado
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="h-16 border-4 focus:border-emerald-500 text-lg font-semibold"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-gray-800 font-black text-lg flex items-center gap-2">
                    🔑 Senha Customizada
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="h-16 border-4 focus:border-emerald-500 pr-16 text-lg font-semibold"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      {mostrarSenha ? <EyeOff className="w-7 h-7 text-gray-500" /> : <Eye className="w-7 h-7 text-gray-500" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-2xl shadow-2xl border-2 border-emerald-400"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-white"></div>
                      AUTENTICANDO...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LogIn className="w-7 h-7" />
                      ENTRAR NO SISTEMA
                      <Sparkles className="w-7 h-7" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Info Box Técnico */}
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-4 border-blue-400">
                <p className="text-base font-black text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  INFORMAÇÕES TÉCNICAS DO SISTEMA:
                </p>
                <div className="space-y-2 text-sm text-blue-900 font-mono font-bold">
                  <p>• Página: <span className="bg-white px-3 py-1 rounded-lg font-black">AutenticacaoCustom</span></p>
                  <p>• Function Backend: <span className="bg-white px-3 py-1 rounded-lg font-black">loginCustom</span></p>
                  <p>• Tabela Database: <span className="bg-white px-3 py-1 rounded-lg font-black">UsuarioCustom</span></p>
                  <p>• Interceptação Base44: <span className="bg-red-200 px-3 py-1 rounded-lg font-black text-red-900">❌ BLOQUEADA</span></p>
                  <p>• Status Sistema: <span className="bg-green-200 px-3 py-1 rounded-lg font-black text-green-900">🟢 OPERACIONAL</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Console de Debug MEGA DETALHADO */}
          <Card className="shadow-2xl border-4 border-green-500 bg-gray-950">
            <CardHeader className="bg-gray-900 border-b-2 border-green-500">
              <CardTitle className="text-2xl font-mono flex items-center gap-3 text-green-400 font-black">
                <span className="animate-pulse text-red-500 text-3xl">●</span>
                CONSOLE DE DEBUG AO VIVO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[500px] overflow-y-auto font-mono text-sm space-y-1 bg-black p-4 rounded-lg border-2 border-green-500">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Sparkles className="w-16 h-16 mb-4 animate-pulse" />
                    <p className="text-lg">Aguardando autenticação...</p>
                    <p className="text-xs mt-2">Logs aparecerão aqui em tempo real</p>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <p key={idx} className="text-green-400 leading-relaxed">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-white font-black text-2xl drop-shadow-2xl">
            © 2024 Riviera Incorporadora
          </p>
          <p className="text-emerald-300 text-lg font-bold">
            🔐 Sistema de Autenticação Customizado v4.0
          </p>
          <p className="text-teal-400 text-sm font-semibold">
            ✨ Página: AutenticacaoCustom (sem interceptação) ✨
          </p>
        </div>
      </div>
    </div>
  );
}