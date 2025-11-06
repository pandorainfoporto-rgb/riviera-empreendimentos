import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, TrendingUp, TrendingDown, Wallet, Award, Users, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function FluxoPorUnidade() {
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("todas");

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
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

  const { data: resgates = [] } = useQuery({
    queryKey: ['resgatesConsorcios'],
    queryFn: () => base44.entities.ResgateConsorcio.list(),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const unidadesFiltradas = unidadeSelecionada === "todas" 
    ? unidades 
    : unidades.filter(u => u.id === unidadeSelecionada);

  const calcularFluxoUnidade = (unidade) => {
    // 1. Pagamentos de clientes (entradas e parcelas pagas)
    const pagamentosRecebidos = pagamentosClientes
      .filter(p => p.unidade_id === unidade.id && p.status === 'pago')
      .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

    // 2. Resgates de consórcios alocados na unidade
    const resgatesAlocados = resgates
      .filter(r => r.unidade_id === unidade.id && r.alocado_unidade && r.status === 'concluido')
      .reduce((sum, r) => sum + (r.valor_liquido || 0), 0);

    // 3. Total disponível (inclui saldo_disponivel da unidade)
    const totalDisponivel = (unidade.saldo_disponivel || 0);

    // 4. Gastos já executados (pagamentos a fornecedores)
    const gastosExecutados = pagamentosFornecedores
      .filter(p => p.unidade_id === unidade.id && p.status === 'pago')
      .reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

    // 5. Gastos pendentes
    const gastosPendentes = pagamentosFornecedores
      .filter(p => p.unidade_id === unidade.id && (p.status === 'pendente' || p.status === 'atrasado'))
      .reduce((sum, p) => sum + (p.valor || 0), 0);

    // 6. Saldo projetado
    const saldoProjetado = totalDisponivel - gastosPendentes;

    return {
      pagamentosRecebidos,
      resgatesAlocados,
      totalDisponivel,
      gastosExecutados,
      gastosPendentes,
      saldoProjetado,
    };
  };

  // Calcular totais gerais
  const totaisGerais = unidadesFiltradas.reduce((acc, unidade) => {
    const fluxo = calcularFluxoUnidade(unidade);
    return {
      totalDisponivel: acc.totalDisponivel + fluxo.totalDisponivel,
      gastosExecutados: acc.gastosExecutados + fluxo.gastosExecutados,
      gastosPendentes: acc.gastosPendentes + fluxo.gastosPendentes,
      pagamentosRecebidos: acc.pagamentosRecebidos + fluxo.pagamentosRecebidos,
      resgatesAlocados: acc.resgatesAlocados + fluxo.resgatesAlocados,
    };
  }, {
    totalDisponivel: 0,
    gastosExecutados: 0,
    gastosPendentes: 0,
    pagamentosRecebidos: 0,
    resgatesAlocados: 0,
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Fluxo por Unidade</h1>
          <p className="text-gray-600 mt-1">Recursos disponíveis e gastos executados por unidade</p>
        </div>

        <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
          <SelectTrigger className="w-full md:w-64">
            <Building2 className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Unidades</SelectItem>
            {unidades.map(uni => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Disponível</p>
                <p className="text-2xl font-bold text-[var(--wine-700)]">
                  R$ {totaisGerais.totalDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Recebido de Clientes</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totaisGerais.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Resgates Alocados</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totaisGerais.resgatesAlocados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Gastos Executados</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {totaisGerais.gastosExecutados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Unidades */}
      <div className="grid md:grid-cols-2 gap-6">
        {unidadesFiltradas.map(unidade => {
          const fluxo = calcularFluxoUnidade(unidade);
          const loteamento = loteamentos.find(l => l.id === unidade.loteamento_id);
          const cliente = clientes.find(c => c.id === unidade.cliente_id);
          
          const percentualGasto = fluxo.totalDisponivel > 0 
            ? (fluxo.gastosExecutados / fluxo.totalDisponivel) * 100 
            : 0;

          return (
            <Card key={unidade.id} className="shadow-lg border-t-4 border-[var(--grape-500)] hover:shadow-xl transition-all">
              <CardHeader className="border-b bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)]">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow">
                      <Building2 className="w-6 h-6 text-[var(--wine-700)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--wine-700)]">{unidade.codigo}</h3>
                      <p className="text-sm text-gray-600">{loteamento?.nome}</p>
                    </div>
                  </div>
                  <Badge className="bg-[var(--wine-100)] text-[var(--wine-700)]">
                    {unidade.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {cliente && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-blue-700">{cliente.nome}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">💰 Saldo Disponível</span>
                    <span className="text-lg font-bold text-[var(--wine-700)]">
                      R$ {fluxo.totalDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagamentos Clientes:</span>
                      <span className="font-semibold text-green-600">
                        R$ {fluxo.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resgates Alocados:</span>
                      <span className="font-semibold text-blue-600">
                        R$ {fluxo.resgatesAlocados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">🔨 Gastos Executados</span>
                      <span className="text-lg font-bold text-red-600">
                        R$ {fluxo.gastosExecutados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Percentual Gasto</span>
                        <span className="font-semibold">{percentualGasto.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentualGasto} className="h-2" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-yellow-800">⏳ A Pagar</span>
                    <span className="text-lg font-bold text-yellow-700">
                      R$ {fluxo.gastosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className={`flex justify-between items-center p-3 rounded-lg border ${
                    fluxo.saldoProjetado >= 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <span className="text-sm font-medium">📊 Saldo Projetado</span>
                    <span className={`text-lg font-bold ${
                      fluxo.saldoProjetado >= 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      R$ {fluxo.saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unidadesFiltradas.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma unidade encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}