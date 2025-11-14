import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

import ClientesList from "../components/clientes/ClientesList";
import ClienteForm from "../components/clientes/ClienteForm";
import DialogCriarNegociacao from "../components/clientes/DialogCriarNegociacao";

export default function Clientes() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [clienteParaNegociacao, setClienteParaNegociacao] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list('-created_date'),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Cliente cadastrado!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Cliente atualizado!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success("Cliente excluído!");
    },
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.telefone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = 
      tipoFilter === "todos" ||
      (tipoFilter === "inquilino" && item.eh_inquilino) ||
      (tipoFilter === "comprador" && !item.eh_inquilino);
    
    const matchesStatus = 
      statusFilter === "todos" ||
      (statusFilter === "com_acesso" && item.tem_acesso_portal) ||
      (statusFilter === "sem_acesso" && !item.tem_acesso_portal);
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const clientesComPortal = items.filter(c => c.tem_acesso_portal).length;
  const inquilinos = items.filter(c => c.eh_inquilino).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie seus clientes e inquilinos</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Clientes com Portal</p>
          <p className="text-2xl font-bold text-blue-600">{clientesComPortal}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Inquilinos</p>
          <p className="text-2xl font-bold text-purple-600">{inquilinos}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="comprador">Compradores</TabsTrigger>
            <TabsTrigger value="inquilino">Inquilinos</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="com_acesso">Com Portal</TabsTrigger>
            <TabsTrigger value="sem_acesso">Sem Portal</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ClienteForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        cliente={editingItem}
        unidades={unidades}
      />

      <ClientesList
        items={filteredItems}
        unidades={unidades}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm("Deseja excluir este cliente?")) {
            deleteMutation.mutate(id);
          }
        }}
        onCriarNegociacao={(cliente) => setClienteParaNegociacao(cliente)}
      />

      {clienteParaNegociacao && (
        <DialogCriarNegociacao
          cliente={clienteParaNegociacao}
          onClose={() => setClienteParaNegociacao(null)}
        />
      )}
    </div>
  );
}