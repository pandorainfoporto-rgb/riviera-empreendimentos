
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { isBefore, parseISO } from "date-fns";

import ParcelasConsorciosList from "../components/consorcios/ParcelasConsorciosList";
import PagarParcelaDialog from "../components/consorcios/PagarParcelaDialog";

export default function ParcelasConsorcios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showPagarDialog, setShowPagarDialog] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const queryClient = useQueryClient();

  const { data: parcelas = [], isLoading } = useQuery({
    queryKey: ['faturasConsorcios'],
    queryFn: () => base44.entities.FaturaConsorcio.list('-data_vencimento'),
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const updateParcelaMutation = useMutation({
    mutationFn: async ({ id, data, movimentacoes }) => {
      // 1. Atualizar a parcela
      await base44.entities.FaturaConsorcio.update(id, data);
      
      // 2. Registrar movimentações no caixa (agora pode ser múltiplas)
      if (movimentacoes && movimentacoes.length > 0) {
        for (const movimentacao of movimentacoes) {
          await base44.entities.MovimentacaoCaixa.create(movimentacao);
        }
        
        // 3. Atualizar saldo do caixa (usar o saldo final da última movimentação)
        const ultimaMovimentacao = movimentacoes[movimentacoes.length - 1];
        const caixa = caixas.find(c => c.id === ultimaMovimentacao.caixa_id);
        if (caixa) {
          await base44.entities.Caixa.update(caixa.id, {
            ...caixa,
            saldo_atual: ultimaMovimentacao.saldo_posterior
          });
        }
      }
      
      // 4. Atualizar parcelas pagas no consórcio
      const consorcio = consorcios.find(c => c.id === data.consorcio_id);
      if (consorcio && data.status === 'pago') {
        const parcelasPagas = (consorcio.parcelas_pagas || 0) + 1;
        await base44.entities.Consorcio.update(consorcio.id, {
          ...consorcio,
          parcelas_pagas: parcelasPagas
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturasConsorcios'] });
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoesCaixa'] });
      setShowPagarDialog(false);
      setSelectedParcela(null);
    },
  });

  // Atualizar automaticamente o status das parcelas atrasadas
  useEffect(() => {
    const atualizarStatusAtrasados = async () => {
      const hoje = new Date();
      const parcelasParaAtualizar = parcelas.filter(p => {
        if (p.status !== 'pendente') return false;
        try {
          const dataVenc = parseISO(p.data_vencimento);
          return isBefore(dataVenc, hoje);
        } catch {
          return false;
        }
      });

      for (const parcela of parcelasParaAtualizar) {
        try {
          await base44.entities.FaturaConsorcio.update(parcela.id, {
            ...parcela,
            status: 'atrasado'
          });
        } catch (error) {
          console.error('Erro ao atualizar status:', error);
        }
      }

      if (parcelasParaAtualizar.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['faturasConsorcios'] });
      }
    };

    if (parcelas.length > 0) {
      atualizarStatusAtrasados();
    }
  }, [parcelas, queryClient]);

  // Obter grupos únicos
  const grupos = [...new Set(consorcios.map(c => c.grupo))].filter(Boolean).sort();

  // Verificar e atualizar status na hora da filtragem
  const hoje = new Date();
  const parcelasComStatusAtualizado = parcelas.map(parcela => {
    if (parcela.status === 'pendente') {
      try {
        const dataVenc = parseISO(parcela.data_vencimento);
        if (isBefore(dataVenc, hoje)) {
          return { ...parcela, status: 'atrasado' };
        }
      } catch (error) {
        console.error('Erro ao processar data:', error);
      }
    }
    return parcela;
  });

  const filteredItems = parcelasComStatusAtualizado.filter(item => {
    const consorcio = consorcios.find(c => c.id === item.consorcio_id);
    if (!consorcio) return false;

    const cliente = clientes.find(c => c.id === consorcio.cliente_id);
    const unidade = unidades.find(u => u.id === consorcio.unidade_id);

    const matchesSearch = 
      consorcio.grupo?.includes(searchTerm) ||
      consorcio.cota?.includes(searchTerm) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consorcio.eh_investimento_caixa && "investimento caixa".includes(searchTerm.toLowerCase()));
    
    const matchesGrupo = grupoFilter === "todos" || consorcio.grupo === grupoFilter;
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;

    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && item.data_vencimento >= dataInicio;
    }
    if (dataFim) {
      matchesData = matchesData && item.data_vencimento <= dataFim;
    }

    return matchesSearch && matchesGrupo && matchesStatus && matchesData;
  });

  const totalPendente = filteredItems
    .filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + (p.valor_total || 0), 0);

  const totalAtrasado = filteredItems
    .filter(p => p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor_total || 0), 0);

  const totalPago = filteredItems
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor_total || 0), 0);

  const handlePagar = (parcela) => {
    setSelectedParcela(parcela);
    setShowPagarDialog(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Parcelas de Consórcios</h1>
          <p className="text-gray-600 mt-1">Gerencie os pagamentos das parcelas de consórcios</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-1">Pendente</p>
          <p className="text-2xl font-bold text-yellow-600">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredItems.filter(p => p.status === 'pendente').length} parcela(s)
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600 mb-1">Atrasado</p>
          <p className="text-2xl font-bold text-red-600">
            R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredItems.filter(p => p.status === 'atrasado').length} parcela(s)
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Pago</p>
          <p className="text-2xl font-bold text-green-600">
            R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredItems.filter(p => p.status === 'pago').length} parcela(s)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por grupo, cota, cliente ou unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={grupoFilter} onValueChange={setGrupoFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Grupos</SelectItem>
              {grupos.map(grupo => (
                <SelectItem key={grupo} value={grupo}>
                  Grupo {grupo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
            <TabsList className="bg-gray-100 grid grid-cols-4 w-full">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
              <TabsTrigger value="pago">Pagos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Vencimento - De
            </Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataFim" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Vencimento - Até
            </Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ParcelasConsorciosList
        items={filteredItems}
        consorcios={consorcios}
        clientes={clientes}
        unidades={unidades}
        isLoading={isLoading}
        onPagar={handlePagar}
      />

      {showPagarDialog && selectedParcela && (
        <PagarParcelaDialog
          parcela={selectedParcela}
          consorcio={consorcios.find(c => c.id === selectedParcela.consorcio_id)}
          cliente={clientes.find(c => c.id === consorcios.find(cons => cons.id === selectedParcela.consorcio_id)?.cliente_id)}
          unidade={unidades.find(u => u.id === consorcios.find(cons => cons.id === selectedParcela.consorcio_id)?.unidade_id)}
          caixas={caixas.filter(c => c.ativo)}
          onClose={() => {
            setShowPagarDialog(false);
            setSelectedParcela(null);
          }}
          onConfirm={(data) => {
            updateParcelaMutation.mutate(data);
          }}
          isProcessing={updateParcelaMutation.isPending}
        />
      )}
    </div>
  );
}
