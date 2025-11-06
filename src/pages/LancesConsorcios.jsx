import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, DollarSign, Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import LanceForm from "../components/consorcios/LanceForm";
import LancesList from "../components/consorcios/LancesList";

export default function LancesConsorcios() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: lances = [], isLoading } = useQuery({
    queryKey: ['lancesConsorcios'],
    queryFn: () => base44.entities.LanceConsorcio.list('-data_lance'),
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LanceConsorcio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancesConsorcios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LanceConsorcio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancesConsorcios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LanceConsorcio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancesConsorcios'] });
    },
  });

  const filteredItems = lances.filter(lance => {
    const consorcio = consorcios.find(c => c.id === lance.consorcio_id);
    const cliente = consorcio ? clientes.find(c => c.id === consorcio.cliente_id) : null;
    const emp = consorcio ? empreendimentos.find(e => e.id === consorcio.empreendimento_id) : null;

    return (
      lance.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lance.cota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Estatísticas
  const lancesAtivos = lances.filter(l => l.status === 'ativo');
  const valorTotalLances = lancesAtivos.reduce((sum, l) => sum + (l.valor_lance || 0), 0);
  const maiorLance = lancesAtivos.length > 0 
    ? Math.max(...lancesAtivos.map(l => l.tipo_lance === 'percentual' ? l.percentual_lance : 0))
    : 0;
  const quantidadeLances = lancesAtivos.length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Lances de Consórcios</h1>
          <p className="text-gray-600 mt-1">Gerencie os lances ofertados em assembleias</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ofertar Lance
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Valor Total de Lances</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(valorTotalLances / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500 mt-1">{quantidadeLances} lances ativos</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Maior Lance Ativo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {maiorLance.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Lances Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lances.filter(l => {
                    const dataLance = new Date(l.data_lance);
                    const hoje = new Date();
                    return dataLance.getMonth() === hoje.getMonth() && 
                           dataLance.getFullYear() === hoje.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por grupo, cota, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <LanceForm
          item={editingItem}
          consorcios={consorcios}
          clientes={clientes}
          empreendimentos={empreendimentos}
          onSubmit={(data) => {
            if (editingItem) {
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

      <LancesList
        items={filteredItems}
        consorcios={consorcios}
        clientes={clientes}
        empreendimentos={empreendimentos}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (window.confirm("Deseja cancelar este lance?")) {
            deleteMutation.mutate(id);
          }
        }}
        onUpdateStatus={(id, status) => {
          const lance = lances.find(l => l.id === id);
          if (lance) {
            updateMutation.mutate({ id, data: { ...lance, status } });
          }
        }}
      />
    </div>
  );
}