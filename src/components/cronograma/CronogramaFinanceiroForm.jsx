import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, Trash2, AlertTriangle, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { differenceInDays, format } from "date-fns";

const categorias = [
  { value: "projeto", label: "Projeto" },
  { value: "mao_de_obra", label: "Mão de Obra" },
  { value: "materiais", label: "Materiais" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "servicos", label: "Serviços" },
  { value: "impostos", label: "Impostos" },
  { value: "administrativo", label: "Administrativo" },
  { value: "financeiro", label: "Financeiro" },
  { value: "contingencia", label: "Contingência" },
  { value: "outros", label: "Outros" },
];

const statusOptions = [
  { value: "nao_iniciado", label: "Não Iniciado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "atrasado", label: "Atrasado" },
  { value: "pausado", label: "Pausado" },
  { value: "cancelado", label: "Cancelado" },
];

const prioridades = [
  { value: "baixa", label: "Baixa", cor: "bg-gray-500" },
  { value: "media", label: "Média", cor: "bg-blue-500" },
  { value: "alta", label: "Alta", cor: "bg-orange-500" },
  { value: "critica", label: "Crítica", cor: "bg-red-500" },
];

const tiposRelacao = [
  { value: "TI", label: "Término → Início (TI)" },
  { value: "II", label: "Início → Início (II)" },
  { value: "TT", label: "Término → Término (TT)" },
  { value: "IT", label: "Início → Término (IT)" },
];

const restricoes = [
  { value: "nenhuma", label: "Nenhuma restrição" },
  { value: "deve_pagar_em", label: "Deve pagar em" },
  { value: "nao_antes_de", label: "Não antes de" },
  { value: "nao_depois_de", label: "Não depois de" },
  { value: "o_mais_cedo_possivel", label: "O mais cedo possível" },
  { value: "o_mais_tarde_possivel", label: "O mais tarde possível" },
];

export default function CronogramaFinanceiroForm({ 
  item, 
  unidades = [], 
  cronogramasObra = [],
  itensFinanceiros = [],
  fornecedores = [], 
  onSubmit, 
  onCancel, 
  isProcessing 
}) {
  const [formData, setFormData] = useState(item || {
    unidade_id: "",
    cronograma_obra_id: "",
    wbs: "",
    nivel_hierarquia: 1,
    item_pai_id: "",
    eh_marco_financeiro: false,
    eh_item_resumo: false,
    categoria: "materiais",
    descricao: "",
    data_prevista_inicio: "",
    data_prevista_fim: "",
    data_real_inicio: "",
    data_real_fim: "",
    duracao_prevista_dias: 0,
    custo_planejado: 0,
    valor_agregado: 0,
    custo_real: 0,
    percentual_fisico_completo: 0,
    percentual_financeiro_completo: 0,
    status: "nao_iniciado",
    prioridade: "media",
    responsavel_financeiro: "",
    centro_custo: "",
    fornecedor_id: "",
    predecessoras_financeiras: [],
    restricao_tipo: "nenhuma",
    restricao_data: "",
    condicoes_pagamento: {
      forma_pagamento: "a_vista",
      quantidade_parcelas: 1,
      valor_entrada: 0,
      desconto_percentual: 0,
    },
    reserva_contingencia: 0,
    riscos_financeiros: [],
    ordem: (itensFinanceiros || []).length + 1,
    observacoes: "",
  });

  const [risco, setRisco] = useState({
    descricao: "",
    probabilidade: "media",
    impacto_financeiro: 0,
    mitigacao: "",
    valor_contingencia: 0,
  });

  // Calcular duração automaticamente
  useEffect(() => {
    if (formData.data_prevista_inicio && formData.data_prevista_fim) {
      const dias = differenceInDays(
        new Date(formData.data_prevista_fim),
        new Date(formData.data_prevista_inicio)
      );
      setFormData(prev => ({ ...prev, duracao_prevista_dias: dias }));
    }
  }, [formData.data_prevista_inicio, formData.data_prevista_fim]);

  // Calcular métricas EVM automaticamente
  useEffect(() => {
    const bcws = formData.custo_planejado || 0;
    const bcwp = formData.valor_agregado || 0;
    const acwp = formData.custo_real || 0;

    const cpi = acwp > 0 ? bcwp / acwp : 0;
    const spi = bcws > 0 ? bcwp / bcws : 0;
    const cv = bcwp - acwp;
    const sv = bcwp - bcws;

    const bac = bcws;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - acwp;
    const vac = bac - eac;

    setFormData(prev => ({
      ...prev,
      cpi: parseFloat(cpi.toFixed(4)),
      spi: parseFloat(spi.toFixed(4)),
      cv: parseFloat(cv.toFixed(2)),
      sv: parseFloat(sv.toFixed(2)),
      eac: parseFloat(eac.toFixed(2)),
      etc: parseFloat(etc.toFixed(2)),
      vac: parseFloat(vac.toFixed(2)),
    }));
  }, [formData.custo_planejado, formData.valor_agregado, formData.custo_real]);

  // Calcular valor agregado baseado no percentual
  useEffect(() => {
    const valorAgregado = (formData.custo_planejado || 0) * ((formData.percentual_financeiro_completo || 0) / 100);
    setFormData(prev => ({ ...prev, valor_agregado: parseFloat(valorAgregado.toFixed(2)) }));
  }, [formData.percentual_financeiro_completo, formData.custo_planejado]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Calcular caminho crítico (simplificado)
    const ehCritico = formData.folga_total === 0 && (formData.predecessoras_financeiras || []).length > 0;

    onSubmit({
      ...formData,
      caminho_critico_financeiro: ehCritico,
    });
  };

  const adicionarPredecessora = () => {
    setFormData({
      ...formData,
      predecessoras_financeiras: [
        ...(formData.predecessoras_financeiras || []),
        { item_id: "", tipo_relacao: "TI", defasagem_dias: 0 }
      ]
    });
  };

  const removerPredecessora = (index) => {
    setFormData({
      ...formData,
      predecessoras_financeiras: (formData.predecessoras_financeiras || []).filter((_, i) => i !== index)
    });
  };

  const atualizarPredecessora = (index, campo, valor) => {
    const novasPred = [...(formData.predecessoras_financeiras || [])];
    novasPred[index][campo] = valor;
    setFormData({ ...formData, predecessoras_financeiras: novasPred });
  };

  const adicionarRisco = () => {
    if (!risco.descricao) return;
    
    setFormData({
      ...formData,
      riscos_financeiros: [...(formData.riscos_financeiros || []), risco]
    });
    setRisco({
      descricao: "",
      probabilidade: "media",
      impacto_financeiro: 0,
      mitigacao: "",
      valor_contingencia: 0,
    });
  };

  const removerRisco = (index) => {
    setFormData({
      ...formData,
      riscos_financeiros: (formData.riscos_financeiros || []).filter((_, i) => i !== index)
    });
  };

  const cronogramasFiltrados = formData.unidade_id 
    ? (cronogramasObra || []).filter(c => c.unidade_id === formData.unidade_id)
    : [];

  const itensDisponiveis = (itensFinanceiros || []).filter(i => i.id !== item?.id);

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          {formData.eh_marco_financeiro && <DollarSign className="w-5 h-5 text-purple-600" />}
          {item ? "Editar Item Financeiro" : "Novo Item Financeiro"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="evm">EVM</TabsTrigger>
              <TabsTrigger value="dependencias">Dependências</TabsTrigger>
              <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
              <TabsTrigger value="riscos">Riscos</TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border">
                  <Checkbox
                    id="eh_marco_financeiro"
                    checked={formData.eh_marco_financeiro}
                    onCheckedChange={(checked) => setFormData({ ...formData, eh_marco_financeiro: checked })}
                  />
                  <Label htmlFor="eh_marco_financeiro" className="cursor-pointer font-semibold">
                    <DollarSign className="w-4 h-4 inline mr-2 text-purple-600" />
                    Marco Financeiro (Milestone)
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                  <Checkbox
                    id="eh_item_resumo"
                    checked={formData.eh_item_resumo}
                    onCheckedChange={(checked) => setFormData({ ...formData, eh_item_resumo: checked })}
                  />
                  <Label htmlFor="eh_item_resumo" className="cursor-pointer font-semibold">
                    Item Resumo (agrupa sub-itens)
                  </Label>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidade *</Label>
                  <Select
                    value={formData.unidade_id}
                    onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(unidades || []).map(uni => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>WBS Financeiro (F.1.2.3)</Label>
                  <Input
                    value={formData.wbs}
                    onChange={(e) => setFormData({ ...formData, wbs: e.target.value })}
                    placeholder="F.1.2.3"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nível Hierarquia</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.nivel_hierarquia}
                    onChange={(e) => setFormData({ ...formData, nivel_hierarquia: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map(prior => (
                        <SelectItem key={prior.value} value={prior.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${prior.cor}`} />
                            {prior.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vincular à Tarefa de Obra (Opcional)</Label>
                <Select
                  value={formData.cronograma_obra_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, cronograma_obra_id: value || null })}
                  disabled={!formData.unidade_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tarefa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {cronogramasFiltrados.map(cronograma => (
                      <SelectItem key={cronograma.id} value={cronograma.id}>
                        {cronograma.wbs ? `${cronograma.wbs} - ` : ''}{cronograma.etapa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do item"
                  rows={3}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data Início Prevista *</Label>
                  <Input
                    type="date"
                    value={formData.data_prevista_inicio}
                    onChange={(e) => setFormData({ ...formData, data_prevista_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim Prevista *</Label>
                  <Input
                    type="date"
                    value={formData.data_prevista_fim}
                    onChange={(e) => setFormData({ ...formData, data_prevista_fim: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (dias)</Label>
                  <div className="h-10 flex items-center px-3 bg-blue-50 rounded-md font-bold text-blue-700 border">
                    {formData.duracao_prevista_dias || 0} dias
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restrição de Pagamento</Label>
                  <Select
                    value={formData.restricao_tipo}
                    onValueChange={(value) => setFormData({ ...formData, restricao_tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {restricoes.map(rest => (
                        <SelectItem key={rest.value} value={rest.value}>
                          {rest.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.restricao_tipo !== 'nenhuma' && 
                 formData.restricao_tipo !== 'o_mais_cedo_possivel' && 
                 formData.restricao_tipo !== 'o_mais_tarde_possivel' && (
                  <div className="space-y-2">
                    <Label>Data da Restrição</Label>
                    <Input
                      type="date"
                      value={formData.restricao_data}
                      onChange={(e) => setFormData({ ...formData, restricao_data: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(st => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável Financeiro</Label>
                  <Input
                    value={formData.responsavel_financeiro}
                    onChange={(e) => setFormData({ ...formData, responsavel_financeiro: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Centro de Custo</Label>
                  <Input
                    value={formData.centro_custo}
                    onChange={(e) => setFormData({ ...formData, centro_custo: e.target.value })}
                    placeholder="Ex: CC-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={formData.fornecedor_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {(fornecedores || []).filter(f => f.ativo).map(forn => (
                      <SelectItem key={forn.id} value={forn.id}>
                        {forn.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* ABA EVM - ANÁLISE DE VALOR AGREGADO */}
            <TabsContent value="evm" className="space-y-4 mt-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-lg mb-4 text-purple-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Análise de Valor Agregado (EVM)
                </h4>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Custo Planejado (BCWS) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.custo_planejado}
                      onChange={(e) => setFormData({ ...formData, custo_planejado: parseFloat(e.target.value) || 0 })}
                      placeholder="R$ 0,00"
                      required
                    />
                    <p className="text-xs text-gray-500">Orçamento para este item</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Custo Real (ACWP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.custo_real}
                      onChange={(e) => setFormData({ ...formData, custo_real: parseFloat(e.target.value) || 0 })}
                      placeholder="R$ 0,00"
                    />
                    <p className="text-xs text-gray-500">Gasto real até o momento</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>% Físico Completo</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.percentual_fisico_completo}
                      onChange={(e) => setFormData({ ...formData, percentual_fisico_completo: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>% Financeiro Executado</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.percentual_financeiro_completo}
                      onChange={(e) => setFormData({ ...formData, percentual_financeiro_completo: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500">Calcula automaticamente o Valor Agregado</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label>Valor Agregado (BCWP)</Label>
                  <div className="h-10 flex items-center px-3 bg-green-100 rounded-md font-bold text-green-700 border">
                    R$ {(formData.valor_agregado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500">
                    Calculado: {formData.custo_planejado || 0} × {formData.percentual_financeiro_completo || 0}%
                  </p>
                </div>

                {formData.custo_planejado > 0 && formData.custo_real > 0 && (
                  <div className="mt-6 grid md:grid-cols-4 gap-3">
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">CPI (Cost Performance)</p>
                        <p className="text-lg font-bold text-blue-700">
                          {(formData.cpi || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.cpi || 0) >= 1 ? '✅ Eficiente' : '⚠️ Acima do orçamento'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">SPI (Schedule Performance)</p>
                        <p className="text-lg font-bold text-green-700">
                          {(formData.spi || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.spi || 0) >= 1 ? '✅ No prazo' : '⚠️ Atrasado'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">CV (Variância Custo)</p>
                        <p className={`text-lg font-bold ${(formData.cv || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          R$ {(formData.cv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-orange-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">EAC (Estimativa Conclusão)</p>
                        <p className="text-lg font-bold text-orange-700">
                          R$ {(formData.eac || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ABA DEPENDÊNCIAS */}
            <TabsContent value="dependencias" className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Dependências Financeiras
                </h4>

                <div className="space-y-3">
                  {(formData.predecessoras_financeiras || []).map((pred, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Item Predecessor</Label>
                        <Select
                          value={pred.item_id}
                          onValueChange={(val) => atualizarPredecessora(index, 'item_id', val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {itensDisponiveis.map(it => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.wbs ? `${it.wbs} - ` : ''}{it.descricao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Tipo Relação</Label>
                        <Select
                          value={pred.tipo_relacao}
                          onValueChange={(val) => atualizarPredecessora(index, 'tipo_relacao', val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposRelacao.map(tipo => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Defasagem (dias)</Label>
                          <Input
                            type="number"
                            className="h-9"
                            value={pred.defasagem_dias}
                            onChange={(e) => atualizarPredecessora(index, 'defasagem_dias', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 text-red-600"
                          onClick={() => removerPredecessora(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={adicionarPredecessora}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Dependência
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ABA PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Condições de Pagamento</h4>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={formData.condicoes_pagamento?.forma_pagamento || "a_vista"}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        condicoes_pagamento: { ...formData.condicoes_pagamento, forma_pagamento: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_vista">À Vista</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                        <SelectItem value="antecipado">Antecipado</SelectItem>
                        <SelectItem value="contra_entrega">Contra Entrega</SelectItem>
                        <SelectItem value="30_dias">30 dias</SelectItem>
                        <SelectItem value="60_dias">60 dias</SelectItem>
                        <SelectItem value="90_dias">90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de Parcelas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.condicoes_pagamento?.quantidade_parcelas || 1}
                      onChange={(e) => setFormData({
                        ...formData,
                        condicoes_pagamento: { ...formData.condicoes_pagamento, quantidade_parcelas: parseInt(e.target.value) || 1 }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Entrada</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.condicoes_pagamento?.valor_entrada || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        condicoes_pagamento: { ...formData.condicoes_pagamento, valor_entrada: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.condicoes_pagamento?.desconto_percentual || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        condicoes_pagamento: { ...formData.condicoes_pagamento, desconto_percentual: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Reserva de Contingência (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.reserva_contingencia}
                    onChange={(e) => setFormData({ ...formData, reserva_contingencia: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">
                    Valor: R$ {((formData.custo_planejado || 0) * ((formData.reserva_contingencia || 0) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ABA RISCOS */}
            <TabsContent value="riscos" className="space-y-4 mt-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Riscos Financeiros
                </h4>

                {(formData.riscos_financeiros || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(formData.riscos_financeiros || []).map((risco, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{risco.descricao}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">
                                Prob: {risco.probabilidade}
                              </Badge>
                              <Badge variant="outline">
                                Impacto: R$ {(risco.impacto_financeiro || 0).toLocaleString('pt-BR')}
                              </Badge>
                              <Badge variant="outline">
                                Contingência: R$ {(risco.valor_contingencia || 0).toLocaleString('pt-BR')}
                              </Badge>
                            </div>
                            {risco.mitigacao && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Mitigação:</strong> {risco.mitigacao}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerRisco(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 bg-white p-3 rounded-lg border">
                  <div>
                    <Label className="text-xs">Descrição do Risco</Label>
                    <Input
                      value={risco.descricao}
                      onChange={(e) => setRisco({ ...risco, descricao: e.target.value })}
                      placeholder="Ex: Atraso no pagamento do fornecedor"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Probabilidade</Label>
                      <Select
                        value={risco.probabilidade}
                        onValueChange={(val) => setRisco({ ...risco, probabilidade: val })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Impacto Financeiro (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9"
                        value={risco.impacto_financeiro}
                        onChange={(e) => setRisco({ ...risco, impacto_financeiro: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Valor Contingência (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9"
                        value={risco.valor_contingencia}
                        onChange={(e) => setRisco({ ...risco, valor_contingencia: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Plano de Mitigação</Label>
                    <Textarea
                      rows={2}
                      value={risco.mitigacao}
                      onChange={(e) => setRisco({ ...risco, mitigacao: e.target.value })}
                      placeholder="Como reduzir/evitar este risco..."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={adicionarRisco}
                    variant="outline"
                    size="sm"
                    disabled={!risco.descricao}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Risco
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes || ""}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-gray-50 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isProcessing}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {item ? "Atualizar" : "Criar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}