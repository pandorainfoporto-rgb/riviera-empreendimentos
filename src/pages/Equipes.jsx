import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import EquipeForm from "../components/equipes/EquipeForm";

export default function Equipes() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => base44.entities.Equipe.list('-created_date'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => base44.entities.Colaborador.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("✅ Equipe criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar equipe: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("✅ Equipe atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar equipe: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes'] });
      toast.success("Equipe excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir equipe: " + error.message);
    },
  });

  const filteredItems = items.filter(item => 
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.servicos_especializados?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const disponibilidadeColors = {
    disponivel: "bg-green-100 text-green-700",
    ocupada: "bg-yellow-100 text-yellow-700",
    indisponivel: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Equipes</h1>
          <p className="text-gray-600 mt-1">Gerencie as equipes de trabalho</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar equipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <EquipeForm
          item={editingItem}
          fornecedores={fornecedores}
          colaboradores={colaboradores}
          onSubmit={(data) => {
            if (editingItem && editingItem.id) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500">Nenhuma equipe cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const fornecedor = fornecedores.find(f => f.id === item.fornecedor_id);
            const colaborador = colaboradores.find(c => c.id === item.colaborador_id);

            return (
              <Card 
                key={item.id} 
                className="hover:shadow-xl transition-all duration-200 border-t-4 border-purple-500"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <h3 className="text-lg font-bold text-[var(--wine-700)]">
                          {item.nome}
                        </h3>
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                      )}
                    </div>
                    <Badge className={disponibilidadeColors[item.disponibilidade]}>
                      {item.disponibilidade}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Vinculado a</p>
                      <p className="font-semibold text-gray-900">
                        {item.tipo_referencia === 'fornecedor' 
                          ? `Fornecedor: ${fornecedor?.nome || 'N/A'}`
                          : `Colaborador: ${colaborador?.nome || 'N/A'}`
                        }
                      </p>
                    </div>

                    {item.servicos_especializados && item.servicos_especializados.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Serviços:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.servicos_especializados.map(servico => (
                            <Badge key={servico} variant="outline" className="text-xs">
                              {servico}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.membros && item.membros.length > 0 && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">
                          {item.membros.length} membro(s)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.custo_hora > 0 && (
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-xs text-gray-600">Custo/Hora</p>
                          <p className="font-semibold text-green-700">
                            R$ {item.custo_hora.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {item.custo_diaria > 0 && (
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-xs text-gray-600">Custo/Diária</p>
                          <p className="font-semibold text-green-700">
                            R$ {item.custo_diaria.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja excluir esta equipe?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}