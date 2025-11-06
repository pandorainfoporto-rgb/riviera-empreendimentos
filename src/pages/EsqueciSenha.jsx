import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  // Detectar portal via URL
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const portalTipo = urlParams.get('portal') || 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('solicitarResetSenha', {
        email,
        tipo_portal: portalTipo
      });

      if (response.data.success) {
        setSucesso(true);
      } else {
        setErro(response.data.error || "Erro ao processar solicitação");
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLinkVoltar = () => {
    if (portalTipo === 'cliente') return createPageUrl('PortalClienteLogin');
    if (portalTipo === 'imobiliaria') return createPageUrl('PortalImobiliariaLogin');
    return '/'; // Login admin
  };

  const getTitulo = () => {
    if (portalTipo === 'cliente') return 'Portal do Cliente';
    if (portalTipo === 'imobiliaria') return 'Portal Imobiliária';
    return 'Sistema Riviera';
  };

  const getCorGradiente = () => {
    if (portalTipo === 'cliente') return 'from-[var(--wine-600)] to-[var(--grape-600)]';
    if (portalTipo === 'imobiliaria') return 'from-purple-600 to-indigo-600';
    return 'from-gray-700 to-gray-900';
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
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <KeyRound className="w-6 h-6" />
              Recuperar Senha
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">{getTitulo()}</p>
          </div>
        </CardHeader>

        <CardContent>
          {sucesso ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <p className="font-semibold mb-2">E-mail enviado com sucesso!</p>
                  <p className="text-sm">
                    Verifique sua caixa de entrada. Se o e-mail estiver cadastrado, 
                    você receberá instruções para redefinir sua senha.
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <a href={getLinkVoltar()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Login
                </a>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800 text-sm">
                    {erro}
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Digite seu e-mail e enviaremos instruções para redefinir sua senha.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
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

              <div className="space-y-3">
                <Button
                  type="submit"
                  className={`w-full bg-gradient-to-r ${getCorGradiente()} hover:opacity-90 h-11`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Enviar Link de Recuperação
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