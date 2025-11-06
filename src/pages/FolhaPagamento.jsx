import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import FolhaPagamentoForm from "../components/folhaPagamento/FolhaPagamentoForm";
import FolhaPagamentoList from "../components/folhaPagamento/FolhaPagamentoList";

export default function FolhaPagamento() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mesFilter, setMesFilter] = useState(format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();

  const { data: folhas = [], isLoading } = useQuery({
    queryKey: ['folhasPagamento'],
    queryFn: () => base44.entities.FolhaPagamento.list('-mes_referencia'),
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores'],
    queryFn: () => base44.entities.Colaborador.list(),
  });

  const { data: centrosCusto = [] } = useQuery({
    queryKey: ['centrosCusto'],
    queryFn: () => base44.entities.CentroCusto.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FolhaPagamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhasPagamento'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FolhaPagamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhasPagamento'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FolhaPagamento.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhasPagamento'] });
    },
  });

  const folhasFiltradas = folhas.filter(f => f.mes_referencia === mesFilter);

  const totalProventos = folhasFiltradas.reduce((sum, f) => sum + (f.total_proventos || 0), 0);
  const totalDescontos = folhasFiltradas.reduce((sum, f) => sum + (f.total_descontos || 0), 0);
  const totalLiquido = folhasFiltradas.reduce((sum, f) => sum + (f.salario_liquido || 0), 0);
  const totalCustoEmpresa = folhasFiltradas.reduce((sum, f) => sum + (f.custo_total_empresa || 0), 0);

  const gerarFolhaAutomatica = async () => {
    const colaboradoresAtivos = colaboradores.filter(c => c.status === 'ativo');
    
    for (const colaborador of colaboradoresAtivos) {
      // Verificar se já existe folha para este colaborador neste mês
      const jaExiste = folhas.some(f => 
        f.colaborador_id === colaborador.id && 
        f.mes_referencia === mesFilter &&
        f.tipo_folha === 'mensal'
      );

      if (jaExiste) continue;

      // Calcular folha
      const salarioBase = colaborador.salario_base || 0;
      const totalProventos = salarioBase;
      
      // INSS (simplificado)
      const inssAliquota = salarioBase <= 1412 ? 7.5 : salarioBase <= 2666.68 ? 9 : salarioBase <= 4000.03 ? 12 : 14;
      const inssValor = (salarioBase * inssAliquota) / 100;

      // IRRF (simplificado)
      const deducaoDependentes = (colaborador.dependentes?.length || 0) * 189.59;
      const baseIRRF = salarioBase - inssValor - deducaoDependentes;
      let irrfAliquota = 0;
      let irrfDeducao = 0;
      
      if (baseIRRF > 4664.68) {
        irrfAliquota = 27.5;
        irrfDeducao = 869.36;
      } else if (baseIRRF > 3751.05) {
        irrfAliquota = 22.5;
        irrfDeducao = 636.13;
      } else if (baseIRRF > 2826.65) {
        irrfAliquota = 15;
        irrfDeducao = 354.80;
      } else if (baseIRRF > 2112) {
        irrfAliquota = 7.5;
        irrfDeducao = 158.40;
      }

      const irrfValor = baseIRRF > 0 ? (baseIRRF * irrfAliquota / 100) - irrfDeducao : 0;

      const totalDescontos = inssValor + (irrfValor > 0 ? irrfValor : 0);
      const salarioLiquido = totalProventos - totalDescontos;

      // Encargos patronais
      const inssPatronal = salarioBase * 0.20;
      const fgts = salarioBase * 0.08;
      const rat = salarioBase * 0.03;
      const terceiros = salarioBase * 0.058;
      const totalEncargos = inssPatronal + fgts + rat + terceiros;
      const custoTotalEmpresa = salarioBase + totalEncargos;

      await createMutation.mutateAsync({
        colaborador_id: colaborador.id,
        centro_custo_id: colaborador.centro_custo_id,
        mes_referencia: mesFilter,
        tipo_folha: 'mensal',
        dias_trabalhados: 30,
        salario_base: salarioBase,
        total_proventos: totalProventos,
        inss_base_calculo: salarioBase,
        inss_aliquota: inssAliquota,
        inss_valor: inssValor,
        irrf_base_calculo: baseIRRF,
        irrf_aliquota: irrfAliquota,
        irrf_valor: irrfValor > 0 ? irrfValor : 0,
        irrf_dependentes: colaborador.dependentes?.length || 0,
        irrf_deducao_dependentes: deducaoDependentes,
        fgts_valor: fgts,
        total_descontos: totalDescontos,
        salario_liquido: salarioLiquido,
        custo_total_empresa: custoTotalEmpresa,
        encargos_sociais: {
          inss_patronal: inssPatronal,
          fgts: fgts,
          rat: rat,
          terceiros: terceiros,
          total_encargos: totalEncargos,
        },
        status: 'calculada',
      });
    }

    queryClient.invalidateQueries({ queryKey: ['folhasPagamento'] });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Folha de Pagamento</h1>
          <p className="text-gray-600 mt-1">Gestão de folha e encargos trabalhistas</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={gerarFolhaAutomatica}
            variant="outline"
            className="hover:bg-blue-100"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Gerar Folha Automática
          </Button>
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Proventos</p>
            <p className="text-xl font-bold text-blue-700">
              R$ {(totalProventos / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Descontos</p>
            <p className="text-xl font-bold text-red-700">
              R$ {(totalDescontos / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Líquido a Pagar</p>
            <p className="text-xl font-bold text-green-700">
              R$ {(totalLiquido / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Custo Total Empresa</p>
            <p className="text-xl font-bold text-purple-700">
              R$ {(totalCustoEmpresa / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Select value={mesFilter} onValueChange={setMesFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = format(date, "yyyy-MM");
              const label = format(date, "MMMM yyyy", { locale: ptBR });
              return (
                <SelectItem key={value} value={value}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Folha
        </Button>
      </div>

      <FolhaPagamentoList
        items={folhasFiltradas}
        colaboradores={colaboradores}
        centrosCusto={centrosCusto}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => {
          if (confirm('Deseja excluir este lançamento?')) {
            deleteMutation.mutate(id);
          }
        }}
      />

      {showForm && (
        <FolhaPagamentoForm
          item={editingItem}
          colaboradores={colaboradores}
          centrosCusto={centrosCusto}
          mesReferencia={mesFilter}
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
    </div>
  );
}