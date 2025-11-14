
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Calculator, AlertCircle, Lock, Percent, Search, RefreshCw, TrendingUp } from "lucide-react"; // Added RefreshCw, TrendingUp icons
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SimulacaoFinanciamento from "./SimulacaoFinanciamento";
import SearchClienteDialog from "../shared/SearchClienteDialog";
import SearchUnidadeDialog from "../shared/SearchUnidadeDialog";
import SearchImobiliariaDialog from "../shared/SearchImobiliariaDialog";
import SearchCorretorDialog from "../shared/SearchCorretorDialog";
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast for notifications

export default function NegociacaoForm({ item, clientes, unidades, loteamentos, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    cliente_id: "",
    unidade_id: "",
    imobiliaria_id: "",
    corretor_id: "",
    comissao_imobiliaria_percentual: 0,
    comissao_imobiliaria_valor: 0,
    comissao_corretor_percentual: 0,
    comissao_corretor_valor: 0,
    comissao_gerada: false,
    valor_total: 0,
    percentual_entrada: 0,
    valor_entrada: 0,
    quantidade_parcelas_entrada: 1,
    quantidade_parcelas_mensais: 0,
    valor_parcela_mensal: 0,
    percentual_mensal: 0,
    data_inicio: "",
    dia_vencimento: 10,
    tipo_correcao: "nenhuma",
    percentual_correcao: 0,
    tabela_correcao: "nenhuma",
    mes_correcao_anual: 1,
    status: "ativa",
    observacoes: "",
  });

  // Atualizar formData quando item mudar (importante para pre-preenchimento)
  React.useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const [showSimulacao, setShowSimulacao] = useState(false);
  const [errosSimulacao, setErrosSimulacao] = useState([]);

  // New state variables for search dialogs
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showUnidadeSearch, setShowUnidadeSearch] = useState(false);
  const [showImobiliariaSearch, setShowImobiliariaSearch] = useState(false);
  const [showCorretorSearch, setShowCorretorSearch] = useState(false);
  const [showUnidadeForm, setShowUnidadeForm] = useState(false); // Assuming this is for creating/editing units
  const [editingUnidade, setEditingUnidade] = useState(null); // Assuming this holds unit data for editing

  const [buscandoIndice, setBuscandoIndice] = useState(false); // New state for index search loading

  // Buscar imobiliárias e corretores
  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  // Filtrar corretores da imobiliária selecionada
  const corretoresFiltrados = formData.imobiliaria_id
    ? corretores.filter(c => c.imobiliaria_id === formData.imobiliaria_id)
    : corretores;

  // Atualizar comissões quando imobiliária/corretor mudar
  useEffect(() => {
    if (formData.imobiliaria_id && formData.valor_total > 0) {
      const imobiliaria = imobiliarias.find(i => i.id === formData.imobiliaria_id);
      if (imobiliaria && formData.comissao_imobiliaria_percentual === 0) {
        const percentual = imobiliaria.percentual_comissao_padrao || 6;
        const valor = (formData.valor_total * percentual) / 100;
        setFormData(prev => ({
          ...prev,
          comissao_imobiliaria_percentual: percentual,
          comissao_imobiliaria_valor: valor,
        }));
      }
    }
  }, [formData.imobiliaria_id, formData.valor_total, imobiliarias]);

  useEffect(() => {
    if (formData.corretor_id && formData.valor_total > 0) {
      const corretor = corretores.find(c => c.id === formData.corretor_id);
      if (corretor && formData.comissao_corretor_percentual === 0) {
        const percentual = corretor.percentual_comissao_padrao || 3;
        const valor = (formData.valor_total * percentual) / 100;
        setFormData(prev => ({
          ...prev,
          comissao_corretor_percentual: percentual,
          comissao_corretor_valor: valor,
        }));
      }
    }
  }, [formData.corretor_id, formData.valor_total, corretores]);

  // Recalcular valor da comissão quando percentual mudar
  useEffect(() => {
    if (formData.valor_total > 0) {
      const valorImob = (formData.valor_total * formData.comissao_imobiliaria_percentual) / 100;
      const valorCorr = (formData.valor_total * formData.comissao_corretor_percentual) / 100;
      setFormData(prev => ({
        ...prev,
        comissao_imobiliaria_valor: valorImob,
        comissao_corretor_valor: valorCorr,
      }));
    }
  }, [formData.comissao_imobiliaria_percentual, formData.comissao_corretor_percentual, formData.valor_total]);

  // Verificar se pode prosseguir (cliente e unidade selecionados)
  const podeEditar = formData.cliente_id && formData.unidade_id;

  // Calcular valor da entrada baseado no percentual
  useEffect(() => {
    if (formData.valor_total > 0 && formData.percentual_entrada >= 0) {
      const valorEntrada = (formData.valor_total * formData.percentual_entrada) / 100;
      setFormData(prev => ({ ...prev, valor_entrada: valorEntrada }));
    }
  }, [formData.valor_total, formData.percentual_entrada]);

  // Calcular valor da parcela mensal e percentual mensal
  useEffect(() => {
    if (formData.valor_total > 0 && formData.valor_entrada >= 0 && formData.quantidade_parcelas_mensais > 0) {
      const saldoFinanciar = formData.valor_total - formData.valor_entrada;
      const valorParcela = saldoFinanciar / formData.quantidade_parcelas_mensais;
      const percentualMensal = (valorParcela / formData.valor_total) * 100;

      setFormData(prev => ({
        ...prev,
        valor_parcela_mensal: valorParcela,
        percentual_mensal: percentualMensal
      }));
    }
  }, [formData.valor_total, formData.valor_entrada, formData.quantidade_parcelas_mensais]);

  // Quando unidade mudar, atualizar valor total
  useEffect(() => {
    if (formData.unidade_id && unidades.length > 0) {
      const selectedUnidade = unidades.find(u => u.id === formData.unidade_id);
      if (selectedUnidade && selectedUnidade.valor_venda > 0) {
        if (formData.valor_total !== selectedUnidade.valor_venda) {
          setFormData(prev => ({ ...prev, valor_total: selectedUnidade.valor_venda }));
        }
      } else if (selectedUnidade && selectedUnidade.valor_venda === 0 && formData.valor_total !== 0) {
        setFormData(prev => ({ ...prev, valor_total: 0 }));
      }
    } else if (!formData.unidade_id && formData.valor_total !== 0) {
      setFormData(prev => ({ ...prev, valor_total: 0 }));
    }
  }, [formData.unidade_id, unidades]);

  // Função para buscar índice econômico automaticamente
  const buscarIndiceEconomico = async (tabelaCorrecao) => {
    if (!tabelaCorrecao || tabelaCorrecao === "nenhuma" || tabelaCorrecao === "personalizada") {
      return;
    }

    setBuscandoIndice(true);
    try {
      const prompt = `Qual é o valor acumulado nos últimos 12 meses do índice ${tabelaCorrecao.toUpperCase()}?
      Retorne apenas o valor numérico em percentual, exemplo: 3.45 para 3,45%.
      Use dados oficiais do IBGE ou FGV conforme o índice.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            valor_percentual: { type: "number" },
            periodo: { type: "string" },
            fonte: { type: "string" }
          }
        }
      });

      if (response && response.valor_percentual !== undefined && response.valor_percentual !== null) {
        setFormData(prev => ({
          ...prev,
          percentual_correcao: response.valor_percentual,
          tabela_correcao: tabelaCorrecao
        }));
        toast.success(`${tabelaCorrecao.toUpperCase()}: ${response.valor_percentual}% (${response.periodo || 'últimos 12 meses'})`);
      } else {
        toast.error(`Não foi possível obter o valor do índice ${tabelaCorrecao.toUpperCase()}.`);
        setFormData(prev => ({ ...prev, percentual_correcao: 0 })); // Reset if no value found
      }
    } catch (error) {
      console.error("Erro ao buscar índice:", error);
      toast.error("Erro ao buscar índice econômico");
      setFormData(prev => ({ ...prev, percentual_correcao: 0 })); // Reset on error
    } finally {
      setBuscandoIndice(false);
    }
  };

  const validarSimulacao = () => {
    const erros = [];

    if (!formData.cliente_id) {
      erros.push("Selecione um cliente");
    }

    if (!formData.unidade_id) {
      erros.push("Selecione uma unidade");
    }

    if (!formData.valor_total || formData.valor_total <= 0) {
      erros.push("Informe o valor total da negociação");
    }

    if (!formData.data_inicio) {
      erros.push("Informe a data de início");
    }

    if (!formData.quantidade_parcelas_mensais || formData.quantidade_parcelas_mensais <= 0) {
      erros.push("Informe a quantidade de parcelas mensais");
    }

    return erros;
  };

  const handleVerSimulacao = () => {
    const erros = validarSimulacao();

    if (erros.length > 0) {
      setErrosSimulacao(erros);
      setShowSimulacao(false);
    } else {
      setErrosSimulacao([]);
      setShowSimulacao(!showSimulacao);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.cliente_id || !formData.unidade_id) {
      alert("Selecione o cliente e a unidade");
      return;
    }

    onSubmit(formData);
  };

  const saldoFinanciar = formData.valor_total - formData.valor_entrada;
  const unidadesFiltradas = unidades.filter(u => {
    // Only show available units or the currently selected unit for editing.
    // If no client is selected, show all available units.
    if (!formData.cliente_id) return u.status === 'disponivel';
    return u.status === 'disponivel' || (u.cliente_id === formData.cliente_id && u.id === formData.unidade_id);
  });

  return (
    <>
      <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {item && item.id ? "Editar Negociação" : "Nova Negociação"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Seção Obrigatória - Cliente e Unidade */}
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Campos Obrigatórios</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id" className="text-red-900 flex items-center gap-2">
                    Cliente *
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowClienteSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={clientes.find(c => c.id === formData.cliente_id)?.nome || ""}
                    disabled
                    className="bg-gray-100 border-red-300"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_id" className="text-red-900 flex items-center gap-2">
                    Unidade *
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowUnidadeSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={unidades.find(u => u.id === formData.unidade_id)?.codigo || ""}
                    disabled
                    className="bg-gray-100 border-red-300"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>
              </div>

              {!podeEditar && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-700" />
                  <p className="text-sm text-yellow-800">
                    Selecione o cliente e a unidade para continuar
                  </p>
                </div>
              )}
            </div>

            {/* SEÇÃO DE COMISSÕES */}
            <div className={`p-4 bg-purple-50 border-2 border-purple-200 rounded-lg ${!podeEditar ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Percent className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Comissões (Opcional)</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="imobiliaria_id" className="flex items-center gap-2">
                    Imobiliária
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowImobiliariaSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={imobiliarias.find(i => i.id === formData.imobiliaria_id)?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corretor_id" className="flex items-center gap-2">
                    Corretor
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setShowCorretorSearch(true)}
                      disabled={!formData.imobiliaria_id}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={corretoresFiltrados.find(c => c.id === formData.corretor_id)?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder={formData.imobiliaria_id ? "Clique na lupa para selecionar..." : "Selecione imobiliária primeiro"}
                  />
                </div>
              </div>

              {formData.imobiliaria_id && (
                <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border border-purple-300">
                  <div className="space-y-2">
                    <Label htmlFor="comissao_imobiliaria_percentual">Comissão Imobiliária (%)</Label>
                    <Input
                      id="comissao_imobiliaria_percentual"
                      type="number"
                      step="0.01"
                      value={formData.comissao_imobiliaria_percentual}
                      onChange={(e) => setFormData({ ...formData, comissao_imobiliaria_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comissao_imobiliaria_valor">Valor Comissão</Label>
                    <Input
                      id="comissao_imobiliaria_valor"
                      type="number"
                      step="0.01"
                      value={formData.comissao_imobiliaria_valor}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              {formData.corretor_id && (
                <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border border-purple-300 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="comissao_corretor_percentual">Comissão Corretor (%)</Label>
                    <Input
                      id="comissao_corretor_percentual"
                      type="number"
                      step="0.01"
                      value={formData.comissao_corretor_percentual}
                      onChange={(e) => setFormData({ ...formData, comissao_corretor_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comissao_corretor_valor">Valor Comissão</Label>
                    <Input
                      id="comissao_corretor_valor"
                      type="number"
                      step="0.01"
                      value={formData.comissao_corretor_valor}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              {(formData.imobiliaria_id || formData.corretor_id) && (
                <Alert className="mt-3 border-purple-300 bg-purple-100">
                  <AlertDescription className="text-purple-800 text-sm">
                    💡 As comissões serão geradas automaticamente como contas a pagar após salvar a negociação.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Campos desabilitados até selecionar cliente e unidade */}
            <div className={!podeEditar ? 'opacity-50 pointer-events-none' : ''}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                    disabled={!podeEditar}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
                  <Input
                    id="dia_vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) })}
                    disabled={!podeEditar}
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg space-y-4">
                <h3 className="font-semibold text-[var(--wine-700)]">Valores da Negociação</h3>

                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total *</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                    required
                    className="text-lg font-semibold"
                    disabled={!podeEditar}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="percentual_entrada">% de Entrada</Label>
                    <Input
                      id="percentual_entrada"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percentual_entrada}
                      onChange={(e) => setFormData({ ...formData, percentual_entrada: parseFloat(e.target.value) || 0 })}
                      disabled={!podeEditar}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_entrada">Valor da Entrada</Label>
                    <Input
                      id="valor_entrada"
                      type="number"
                      step="0.01"
                      value={formData.valor_entrada}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_parcelas_entrada">Parcelas Entrada</Label>
                    <Input
                      id="quantidade_parcelas_entrada"
                      type="number"
                      min="1"
                      value={formData.quantidade_parcelas_entrada}
                      onChange={(e) => setFormData({ ...formData, quantidade_parcelas_entrada: parseInt(e.target.value) || 1 })}
                      disabled={!podeEditar}
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-[var(--wine-200)]">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Saldo a Financiar:</span>
                    <span className="font-bold text-[var(--wine-700)]">
                      R$ {saldoFinanciar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{(formData.valor_total > 0 ? (100 - formData.percentual_entrada) : 0).toFixed(2)}% do valor total</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_parcelas_mensais">Parcelas Mensais *</Label>
                    <Input
                      id="quantidade_parcelas_mensais"
                      type="number"
                      min="0"
                      value={formData.quantidade_parcelas_mensais}
                      onChange={(e) => setFormData({ ...formData, quantidade_parcelas_mensais: parseInt(e.target.value) || 0 })}
                      disabled={!podeEditar}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_parcela_mensal">Valor Parcela Mensal</Label>
                    <Input
                      id="valor_parcela_mensal"
                      type="number"
                      step="0.01"
                      value={formData.valor_parcela_mensal}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="percentual_mensal">% Mensal</Label>
                    <Input
                      id="percentual_mensal"
                      type="number"
                      step="0.01"
                      value={formData.percentual_mensal}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>

                {formData.valor_entrada > 0 && formData.quantidade_parcelas_entrada > 1 && (
                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Valor de cada parcela da entrada:</span>
                      <span className="font-bold text-purple-900">
                        R$ {(formData.valor_entrada / formData.quantidade_parcelas_entrada).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO DE CORREÇÃO */}
              <div className={`p-4 bg-green-50 border-2 border-green-200 rounded-lg ${!podeEditar ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Correção Monetária</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_correcao">Tipo de Correção</Label>
                    <Select
                      value={formData.tipo_correcao}
                      onValueChange={(value) => setFormData({ ...formData, tipo_correcao: value })}
                      disabled={!podeEditar}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma">Nenhuma</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipo_correcao !== "nenhuma" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="tabela_correcao" className="flex items-center gap-2">
                          Tabela/Índice
                          {buscandoIndice && <RefreshCw className="w-3 h-3 animate-spin" />}
                        </Label>
                        <Select
                          value={formData.tabela_correcao}
                          onValueChange={(value) => {
                            setFormData({ ...formData, tabela_correcao: value });
                            if (value !== "nenhuma" && value !== "personalizada") {
                              buscarIndiceEconomico(value);
                            }
                          }}
                          disabled={!podeEditar || buscandoIndice}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhuma">Nenhuma</SelectItem>
                            <SelectItem value="igpm">IGP-M</SelectItem>
                            <SelectItem value="ipca">IPCA</SelectItem>
                            <SelectItem value="incc">INCC</SelectItem>
                            <SelectItem value="personalizada">Personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="percentual_correcao" className="flex items-center">
                          Percentual (%)
                          {formData.tabela_correcao && formData.tabela_correcao !== "nenhuma" && formData.tabela_correcao !== "personalizada" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="ml-2 h-6 w-6"
                              onClick={() => buscarIndiceEconomico(formData.tabela_correcao)}
                              disabled={buscandoIndice}
                            >
                              <RefreshCw className={`w-3 h-3 ${buscandoIndice ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </Label>
                        <Input
                          id="percentual_correcao"
                          type="number"
                          step="0.01"
                          value={formData.percentual_correcao || 0}
                          onChange={(e) => setFormData({ ...formData, percentual_correcao: parseFloat(e.target.value) })}
                          disabled={!podeEditar || buscandoIndice}
                        />
                      </div>
                    </>
                  )}

                  {formData.tipo_correcao === "anual" && (
                    <div className="space-y-2">
                      <Label htmlFor="mes_correcao_anual">Mês de Correção Anual</Label>
                      <Select
                        value={formData.mes_correcao_anual?.toString() || "1"}
                        onValueChange={(value) => setFormData({ ...formData, mes_correcao_anual: parseInt(value) })}
                        disabled={!podeEditar}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                          ].map((mes, index) => (
                            <SelectItem key={index} value={(index + 1).toString()}>
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {buscandoIndice && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Buscando dados oficiais do índice na internet...
                    </p>
                  </div>
                )}

                {formData.tabela_correcao && !["nenhuma", "personalizada"].includes(formData.tabela_correcao) && formData.percentual_correcao > 0 && !buscandoIndice && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Índice {formData.tabela_correcao.toUpperCase()}: {formData.percentual_correcao}% nos últimos 12 meses
                    </p>
                  </div>
                )}
              </div>

              {errosSimulacao.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Para ver a simulação, preencha:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {errosSimulacao.map((erro, index) => (
                        <li key={index}>{erro}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleVerSimulacao}
                className="w-full hover:bg-yellow-100"
                disabled={!podeEditar}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {showSimulacao ? "Ocultar" : "Ver"} Simulação Completa
              </Button>


              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={!podeEditar}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  disabled={!podeEditar}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !podeEditar}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {item ? "Atualizar" : "Criar"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {showSimulacao && errosSimulacao.length === 0 && podeEditar && (
        <SimulacaoFinanciamento negociacao={formData} />
      )}

      {/* Search Dialogs */}
      <SearchClienteDialog
        open={showClienteSearch}
        onClose={() => setShowClienteSearch(false)}
        clientes={clientes}
        onSelect={(cliente) => {
          setFormData(prev => ({ ...prev, cliente_id: cliente.id }));
          setShowClienteSearch(false);
        }}
      />

      <SearchUnidadeDialog
        open={showUnidadeSearch}
        onClose={() => setShowUnidadeSearch(false)}
        unidades={unidadesFiltradas}
        onSelect={(unidade) => {
          setFormData(prev => ({ ...prev, unidade_id: unidade.id }));
          setShowUnidadeSearch(false);
        }}
        onOpenForm={(unidade) => {
          setEditingUnidade(unidade);
          setShowUnidadeForm(true);
          setShowUnidadeSearch(false);
        }}
      />

      <SearchImobiliariaDialog
        open={showImobiliariaSearch}
        onClose={() => setShowImobiliariaSearch(false)}
        imobiliarias={imobiliarias}
        onSelect={(imobiliaria) => {
          setFormData(prev => ({ ...prev, imobiliaria_id: imobiliaria.id, corretor_id: "" })); // Clear corretor when imobiliaria changes
          setShowImobiliariaSearch(false);
        }}
      />

      <SearchCorretorDialog
        open={showCorretorSearch}
        onClose={() => setShowCorretorSearch(false)}
        corretores={corretoresFiltrados}
        onSelect={(corretor) => {
          setFormData(prev => ({ ...prev, corretor_id: corretor.id }));
          setShowCorretorSearch(false);
        }}
      />
    </>
  );
}
