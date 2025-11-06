
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, PiggyBank, 
  Building2, ArrowUpRight, ArrowDownRight, Calendar, AlertCircle 
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import SaldosCaixas from "../components/dashboardFinanceiro/SaldosCaixas";
import MovimentacoesRecentes from "../components/dashboardFinanceiro/MovimentacoesRecentes";
import ReceitasDespesasChart from "../components/dashboardFinanceiro/ReceitasDespesasChart";
import FluxoMensalChart from "../components/dashboardFinanceiro/FluxoMensalChart";
import CategoriasChart from "../components/dashboardFinanceiro/CategoriasChart";
import PortfolioPerformance from "../components/dashboardFinanceiro/PortfolioPerformance";
import ProjecaoFluxo from "../components/dashboardFinanceiro/ProjecaoFluxo";
import OrcamentoVsRealizado from "../components/dashboardFinanceiro/OrcamentoVsRealizado";
import AlertasOrcamento from "../components/dashboardFinanceiro/AlertasOrcamento";

export default function DashboardFinanceiro() {
  const [periodoFilter, setPeriodoFilter] = useState("mes_atual");
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
    initialData: [],
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoesCaixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list('-data_movimentacao'),
    initialData: [],
  });

  const { data: investimentos = [] } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => base44.entities.Investimento.list(),
    initialData: [],
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
    initialData: [],
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
    initialData: [],
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
    initialData: [],
  });

  const { data: aportesSocios = [] } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: () => base44.entities.Orcamento.list(),
    initialData: [],
  });

  // Calcular período
  const hoje = new Date();
  let dataInicio, dataFim;
  
  switch (periodoFilter) {
    case "mes_atual":
      dataInicio = startOfMonth(hoje);
      dataFim = endOfMonth(hoje);
      break;
    case "ultimos_3_meses":
      dataInicio = startOfMonth(subMonths(hoje, 2));
      dataFim = endOfMonth(hoje);
      break;
    case "ultimos_6_meses":
      dataInicio = startOfMonth(subMonths(hoje, 5));
      dataFim = endOfMonth(hoje);
      break;
    case "ano_atual":
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = endOfMonth(hoje);
      break;
    default:
      dataInicio = startOfMonth(hoje);
      dataFim = endOfMonth(hoje);
  }

  // Filtrar movimentações por período e loteamento
  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    try {
      const dataMov = parseISO(mov.data_movimentacao);
      const dentroPerido = dataMov >= dataInicio && dataMov <= dataFim;
      
      if (!dentroPerido) return false;
      
      if (loteamentoFilter === "todos") return true;
      
      const caixa = caixas.find(c => c.id === mov.caixa_id);
      return caixa?.loteamento_id === loteamentoFilter;
    } catch {
      return false;
    }
  });

  // Calcular totais de receitas e despesas
  const totalReceitas = movimentacoesFiltradas
    .filter(m => m.tipo === "entrada")
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalDespesas = movimentacoesFiltradas
    .filter(m => m.tipo === "saida")
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const saldoPeriodo = totalReceitas - totalDespesas;

  // Calcular saldo total de todos os caixas ativos
  const saldoTotalCaixas = caixas
    .filter(c => c.ativo)
    .reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

  // Calcular valor investido
  const investimentosAtivos = investimentos.filter(i => i.status === 'ativo');
  const totalInvestido = investimentosAtivos.reduce((sum, i) => sum + (i.valor_aplicado || 0), 0);

  // Calcular valor em consórcios
  const consorciosAtivos = consorcios.filter(c => !c.contemplado);
  const valorConsorcios = consorciosAtivos.reduce((sum, c) => {
    const valorPago = (c.parcelas_pagas || 0) * (c.valor_parcela || 0);
    return sum + valorPago;
  }, 0);

  // A receber e a pagar
  const aReceber = pagamentosClientes
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const aPagar = pagamentosFornecedores
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const aportesReceber = aportesSocios
    .filter(a => a.status === 'pendente' || a.status === 'atrasado')
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  // Filtrar orçamentos do mês atual
  const mesAtual = format(hoje, "yyyy-MM");
  const orcamentosMesAtual = orcamentos.filter(orc => 
    orc.mes_referencia === mesAtual && orc.ativo &&
    (loteamentoFilter === "todos" || orc.loteamento_id === loteamentoFilter)
  );

  // Função para calcular gasto real
  const calcularGastoReal = (categoria, mesRef, loteamentoId) => {
    const [ano, mes] = mesRef.split('-');
    const inicioMes = startOfMonth(new Date(parseInt(ano), parseInt(mes) - 1, 1));
    const fimMes = endOfMonth(new Date(parseInt(ano), parseInt(mes) - 1, 1));

    const movsFiltradas = movimentacoes.filter(mov => {
      if (mov.tipo !== 'saida') return false;
      
      try {
        const dataMov = parseISO(mov.data_movimentacao);
        if (dataMov < inicioMes || dataMov > fimMes) return false;
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Dashboard Financeiro</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Visão completa da saúde financeira do negócio</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
            <SelectTrigger className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
              <SelectItem value="ano_atual">Ano Atual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
            <SelectTrigger className="w-full">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Loteamentos</SelectItem>
              {loteamentos.map(lot => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards Principais de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Saldo em Caixas</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                  R$ {saldoTotalCaixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {caixas.filter(c => c.ativo).length} caixa(s) ativo(s)
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Receitas do Período</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 break-words">
                  R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-600 font-semibold truncate">
                    {movimentacoesFiltradas.filter(m => m.tipo === "entrada").length} entradas
                  </p>
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-green-100 flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Despesas do Período</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 break-words">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-semibold truncate">
                    {movimentacoesFiltradas.filter(m => m.tipo === "saida").length} saídas
                  </p>
                </div>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-100 flex-shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Resultado do Período</p>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold break-words ${saldoPeriodo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {saldoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {saldoPeriodo >= 0 ? 'Superávit' : 'Déficit'}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100 flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-lg border-l-4 border-purple-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Investimentos</p>
                <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                R$ {(totalInvestido / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-indigo-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Consórcios</p>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                R$ {(valorConsorcios / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-cyan-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">A Receber</p>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
              </div>
              <p className="text-base sm:text-lg font-bold text-cyan-600">
                R$ {((aReceber + aportesReceber) / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">A Pagar</p>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
              </div>
              <p className="text-base sm:text-lg font-bold text-amber-600">
                R$ {(aPagar / 1000).toFixed(0)}k
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Orçamento */}
      {orcamentosMesAtual.length > 0 && (
        <AlertasOrcamento 
          orcamentos={orcamentosMesAtual}
          calcularGastoReal={calcularGastoReal}
        />
      )}

      {/* Gráficos e Componentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ReceitasDespesasChart 
          movimentacoes={movimentacoesFiltradas}
          dataInicio={dataInicio}
          dataFim={dataFim}
        />
        
        <FluxoMensalChart 
          movimentacoes={movimentacoes}
          periodoMeses={6}
        />
      </div>

      {/* Orçamento vs Realizado */}
      {orcamentosMesAtual.length > 0 && (
        <OrcamentoVsRealizado
          orcamentos={orcamentosMesAtual}
          calcularGastoReal={calcularGastoReal}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <SaldosCaixas caixas={caixas} loteamentos={loteamentos} />
        </div>
        
        <CategoriasChart movimentacoes={movimentacoesFiltradas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PortfolioPerformance 
          investimentos={investimentos}
          consorcios={consorcios}
        />
        
        <ProjecaoFluxo 
          pagamentosClientes={pagamentosClientes}
          pagamentosFornecedores={pagamentosFornecedores}
          aportesSocios={aportesSocios}
        />
      </div>

      <MovimentacoesRecentes 
        movimentacoes={movimentacoes.slice(0, 10)}
        caixas={caixas}
      />
    </div>
  );
}
