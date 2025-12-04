import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import ContaPagarForm from "../components/financeiro/ContaPagarForm";
import ContasPagarList from "../components/financeiro/ContasPagarList";

export default function Pagar() {
  const [showForm, setShowForm] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const queryClient = useQueryClient();

  const { data: contas = [] } = useQuery({
    queryKey: ['contasPagar'],
    queryFn: () => base44.entities.ContaPagar.list('-data_vencimento'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContaPagar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      setShowForm(false);
      toast.success("Conta a pagar criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContaPagar.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      setShowForm(false);
      toast.success("Conta atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContaPagar.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contasPagar'] });
      toast.success("Conta removida!");
    },
  });

  const handleSubmit = (data) => {
    if (editingConta) {
      updateMutation.mutate({ id: editingConta.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Estatísticas
  const hoje = new Date().toISOString().split('T')[0];
  const pendentes = contas.filter(c => c.status === 'pendente').length;
  const atrasadas = contas.filter(c => 
    c.status === 'pendente' && c.data_vencimento < hoje
  ).length;
  const valorPendente = contas
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + (c.valor || 0), 0);
  const valorPago = contas
    .filter(c => c.status === 'pago')
    .reduce((sum, c) => sum + (c.valor || 0), 0);

  const filteredContas = contas.filter(c => {
    const matchesSearch = c.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <ContaPagarForm
          conta={editingConta}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingConta(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Contas a Pagar</h1>
          <p className="text-gray-600">Gestão de despesas e pagamentos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">{pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold">{atrasadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">A Pagar</p>
              <p className="text-xl font-bold text-red-600">
                R$ {valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Pago (mês)</p>
              <p className="text-xl font-bold text-green-600">
                R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {['todos', 'pendente', 'pago', 'atrasado'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <ContasPagarList
        contas={filteredContas}
        onEdit={(conta) => {
          setEditingConta(conta);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm("Remover esta conta?")) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}