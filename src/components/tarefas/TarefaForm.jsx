import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Search } from "lucide-react";
import SearchUnidadeDialog from "../shared/SearchUnidadeDialog";

const fases = [
  { value: "projeto", label: "Projeto" },
  { value: "aprovacoes", label: "Aprovações" },
  { value: "preparacao", label: "Preparação" },
  { value: "fundacao", label: "Fundação" },
  { value: "estrutura", label: "Estrutura" },
  { value: "alvenaria", label: "Alvenaria" },
  { value: "instalacoes", label: "Instalações" },
  { value: "acabamento", label: "Acabamento" },
  { value: "finalizacao", label: "Finalização" },
];

const statusOptions = [
  { value: "nao_iniciada", label: "Não Iniciada" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
  { value: "pausada", label: "Pausada" },
  { value: "cancelada", label: "Cancelada" },
];

const prioridades = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export default function TarefaForm({ tarefa, unidades, equipes, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    unidade_id: tarefa?.unidade_id || "",
    fase: tarefa?.fase || "projeto",
    etapa: tarefa?.etapa || "",
    descricao: tarefa?.descricao || "",
    data_inicio_prevista: tarefa?.data_inicio_prevista || "",
    data_fim_prevista: tarefa?.data_fim_prevista || "",
    data_inicio_real: tarefa?.data_inicio_real || "",
    data_fim_real: tarefa?.data_fim_real || "",
    status: tarefa?.status || "nao_iniciada",
    prioridade: tarefa?.prioridade || "media",
    responsavel: tarefa?.responsavel || "",
    percentual_conclusao: tarefa?.percentual_conclusao || 0,
    eh_marco: tarefa?.eh_marco || false,
    caminho_critico: tarefa?.caminho_critico || false,
    custo_planejado: tarefa?.custo_planejado || 0,
    notas: tarefa?.notas || "",
  });

  const [showUnidadeSearch, setShowUnidadeSearch] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_id);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <CardTitle>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basico">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
              <TabsTrigger value="datas">Datas e Progresso</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                    value={unidadeSelecionada?.codigo || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fase *</Label>
                  <Select
                    value={formData.fase}
                    onValueChange={(val) => setFormData({ ...formData, fase: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fases.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome da Tarefa / Etapa *</Label>
                <Input
                  value={formData.etapa}
                  onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                  placeholder="Ex: Levantamento de paredes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada da tarefa..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(val) => setFormData({ ...formData, prioridade: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="datas" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início Prevista *</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio_prevista}
                    onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim Prevista *</Label>
                  <Input
                    type="date"
                    value={formData.data_fim_prevista}
                    onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Início Real</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio_real}
                    onChange={(e) => setFormData({ ...formData, data_inicio_real: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim Real</Label>
                  <Input
                    type="date"
                    value={formData.data_fim_real}
                    onChange={(e) => setFormData({ ...formData, data_fim_real: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Percentual de Conclusão: {formData.percentual_conclusao}%</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.percentual_conclusao}
                    onChange={(e) => setFormData({ ...formData, percentual_conclusao: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label>É um Marco (Milestone)</Label>
                  <Switch
                    checked={formData.eh_marco}
                    onCheckedChange={(checked) => setFormData({ ...formData, eh_marco: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label>Caminho Crítico</Label>
                  <Switch
                    checked={formData.caminho_critico}
                    onCheckedChange={(checked) => setFormData({ ...formData, caminho_critico: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custo Planejado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_planejado}
                  onChange={(e) => setFormData({ ...formData, custo_planejado: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas e Observações</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Tarefa'}
            </Button>
          </div>
        </form>
      </CardContent>

      <SearchUnidadeDialog
        open={showUnidadeSearch}
        onClose={() => setShowUnidadeSearch(false)}
        unidades={unidades}
        onSelect={(uni) => {
          setFormData({ ...formData, unidade_id: uni.id });
          setShowUnidadeSearch(false);
        }}
      />
    </Card>
  );
}