import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        navigate(createPageUrl('Dashboard'));
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
            Riviera Incorporadora
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto px-4">
            Sistema completo de gestão para incorporadoras imobiliárias
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 md:p-8">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center">
              Bem-vindo ao Sistema
            </CardTitle>
            <p className="text-center text-white/90 mt-2 text-sm sm:text-base">
              Versão 3.8.3 • Dezembro 2024
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
              <div className="p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Gestão de Empreendimentos</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Controle completo de loteamentos, unidades e cronogramas de obra
                </p>
              </div>

              <div className="p-4 sm:p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Financeiro Completo</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Fluxo de caixa, DRE, conciliação bancária e gestão de boletos
                </p>
              </div>

              <div className="p-4 sm:p-6 bg-green-50 rounded-lg border border-green-200 sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-600 flex items-center justify-center mb-3 sm:mb-4">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">Consórcios & CRM</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Gestão de cotas, contemplações e relacionamento com clientes
                </p>
              </div>
            </div>

            {/* New Features */}
            <div className="mb-6 sm:mb-8 md:mb-12 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">🎉</span> Novidades da Versão 3.8.3
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Custos de Obra Avançado</strong> - Orçamento detalhado com materiais e serviços</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Orçamentos de Compra</strong> - Cotações automáticas para fornecedores</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Conciliação Bancária IA</strong> - Matching inteligente de pagamentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Dashboard Financeiro Consolidado</strong> - Visão 360° do negócio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Responsividade Total</strong> - Interface otimizada para mobile e desktop</span>
                </li>
              </ul>
            </div>

            {/* Login Button */}
            <div className="text-center">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl shadow-xl w-full sm:w-auto"
              >
                Acessar Sistema
                <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                Faça login com suas credenciais do Base44
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 md:mt-12 text-white/60 text-xs sm:text-sm">
          <p>© 2024 Riviera Incorporadora • Todos os direitos reservados</p>
          <p className="mt-1 sm:mt-2">Desenvolvido com ❤️ usando Base44 Platform</p>
        </div>
      </div>
    </div>
  );
}