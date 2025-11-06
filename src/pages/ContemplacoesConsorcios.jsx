
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Award, Calendar, DollarSign, Plus, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ContemplacoesConsorcios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [empFilter, setEmpFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [showRegistrarDialog, setShowRegistrarDialog] = useState(false);
  const [mesReferencia, setMesReferencia] = useState(format(new Date(), 'yyyy-MM'));

  const queryClient = useQueryClient();

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list('-data_contemplacao'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['empreendimentos'],
    queryFn: () => base44.entities.Empreendimento.list(),
  });

  // Filtrar apenas contemplados
  const consorciosContemplados = consorcios.filter(c => c.contemplado);

  const filteredItems = consorciosContemplados.filter(item => {
    const cliente = clientes.find(c => c.id === item.cliente_id);
    // const emp = empreendimentos.find(e => e.id === item.empreendimento_id); // This line is not strictly needed for filtering logic directly

    const matchesSearch =
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cota?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmp = empFilter === "todos" || item.empreendimento_id === empFilter;
    const matchesTipo = tipoFilter === "todos" || item.tipo_contemplacao === tipoFilter;

    return matchesSearch && matchesEmp && matchesTipo;
  });

  const valorTotalContemplado = consorciosContemplados.reduce((sum, c) => sum + (c.valor_carta || 0), 0);
  const contemplacoesPorLance = consorciosContemplados.filter(c => c.tipo_contemplacao === 'lance').length;
  const contemplacoesPorSorteio = consorciosContemplados.filter(c => c.tipo_contemplacao === 'sorteio').length;

  const registrarContemplacao = useMutation({
    mutationFn: async ({ consorcioId, tipo }) => {
      const consorcio = consorcios.find(c => c.id === consorcioId);
      return base44.entities.Consorcio.update(consorcioId, {
        ...consorcio,
        contemplado: true,
        tipo_contemplacao: tipo,
        data_contemplacao: format(new Date(), 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      alert('Contemplação registrada com sucesso!');
    },
    onError: (error) => {
      console.error("Erro ao registrar contemplação:", error);
      alert('Ocorreu um erro ao registrar a contemplação.');
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Contemplações</h1>
          <p className="text-gray-600 mt-1">Histórico de contemplações de consórcios</p>
        </div>
        <Button
          onClick={() => setShowRegistrarDialog(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Contemplação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Total Contemplados</p>
                <p className="text-3xl font-bold text-gray-900">{consorciosContemplados.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Por Lance</p>
                <p className="text-3xl font-bold text-gray-900">{contemplacoesPorLance}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Por Sorteio</p>
                <p className="text-3xl font-bold text-gray-900">{contemplacoesPorSorteio}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-[var(--wine-600)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Valor Total</p>
                <p className="text-xl font-bold text-gray-900">
                  R$ {(valorTotalContemplado / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)] shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por cliente, grupo ou cota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={tipoFilter} onValueChange={setTipoFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="lance">Lance</TabsTrigger>
            <TabsTrigger value="sorteio">Sorteio</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por empreendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Empreendimentos</SelectItem>
            {empreendimentos.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline de Contemplações */}
      <div className="space-y-4">
        {filteredItems.map(consorcio => {
          const cliente = clientes.find(c => c.id === consorcio.cliente_id);
          const emp = empreendimentos.find(e => e.id === consorcio.empreendimento_id);

          const tipoColors = {
            lance: "bg-blue-100 text-blue-700 border-blue-200",
            sorteio: "bg-purple-100 text-purple-700 border-purple-200",
          };

          return (
            <Card key={consorcio.id} className="hover:shadow-xl transition-all duration-200 border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold text-[var(--wine-700)]">
                        Grupo {consorcio.grupo} - Cota {consorcio.cota}
                      </h3>
                      <Badge className={tipoColors[consorcio.tipo_contemplacao]}>
                        {consorcio.tipo_contemplacao === 'lance' ? 'Lance' : 'Sorteio'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold">Cliente:</span>
                        <span>{cliente?.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-semibold">Empreendimento:</span>
                        <span>{emp?.nome}</span>
                      </div>
                      {consorcio.data_contemplacao && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">Data Contemplação:</span>
                          <span>{format(parseISO(consorcio.data_contemplacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Valor da Carta</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {consorcio.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {consorcio.parcelas_pagas} / {consorcio.parcelas_total} parcelas pagas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500">Nenhuma contemplação encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para registrar contemplação */}
      {showRegistrarDialog && (
        <Dialog open={showRegistrarDialog} onOpenChange={setShowRegistrarDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[var(--wine-700)]">Registrar Contemplações do Mês</DialogTitle>
              <DialogDescription>
                Selecione as cotas que foram contempladas neste mês
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mesReferencia">Mês de Referência</Label>
                <Input
                  id="mesReferencia"
                  type="month"
                  value={mesReferencia}
                  onChange={(e) => setMesReferencia(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Cotas Ativas (não contempladas)</Label>
                {consorcios.filter(c => !c.contemplado).map(consorcio => {
                  const cliente = clientes.find(cl => cl.id === consorcio.cliente_id);
                  const emp = empreendimentos.find(e => e.id === consorcio.empreendimento_id);

                  return (
                    <div key={consorcio.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">Grupo {consorcio.grupo} - Cota {consorcio.cota}</p>
                          <p className="text-sm text-gray-600">{cliente?.nome}</p>
                          <p className="text-xs text-gray-500">{emp?.nome}</p>
                        </div>
                        <Badge className="bg-[var(--wine-100)] text-[var(--wine-700)]">
                          {consorcio.parcelas_pagas} / {consorcio.parcelas_total} parcelas
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Confirmar contemplação por LANCE?')) {
                              registrarContemplacao.mutate({
                                consorcioId: consorcio.id,
                                tipo: 'lance'
                              });
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={registrarContemplacao.isPending}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Contemplar por Lance
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Confirmar contemplação por SORTEIO?')) {
                              registrarContemplacao.mutate({
                                consorcioId: consorcio.id,
                                tipo: 'sorteio'
                              });
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={registrarContemplacao.isPending}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Contemplar por Sorteio
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {consorcios.filter(c => !c.contemplado).length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    Todas as cotas já foram contempladas
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegistrarDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
