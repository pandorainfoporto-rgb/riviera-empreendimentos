
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RelatorioDRE() {
  const [mesInicio, setMesInicio] = useState(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM"));
  const [mesFim, setMesFim] = useState(format(new Date(), "yyyy-MM"));
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");

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

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: () => base44.entities.Movimentacao.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list('ordem_exibicao_dre'),
  });

  const { data: tiposDespesa = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const { data: folhasPagamento = [] } = useQuery({
    queryKey: ['folhasPagamento'],
    queryFn: () => base44.entities.FolhaPagamento.list(),
  });

  // Filtrar por período
  const filtrarPorPeriodo = (item, campoData) => {
    if (!item) return false;
    try {
      const mesRef = item.mes_referencia || format(parseISO(item[campoData]), 'yyyy-MM');
      return mesRef >= mesInicio && mesRef <= mesFim;
    } catch {
      return false;
    }
  };

  const filtrarPorLoteamento = (item) => {
    if (loteamentoFilter === "todos") return true;
    return item.loteamento_id === loteamentoFilter;
  };

  const pagamentosClientesFiltrados = useMemo(() => {
    return pagamentosClientes.filter(p =>
      filtrarPorPeriodo(p, 'data_pagamento') &&
      filtrarPorLoteamento(p)
    );
  }, [pagamentosClientes, mesInicio, mesFim, loteamentoFilter]);

  const pagamentosFornecedoresFiltrados = useMemo(() => {
    return pagamentosFornecedores.filter(p =>
      filtrarPorPeriodo(p, 'data_pagamento') &&
      filtrarPorLoteamento(p)
    );
  }, [pagamentosFornecedores, mesInicio, mesFim, loteamentoFilter]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(m =>
      filtrarPorPeriodo(m, 'data_movimentacao') &&
      filtrarPorLoteamento(m)
    );
  }, [movimentacoes, mesInicio, mesFim, loteamentoFilter]);

  const folhasFiltradas = useMemo(() => {
    return folhasPagamento.filter(f =>
      filtrarPorPeriodo(f, 'data_vencimento') && (f.status === 'paga' || f.status === 'calculada')
    );
  }, [folhasPagamento, mesInicio, mesFim]);


  // RECEITAS
  const receitaVendas = pagamentosClientesFiltrados
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total_recebido || p.valor || 0), 0);

  const receitasFinanceiras = 0; // Implementar depois com investimentos

  const totalReceitaOperacional = receitaVendas;
  const totalOutrasReceitas = receitasFinanceiras;
  const receitaBruta = totalReceitaOperacional + totalOutrasReceitas;

  // CUSTOS E DESPESAS por Centro de Custo
  const despesasPorCentro = useMemo(() => {
    const expenses = {};

    centrosCusto.forEach(cc => {
      if (cc.eh_receita || !cc.consolidar_dre) return;

      let total = 0;

      // Pagamentos a fornecedores
      const pagsDoCC = pagamentosFornecedoresFiltrados.filter(p =>
        p.centro_custo_id === cc.id && p.status === 'pago'
      );
      total += pagsDoCC.reduce((sum, p) => sum + (p.valor_total_pago || p.valor || 0), 0);

      // Movimentações de caixa
      const movsDoCC = movimentacoesFiltradas.filter(m =>
        m.centro_custo_id === cc.id &&
        m.tipo === 'saida'
      );
      total += movsDoCC.reduce((sum, m) => sum + (m.valor || 0), 0);

      // Folha de pagamento
      // Only administrative expenses should include payroll costs based on the outline
      if (cc.nivel_dre === 'despesa_administrativa') {
        const folhasDoCC = folhasFiltradas.filter(f => f.centro_custo_id === cc.id);
        total += folhasDoCC.reduce((sum, f) => sum + (f.custo_total_empresa || 0), 0);
      }

      expenses[cc.id] = {
        centro: cc,
        valor: total
      };
    });
    return expenses;
  }, [centrosCusto, pagamentosFornecedoresFiltrados, movimentacoesFiltradas, folhasFiltradas]);


  const cmv = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'custo_mercadoria_vendida')
    .reduce((sum, d) => sum + d.valor, 0);

  const lucBruto = receitaBruta - cmv;

  const despesasOperacionais = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'despesa_operacional')
    .reduce((sum, d) => sum + d.valor, 0);

  const despesasAdministrativas = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'despesa_administrativa')
    .reduce((sum, d) => sum + d.valor, 0);

  const despesasComerciais = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'despesa_comercial')
    .reduce((sum, d) => sum + d.valor, 0);

  const lucroOperacional = lucBruto - despesasOperacionais - despesasAdministrativas - despesasComerciais;

  const despesasFinanceiras = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'despesa_financeira')
    .reduce((sum, d) => sum + d.valor, 0);

  const lucroAntesImposto = lucroOperacional + totalOutrasReceitas - despesasFinanceiras;

  const impostosTaxas = Object.values(despesasPorCentro)
    .filter(d => d.centro.nivel_dre === 'impostos_taxas')
    .reduce((sum, d) => sum + d.valor, 0);

  const lucroLiquido = lucroAntesImposto - impostosTaxas;

  const margemBruta = receitaBruta > 0 ? (lucBruto / receitaBruta) * 100 : 0;
  const margemOperacional = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0;
  const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

  const exportarPDF = () => {
    // This will print the whole page by default or follow media queries in CSS
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end mb-4">
          <Button onClick={exportarPDF} className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
      </div>

      <Card id="dre-content" className="shadow-lg print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] text-white print:bg-gray-100 print:text-gray-900">
          <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <span>Demonstração do Resultado do Exercício (DRE)</span>
            <span className="text-sm font-normal mt-2 md:mt-0">
              {format(parseISO(mesInicio + '-01'), "MMMM yyyy", { locale: ptBR })} até{' '}
              {format(parseISO(mesFim + '-01'), "MMMM yyyy", { locale: ptBR })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Filtros */}
          <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <Label>Período Início</Label>
              <Input
                type="month"
                value={mesInicio}
                onChange={(e) => setMesInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Período Fim</Label>
              <Input
                type="month"
                value={mesFim}
                onChange={(e) => setMesFim(e.target.value)}
              />
            </div>
            <div>
              <Label>Loteamento</Label>
              <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um loteamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {loteamentos.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DRE */}
          <div className="space-y-4">
            {/* RECEITA BRUTA */}
            <LinhaValor label="(+) RECEITA BRUTA" valor={receitaBruta} destaque className="text-blue-700" />

            {/* Detalhamento Receitas */}
            <div className="ml-6 space-y-1">
              <LinhaValor label="Receita de Vendas" valor={receitaVendas} />
              {totalOutrasReceitas > 0 && <LinhaValor label="Outras Receitas Financeiras" valor={totalOutrasReceitas} />}
            </div>

            <div className="border-t-2 border-gray-300 my-4" />

            {/* CMV */}
            <LinhaValor label="(-) CUSTO DA MERCADORIA VENDIDA (CMV)" valor={cmv} negativo className="text-orange-700" />

            {/* Detalhamento CMV */}
            <div className="ml-6 space-y-1">
              {Object.values(despesasPorCentro)
                .filter(d => d.centro.nivel_dre === 'custo_mercadoria_vendida')
                .map(d => (
                  <LinhaValor key={d.centro.id} label={d.centro.nome} valor={d.valor} small />
                ))}
            </div>

            <LinhaValor label="(=) LUCRO BRUTO" valor={lucBruto} destaque className="text-green-700" />
            <div className="text-sm text-gray-600 ml-6">Margem Bruta: {margemBruta.toFixed(2)}%</div>

            <div className="border-t-2 border-gray-300 my-4" />

            {/* DESPESAS OPERACIONAIS */}
            <LinhaValor label="(-) DESPESAS OPERACIONAIS" valor={despesasOperacionais} negativo className="text-red-700" />

            <div className="ml-6 space-y-1">
              {Object.values(despesasPorCentro)
                .filter(d => d.centro.nivel_dre === 'despesa_operacional')
                .map(d => (
                  <LinhaValor key={d.centro.id} label={d.centro.nome} valor={d.valor} small />
                ))}
            </div>

            {/* DESPESAS ADMINISTRATIVAS */}
            <LinhaValor label="(-) DESPESAS ADMINISTRATIVAS" valor={despesasAdministrativas} negativo className="text-red-700" />

            <div className="ml-6 space-y-1">
              {Object.values(despesasPorCentro)
                .filter(d => d.centro.nivel_dre === 'despesa_administrativa')
                .map(d => (
                  <LinhaValor key={d.centro.id} label={d.centro.nome} valor={d.valor} small />
                ))}
            </div>

            {/* DESPESAS COMERCIAIS */}
            <LinhaValor label="(-) DESPESAS COMERCIAIS" valor={despesasComerciais} negativo className="text-red-700" />

            <div className="ml-6 space-y-1">
              {Object.values(despesasPorCentro)
                .filter(d => d.centro.nivel_dre === 'despesa_comercial')
                .map(d => (
                  <LinhaValor key={d.centro.id} label={d.centro.nome} valor={d.valor} small />
                ))}
            </div>

            <LinhaValor label="(=) LUCRO OPERACIONAL" valor={lucroOperacional} destaque className="text-green-700" />
            <div className="text-sm text-gray-600 ml-6">Margem Operacional: {margemOperacional.toFixed(2)}%</div>

            <div className="border-t-2 border-gray-300 my-4" />

            {/* RESULTADO FINANCEIRO */}
            <LinhaValor label="(-) DESPESAS FINANCEIRAS" valor={despesasFinanceiras} negativo className="text-red-700" />

            <LinhaValor label="(=) LUCRO ANTES IMPOSTOS" valor={lucroAntesImposto} destaque className="text-purple-700" />

            <div className="border-t-2 border-gray-300 my-4" />

            {/* IMPOSTOS */}
            <LinhaValor label="(-) IMPOSTOS E TAXAS" valor={impostosTaxas} negativo className="text-red-700" />

            <div className="ml-6 space-y-1">
              {Object.values(despesasPorCentro)
                .filter(d => d.centro.nivel_dre === 'impostos_taxas')
                .map(d => (
                  <LinhaValor key={d.centro.id} label={d.centro.nome} valor={d.valor} small />
                ))}
            </div>

            <div className="border-t-4 border-[var(--wine-600)] my-4" />

            {/* LUCRO LÍQUIDO */}
            <LinhaValor
              label="(=) LUCRO LÍQUIDO DO PERÍODO"
              valor={lucroLiquido}
              destaque
              className={lucroLiquido >= 0 ? "text-green-700 text-2xl" : "text-red-700 text-2xl"}
            />
            <div className="text-sm text-gray-600 ml-6">Margem Líquida: {margemLiquida.toFixed(2)}%</div>
          </div>

          {/* Indicadores */}
          <div className="grid md:grid-cols-3 gap-4 mt-8 pt-8 border-t">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Margem Bruta</p>
                <p className="text-3xl font-bold text-blue-700">{margemBruta.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Margem Operacional</p>
                <p className="text-3xl font-bold text-purple-700">{margemOperacional.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${lucroLiquido >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Margem Líquida</p>
                <p className={`text-3xl font-bold ${lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {margemLiquida.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LinhaValor({ label, valor, destaque = false, negativo = false, small = false, className = "" }) {
  const displayValor = Math.abs(valor);
  const valorColorClass = negativo && valor > 0 ? "text-red-600" : (valor < 0 ? "text-red-600" : (destaque && valor > 0 ? "text-green-700" : "")); // Add green for positive destaque values

  return (
    <div className={`flex justify-between items-center py-2 ${destaque ? 'bg-gray-50 px-4 rounded-lg font-bold' : ''} ${small ? 'text-sm' : ''}`}>
      <span className={`${className || 'text-gray-700'} ${destaque && !className.includes('text-') ? 'text-gray-900' : ''}`}>{label}</span>
      <span className={`${className || 'text-gray-900'} ${destaque ? 'text-xl' : ''} font-semibold ${valorColorClass}`}>
        {negativo && valor > 0 ? '- ' : ''}R$ {displayValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
