import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PosicaoCaixa() {
  const [caixaSelecionado, setCaixaSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ['movimentacoes_caixa'],
    queryFn: () => base44.entities.MovimentacaoCaixa.list('-data_movimentacao'),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list(),
  });

  const { data: tiposDespesa = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const caixa = caixas.find(c => c.id === caixaSelecionado);

  const movimentacoesFiltradas = movimentacoes.filter(m => {
    if (m.caixa_id !== caixaSelecionado) return false;
    
    try {
      const dataMov = parseISO(m.data_movimentacao);
      return isWithinInterval(dataMov, {
        start: parseISO(dataInicio),
        end: parseISO(dataFim)
      });
    } catch {
      return false;
    }
  }).sort((a, b) => new Date(a.data_movimentacao) - new Date(b.data_movimentacao));

  const totalEntradas = movimentacoesFiltradas
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalSaidas = movimentacoesFiltradas
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const saldoInicial = caixa?.saldo_inicial || 0;
  const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

  const exportarPDF = () => {
    // Implementar exportação PDF
    alert('Funcionalidade de exportação será implementada');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Posição de Caixa</h1>
          <p className="text-gray-600 mt-1">Extrato detalhado de movimentações</p>
        </div>
        {caixaSelecionado && (
          <Button onClick={exportarPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Caixa *</Label>
              <Select value={caixaSelecionado} onValueChange={setCaixaSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um caixa..." />
                </SelectTrigger>
                <SelectContent>
                  {caixas.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {caixaSelecionado && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-gray-500">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Saldo Inicial</p>
                <p className="text-2xl font-bold text-gray-700">
                  R$ {saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Entradas</p>
                    <p className="text-2xl font-bold text-green-700">
                      R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Saídas</p>
                    <p className="text-2xl font-bold text-red-700">
                      R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${saldoFinal >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">Saldo Final</p>
                <p className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Extrato de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {movimentacoesFiltradas.length === 0 ? (
                <p className="text-center text-gray-500 py-12">Nenhuma movimentação no período</p>
              ) : (
                <div className="space-y-2">
                  {movimentacoesFiltradas.map(mov => {
                    const centroCusto = centrosCusto.find(cc => cc.id === mov.centro_custo_id);
                    const tipoDespesa = tiposDespesa.find(td => td.id === mov.tipo_despesa_id);

                    return (
                      <div
                        key={mov.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          mov.tipo === 'entrada' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={mov.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'}>
                                {mov.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                              </Badge>
                              <Badge variant="outline">
                                {mov.categoria?.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {format(parseISO(mov.data_movimentacao), "dd/MM/yyyy")}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900">{mov.descricao}</p>
                            {centroCusto && (
                              <p className="text-sm text-gray-600 mt-1">
                                Centro: {centroCusto.codigo} - {centroCusto.nome}
                              </p>
                            )}
                            {tipoDespesa && (
                              <p className="text-sm text-gray-600">
                                Tipo: {tipoDespesa.nome}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              mov.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {mov.tipo === 'entrada' ? '+' : '-'} R$ {mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}