import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, HardHat, Package, Truck, Plus, Trash2, TrendingUp, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ResourceAllocation({ cronogramaObra, unidade }) {
  const [showDialog, setShowDialog] = useState(false);
  const [tipoRecurso, setTipoRecurso] = useState("mao_de_obra");
  const queryClient = useQueryClient();

  const equipeAtual = cronogramaObra.equipe || [];
  const recursosAtuais = cronogramaObra.recursos_alocados || [];

  const { data: materiaisPadrao = [] } = useQuery({
    queryKey: ['materiaisPadrao'],
    queryFn: () => base44.entities.MaterialPadrao.list(),
    initialData: [],
  });

  const updateRecursosMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CronogramaObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronogramasObra'] });
      setShowDialog(false);
    },
  });

  const adicionarRecurso = (recurso) => {
    const novosRecursos = [...recursosAtuais, recurso];
    updateRecursosMutation.mutate({
      id: cronogramaObra.id,
      data: { recursos_alocados: novosRecursos }
    });
  };

  const removerRecurso = (index) => {
    const novosRecursos = recursosAtuais.filter((_, i) => i !== index);
    updateRecursosMutation.mutate({
      id: cronogramaObra.id,
      data: { recursos_alocados: novosRecursos }
    });
  };

  const calcularTotalCusto = () => {
    let total = 0;
    
    // Custo da equipe
    equipeAtual.forEach(membro => {
      total += (membro.horas_alocadas || 0) * (membro.custo_hora || 0);
    });

    // Custo dos recursos
    recursosAtuais.forEach(rec => {
      total += (rec.quantidade || 0) * (rec.custo_unitario || 0);
    });

    return total;
  };

  const totalCusto = calcularTotalCusto();
  const custoRealizado = cronogramaObra.custo_real || 0;
  const orcamento = cronogramaObra.custo_planejado || 0;
  const percentualGasto = orcamento > 0 ? (custoRealizado / orcamento) * 100 : 0;

  // Agrupar recursos por tipo
  const maoDeObra = recursosAtuais.filter(r => r.tipo === 'mao_de_obra');
  const equipamentos = recursosAtuais.filter(r => r.tipo === 'equipamento');
  const materiais = recursosAtuais.filter(r => r.tipo === 'material');

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Orçamento</p>
            <p className="text-xl font-bold text-blue-700">
              R$ {(orcamento / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Custo Alocado</p>
            <p className="text-xl font-bold text-purple-700">
              R$ {(totalCusto / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Gasto Real</p>
            <p className="text-xl font-bold text-orange-700">
              R$ {(custoRealizado / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${percentualGasto > 100 ? 'border-red-500' : 'border-green-500'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">% Gasto</p>
            <p className={`text-xl font-bold ${percentualGasto > 100 ? 'text-red-700' : 'text-green-700'}`}>
              {percentualGasto.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recursos Alocados */}
      <Tabs defaultValue="equipe" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipe">
            <Users className="w-4 h-4 mr-2" />
            Equipe ({equipeAtual.length})
          </TabsTrigger>
          <TabsTrigger value="mao_de_obra">
            <HardHat className="w-4 h-4 mr-2" />
            Mão de Obra ({maoDeObra.length})
          </TabsTrigger>
          <TabsTrigger value="equipamentos">
            <Truck className="w-4 h-4 mr-2" />
            Equipamentos ({equipamentos.length})
          </TabsTrigger>
          <TabsTrigger value="materiais">
            <Package className="w-4 h-4 mr-2" />
            Materiais ({materiais.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipe" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Membros da Equipe Interna</CardTitle>
            </CardHeader>
            <CardContent>
              {equipeAtual.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Nenhum membro alocado. Configure no formulário da tarefa.
                </p>
              ) : (
                <div className="space-y-2">
                  {equipeAtual.map((membro, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{membro.nome}</p>
                        <p className="text-sm text-gray-600">
                          {membro.funcao} • {membro.horas_alocadas}h • R$ {membro.custo_hora}/h
                        </p>
                      </div>
                      <p className="font-bold text-green-700">
                        R$ {((membro.horas_alocadas || 0) * (membro.custo_hora || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mao_de_obra" className="mt-4">
          <RecursosTab
            recursos={maoDeObra}
            tipo="mao_de_obra"
            onAdicionar={() => {
              setTipoRecurso("mao_de_obra");
              setShowDialog(true);
            }}
            onRemover={removerRecurso}
            materiaisPadrao={materiaisPadrao.filter(m => m.categoria === 'mao_de_obra')}
          />
        </TabsContent>

        <TabsContent value="equipamentos" className="mt-4">
          <RecursosTab
            recursos={equipamentos}
            tipo="equipamento"
            onAdicionar={() => {
              setTipoRecurso("equipamento");
              setShowDialog(true);
            }}
            onRemover={removerRecurso}
            materiaisPadrao={materiaisPadrao.filter(m => m.categoria === 'equipamento')}
          />
        </TabsContent>

        <TabsContent value="materiais" className="mt-4">
          <RecursosTab
            recursos={materiais}
            tipo="material"
            onAdicionar={() => {
              setTipoRecurso("material");
              setShowDialog(true);
            }}
            onRemover={removerRecurso}
            materiaisPadrao={materiaisPadrao.filter(m => m.categoria === 'material')}
          />
        </TabsContent>
      </Tabs>

      {showDialog && (
        <AdicionarRecursoDialog
          tipo={tipoRecurso}
          materiaisPadrao={materiaisPadrao}
          onAdicionar={adicionarRecurso}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}

function RecursosTab({ recursos, tipo, onAdicionar, onRemover, materiaisPadrao }) {
  const tipoLabels = {
    mao_de_obra: "Mão de Obra",
    equipamento: "Equipamentos",
    material: "Materiais",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{tipoLabels[tipo]} Alocados</CardTitle>
        <Button onClick={onAdicionar} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {recursos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Nenhum recurso alocado
          </p>
        ) : (
          <div className="space-y-2">
            {recursos.map((recurso, idx) => {
              const indexGlobal = recursos.indexOf(recurso);
              const material = materiaisPadrao.find(m => m.id === recurso.material_padrao_id);

              return (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {recurso.descricao || material?.nome || 'Sem descrição'}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>
                          Qtd: {recurso.quantidade} {recurso.unidade_medida}
                        </span>
                        <span>
                          R$ {(recurso.custo_unitario || 0).toFixed(2)}/{recurso.unidade_medida}
                        </span>
                        <span className="font-semibold text-green-700">
                          Total: R$ {((recurso.quantidade || 0) * (recurso.custo_unitario || 0)).toFixed(2)}
                        </span>
                      </div>
                      {recurso.status_alocacao && (
                        <Badge className="mt-2 text-xs">
                          {recurso.status_alocacao}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemover(indexGlobal)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdicionarRecursoDialog({ tipo, materiaisPadrao, onAdicionar, onClose }) {
  const [formData, setFormData] = useState({
    tipo: tipo,
    material_padrao_id: "",
    descricao: "",
    quantidade: 0,
    unidade_medida: "unidade",
    custo_unitario: 0,
    status_alocacao: "planejado",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdicionar(formData);
    onClose();
  };

  const materialSelecionado = materiaisPadrao.find(m => m.id === formData.material_padrao_id);

  React.useEffect(() => {
    if (materialSelecionado) {
      setFormData(prev => ({
        ...prev,
        descricao: materialSelecionado.nome,
        unidade_medida: materialSelecionado.unidade_medida,
        custo_unitario: materialSelecionado.valor_referencia_unitario || 0,
      }));
    }
  }, [materialSelecionado]);

  const tipoLabels = {
    mao_de_obra: "Mão de Obra",
    equipamento: "Equipamento",
    material: "Material",
  };

  const materiaisFiltrados = materiaisPadrao.filter(m => m.categoria === tipo);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar {tipoLabels[tipo]}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>Selecionar da Base de Dados</Label>
              <Select
                value={formData.material_padrao_id}
                onValueChange={(value) => setFormData({ ...formData, material_padrao_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um item padrão..." />
                </SelectTrigger>
                <SelectContent>
                  {materiaisFiltrados.map(mat => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.nome} - R$ {(mat.valor_referencia_unitario || 0).toFixed(2)}/{mat.unidade_medida}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label>Unidade</Label>
                <Input
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo Unit. (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.custo_unitario}
                  onChange={(e) => setFormData({ ...formData, custo_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Status de Alocação</Label>
              <Select
                value={formData.status_alocacao}
                onValueChange={(value) => setFormData({ ...formData, status_alocacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="alocado">Alocado</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="liberado">Liberado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">
                Custo Total: R$ {((formData.quantidade || 0) * (formData.custo_unitario || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Recurso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}