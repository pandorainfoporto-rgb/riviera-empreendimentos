import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Search, Mail, CheckCircle2, Clock, XCircle,
  TrendingUp, Package, Award
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatorioOrcamentosCompra() {
  const [busca, setBusca] = useState("");

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos_compra'],
    queryFn: () => base44.entities.OrcamentoCompra.list('-data_orcamento'),
    initialData: [],
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    initialData: [],
  });

  const totalOrcamentos = orcamentos.length;
  const totalEnviados = orcamentos.filter(o => o.status === 'enviado' || o.status === 'em_analise').length;
  const totalAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
  const taxaAprovacao = totalOrcamentos > 0 ? (totalAprovados / totalOrcamentos) * 100 : 0;

  const totalFornecedoresContatados = orcamentos.reduce((sum, orc) => 
    sum + (orc.fornecedores_enviados?.length || 0), 0
  );
  const totalRespostas = orcamentos.reduce((sum, orc) => 
    sum + (orc.fornecedores_enviados?.filter(f => f.respondido).length || 0), 0
  );
  const taxaResposta = totalFornecedoresContatados > 0 
    ? (totalRespostas / totalFornecedoresContatados) * 100 
    : 0;

  const orcamentosFiltrados = orcamentos.filter(orc => 
    !busca || orc.id.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Relatório de Orçamentos de Compra</h1>
          <p className="text-gray-600 mt-1">Análise de cotações e aprovações</p>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total de Orçamentos</p>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{totalOrcamentos}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Enviados</p>
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">{totalEnviados}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Taxa de Aprovação</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{taxaAprovacao.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">{totalAprovados} aprovados</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Taxa de Resposta</p>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{taxaResposta.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalRespostas} de {totalFornecedoresContatados}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar orçamentos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-4">
        {orcamentosFiltrados.map(orc => {
          const totalForn = orc.fornecedores_enviados?.length || 0;
          const respostas = orc.fornecedores_enviados?.filter(f => f.respondido).length || 0;

          return (
            <Card key={orc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      #{orc.id.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(orc.data_orcamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={`
                    ${orc.status === 'enviado' ? 'bg-blue-100 text-blue-800' : ''}
                    ${orc.status === 'em_analise' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${orc.status === 'aprovado' ? 'bg-green-100 text-green-800' : ''}
                    ${orc.status === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {orc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-700 font-semibold">Fornecedores</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{totalForn}</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-green-700 font-semibold">Respostas</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{respostas}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {totalForn > 0 ? ((respostas / totalForn) * 100).toFixed(0) : 0}%
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-purple-700 font-semibold">Etapas</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {orc.etapas_selecionadas?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}