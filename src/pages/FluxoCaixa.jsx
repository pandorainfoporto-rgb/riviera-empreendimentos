
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Users, CircleDollarSign, 
  PiggyBank, Clock, AlertTriangle, Zap, Target, AlertCircle, Award 
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function FluxoCaixa() {
  const [selectedEmp, setSelectedEmp] = useState("todos");
  const [selectedUnidade, setSelectedUnidade] = useState("todos");

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: pagamentosClientes = [] } = useQuery({
    queryKey: ['pagamentosClientes'],
    queryFn: () => base44.entities.PagamentoCliente.list(),
  });

  const { data: pagamentosFornecedores = [] } = useQuery({
    queryKey: ['pagamentosFornecedores'],
    queryFn: () => base44.entities.PagamentoFornecedor.list(),
  });

  const { data: aportesSocios = [] } = useQuery({
    queryKey: ['aportesSocios'],
    queryFn: () => base44.entities.AporteSocio.list(),
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
  });

  const { data: investimentos = [] } = useQuery({
    queryKey: ['investimentos'],
    queryFn: () => base44.entities.Investimento.list(),
  });

  const { data: lances = [] } = useQuery({
    queryKey: ['lancesConsorcios'],
    queryFn: () => base44.entities.LanceConsorcio.list(),
  });

  const { data: faturasConsorcios = [] } = useQuery({
    queryKey: ['faturasConsorcios'],
    queryFn: () => base44.entities.FaturaConsorcio.list(),
  });

  const filtrarPorEmpreendimento = (items) => {
    if (selectedEmp === "todos") return items;
    // Assuming all relevant entities have an 'empreendimento_id' field.
    // If 'unidade_id' filtering is ever needed, this function would need to be expanded
    // or a new one created, possibly considering parent-child relationships.
    return items.filter(item => item.empreendimento_id === selectedEmp);
  };
  
  const receitasPagas = filtrarPorEmpreendimento(pagamentosClientes.filter(p => p.status === 'pago'))
    .reduce((sum, p) => sum + (p.valor || 0), 0);
    
  const despesasPagas = filtrarPorEmpreendimento(pagamentosFornecedores.filter(p => p.status === 'pago'))
    .reduce((sum, p) => sum + (p.valor || 0), 0);
    
  const receitasPendentes = filtrarPorEmpreendimento(pagamentosClientes.filter(p => p.status === 'pendente' || p.status === 'atrasado'))
    .reduce((sum, p) => sum + (p.valor || 0), 0);
    
  const despesasPendentes = filtrarPorEmpreendimento(pagamentosFornecedores.filter(p => p.status === 'pendente' || p.status === 'atrasado'))
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const aportesSociosPagos = filtrarPorEmpreendimento(aportesSocios.filter(a => a.status === 'pago'))
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  const aportesSociosPendentes = filtrarPorEmpreendimento(aportesSocios.filter(a => a.status === 'pendente'))
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  const consorciosFiltrados = filtrarPorEmpreendimento(consorcios);
  const investimentoConsorcios = consorciosFiltrados.reduce((sum, c) => {
    const valorPago = (c.parcelas_pagas || 0) * (c.valor_parcela || 0);
    return sum + valorPago;
  }, 0);

  const investimentoConsorciosPendente = consorciosFiltrados.reduce((sum, c) => {
    const parcelasRestantes = (c.parcelas_total || 0) - (c.parcelas_pagas || 0);
    const valorPendente = parcelasRestantes * (c.valor_parcela || 0);
    return sum + valorPendente;
  }, 0);

  // NOVOS CÁLCULOS: JUROS SOBRE RENDIMENTOS
  const jurosClientesPagos = filtrarPorEmpreendimento(pagamentosClientes)
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_juros || 0) + (p.valor_multa || 0), 0);

  const rendimentosInvestimentos = filtrarPorEmpreendimento(investimentos)
    .filter(i => i.status === 'resgatado' && i.valor_resgatado)
    .reduce((sum, i) => {
      const rendimento = (i.valor_resgatado || 0) - (i.valor_aplicado || 0);
      return sum + (rendimento > 0 ? rendimento : 0);
    }, 0);

  const rendimentosConsorcios = filtrarPorEmpreendimento(faturasConsorcios)
    .filter(f => f.status === 'pago' && f.valor_fundo_reserva)
    .reduce((sum, f) => {
      // Considerar rendimentos sacados do fundo de reserva (se houver)
      return sum + 0; // Ajustar conforme lógica específica
    }, 0);

  const totalJurosRendimentos = jurosClientesPagos + rendimentosInvestimentos + rendimentosConsorcios;

  // NOVOS CÁLCULOS: CUSTOS SOBRE APORTES
  const jurosPagosFornecedores = filtrarPorEmpreendimento(pagamentosFornecedores)
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_juros || 0) + (p.valor_multa || 0), 0);

  const taxasAdministracaoConsorcios = filtrarPorEmpreendimento(faturasConsorcios)
    .filter(f => f.status === 'pago')
    .reduce((sum, f) => sum + (f.valor_taxa_administracao || 0), 0);

  const totalCustosAportes = jurosPagosFornecedores + taxasAdministracaoConsorcios;

  // NOVOS CÁLCULOS: FUNDO RESERVA APORTADO
  const totalFundoReserva = filtrarPorEmpreendimento(faturasConsorcios)
    .filter(f => f.status === 'pago')
    .reduce((sum, f) => sum + (f.valor_fundo_reserva || 0), 0);

  // NOVOS CÁLCULOS: LANCES
  const valorLancesOfertados = filtrarPorEmpreendimento(lances)
    .reduce((sum, l) => sum + (l.valor_lance || 0), 0);

  const valorLancesAPagar = filtrarPorEmpreendimento(pagamentosFornecedores)
    .filter(p => p.tipo === 'lance_consorcio' && (p.status === 'pendente' || p.status === 'atrasado'))
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const saldoReal = (receitasPagas + aportesSociosPagos) - (despesasPagas + investimentoConsorcios);
  const projecaoSaldo = saldoReal + receitasPendentes + aportesSociosPendentes - despesasPendentes - investimentoConsorciosPendente;

  const hoje = new Date();
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    meses.push(subMonths(hoje, i));
  }

  const dadosGrafico = meses.map(mes => {
    const inicioMes = startOfMonth(mes);
    const fimMes = endOfMonth(mes);

    const receitas = filtrarPorEmpreendimento(pagamentosClientes)
      .filter(p => {
        if (!p.data_pagamento) return false;
        const dataPag = parseISO(p.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && p.status === 'pago';
      })
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    const despesas = filtrarPorEmpreendimento(pagamentosFornecedores)
      .filter(p => {
        if (!p.data_pagamento) return false;
        const dataPag = parseISO(p.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && p.status === 'pago';
      })
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    const aportes = filtrarPorEmpreendimento(aportesSocios)
      .filter(a => {
        if (!a.data_pagamento) return false;
        const dataPag = parseISO(a.data_pagamento);
        return dataPag >= inicioMes && dataPag <= fimMes && a.status === 'pago';
      })
      .reduce((sum, a) => sum + (a.valor || 0), 0);

    const entradas = receitas + aportes;
    const saidas = despesas;

    return {
      mes: format(mes, "MMM/yy", { locale: ptBR }),
      receitas,
      despesas,
      aportes,
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--wine-700)]">Fluxo de Caixa</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Acompanhe entradas, saídas e aplicações</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={selectedEmp} onValueChange={setSelectedEmp} className="w-full sm:w-64">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Empreendimentos</SelectItem>
              {empreendimentos.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUnidade} onValueChange={setSelectedUnidade} className="w-full sm:w-64">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Unidades</SelectItem>
              {unidades.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">💰 Entradas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-lg border-t-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Receitas de Clientes</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    R$ {receitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Pendente: R$ {receitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Aportes de Sócios</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    R$ {aportesSociosPagos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Pendente: R$ {aportesSociosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-[var(--grape-600)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total de Entradas</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    R$ {(receitasPagas + aportesSociosPagos).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">📤 Saídas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-lg border-t-4 border-red-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Despesas com Fornecedores</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Pendente: R$ {despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Investimento em Consórcios</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    R$ {investimentoConsorcios.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    A pagar: R$ {investimentoConsorciosPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <CircleDollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total de Saídas</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    R$ {(despesasPagas + investimentoConsorcios).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NOVOS CARDS: JUROS, CUSTOS E FUNDO RESERVA */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">⚡ Juros, Custos e Fundos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-lg border-t-4 border-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Juros sobre Rendimentos</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-700">
                    R$ {totalJurosRendimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Juros + Rendimentos</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-rose-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Custos sobre Aportes</p>
                  <p className="text-xl sm:text-2xl font-bold text-rose-700">
                    R$ {totalCustosAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Juros + Taxas</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-100">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-sky-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Fundo Reserva Aportado</p>
                  <p className="text-xl sm:text-2xl font-bold text-sky-700">
                    R$ {totalFundoReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total nos Consórcios</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-100">
                  <PiggyBank className="w-6 h-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-amber-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Lances Ofertados</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700">
                    R$ {valorLancesOfertados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">A Pagar: R$ {valorLancesAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">📊 A Receber e A Pagar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg border-t-4 border-cyan-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total A Receber</p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-700">
                    R$ {(receitasPendentes + aportesSociosPendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      Clientes: R$ {receitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Sócios: R$ {aportesSociosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-100">
                  <Clock className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-amber-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total A Pagar</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700">
                    R$ {(despesasPendentes + investimentoConsorciosPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      Fornecedores: R$ {despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Consórcios: R$ {investimentoConsorciosPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">💼 Saldo e Aplicações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Saldo Real em Caixa</p>
                  <p className={`text-xl sm:text-2xl font-bold ${saldoReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {saldoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-indigo-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Aplicações (Consórcios)</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    R$ {investimentoConsorcios.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {consorciosFiltrados.length} consórcio(s)
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <PiggyBank className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-t-4 border-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Projeção de Saldo</p>
                  <p className={`text-xl sm:text-2xl font-bold ${projecaoSaldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {projecaoSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] text-base sm:text-lg">Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="#10b981" name="Receitas Clientes" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="aportes" fill="#3b82f6" name="Aportes Sócios" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] text-base sm:text-lg">Saldo Acumulado</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="var(--wine-600)" 
                    strokeWidth={3}
                    name="Saldo"
                    dot={{ fill: 'var(--wine-600)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
