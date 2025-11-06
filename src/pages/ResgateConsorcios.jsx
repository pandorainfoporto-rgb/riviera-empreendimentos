import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Award, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ResgatesList from "../components/consorcios/ResgatesList";
import ResgateForm from "../components/consorcios/ResgateForm";

export default function ResgateConsorcios() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const { data: resgates = [], isLoading } = useQuery({
    queryKey: ['resgatesConsorcios'],
    queryFn: () => base44.entities.ResgateConsorcio.list('-data_resgate'),
    initialData: [],
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Criar registro de resgate
      const resgate = await base44.entities.ResgateConsorcio.create(data);

      // 2. Atualizar consórcio como resgatado
      const consorcio = consorcios.find(c => c.id === data.consorcio_id);
      if (consorcio) {
        await base44.entities.Consorcio.update(data.consorcio_id, {
          ...consorcio,
          resgatado: true,
          data_resgate: data.data_resgate,
        });
      }

      // 3. Registrar entrada no caixa
      const caixa = caixas.find(c => c.id === data.caixa_id);
      if (caixa) {
        const saldoAnterior = caixa.saldo_atual || 0;
        const saldoPosterior = saldoAnterior + (data.valor_liquido || 0);

        await base44.entities.MovimentacaoCaixa.create({
          caixa_id: data.caixa_id,
          tipo: "entrada",
          categoria: "resgate_consorcio",
          valor: data.valor_liquido,
          data_movimentacao: data.data_resgate,
          descricao: `Resgate de consórcio - Grupo ${consorcio?.grupo} Cota ${consorcio?.cota}`,
          saldo_anterior: saldoAnterior,
          saldo_posterior: saldoPosterior,
          observacoes: data.observacoes,
        });

        // Atualizar saldo do caixa
        await base44.entities.Caixa.update(data.caixa_id, {
          ...caixa,
          saldo_atual: saldoPosterior,
        });
      }

      // 4. Se alocado na unidade, atualizar saldo disponível
      if (data.alocado_unidade && data.unidade_id) {
        const unidade = unidades.find(u => u.id === data.unidade_id);
        if (unidade) {
          const saldoAtual = unidade.saldo_disponivel || 0;
          await base44.entities.Unidade.update(data.unidade_id, {
            ...unidade,
            saldo_disponivel: saldoAtual + (data.valor_liquido || 0),
          });
        }
      }

      return resgate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resgatesConsorcios'] });
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoesCaixa'] });
      setShowForm(false);
    },
  });

  // Filtrar apenas consórcios contemplados e não resgatados
  const consorciosDisponiveis = consorcios.filter(c => c.contemplado && !c.resgatado);

  const filteredItems = resgates.filter(item => {
    const consorcio = consorcios.find(c => c.id === item.consorcio_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    const cliente = clientes.find(cl => cl.id === item.cliente_id);

    const matchesSearch = 
      consorcio?.grupo?.includes(searchTerm) ||
      consorcio?.cota?.includes(searchTerm) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalResgatado = filteredItems
    .filter(r => r.status === 'concluido')
    .reduce((sum, r) => sum + (r.valor_liquido || 0), 0);

  const totalAlocado = filteredItems
    .filter(r => r.status === 'concluido' && r.alocado_unidade)
    .reduce((sum, r) => sum + (r.valor_liquido || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Resgates de Consórcios</h1>
          <p className="text-gray-600 mt-1">Gerencie os resgates de cotas contempladas</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          disabled={consorciosDisponiveis.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Resgate
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Resgatado</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalResgatado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Alocado em Unidades</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {totalAlocado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-100">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cotas Disponíveis</p>
              <p className="text-2xl font-bold text-purple-600">
                {consorciosDisponiveis.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar resgates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="solicitado">Solicitados</TabsTrigger>
            <TabsTrigger value="processando">Processando</TabsTrigger>
            <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {showForm && (
        <ResgateForm
          consorcios={consorciosDisponiveis}
          unidades={unidades}
          clientes={clientes}
          caixas={caixas.filter(c => c.ativo)}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isProcessing={createMutation.isPending}
        />
      )}

      <ResgatesList
        items={filteredItems}
        consorcios={consorcios}
        unidades={unidades}
        clientes={clientes}
        caixas={caixas}
        isLoading={isLoading}
      />
    </div>
  );
}