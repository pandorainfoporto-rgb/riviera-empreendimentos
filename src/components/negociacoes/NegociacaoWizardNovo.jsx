import React, { useState, useEffect, useCallback } from "react";
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
import MapaLoteamento from "../loteamentos/MapaLoteamento";
import SearchClienteDialog from "../shared/SearchClienteDialog";
import SearchImobiliariaDialog from "../shared/SearchImobiliariaDialog";
import SearchCorretorDialog from "../shared/SearchCorretorDialog";
import SimulacaoFinanciamento from "./SimulacaoFinanciamento";
import { toast } from "sonner";

const steps = [
  { id: 1, name: "Cliente", icon: User },
  { id: 2, name: "Intenção/Custo", icon: FileText },
  { id: 3, name: "Valores", icon: DollarSign },
  { id: 4, name: "Parcelamento", icon: Calendar },
  { id: 5, name: "Correção", icon: TrendingUp },
  { id: 6, name: "Comissões", icon: FileText },
  { id: 7, name: "Revisão", icon: Check },
];

export default function NegociacaoWizardNovo({ item, clientes, onSubmit, onCancel, isProcessing }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(item || {
    cliente_id: "",
    intencao_compra_id: "",
    custo_obra_id: "",
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
    data_inicio: new Date().toISOString().split('T')[0],
    dia_vencimento: 10,
    tipo_correcao: "nenhuma",
    percentual_correcao: 0,
    tabela_correcao: "nenhuma",
    mes_correcao_anual: 1,
    status: "rascunho",
    observacoes: "",
  });

  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showImobiliariaSearch, setShowImobiliariaSearch] = useState(false);
  const [showCorretorSearch, setShowCorretorSearch] = useState(false);
  const [buscandoIndice, setBuscandoIndice] = useState(false);

  const { data: intencoes = [] } = useQuery({
    queryKey: ['intencoes_cliente', formData.cliente_id],
    queryFn: () => base44.entities.IntencaoCompra.filter({ 
      cliente_id: formData.cliente_id,
      status: { $in: ['aprovado', 'aguardando_projeto'] }
    }),
    enabled: !!formData.cliente_id,
  });

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_intencao', formData.intencao_compra_id],
    queryFn: () => base44.entities.CustoObra.filter({ 
      intencao_compra_id: formData.intencao_compra_id,
      status: { $in: ['aprovado', 'orcamento'] }
    }),
    enabled: !!formData.intencao_compra_id,
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos_neg'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias_neg'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores_neg'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  const corretoresFiltrados = formData.imobiliaria_id
    ? corretores.filter(c => c.imobiliaria_id === formData.imobiliaria_id)
    : corretores;

  // Atualizar valor_total quando custo_obra mudar
  useEffect(() => {
    if (formData.custo_obra_id) {
      const custo = custosObra.find(c => c.id === formData.custo_obra_id);
      if (custo && custo.valor_total_estimado > 0) {
        setFormData(prev => ({ ...prev, valor_total: custo.valor_total_estimado }));
      }
    }
  }, [formData.custo_obra_id, custosObra]);

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

  const buscarIndiceEconomico = useCallback(async (tabelaCorrecao) => {
    if (!tabelaCorrecao || tabelaCorrecao === "nenhuma" || tabelaCorrecao === "personalizada") return;

    setBuscandoIndice(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Qual é o valor acumulado nos últimos 12 meses do índice ${tabelaCorrecao.toUpperCase()}? Retorne apenas o valor numérico em percentual.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            valor_percentual: { type: "number" },
            periodo: { type: "string" },
          }
        }
      });

      if (response?.valor_percentual) {
        setFormData(prev => ({
          ...prev,
          percentual_correcao: response.valor_percentual,
          tabela_correcao: tabelaCorrecao
        }));
        toast.success(`${tabelaCorrecao.toUpperCase()}: ${response.valor_percentual}%`);
      }
    } catch (error) {
      toast.error("Erro ao buscar índice");
    } finally {
      setBuscandoIndice(false);
    }
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1: return formData.cliente_id;
      case 2: return formData.intencao_compra_id && formData.custo_obra_id;
      case 3: return formData.valor_total > 0 && formData.data_inicio;
      case 4: return formData.quantidade_parcelas_mensais > 0;
      case 5:
      case 6:
      case 7: return true;
      default: return false;
    }
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [canProceed, currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (!formData.cliente_id || !formData.intencao_compra_id || !formData.custo_obra_id || !formData.valor_total) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    onSubmit(formData);
  }, [formData, onSubmit]);

  const saldoFinanciar = formData.valor_total - formData.valor_entrada;

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        Selecione o Cliente
      </h3>
      
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Cliente *
          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowClienteSearch(true)}>
            <Search className="w-3 h-3" />
          </Button>
        </Label>
        <Input
          value={clientes?.find(c => c.id === formData.cliente_id)?.nome || ""}
          disabled
          className="bg-gray-100"
          placeholder="Clique na lupa para selecionar..."
        />
      </div>

      {formData.cliente_id && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Cliente selecionado! Clique em Próximo.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Intenção de Compra e Custo de Obra
      </h3>

      <div className="space-y-2">
        <Label>Intenção de Compra *</Label>
        <Select
          value={formData.intencao_compra_id}
          onValueChange={(value) => setFormData({ ...formData, intencao_compra_id: value, custo_obra_id: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma intenção..." />
          </SelectTrigger>
          <SelectContent>
            {intencoes.length === 0 && (
              <SelectItem value="_empty" disabled>Nenhuma intenção disponível</SelectItem>
            )}
            {intencoes.map(i => {
              const loteamento = loteamentos.find(l => l.id === i.loteamento_id);
              return (
                <SelectItem key={i.id} value={i.id}>
                  {loteamento?.nome || 'N/A'} - {i.padrao_imovel} - {i.area_construida_desejada}m²
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {formData.intencao_compra_id && (
        <div className="space-y-2">
          <Label>Custo de Obra *</Label>
          <Select
            value={formData.custo_obra_id}
            onValueChange={(value) => setFormData({ ...formData, custo_obra_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um custo..." />
            </SelectTrigger>
            <SelectContent>
              {custosObra.length === 0 && (
                <SelectItem value="_empty" disabled>Nenhum custo disponível para esta intenção</SelectItem>
              )}
              {custosObra.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} - R$ {(c.valor_total_estimado || 0).toLocaleString('pt-BR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.intencao_compra_id && formData.custo_obra_id && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Intenção e custo selecionados!
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
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
        <p className="text-xs text-gray-500">Baseado no custo de obra selecionado</p>
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
          onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) || 1 })}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
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
          <InputCurrency value={formData.valor_entrada} disabled className="bg-gray-100 font-semibold" />
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
          <span className="font-bold text-purple-900">R$ {saldoFinanciar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
          <InputCurrency value={formData.valor_parcela_mensal} disabled className="bg-gray-100 font-semibold" />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Correção Monetária
      </h3>

      <div className="space-y-2">
        <Label>Tipo de Correção</Label>
        <Select value={formData.tipo_correcao} onValueChange={(value) => setFormData({ ...formData, tipo_correcao: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label>Tabela/Índice</Label>
            <Select
              value={formData.tabela_correcao}
              onValueChange={(value) => {
                setFormData({ ...formData, tabela_correcao: value });
                if (value !== "nenhuma" && value !== "personalizada") buscarIndiceEconomico(value);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
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
              onChange={(e) => setFormData({ ...formData, percentual_correcao: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Comissões (Opcional)
      </h3>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Imobiliária
          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowImobiliariaSearch(true)}>
            <Search className="w-3 h-3" />
          </Button>
        </Label>
        <Input
          value={imobiliarias.find(i => i.id === formData.imobiliaria_id)?.nome || ""}
          disabled
          className="bg-gray-100"
          placeholder="Clique na lupa..."
        />
      </div>

      {formData.imobiliaria_id && (
        <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border">
          <div className="space-y-2">
            <Label>Comissão (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.comissao_imobiliaria_percentual}
              onChange={(e) => setFormData({ ...formData, comissao_imobiliaria_percentual: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <InputCurrency value={formData.comissao_imobiliaria_valor} disabled className="bg-gray-100 font-semibold" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Corretor
          <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowCorretorSearch(true)} disabled={!formData.imobiliaria_id}>
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
        <div className="grid md:grid-cols-2 gap-4 p-3 bg-white rounded border">
          <div className="space-y-2">
            <Label>Comissão (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.comissao_corretor_percentual}
              onChange={(e) => setFormData({ ...formData, comissao_corretor_percentual: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <InputCurrency value={formData.comissao_corretor_valor} disabled className="bg-gray-100 font-semibold" />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep7 = () => {
    const intencao = intencoes.find(i => i.id === formData.intencao_compra_id);
    const custo = custosObra.find(c => c.id === formData.custo_obra_id);
    const loteamento = loteamentos.find(l => l.id === intencao?.loteamento_id);

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Revisão Final
        </h3>

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Cliente</p>
            <p className="font-semibold">{clientes?.find(c => c.id === formData.cliente_id)?.nome}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Intenção de Compra</p>
            <p className="font-semibold">{loteamento?.nome} - {intencao?.padrao_imovel}</p>
            <p className="text-sm text-gray-600">{intencao?.area_construida_desejada}m²</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Custo de Obra</p>
            <p className="font-semibold">{custo?.nome}</p>
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
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Parcelas Mensais</p>
              <p className="font-semibold text-purple-700">
                {formData.quantidade_parcelas_mensais}x de R$ {formData.valor_parcela_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

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
    );
  };

  return (
    <>
      <Card className="mb-6 shadow-lg border-t-4 border-[var(--wine-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)]">
            {item?.id ? "Editar Negociação" : "Nova Negociação"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 justify-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? 'bg-[var(--wine-600)] text-white' :
                    currentStep > step.id ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'} mx-2`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">{steps.find(s => s.id === currentStep)?.name}</p>
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
          {currentStep === 7 && renderStep7()}
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
              Criar Negociação
            </Button>
          )}
        </CardFooter>
      </Card>

      <SearchClienteDialog
        open={showClienteSearch}
        onClose={() => setShowClienteSearch(false)}
        clientes={clientes || []}
        onSelect={(cliente) => {
          setFormData(prev => ({ ...prev, cliente_id: cliente.id }));
          setShowClienteSearch(false);
        }}
      />

      <SearchImobiliariaDialog
        open={showImobiliariaSearch}
        onClose={() => setShowImobiliariaSearch(false)}
        imobiliarias={imobiliarias || []}
        onSelect={(imobiliaria) => {
          setFormData(prev => ({ ...prev, imobiliaria_id: imobiliaria.id, corretor_id: "" }));
          setShowImobiliariaSearch(false);
        }}
      />

      <SearchCorretorDialog
        open={showCorretorSearch}
        onClose={() => setShowCorretorSearch(false)}
        corretores={corretoresFiltrados || []}
        onSelect={(corretor) => {
          setFormData(prev => ({ ...prev, corretor_id: corretor.id }));
          setShowCorretorSearch(false);
        }}
      />
    </>
  );
}