import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Grid3x3, Award, TrendingUp, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import FormularioAssembleia from "../components/consorcios/FormularioAssembleia";
import GridCotasDialog from "../components/consorcios/GridCotasDialog";

export default function ResultadosConsorcios() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("todos");
  const [showGridDialog, setShowGridDialog] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const queryClient = useQueryClient();

  const { data: resultados = [], isLoading } = useQuery({
    queryKey: ['resultadosAssembleias'],
    queryFn: () => base44.entities.ResultadoAssembleia.list('-data_assembleia'),
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

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: administradoras = [] } = useQuery({
    queryKey: ['administradoras'],
    queryFn: () => base44.entities.AdministradoraConsorcio.list(),
  });

  const grupos = useMemo(() => {
    const gruposUnicos = [...new Set((consorcios || []).map(c => c.grupo).filter(Boolean))];
    return gruposUnicos.sort();
  }, [consorcios]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const resultado = await base44.entities.ResultadoAssembleia.create(data);
      
      if (data.cotas_contempladas && Array.isArray(data.cotas_contempladas)) {
        const consorciosParaAtualizar = (consorcios || []).filter(c => 
          c.grupo === data.grupo && 
          data.cotas_contempladas.some(cota => cota.numero_cota === c.cota)
        );

        for (const consorcio of consorciosParaAtualizar) {
          const cotaInfo = data.cotas_contempladas.find(cota => cota.numero_cota === consorcio.cota);
          await base44.entities.Consorcio.update(consorcio.id, {
            contemplado: true,
            data_contemplacao: data.data_assembleia,
            tipo_contemplacao: cotaInfo.tipo,
            percentual_lance: cotaInfo.tipo === 'lance' ? cotaInfo.percentual_lance : 0,
            valor_lance: cotaInfo.tipo === 'lance' ? (consorcio.valor_carta * cotaInfo.percentual_lance / 100) : 0,
          });
        }
      }
      
      return resultado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultadosAssembleias'] });
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      setShowForm(false);
      toast.success("Resultado da assembleia registrado com sucesso!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ResultadoAssembleia.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultadosAssembleias'] });
      toast.success("Resultado excluído com sucesso!");
    },
  });

  const gerarPagamentoLanceMutation = useMutation({
    mutationFn: async ({ consorcio, administradora }) => {
      // Criar pagamento do lance
      const pagamento = await base44.entities.PagamentoFornecedor.create({
        fornecedor_id: administradora.fornecedor_id,
        tipo: 'lance_consorcio',
        consorcio_id: consorcio.id,
        valor: consorcio.valor_lance,
        data_vencimento: new Date().toISOString().split('T')[0],
        forma_pagamento: 'boleto',
        status: 'pendente',
        descricao: `Lance do consórcio - Grupo ${consorcio.grupo} Cota ${consorcio.cota} - ${consorcio.percentual_lance}%`,
      });

      // Atualizar consórcio
      await base44.entities.Consorcio.update(consorcio.id, {
        lance_pago: false,
        pagamento_lance_id: pagamento.id,
      });

      return pagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      toast.success("Pagamento do lance gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar pagamento do lance: " + error.message);
    },
  });

  const filteredResultados = (resultados || []).filter(item => {
    const matchesSearch = 
      item.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrupo = grupoFilter === "todos" || item.grupo === grupoFilter;
    
    return matchesSearch && matchesGrupo;
  });

  const handleVerGrid = (grupo) => {
    setSelectedGrupo(grupo);
    setShowGridDialog(true);
  };

  const handleVencemos = (consorcio) => {
    if (!consorcio.administradora_id) {
      toast.error("Esta cota não possui administradora cadastrada!");
      return;
    }

    const administradora = administradoras.find(a => a.id === consorcio.administradora_id);
    if (!administradora) {
      toast.error("Administradora não encontrada!");
      return;
    }

    if (!administradora.fornecedor_id) {
      toast.error("Administradora não possui fornecedor vinculado!");
      return;
    }

    if (consorcio.pagamento_lance_id) {
      toast.warning("Pagamento do lance já foi gerado para esta cota!");
      return;
    }

    if (confirm(`Gerar pagamento do lance de R$ ${consorcio.valor_lance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${administradora.nome}?`)) {
      gerarPagamentoLanceMutation.mutate({ consorcio, administradora });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Resultados de Assembleias</h1>
          <p className="text-gray-600 mt-1">Registre contemplações de sorteio e lance</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Resultado
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={grupoFilter} onValueChange={setGrupoFilter}>
          <SelectTrigger className="w-full md:w-64">
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
      </div>

      {showForm && (
        <FormularioAssembleia
          grupos={grupos}
          loteamentos={loteamentos}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isProcessing={createMutation.isPending}
        />
      )}

      {showGridDialog && selectedGrupo && (
        <GridCotasDialog
          grupo={selectedGrupo}
          consorcios={consorcios}
          clientes={clientes}
          unidades={unidades}
          onClose={() => {
            setShowGridDialog(false);
            setSelectedGrupo(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {filteredResultados.map((resultado) => {
          const loteamento = (loteamentos || []).find(l => l.id === resultado.loteamento_id);
          const cotasContempladas = resultado.cotas_contempladas || [];

          return (
            <Card key={resultado.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-white">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
                      <Award className="w-6 h-6" />
                      Grupo {resultado.grupo} - {new Date(resultado.data_assembleia).toLocaleDateString('pt-BR')}
                    </CardTitle>
                    {loteamento && (
                      <p className="text-sm text-gray-600 mt-1">{loteamento.nome}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerGrid(resultado.grupo)}
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Ver Grid
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Deseja realmente excluir este resultado?")) {
                          deleteMutation.mutate(resultado.id);
                        }
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Cotas Contempladas ({cotasContempladas.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cotasContempladas.map((cota, idx) => {
                        // Buscar consórcio correspondente
                        const consorcioCorrespondente = consorcios.find(c => 
                          c.grupo === resultado.grupo && c.cota === cota.numero_cota
                        );

                        const ehNossaCota = !!consorcioCorrespondente;
                        const ehLance = cota.tipo === 'lance';
                        const jaTemPagamento = consorcioCorrespondente?.pagamento_lance_id;

                        return (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg border-2 ${
                              ehLance
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-blue-500 bg-blue-50'
                            } ${ehNossaCota ? 'ring-2 ring-green-400' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">Cota {cota.numero_cota}</p>
                                  {ehNossaCota && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      Nossa
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600">
                                  {ehLance 
                                    ? `Lance ${cota.percentual_lance}%`
                                    : 'Sorteio'
                                  }
                                </p>
                                {ehNossaCota && ehLance && consorcioCorrespondente.valor_lance > 0 && (
                                  <p className="text-xs font-semibold text-purple-700 mt-1">
                                    Valor: R$ {consorcioCorrespondente.valor_lance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>

                              {ehNossaCota && ehLance && !jaTemPagamento && (
                                <Button
                                  size="sm"
                                  onClick={() => handleVencemos(consorcioCorrespondente)}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                                  disabled={gerarPagamentoLanceMutation.isPending}
                                >
                                  <Trophy className="w-4 h-4 mr-1" />
                                  Vencemos
                                </Button>
                              )}

                              {ehNossaCota && jaTemPagamento && (
                                <Badge className="bg-green-100 text-green-700">
                                  Pagamento Gerado
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {resultado.observacoes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{resultado.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredResultados.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum resultado de assembleia encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}