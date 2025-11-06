import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, ArrowRightLeft, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ConsorciosList from "../components/consorcios/ConsorciosList";
import TransferirCotaDialog from "../components/consorcios/TransferirCotaDialog";

export default function TransferenciasConsorcios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [showTransferirDialog, setShowTransferirDialog] = useState(false);
  const [cotaSelecionada, setCotaSelecionada] = useState(null);
  const queryClient = useQueryClient();

  const { data: consorcios = [], isLoading } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const transferirMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consorcio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      setShowTransferirDialog(false);
      setCotaSelecionada(null);
    },
  });

  const filteredItems = consorcios.filter(item => {
    const cliente = clientes.find(c => c.id === item.cliente_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    const matchesSearch = 
      item.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = 
      tipoFilter === "todos" ||
      (tipoFilter === "investimento" && item.eh_investimento_caixa) ||
      (tipoFilter === "cliente" && !item.eh_investimento_caixa);
    
    return matchesSearch && matchesTipo;
  });

  const handleTransferir = (cota) => {
    setCotaSelecionada(cota);
    setShowTransferirDialog(true);
  };

  const totalCotas = consorcios.length;
  const cotasInvestimento = consorcios.filter(c => c.eh_investimento_caixa).length;
  const cotasClientes = consorcios.filter(c => !c.eh_investimento_caixa).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Transferências de Cotas</h1>
          <p className="text-gray-600 mt-1">Gerencie transferências entre clientes e investimentos</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-l-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Cotas</p>
                <p className="text-3xl font-bold text-gray-900">{totalCotas}</p>
              </div>
              <ArrowRightLeft className="w-10 h-10 text-[var(--wine-600)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cotas Investimento</p>
                <p className="text-3xl font-bold text-blue-600">{cotasInvestimento}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cotas de Clientes</p>
                <p className="text-3xl font-bold text-green-600">{cotasClientes}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por grupo, cota, cliente, unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-64">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Cotas</SelectItem>
            <SelectItem value="investimento">Cotas de Investimento</SelectItem>
            <SelectItem value="cliente">Cotas de Clientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Informativo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Como funciona?</h3>
              <p className="text-sm text-blue-800">
                Clique no botão "Transferir" em qualquer cota para iniciar o processo de transferência. 
                Você pode transferir cotas de investimento para clientes, de cliente para cliente, ou de cliente para investimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Consórcios */}
      <ConsorciosList
        items={filteredItems}
        clientes={clientes}
        unidades={unidades}
        isLoading={isLoading}
        onEdit={() => {}} // Não permite editar nesta tela
        onDelete={() => {}} // Não permite deletar nesta tela
        onTransferir={handleTransferir}
      />

      {/* Dialog de Transferência */}
      {showTransferirDialog && cotaSelecionada && (
        <TransferirCotaDialog
          consorcio={cotaSelecionada}
          clientes={clientes}
          unidades={unidades}
          onClose={() => {
            setShowTransferirDialog(false);
            setCotaSelecionada(null);
          }}
          onConfirm={(data) => {
            transferirMutation.mutate({
              id: cotaSelecionada.id,
              data,
            });
          }}
          isProcessing={transferirMutation.isPending}
        />
      )}
    </div>
  );
}