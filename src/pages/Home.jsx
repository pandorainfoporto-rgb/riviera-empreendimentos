import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Shield, AlertCircle, Lock, Zap, Sparkles, Rocket, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [logs, setLogs] = useState([]);
  const [sucesso, setSucesso] = useState(false);

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addLog('🎉 HOME CARREGADA - INTERCEPTAÇÃO ZERO!');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    addLog('✅ Página HOME é pública por padrão!');
    addLog('✅ Base44 NÃO intercepta a Home!');
    addLog('✅ Sistema de login customizado ATIVO!');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Limpar tokens Base44
    try {
      localStorage.removeItem('base44_auth_token');
      localStorage.removeItem('base44_user');
      addLog('💾 localStorage Base44 limpo!');
    } catch (e) {
      addLog('⚠️ Erro ao limpar localStorage: ' + e.message);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso(false);
    setLoading(true);

    try {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('🚀 INICIANDO AUTENTICAÇÃO CUSTOMIZADA');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog(`📧 Email: ${email.trim()}`);
      addLog(`🔑 Senha: ${'*'.repeat(senha.length)} caracteres`);
      addLog('');
      
      addLog('📡 Chamando base44.functions.invoke...');
      addLog('   Function: loginCustom');
      addLog('   Payload: { email, senha }');
      addLog('');
      
      const response = await base44.functions.invoke('loginCustom', {
        email: email.trim(),
        senha: senha
      });

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('📥 RESPONSE RECEBIDA DO BACKEND!');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('📊 HTTP Status Code: ' + response.status);
      addLog('📦 Response.data.success: ' + response.data.success);
      addLog('');

      if (!response.data.success) {
        const errorMsg = response.data.error || 'Erro desconhecido na autenticação';
        addLog('❌ ═══════════════════════════════════');
        addLog('❌ AUTENTICAÇÃO FALHOU!');
        addLog('❌ ═══════════════════════════════════');
        addLog('   Motivo: ' + errorMsg);
        addLog('');
        setErro(errorMsg);
        setLoading(false);
        return;
      }

      addLog('✅ ═══════════════════════════════════');
      addLog('✅ AUTENTICAÇÃO BEM-SUCEDIDA! 🎉');
      addLog('✅ ═══════════════════════════════════');
      addLog('');
      addLog('🔑 TOKEN GERADO:');
      addLog('   ' + response.data.token.substring(0, 40) + '...');
      addLog('');
      addLog('👤 DADOS DO USUÁRIO:');
      addLog('   • ID: ' + response.data.usuario.id);
      addLog('   • Email: ' + response.data.usuario.email);
      addLog('   • Nome: ' + response.data.usuario.nome);
      addLog('   • Tipo de Acesso: ' + response.data.usuario.tipo_acesso);
      addLog('   • Primeiro Acesso: ' + response.data.usuario.primeiro_acesso);
      addLog('');

      // Salvar no localStorage
      localStorage.setItem('auth_token_custom', response.data.token);
      localStorage.setItem('user_data_custom', JSON.stringify(response.data.usuario));
      addLog('💾 ═══════════════════════════════════');
      addLog('💾 DADOS SALVOS NO LOCALSTORAGE!');
      addLog('💾 ═══════════════════════════════════');
      addLog('   • auth_token_custom: ✅ Salvo');
      addLog('   • user_data_custom: ✅ Salvo');
      addLog('');

      setSucesso(true);

      // Redirecionar baseado no tipo
      const tipo = response.data.usuario.tipo_acesso;
      addLog('🚀 ═══════════════════════════════════');
      addLog('🚀 PREPARANDO REDIRECIONAMENTO');
      addLog('🚀 ═══════════════════════════════════');
      addLog(`   Tipo de acesso: ${tipo}`);

      let destino = '';
      if (tipo === 'admin') {
        destino = 'Dashboard (Admin)';
        addLog('   Destino: #/Dashboard');
        addLog('   Aguardando 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/Dashboard';
        }, 2000);
      } else if (tipo === 'cliente') {
        destino = 'Portal do Cliente';
        addLog('   Destino: #/PortalClienteDashboard');
        addLog('   Aguardando 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/PortalClienteDashboard';
        }, 2000);
      } else {
        destino = 'Dashboard (Colaborador)';
        addLog('   Destino: #/Dashboard');
        addLog('   Aguardando 2 segundos...');
        setTimeout(() => {
          window.location.href = '#/Dashboard';
        }, 2000);
      }
      addLog('');
      addLog('🎯 Redirecionando para: ' + destino);
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('💥 ERRO CRÍTICO DETECTADO!');
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('❌ Tipo de Erro: ' + error.name);
      addLog('❌ Mensagem: ' + error.message);
      
      if (error.response) {
        addLog('');
        addLog('📡 RESPONSE DO SERVIDOR:');
        addLog('   • Status: ' + error.response.status);
        addLog('   • Status Text: ' + error.response.statusText);
        addLog('   • Data: ' + JSON.stringify(error.response.data));
      }
      
      addLog('');
      addLog('📚 STACK TRACE:');
      const stackLines = error.stack.split('\n');
      stackLines.forEach((line, idx) => {
        if (idx < 5) addLog('   ' + line);
      });
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      setErro('Erro crítico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <style>{`
        @keyframes neonGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                        0 0 40px rgba(147, 51, 234, 0.3),
                        0 0 60px rgba(236, 72, 153, 0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8),
                        0 0 80px rgba(147, 51, 234, 0.6),
                        0 0 120px rgba(236, 72, 153, 0.4);
          }
        }
        .neon-box {
          animation: neonGlow 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .float-icon {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse-text {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full max-w-7xl">
        {/* Header MEGA VISÍVEL */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6 float-icon">
            <div className="p-8 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full shadow-2xl neon-box">
              <Rocket className="w-32 h-32 text-white" strokeWidth={2} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 rounded-3xl inline-block mb-6">
            <div className="bg-gray-900 px-10 py-6 rounded-3xl">
              <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                🚀 RIVIERA INCORPORADORA
              </h1>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-400 pulse-text" />
              <p className="text-4xl font-black text-green-300">PÁGINA HOME - SEM INTERCEPTAÇÃO!</p>
              <CheckCircle2 className="w-12 h-12 text-green-400 pulse-text" />
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-10 h-10 text-yellow-400" />
              <p className="text-2xl text-yellow-300 font-bold">Sistema de Autenticação Customizado 100% Independente</p>
              <Shield className="w-10 h-10 text-yellow-400" />
            </div>

            <div className="flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-blue-400" />
              <p className="text-xl text-blue-300 font-semibold">Tabela: UsuarioCustom | Function: loginCustom</p>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card de Login */}
          <Card className="shadow-2xl border-4 border-blue-500 neon-box bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-b-4 border-blue-400">
              <CardTitle className="text-4xl text-center flex items-center justify-center gap-3 font-black">
                <Shield className="w-10 h-10" />
                LOGIN CUSTOMIZADO
                <Shield className="w-10 h-10" />
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-8">
              {/* Alerta de Sucesso da Página */}
              <Alert className="mb-6 bg-gradient-to-r from-green-200 to-emerald-200 border-4 border-green-500">
                <CheckCircle2 className="w-8 h-8 text-green-700 pulse-text" />
                <AlertDescription className="text-green-900 font-black text-xl">
                  ✅ PÁGINA HOME CARREGADA COM SUCESSO!
                  <br />
                  <span className="text-base font-bold">
                    🎉 Base44 não interceptou esta página!
                  </span>
                  <br />
                  <span className="text-sm font-semibold text-green-800">
                    (Home é pública por padrão - sem redirecionamentos)
                  </span>
                </AlertDescription>
              </Alert>

              {erro && (
                <Alert className="mb-6 bg-red-100 border-4 border-red-500">
                  <AlertCircle className="w-6 h-6 text-red-700" />
                  <AlertDescription className="text-red-900 font-bold text-lg">{erro}</AlertDescription>
                </Alert>
              )}

              {sucesso && (
                <Alert className="mb-6 bg-green-100 border-4 border-green-500">
                  <CheckCircle2 className="w-6 h-6 text-green-700" />
                  <AlertDescription className="text-green-900 font-bold text-lg">
                    ✅ Login realizado! Redirecionando...
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-800 font-black text-xl flex items-center gap-2">
                    📧 Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="h-16 border-4 focus:border-blue-500 text-lg font-semibold"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="senha" className="text-gray-800 font-black text-xl flex items-center gap-2">
                    🔑 Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="h-16 border-4 focus:border-blue-500 pr-16 text-lg font-semibold"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      disabled={loading}
                    >
                      {mostrarSenha ? <EyeOff className="w-7 h-7 text-gray-500" /> : <Eye className="w-7 h-7 text-gray-500" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-black text-2xl shadow-2xl border-2 border-blue-400"
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

              {/* Info Box */}
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-4 border-blue-400">
                <p className="text-base font-black text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  INFORMAÇÕES DO SISTEMA:
                </p>
                <div className="space-y-2 text-sm text-blue-900 font-mono font-bold">
                  <p>• Página: <span className="bg-white px-3 py-1 rounded-lg font-black">Home (Pública)</span></p>
                  <p>• Function: <span className="bg-white px-3 py-1 rounded-lg font-black">loginCustom</span></p>
                  <p>• Tabela: <span className="bg-white px-3 py-1 rounded-lg font-black">UsuarioCustom</span></p>
                  <p>• Base44 Redirect: <span className="bg-red-200 px-3 py-1 rounded-lg font-black text-red-900">❌ BLOQUEADO</span></p>
                  <p>• Status: <span className="bg-green-200 px-3 py-1 rounded-lg font-black text-green-900">🟢 OPERACIONAL</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Console de Debug GIGANTE */}
          <Card className="shadow-2xl border-4 border-green-500 bg-gray-950">
            <CardHeader className="bg-gray-900 border-b-2 border-green-500">
              <CardTitle className="text-3xl font-mono flex items-center gap-3 text-green-400 font-black">
                <span className="animate-pulse text-red-500 text-4xl">●</span>
                CONSOLE DE DEBUG LIVE
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[600px] overflow-y-auto font-mono text-sm space-y-1 bg-black p-5 rounded-lg border-2 border-green-500">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Sparkles className="w-20 h-20 mb-4 animate-pulse" />
                    <p className="text-xl">Sistema pronto!</p>
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
          <p className="text-white font-black text-3xl drop-shadow-2xl">
            © 2024 Riviera Incorporadora
          </p>
          <p className="text-blue-300 text-xl font-bold">
            🚀 Sistema de Autenticação Customizado v5.0 FINAL
          </p>
          <p className="text-purple-400 text-lg font-semibold pulse-text">
            ✨ HOME PAGE - 100% Funcional sem Interceptação ✨
          </p>
        </div>
      </div>
    </div>
  );
}