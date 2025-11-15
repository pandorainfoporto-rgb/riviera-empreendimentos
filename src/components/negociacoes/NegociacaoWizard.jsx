import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Check, User, Home, DollarSign, Calendar, FileText, Search, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InputCurrency } from "@/components/ui/input-currency";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SearchClienteDialog from "../shared/SearchClienteDialog";
import SearchUnidadeDialog from "../shared/SearchUnidadeDialog";
import SearchImobiliariaDialog from "../shared/SearchImobiliariaDialog";
import SearchCorretorDialog from "../shared/SearchCorretorDialog";
import SimulacaoFinanciamento from "./SimulacaoFinanciamento";
import { toast } from "sonner";

const steps = [
  { id: 1, name: "Cliente e Unidade", icon: User },
  { id: 2, name: "Valores", icon: DollarSign },
  { id: 3, name: "Parcelamento", icon: Calendar },
  { id: 4, name: "Correção", icon: TrendingUp },
  { id: 5, name: "Comissões", icon: FileText },
  { id: 6, name: "Revisão", icon: Check },
];

export default function NegociacaoWizard({ item, clientes, unidades, onSubmit, onCancel, isProcessing }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(item || {
    cliente_id: "",
    unidade_id: "",
    imobiliaria_id: "",
    corretor_id: "",
    comissao_imobiliaria_percentual: 0,
    comissao_imobiliaria_valor: 0,
    comissao_corretor_percentual: 0,
    comissao_corretor_valor: 0,
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
    status: "aguardando_assinatura_contrato",
    observacoes: "",
  });

  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showUnidadeSearch, setShowUnidadeSearch] = useState(false);
  const [showImobiliariaSearch, setShowImobiliariaSearch] = useState(false);
  const [showCorretorSearch, setShowCorretorSearch] = useState(false);
  const [buscandoIndice, setBuscandoIndice] = useState(false);

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  const corretoresFiltrados = formData.imobiliaria_id
    ? corretores.filter(c => c.imobiliaria_id === formData.imobiliaria_id)
    : corretores;

  useEffect(() => {
    if (formData.valor_total > 0 && formData.percentual_entrada >= 0) {
      const valorEntrada = (formData.valor_total * formData.percentual_entrada) / 100;
      setFormData(prev => ({ ...prev, valor_entrada: valorEntrada }));
    }
  }, [formData.valor_total, formData.percentual_entrada]);

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

  useEffect(() => {
    if (formData.unidade_id && unidades.length > 0) {
      const selectedUnidade = unidades.find(u => u.id === formData.unidade_id);
      if (selectedUnidade && selectedUnidade.valor_venda > 0 && formData.valor_total !== selectedUnidade.valor_venda) {
        setFormData(prev => ({ ...prev, valor_total: selectedUnidade.valor_venda }));
      }
    }
  }, [formData.unidade_id, unidades]);

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
        setFormData(prev => ({ ...prev, percentual_correcao: 0 }));
      }
    } catch (error) {
      console.error("Erro ao buscar índice:", error);
      toast.error("Erro ao buscar índice econômico");
      setFormData(prev => ({ ...prev, percentual_correcao: 0 }));
    } finally {
      setBuscandoIndice(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.cliente_id && formData.unidade_id;
      case 2:
        return formData.valor_total > 0 && formData.data_inicio;
      case 3:
        return formData.quantidade_parcelas_mensais > 0;
      case 4:
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.cliente_id || !formData.unidade_id || !formData.valor_total) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    onSubmit(formData);
  };

  const unidadesFiltradas = unidades.filter(u => {
    if (!formData.cliente_id) return u.status === 'disponivel';
    return u.status === 'disponivel' || (u.cliente_id === formData.cliente_id && u.id === formData.unidade_id);
  });

  const saldoFinanciar = formData.valor_total - formData.valor_entrada;

  return (
    <>
      <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">
            {item?.id ? "Editar Negociação" : "Nova Negociação"}
          </CardTitle>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep === step.id ? 'bg-[var(--wine-600)] text-white' :
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-center hidden md:block">{step.name}</p>
                </div>
              ))}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {/* Step 1: Cliente e Unidade */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Selecione Cliente e Unidade
              </h3>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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
                  className="bg-gray-100"
                  placeholder="Clique na lupa para selecionar..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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
                  className="bg-gray-100"
                  placeholder="Clique na lupa para selecionar..."
                />
              </div>

              {formData.cliente_id && formData.unidade_id && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Cliente e unidade selecionados! Clique em Próximo para continuar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Valores */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Valores da Negociação
              </h3>

              <div className="space-y-2">
                <Label>Valor Total *</Label>
                <InputCurrency
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Dia do Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento}
                  onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Parcelamento */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Entrada e Parcelamento
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>% de Entrada</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentual_entrada}
                    onChange={(e) => setFormData({ ...formData, percentual_entrada: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Entrada</Label>
                  <InputCurrency
                    value={formData.valor_entrada}
                    disabled
                    className="bg-gray-100 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Parcelas da Entrada</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade_parcelas_entrada}
                  onChange={(e) => setFormData({ ...formData, quantidade_parcelas_entrada: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="p-3 bg-purple-50 rounded border border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Saldo a Financiar:</span>
                  <span className="font-bold text-purple-900">
                    R$ {saldoFinanciar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parcelas Mensais *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantidade_parcelas_mensais}
                    onChange={(e) => setFormData({ ...formData, quantidade_parcelas_mensais: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Parcela Mensal</Label>
                  <InputCurrency
                    value={formData.valor_parcela_mensal}
                    disabled
                    className="bg-gray-100 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Correção */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Correção Monetária
              </h3>

              <div className="space-y-2">
                <Label>Tipo de Correção</Label>
                <Select
                  value={formData.tipo_correcao}
                  onValueChange={(value) => setFormData({ ...formData, tipo_correcao: value })}
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
                    <Label className="flex items-center gap-2">
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
                      disabled={buscandoIndice}
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
                    <Label>Percentual (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.percentual_correcao || 0}
                      onChange={(e) => setFormData({ ...formData, percentual_correcao: parseFloat(e.target.value) })}
                      disabled={buscandoIndice}
                    />
                  </div>

                  {formData.tipo_correcao === "anual" && (
                    <div className="space-y-2">
                      <Label>Mês de Correção Anual</Label>
                      <Select
                        value={formData.mes_correcao_anual?.toString() || "1"}
                        onValueChange={(value) => setFormData({ ...formData, mes_correcao_anual: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
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
                </>
              )}
            </div>
          )}

          {/* Step 5: Comissões */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Comissões (Opcional)
              </h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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

              {formData.imobiliaria_id && (
                <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border border-purple-300">
                  <div className="space-y-2">
                    <Label>Comissão Imobiliária (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.comissao_imobiliaria_percentual}
                      onChange={(e) => setFormData({ ...formData, comissao_imobiliaria_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Comissão</Label>
                    <InputCurrency
                      value={formData.comissao_imobiliaria_valor}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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
                  placeholder={formData.imobiliaria_id ? "Clique na lupa..." : "Selecione imobiliária primeiro"}
                />
              </div>

              {formData.corretor_id && (
                <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border border-purple-300">
                  <div className="space-y-2">
                    <Label>Comissão Corretor (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.comissao_corretor_percentual}
                      onChange={(e) => setFormData({ ...formData, comissao_corretor_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Comissão</Label>
                    <InputCurrency
                      value={formData.comissao_corretor_valor}
                      disabled
                      className="bg-gray-100 font-semibold"
                    />
                  </div>
                </div>
              )}

              {!formData.imobiliaria_id && !formData.corretor_id && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 As comissões são opcionais. Clique em Próximo se não houver comissões.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Revisão */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Revisão Final
              </h3>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Cliente</p>
                  <p className="font-semibold">{clientes.find(c => c.id === formData.cliente_id)?.nome}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Unidade</p>
                  <p className="font-semibold">{unidades.find(u => u.id === formData.unidade_id)?.codigo}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {formData.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Entrada</p>
                    <p className="font-semibold text-blue-700">
                      R$ {formData.valor_entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{formData.quantidade_parcelas_entrada}x parcelas</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Parcelas Mensais</p>
                    <p className="font-semibold text-purple-700">
                      {formData.quantidade_parcelas_mensais}x de R$ {formData.valor_parcela_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {formData.tipo_correcao !== "nenhuma" && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-gray-600 mb-1">Correção Monetária</p>
                    <p className="font-semibold text-yellow-800">
                      {formData.tipo_correcao === "mensal" ? "Mensal" : "Anual"} - {formData.tabela_correcao.toUpperCase()} ({formData.percentual_correcao}%)
                    </p>
                  </div>
                )}

                {(formData.imobiliaria_id || formData.corretor_id) && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-gray-600 mb-2">Comissões</p>
                    {formData.imobiliaria_id && (
                      <p className="text-sm">
                        Imobiliária: R$ {formData.comissao_imobiliaria_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {formData.corretor_id && (
                      <p className="text-sm">
                        Corretor: R$ {formData.comissao_corretor_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <SimulacaoFinanciamento negociacao={formData} />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrev}
            disabled={isProcessing}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Finalizar Negociação
            </Button>
          )}
        </CardFooter>
      </Card>

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
        onOpenForm={() => {}}
      />

      <SearchImobiliariaDialog
        open={showImobiliariaSearch}
        onClose={() => setShowImobiliariaSearch(false)}
        imobiliarias={imobiliarias}
        onSelect={(imobiliaria) => {
          setFormData(prev => ({ ...prev, imobiliaria_id: imobiliaria.id, corretor_id: "" }));
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