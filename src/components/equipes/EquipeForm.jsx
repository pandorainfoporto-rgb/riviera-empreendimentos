import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, Trash2, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchFornecedorDialog from "../shared/SearchFornecedorDialog";
import SearchColaboradorDialog from "../shared/SearchColaboradorDialog";

const SERVICOS_DISPONIVEIS = [
  "Fundação",
  "Estrutura",
  "Alvenaria",
  "Cobertura",
  "Elétrica",
  "Hidráulica",
  "Gás",
  "Pintura",
  "Revestimento",
  "Esquadrias",
  "Pisos",
  "Forros",
  "Paisagismo",
  "Limpeza",
  "Acabamento",
  "Impermeabilização",
];

export default function EquipeForm({ item, fornecedores, colaboradores, onSubmit, onCancel, isProcessing }) {
  const [formData, setFormData] = useState(item || {
    nome: "",
    descricao: "",
    tipo_referencia: "fornecedor",
    fornecedor_id: "",
    colaborador_id: "",
    servicos_especializados: [],
    membros: [],
    disponibilidade: "disponivel",
    custo_hora: 0,
    custo_diaria: 0,
    ativo: true,
    observacoes: "",
  });

  const [showFornecedorSearch, setShowFornecedorSearch] = useState(false);
  const [showColaboradorSearch, setShowColaboradorSearch] = useState(false);
  const [novoMembro, setNovoMembro] = useState({ nome: "", funcao: "", telefone: "", email: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const adicionarServico = (servico) => {
    if (!formData.servicos_especializados.includes(servico)) {
      setFormData({
        ...formData,
        servicos_especializados: [...formData.servicos_especializados, servico]
      });
    }
  };

  const removerServico = (servico) => {
    setFormData({
      ...formData,
      servicos_especializados: formData.servicos_especializados.filter(s => s !== servico)
    });
  };

  const adicionarMembro = () => {
    if (novoMembro.nome && novoMembro.funcao) {
      setFormData({
        ...formData,
        membros: [...formData.membros, novoMembro]
      });
      setNovoMembro({ nome: "", funcao: "", telefone: "", email: "" });
    }
  };

  const removerMembro = (index) => {
    setFormData({
      ...formData,
      membros: formData.membros.filter((_, i) => i !== index)
    });
  };

  const fornecedor = fornecedores?.find(f => f.id === formData.fornecedor_id);
  const colaborador = colaboradores?.find(c => c.id === formData.colaborador_id);

  return (
    <>
      <Card className="shadow-xl border-t-4 border-[var(--grape-600)]">
        <CardHeader>
          <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <Users className="w-5 h-5" />
            {item ? "Editar Equipe" : "Nova Equipe"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Informações Básicas */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Equipe *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: Equipe de Fundação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disponibilidade">Disponibilidade</Label>
                <Select
                  value={formData.disponibilidade}
                  onValueChange={(value) => setFormData({ ...formData, disponibilidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
                placeholder="Descrição da equipe e suas especialidades"
              />
            </div>

            {/* Tipo de Referência */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Vinculação da Equipe</h3>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="tipo_referencia">Tipo de Vinculação *</Label>
                <Select
                  value={formData.tipo_referencia}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    tipo_referencia: value,
                    fornecedor_id: "",
                    colaborador_id: ""
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecedor">Fornecedor (Empresa Externa)</SelectItem>
                    <SelectItem value="colaborador">Colaborador (Interno)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_referencia === "fornecedor" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Fornecedor *
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowFornecedorSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={fornecedor?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>
              )}

              {formData.tipo_referencia === "colaborador" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Colaborador *
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => setShowColaboradorSearch(true)}
                    >
                      <Search className="w-3 h-3" />
                    </Button>
                  </Label>
                  <Input
                    value={colaborador?.nome || ""}
                    disabled
                    className="bg-gray-100"
                    placeholder="Clique na lupa para selecionar..."
                  />
                </div>
              )}
            </div>

            {/* Serviços Especializados */}
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">Serviços que a Equipe Executa</h3>
              
              <div className="space-y-2 mb-3">
                <Label>Adicionar Serviço</Label>
                <Select onValueChange={(value) => adicionarServico(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICOS_DISPONIVEIS.map(servico => (
                      <SelectItem key={servico} value={servico}>
                        {servico}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.servicos_especializados.map(servico => (
                  <Badge key={servico} className="bg-purple-600 text-white flex items-center gap-1">
                    {servico}
                    <button
                      type="button"
                      onClick={() => removerServico(servico)}
                      className="ml-1 hover:bg-purple-700 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {formData.servicos_especializados.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum serviço adicionado</p>
                )}
              </div>
            </div>

            {/* Membros da Equipe */}
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Membros da Equipe</h3>
              
              <div className="grid md:grid-cols-4 gap-3 mb-3">
                <Input
                  placeholder="Nome"
                  value={novoMembro.nome}
                  onChange={(e) => setNovoMembro({ ...novoMembro, nome: e.target.value })}
                />
                <Input
                  placeholder="Função"
                  value={novoMembro.funcao}
                  onChange={(e) => setNovoMembro({ ...novoMembro, funcao: e.target.value })}
                />
                <Input
                  placeholder="Telefone"
                  value={novoMembro.telefone}
                  onChange={(e) => setNovoMembro({ ...novoMembro, telefone: e.target.value })}
                />
                <Button type="button" onClick={adicionarMembro} className="bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {formData.membros.map((membro, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{membro.nome}</p>
                      <p className="text-sm text-gray-600">{membro.funcao}</p>
                      {membro.telefone && (
                        <p className="text-xs text-gray-500">{membro.telefone}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removerMembro(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {formData.membros.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum membro adicionado</p>
                )}
              </div>
            </div>

            {/* Custos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custo_hora">Custo por Hora (R$)</Label>
                <Input
                  id="custo_hora"
                  type="number"
                  step="0.01"
                  value={formData.custo_hora}
                  onChange={(e) => setFormData({ ...formData, custo_hora: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custo_diaria">Custo por Diária (R$)</Label>
                <Input
                  id="custo_diaria"
                  type="number"
                  step="0.01"
                  value={formData.custo_diaria}
                  onChange={(e) => setFormData({ ...formData, custo_diaria: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
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

      <SearchFornecedorDialog
        open={showFornecedorSearch}
        onClose={() => setShowFornecedorSearch(false)}
        fornecedores={fornecedores}
        onSelect={(fornecedor) => {
          setFormData({ ...formData, fornecedor_id: fornecedor.id });
          setShowFornecedorSearch(false);
        }}
      />

      <SearchColaboradorDialog
        open={showColaboradorSearch}
        onClose={() => setShowColaboradorSearch(false)}
        colaboradores={colaboradores}
        onSelect={(colaborador) => {
          setFormData({ ...formData, colaborador_id: colaborador.id });
          setShowColaboradorSearch(false);
        }}
      />
    </>
  );
}