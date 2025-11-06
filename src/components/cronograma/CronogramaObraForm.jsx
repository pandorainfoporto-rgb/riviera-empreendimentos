import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2, DollarSign, Target, AlertTriangle, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fases = [
  { value: "projeto", label: "Projeto" },
  { value: "aprovacoes", label: "Aprovações" },
  { value: "preparacao", label: "Preparação do Terreno" },
  { value: "fundacao", label: "Fundação" },
  { value: "estrutura", label: "Estrutura" },
  { value: "alvenaria", label: "Alvenaria" },
  { value: "instalacoes", label: "Instalações" },
  { value: "acabamento", label: "Acabamento" },
  { value: "finalizacao", label: "Finalização" },
];

const status = [
  { value: "nao_iniciada", label: "Não Iniciada" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
  { value: "pausada", label: "Pausada" },
  { value: "cancelada", label: "Cancelada" },
];

const prioridades = [
  { value: "baixa", label: "Baixa", cor: "bg-gray-500" },
  { value: "media", label: "Média", cor: "bg-blue-500" },
  { value: "alta", label: "Alta", cor: "bg-orange-500" },
  { value: "critica", label: "Crítica", cor: "bg-red-500" },
];

const tiposRelacao = [
  { value: "TI", label: "Término → Início (TI)", desc: "Termina antes de iniciar" },
  { value: "II", label: "Início → Início (II)", desc: "Iniciam juntas" },
  { value: "TT", label: "Término → Término (TT)", desc: "Terminam juntas" },
  { value: "IT", label: "Início → Término (IT)", desc: "Inicia antes de terminar" },
];

const restricoes = [
  { value: "nenhuma", label: "Nenhuma restrição" },
  { value: "deve_iniciar_em", label: "Deve iniciar em" },
  { value: "deve_terminar_em", label: "Deve terminar em" },
  { value: "nao_antes_de", label: "Não antes de" },
  { value: "nao_depois_de", label: "Não depois de" },
  { value: "o_mais_cedo_possivel", label: "O mais cedo possível" },
  { value: "o_mais_tarde_possivel", label: "O mais tarde possível" },
];

export default function CronogramaObraForm({ item, unidades = [], cronogramasObra = [], onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    unidade_id: "",
    wbs: "",
    nivel_hierarquia: 1,
    tarefa_pai_id: "",
    eh_marco: false,
    eh_tarefa_resumo: false,
    fase: "projeto",
    etapa: "",
    descricao: "",
    data_inicio_prevista: "",
    data_fim_prevista: "",
    data_inicio_real: "",
    data_fim_real: "",
    duracao_prevista_dias: 0,
    percentual_conclusao: 0,
    status: "nao_iniciada",
    prioridade: "media",
    responsavel: "",
    equipe: [],
    predecessoras: [],
    restricao_tipo: "nenhuma",
    restricao_data: "",
    custo_planejado: 0,
    ordem: (cronogramasObra || []).length + 1,
    riscos: [],
  });

  const [gerarFinanceiro, setGerarFinanceiro] = useState(false);
  const [itensFinanceiros, setItensFinanceiros] = useState(item?.itensFinanceiros || []);
  const [membroEquipe, setMembroEquipe] = useState({ nome: "", funcao: "", horas_alocadas: 0, custo_hora: 0 });
  const [risco, setRisco] = useState({ descricao: "", probabilidade: "media", impacto: "medio", mitigacao: "" });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    initialData: [],
  });

  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => base44.entities.Servico.list(),
    initialData: [],
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
    initialData: [],
  });

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: () => base44.entities.Orcamento.list(),
    initialData: [],
  });

  // Calcular duração automaticamente
  React.useEffect(() => {
    if (formData.data_inicio_prevista && formData.data_fim_prevista) {
      const dias = differenceInDays(
        new Date(formData.data_fim_prevista),
        new Date(formData.data_inicio_prevista)
      );
      setFormData(prev => ({ ...prev, duracao_prevista_dias: dias }));
    }
  }, [formData.data_inicio_prevista, formData.data_fim_prevista]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Calcular caminho crítico (simplificado)
    const ehCritico = formData.folga_total === 0 && formData.predecessoras?.length > 0;

    onSubmit({
      ...formData,
      caminho_critico: ehCritico,
      gerarFinanceiro,
      itensFinanceiros: gerarFinanceiro ? (itensFinanceiros || []) : [],
    });
  };

  const adicionarPredecessora = () => {
    setFormData({
      ...formData,
      predecessoras: [
        ...(formData.predecessoras || []),
        { tarefa_id: "", tipo_relacao: "TI", defasagem_dias: 0 }
      ]
    });
  };

  const removerPredecessora = (index) => {
    setFormData({
      ...formData,
      predecessoras: (formData.predecessoras || []).filter((_, i) => i !== index)
    });
  };

  const atualizarPredecessora = (index, campo, valor) => {
    const novasPred = [...(formData.predecessoras || [])];
    novasPred[index][campo] = valor;
    setFormData({ ...formData, predecessoras: novasPred });
  };

  const adicionarMembroEquipe = () => {
    if (!membroEquipe.nome) return;
    
    setFormData({
      ...formData,
      equipe: [...(formData.equipe || []), membroEquipe]
    });
    setMembroEquipe({ nome: "", funcao: "", horas_alocadas: 0, custo_hora: 0 });
  };

  const removerMembroEquipe = (index) => {
    setFormData({
      ...formData,
      equipe: (formData.equipe || []).filter((_, i) => i !== index)
    });
  };

  const adicionarRisco = () => {
    if (!risco.descricao) return;
    
    setFormData({
      ...formData,
      riscos: [...(formData.riscos || []), risco]
    });
    setRisco({ descricao: "", probabilidade: "media", impacto: "medio", mitigacao: "" });
  };

  const removerRisco = (index) => {
    setFormData({
      ...formData,
      riscos: (formData.riscos || []).filter((_, i) => i !== index)
    });
  };

  // Tarefas disponíveis para serem predecessoras (excluindo a atual e suas descendentes)
  const tarefasDisponiveis = (cronogramasObra || []).filter(t => t.id !== item?.id);

  return (
    <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          {formData.eh_marco && <Target className="w-5 h-5 text-purple-600" />}
          {item ? "Editar Tarefa" : "Nova Tarefa do Cronograma"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="dependencias">Dependências</TabsTrigger>
              <TabsTrigger value="recursos">Recursos</TabsTrigger>
              <TabsTrigger value="custos">Custos</TabsTrigger>
              <TabsTrigger value="riscos">Riscos</TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg border">
                  <Checkbox
                    id="eh_marco"
                    checked={formData.eh_marco}
                    onCheckedChange={(checked) => setFormData({ ...formData, eh_marco: checked })}
                  />
                  <Label htmlFor="eh_marco" className="cursor-pointer font-semibold">
                    <Target className="w-4 h-4 inline mr-2 text-purple-600" />
                    Marco do Projeto (Milestone)
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border">
                  <Checkbox
                    id="eh_tarefa_resumo"
                    checked={formData.eh_tarefa_resumo}
                    onCheckedChange={(checked) => setFormData({ ...formData, eh_tarefa_resumo: checked })}
                  />
                  <Label htmlFor="eh_tarefa_resumo" className="cursor-pointer font-semibold">
                    Tarefa Resumo (agrupa subtarefas)
                  </Label>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidade_id">Unidade *</Label>
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
                  <Label htmlFor="wbs">WBS (1.2.3)</Label>
                  <Input
                    id="wbs"
                    value={formData.wbs}
                    onChange={(e) => setFormData({ ...formData, wbs: e.target.value })}
                    placeholder="1.2.3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel_hierarquia">Nível</Label>
                  <Input
                    id="nivel_hierarquia"
                    type="number"
                    min="1"
                    value={formData.nivel_hierarquia}
                    onChange={(e) => setFormData({ ...formData, nivel_hierarquia: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase *</Label>
                  <Select
                    value={formData.fase}
                    onValueChange={(value) => setFormData({ ...formData, fase: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fases.map(fase => (
                        <SelectItem key={fase.value} value={fase.value}>
                          {fase.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
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
                <Label htmlFor="etapa">Nome da Tarefa *</Label>
                <Input
                  id="etapa"
                  value={formData.etapa}
                  onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                  placeholder="Ex: Escavação, Concretagem da Laje, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio_prevista">Data Início Prevista *</Label>
                  <Input
                    id="data_inicio_prevista"
                    type="date"
                    value={formData.data_inicio_prevista}
                    onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim_prevista">Data Fim Prevista *</Label>
                  <Input
                    id="data_fim_prevista"
                    type="date"
                    value={formData.data_fim_prevista}
                    onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (dias úteis)</Label>
                  <div className="h-10 flex items-center px-3 bg-blue-50 rounded-md font-bold text-blue-700 border">
                    {formData.duracao_prevista_dias || 0} dias
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restrição de Agendamento</Label>
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {status.map(st => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentual_conclusao">% Conclusão</Label>
                  <Input
                    id="percentual_conclusao"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentual_conclusao}
                    onChange={(e) => setFormData({ ...formData, percentual_conclusao: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA DEPENDÊNCIAS */}
            <TabsContent value="dependencias" className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Predecessoras (Tarefas que devem ser concluídas antes)
                </h4>
                <p className="text-sm text-blue-700 mb-4">
                  Defina as dependências entre tarefas conforme MS Project
                </p>

                <div className="space-y-3">
                  {(formData.predecessoras || []).map((pred, index) => (
                    <div key={index} className="grid md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Tarefa Predecessora</Label>
                        <Select
                          value={pred.tarefa_id}
                          onValueChange={(val) => atualizarPredecessora(index, 'tarefa_id', val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tarefasDisponiveis.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.wbs ? `${t.wbs} - ` : ''}{t.etapa}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Tipo de Relação</Label>
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
                    Adicionar Predecessora
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ABA RECURSOS */}
            <TabsContent value="recursos" className="space-y-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Equipe Alocada
                </h4>

                {(formData.equipe || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(formData.equipe || []).map((membro, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-semibold text-gray-900">{membro.nome}</p>
                          <p className="text-sm text-gray-600">
                            {membro.funcao} • {membro.horas_alocadas}h • R$ {membro.custo_hora}/h
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removerMembroEquipe(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid md:grid-cols-5 gap-3 bg-white p-3 rounded-lg border">
                  <div className="md:col-span-2">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      className="h-9"
                      value={membroEquipe.nome}
                      onChange={(e) => setMembroEquipe({ ...membroEquipe, nome: e.target.value })}
                      placeholder="Nome do membro"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Função</Label>
                    <Input
                      className="h-9"
                      value={membroEquipe.funcao}
                      onChange={(e) => setMembroEquipe({ ...membroEquipe, funcao: e.target.value })}
                      placeholder="Ex: Pedreiro"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Horas</Label>
                    <Input
                      className="h-9"
                      type="number"
                      value={membroEquipe.horas_alocadas}
                      onChange={(e) => setMembroEquipe({ ...membroEquipe, horas_alocadas: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">R$/h</Label>
                    <div className="flex gap-1">
                      <Input
                        className="h-9"
                        type="number"
                        step="0.01"
                        value={membroEquipe.custo_hora}
                        onChange={(e) => setMembroEquipe({ ...membroEquipe, custo_hora: parseFloat(e.target.value) || 0 })}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={adicionarMembroEquipe}
                        className="h-9 w-9"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA CUSTOS */}
            <TabsContent value="custos" className="space-y-4 mt-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Análise de Valor Agregado (EVM)
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Custo Planejado (BCWS)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.custo_planejado}
                      onChange={(e) => setFormData({ ...formData, custo_planejado: parseFloat(e.target.value) || 0 })}
                      placeholder="R$ 0,00"
                    />
                    <p className="text-xs text-gray-500">Orçamento para esta tarefa</p>
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

                {formData.custo_planejado > 0 && formData.custo_real > 0 && (
                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    <Card className="border-l-4 border-blue-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">CPI (Cost Performance)</p>
                        <p className="text-lg font-bold text-blue-700">
                          {((formData.valor_agregado || 0) / formData.custo_real).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((formData.valor_agregado || 0) / formData.custo_real) >= 1 ? '✅ Eficiente' : '⚠️ Acima do orçamento'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-green-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">Variância de Custo</p>
                        <p className="text-lg font-bold text-green-700">
                          R$ {((formData.valor_agregado || 0) - formData.custo_real).toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-500">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-600">% do Orçado Gasto</p>
                        <p className="text-lg font-bold text-purple-700">
                          {((formData.custo_real / formData.custo_planejado) * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Cronograma Financeiro */}
              <div className="space-y-4 p-4 border-2 border-dashed border-[var(--grape-400)] rounded-lg bg-[var(--grape-50)]">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gerarFinanceiro"
                    checked={gerarFinanceiro}
                    onCheckedChange={setGerarFinanceiro}
                  />
                  <Label htmlFor="gerarFinanceiro" className="cursor-pointer font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Gerar Cronograma Financeiro para esta Tarefa
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* ABA RISCOS */}
            <TabsContent value="riscos" className="space-y-4 mt-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Gestão de Riscos
                </h4>

                {(formData.riscos || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {(formData.riscos || []).map((risco, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{risco.descricao}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">
                                Prob: {risco.probabilidade}
                              </Badge>
                              <Badge variant="outline">
                                Impacto: {risco.impacto}
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
                      placeholder="Ex: Atraso na entrega de materiais"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
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
                      <Label className="text-xs">Impacto</Label>
                      <Select
                        value={risco.impacto}
                        onValueChange={(val) => setRisco({ ...risco, impacto: val })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
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
            {item ? "Atualizar" : "Criar"} Tarefa
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}