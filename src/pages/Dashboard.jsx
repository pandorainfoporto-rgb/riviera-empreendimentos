import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, DollarSign, CircleDollarSign, HardHat,
  TrendingUp, Building2, Wallet, CheckCircle2, AlertCircle, Key, AlertTriangle
} from "lucide-react";

import StatsCard from "../components/dashboard/StatsCard";
import EmpreendimentosStatus from "../components/dashboard/EmpreendimentosStatus";
import PagamentosPrioritarios from "../components/dashboard/PagamentosPrioritarios";
import FluxoCaixaChart from "../components/dashboard/FluxoCaixaChart";
import ObrasAndamento from "../components/dashboard/ObrasAndamento";
import ConsorciosResumo from "../components/dashboard/ConsorciosResumo";
import InvestimentosResumo from "../components/dashboard/InvestimentosResumo";
import AportesResumo from "../components/dashboard/AportesResumo";
import UnidadesStatus from "../components/dashboard/UnidadesStatus";
import DashboardLocacoesCompleto from "../components/dashboard/DashboardLocacoesCompleto";

// Componentes de IA
import PrevisaoVendasIA from "../components/ia/PrevisaoVendasIA";
import AnaliseRiscoInadimplenciaIA from "../components/ia/AnaliseRiscoInadimplenciaIA";
import OtimizacaoCustosObraIA from "../components/ia/OtimizacaoCustosObraIA";
import RelatorioAutomaticoIA from "../components/ia/RelatorioAutomaticoIA";

// Componentes de Dashboard Financeiro
import SaldosCaixas from "../components/dashboardFinanceiro/SaldosCaixas";
import MovimentacoesRecentes from "../components/dashboardFinanceiro/MovimentacoesRecentes";
import ReceitasDespesasChart from "../components/dashboardFinanceiro/ReceitasDespesasChart";
import FluxoMensalChart from "../components/dashboardFinanceiro/FluxoMensalChart";
import CategoriasChart from "../components/dashboardFinanceiro/CategoriasChart";
import PortfolioPerformance from "../components/dashboardFinanceiro/PortfolioPerformance";
import ProjecaoFluxo from "../components/dashboardFinanceiro/ProjecaoFluxo";
import OrcamentoVsRealizado from "../components/dashboardFinanceiro/OrcamentoVsRealizado";
import AlertasOrcamento from "../components/dashboardFinanceiro/AlertasOrcamento";

export default function Dashboard() {
  const [loteamentoSelecionado, setLoteamentoSelecionado] = useState("todos");
  const [dashboardSelecionada, setDashboardSelecionada] = useState("executiva");
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  // PROTEÇÃO: Verificar se é cliente e redirecionar IMEDIATAMENTE
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const user = await base44.auth.me();
        
        // Se for role 'user', verificar se é cliente
        if (user.role === 'user') {
          const clientes = await base44.entities.Cliente.filter({ email: user.email });
          if (clientes && clientes.length > 0) {
            console.log('❌ Cliente tentando acessar Dashboard Admin - redirecionando');
            window.location.href = '#/PortalClienteDashboard';
            return;
          }
        }

        // Se for imobiliária
        if (user.tipo_acesso === 'imobiliaria') {
          console.log('❌ Imobiliária tentando acessar Dashboard Admin - redirecionando');
          window.location.href = '#/PortalImobiliariaDashboard';
          return;
        }

        // Se for admin, permitir acesso
        if (user.role === 'admin') {
          console.log('✅ Admin acessando Dashboard');
          setVerificandoAcesso(false);
          return;
        }

        // Se não for nenhum dos anteriores, bloquear
        console.log('❌ Acesso não autorizado');
        base44.auth.logout();
        
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        base44.auth.redirectToLogin();
      }
    };

    verificarAcesso();
  }, []);

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: async () => {
      try {
        return await base44.entities.Loteamento.list();
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      try {
        return await base44.entities.Unidade.list();
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentos_clientes'],
    queryFn: async () => {
      try {
        const result = await base44.entities.PagamentoCliente.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentos_fornecedores'],
    queryFn: async () => {
      try {
        const result = await base44.entities.PagamentoFornecedor.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: aportes = [] } = useQuery({
    queryKey: ['aportes_socios'],
    queryFn: async () => {
      try {
        const result = await base44.entities.AporteSocio.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Consorcio.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: investimentos = [] } = useQuery({
    queryKey: ['investimentos'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Investimento.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: cronogramasObra = [] } = useQuery({
    queryKey: ['cronogramas_obra'],
    queryFn: async () => {
      try {
        const result = await base44.entities.CronogramaObra.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Caixa.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes_caixa'],
    queryFn: async () => {
      try {
        const result = await base44.entities.MovimentacaoCaixa.list('-data_movimentacao', 100);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Orcamento.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: locacoes = [] } = useQuery({
    queryKey: ['locacoes'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Locacao.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: alugueisMensais = [] } = useQuery({
    queryKey: ['alugueis_mensais'],
    queryFn: async () => {
      try {
        const result = await base44.entities.AluguelMensal.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ['negociacoes'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Negociacao.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Cliente.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_obra'],
    queryFn: async () => {
      try {
        const result = await base44.entities.CustoObra.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Fornecedor.list();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !verificandoAcesso,
  });

  // Mostrar loading enquanto verifica acesso
  if (verificandoAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Filtrar por loteamento
  const unidadesFiltradas = loteamentoSelecionado === "todos"
    ? unidades
    : unidades.filter(u => u.loteamento_id === loteamentoSelecionado);

  const unidadeIds = unidadesFiltradas.map(u => u.id);

  const pagamentosClientesFiltrados = pagamentosClientes.filter(p =>
    !p.unidade_id || unidadeIds.includes(p.unidade_id)
  );

  const pagamentosFornecedoresFiltrados = pagamentosFornecedores.filter(p =>
    !p.unidade_id || unidadeIds.includes(p.unidade_id)
  );

  const aportesFiltrados = aportes.filter(a =>
    !a.unidade_id || unidadeIds.includes(a.unidade_id)
  );

  const consorciosFiltrados = consorcios.filter(c =>
    !c.unidade_id || unidadeIds.includes(c.unidade_id)
  );

  const investimentosFiltrados = loteamentoSelecionado === "todos"
    ? investimentos
    : investimentos.filter(i => i.loteamento_id === loteamentoSelecionado);

  const cronogramasFiltrados = cronogramasObra.filter(c =>
    unidadeIds.includes(c.unidade_id)
  );

  const locacoesFiltradas = loteamentoSelecionado === "todos"
    ? locacoes
    : locacoes.filter(l => l.loteamento_id === loteamentoSelecionado);

  const locacaoIdsFiltradas = locacoesFiltradas.map(l => l.id);

  const alugueisMensaisFiltrados = alugueisMensais.filter(am =>
    locacaoIdsFiltradas.includes(am.locacao_id)
  );

  // Cálculos
  const totalReceitas = pagamentosClientesFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

  const totalDespesas = pagamentosFornecedoresFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

  const totalAportes = aportesFiltrados
    .filter(a => a.status === 'pago')
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  const saldoAtual = totalReceitas + totalAportes - totalDespesas;

  const pagamentosPendentes = pagamentosClientesFiltrados
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const contasPagar = pagamentosFornecedoresFiltrados
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const unidadesVendidas = unidadesFiltradas.filter(u => u.status === 'vendida').length;
  const unidadesDisponiveis = unidadesFiltradas.filter(u => u.status === 'disponivel').length;

  // Função para calcular gasto real
  const calcularGastoReal = (categoria, mesRef, loteamentoId) => {
    const [anoStr, mesStr] = mesRef.split('-');
    const ano = parseInt(anoStr);
    const mes = parseInt(mesStr); // Meses são 0-indexed no JS Date, então subtraímos 1
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0); // O dia 0 do próximo mês é o último dia do mês atual

    const movsFiltradas = movimentacoes.filter(mov => {
      if (mov.tipo !== 'saida') return false;

      try {
        const dataMov = new Date(mov.data_movimentacao);
        if (isNaN(dataMov.getTime()) || dataMov < inicioMes || dataMov > fimMes) return false;
      } catch {
        return false;
      }

      if (loteamentoId && loteamentoId !== "todos") {
        const caixa = caixas.find(c => c.id === mov.caixa_id);
        if (caixa?.loteamento_id !== loteamentoId) return false;
      }

      return mov.categoria === categoria;
    });

    return movsFiltradas.reduce((sum, mov) => sum + (mov.valor || 0), 0);
  };




  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Visão estratégica do negócio</p>
        </div>

        <div className="flex flex-col gap-3">
          <Select value={dashboardSelecionada} onValueChange={setDashboardSelecionada}>
            <SelectTrigger className="w-full bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] border-[var(--wine-300)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executiva">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Dashboard Executiva</span>
                </div>
              </SelectItem>
              <SelectItem value="geral">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Visão Geral</span>
                </div>
              </SelectItem>
              <SelectItem value="financeiro">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Dashboard Financeiro</span>
                </div>
              </SelectItem>
              <SelectItem value="consorcios">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-cyan-600" />
                  <span>Dashboard Consórcios</span>
                </div>
              </SelectItem>
              <SelectItem value="obras">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-orange-600" />
                  <span>Dashboard Obras</span>
                </div>
              </SelectItem>
              <SelectItem value="alugueis">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Dashboard Locações</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={loteamentoSelecionado} onValueChange={setLoteamentoSelecionado}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">📊 Todos os Loteamentos</SelectItem>
              {loteamentos.map(lot => (
                <SelectItem key={lot.id} value={lot.id}>
                  🏘️ {lot.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DASHBOARD EXECUTIVA */}
      {dashboardSelecionada === "executiva" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Cards Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatsCard
              title="Saldo Total"
              value={`R$ ${(saldoAtual / 1000).toFixed(1)}k`}
              icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />

            <StatsCard
              title="Receitas do Mês"
              value={`R$ ${(totalReceitas / 1000).toFixed(1)}k`}
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />

            <StatsCard
              title="Despesas do Mês"
              value={`R$ ${(totalDespesas / 1000).toFixed(1)}k`}
              icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
            />

            <StatsCard
              title="Lucro Líquido"
              value={`R$ ${((totalReceitas + totalAportes - totalDespesas) / 1000).toFixed(1)}k`}
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          {/* Indicadores de Negócio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total Unidades</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">{unidadesFiltradas.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{unidadesDisponiveis} disponíveis</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-green-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Vendidas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">{unidadesVendidas}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {unidadesFiltradas.length > 0 ? Math.round((unidadesVendidas / unidadesFiltradas.length) * 100) : 0}% do total
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-orange-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Obras Ativas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-700">
                      {cronogramasFiltrados.filter(c => c.status === 'em_andamento').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cronogramasFiltrados.filter(c => c.status === 'atrasada').length} atrasadas
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-orange-100 flex-shrink-0">
                    <HardHat className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-cyan-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Consórcios</p>
                    <p className="text-2xl sm:text-3xl font-bold text-cyan-700">{consorciosFiltrados.length}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {consorciosFiltrados.filter(c => c.contemplado).length} contemplados
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-100 flex-shrink-0">
                    <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Principais */}
          <FluxoCaixaChart
            pagamentosClientes={pagamentosClientesFiltrados}
            pagamentosFornecedores={pagamentosFornecedoresFiltrados}
            aportesSocios={aportesFiltrados}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <UnidadesStatus unidades={unidadesFiltradas} />
            <ObrasAndamento cronogramasObra={cronogramasFiltrados} unidades={unidadesFiltradas} />
            <PagamentosPrioritarios pagamentosClientes={pagamentosClientesFiltrados} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <ConsorciosResumo consorcios={consorciosFiltrados} unidades={unidadesFiltradas} />
            <InvestimentosResumo investimentos={investimentosFiltrados} />
            <AportesResumo aportes={aportesFiltrados} />
          </div>

          {/* Seção de Insights com IA */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🤖</span> Insights Inteligentes com IA
            </h2>
            <div className="space-y-4">
              <PrevisaoVendasIA 
                negociacoes={negociacoes}
                unidades={unidadesFiltradas}
                loteamentos={loteamentos}
              />
              <AnaliseRiscoInadimplenciaIA
                pagamentosClientes={pagamentosClientesFiltrados}
                clientes={clientes}
                locacoes={locacoesFiltradas}
                alugueisMensais={alugueisMensaisFiltrados}
              />
              <OtimizacaoCustosObraIA
                custosObra={custosObra}
                cronogramasObra={cronogramasFiltrados}
                pagamentosFornecedores={pagamentosFornecedoresFiltrados}
                unidades={unidadesFiltradas}
                fornecedores={fornecedores}
              />
              <RelatorioAutomaticoIA
                negociacoes={negociacoes}
                pagamentosClientes={pagamentosClientesFiltrados}
                pagamentosFornecedores={pagamentosFornecedoresFiltrados}
                unidades={unidadesFiltradas}
                locacoes={locacoesFiltradas}
                cronogramasObra={cronogramasFiltrados}
                consorcios={consorciosFiltrados}
                caixas={caixas}
                loteamentos={loteamentos}
              />
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD GERAL */}
      {dashboardSelecionada === "geral" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatsCard
              title="Saldo Atual"
              value={`R$ ${(saldoAtual / 1000).toFixed(1)}k`}
              icon={<Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />

            <StatsCard
              title="A Receber"
              value={`R$ ${(pagamentosPendentes / 1000).toFixed(1)}k`}
              subtitle={`${pagamentosClientesFiltrados.filter(p => p.status === 'pendente' || p.status === 'atrasado').length} pendentes`}
              icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />

            <StatsCard
              title="A Pagar"
              value={`R$ ${(contasPagar / 1000).toFixed(1)}k`}
              subtitle={`${pagamentosFornecedoresFiltrados.filter(p => p.status === 'pendente' || p.status === 'atrasado').length} pendentes`}
              icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
            />

            <StatsCard
              title="Unidades"
              value={`${unidadesVendidas}/${unidadesFiltradas.length}`}
              subtitle={`${unidadesDisponiveis} disponíveis`}
              icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <UnidadesStatus unidades={unidadesFiltradas} />
            <ObrasAndamento cronogramasObra={cronogramasFiltrados} unidades={unidadesFiltradas} />
          </div>

          <FluxoCaixaChart
            pagamentosClientes={pagamentosClientesFiltrados}
            pagamentosFornecedores={pagamentosFornecedoresFiltrados}
            aportesSocios={aportesFiltrados}
          />

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <PagamentosPrioritarios pagamentosClientes={pagamentosClientesFiltrados} />
            <ConsorciosResumo consorcios={consorciosFiltrados} unidades={unidadesFiltradas} />
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <InvestimentosResumo investimentos={investimentosFiltrados} />
            <AportesResumo aportes={aportesFiltrados} />
          </div>
        </div>
      )}

      {/* DASHBOARD FINANCEIRO */}
      {dashboardSelecionada === "financeiro" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <SaldosCaixas caixas={caixas} />
            <div className="lg:col-span-2">
              <FluxoMensalChart
                movimentacoes={movimentacoes}
                periodoMeses={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <CategoriasChart movimentacoes={movimentacoes} />
            <PortfolioPerformance
              investimentos={investimentosFiltrados}
              consorcios={consorciosFiltrados}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <OrcamentoVsRealizado
              orcamentos={orcamentos}
              calcularGastoReal={calcularGastoReal}
            />
            <AlertasOrcamento
              orcamentos={orcamentos}
              calcularGastoReal={calcularGastoReal}
            />
          </div>

          <MovimentacoesRecentes movimentacoes={movimentacoes} caixas={caixas} />
        </div>
      )}

      {/* DASHBOARD CONSÓRCIOS */}
      {dashboardSelecionada === "consorcios" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total de Cotas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">{consorciosFiltrados.length}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                    <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-green-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Contempladas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">
                      {consorciosFiltrados.filter(c => c.contemplado).length}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-purple-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Investimento</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                      {consorciosFiltrados.filter(c => c.eh_investimento_caixa).length}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-orange-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Valor Total</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-700 break-words">
                      R$ {(consorciosFiltrados.reduce((sum, c) => sum + (c.valor_carta || 0), 0) / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-orange-100 flex-shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ConsorciosResumo consorcios={consorciosFiltrados} unidades={unidadesFiltradas} />
            <InvestimentosResumo investimentos={investimentosFiltrados} />
          </div>
        </div>
      )}

      {/* DASHBOARD OBRAS */}
      {dashboardSelecionada === "obras" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Em Andamento</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                      {cronogramasFiltrados.filter(c => c.status === 'em_andamento').length}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                    <HardHat className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-green-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Concluídas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">
                      {cronogramasFiltrados.filter(c => c.status === 'concluida').length}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-red-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Atrasadas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-700">
                      {cronogramasFiltrados.filter(c => c.status === 'atrasada').length}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-100 flex-shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-purple-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Progresso Médio</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                      {cronogramasFiltrados.length > 0
                        ? Math.round(cronogramasFiltrados.reduce((sum, c) => sum + (c.percentual_conclusao || 0), 0) / cronogramasFiltrados.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ObrasAndamento cronogramasObra={cronogramasFiltrados} unidades={unidadesFiltradas} />
            <UnidadesStatus unidades={unidadesFiltradas} />
          </div>

          <FluxoCaixaChart
            pagamentosClientes={pagamentosClientesFiltrados}
            pagamentosFornecedores={pagamentosFornecedoresFiltrados}
            aportesSocios={aportesFiltrados}
          />
        </div>
      )}

      {/* DASHBOARD ALUGUÉIS */}
      {dashboardSelecionada === "alugueis" && (
        <DashboardLocacoesCompleto 
          locacoes={locacoesFiltradas}
          alugueisMensais={alugueisMensaisFiltrados}
          unidades={unidadesFiltradas}
        />
      )}
    </div>
  );
}