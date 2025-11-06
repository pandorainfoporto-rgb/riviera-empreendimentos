import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, Search, Eye, Download, CheckCircle2, 
  Clock, AlertCircle, Package, TrendingUp, FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusColors = {
  rascunho: "bg-gray-100 text-gray-800",
  enviado: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const statusLabels = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
};

export default function OrcamentosCompra() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [unidadeFilter, setUnidadeFilter] = useState("todas");
  const queryClient = useQueryClient();

  const { data: orcamentos = [] } = useQuery({
    queryKey: ['orcamentos_compra'],
    queryFn: () => base44.entities.OrcamentoCompra.list('-data_orcamento'),
    initialData: [],
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
    initialData: [],
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    initialData: [],
  });

  const { data: custosObra = [] } = useQuery({
    queryKey: ['custos_obra'],
    queryFn: () => base44.entities.CustoObra.list(),
    initialData: [],
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    initialData: [],
  });

  const orcamentosFiltrados = (orcamentos || []).filter(orc => {
    const unidade = (unidades || []).find(u => u.id === orc.unidade_id);
    const custoObra = (custosObra || []).find(c => c.id === orc.custo_obra_id);
    
    const matchSearch = !searchTerm || 
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custoObra?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === "todos" || orc.status === statusFilter;
    const matchUnidade = unidadeFilter === "todas" || orc.unidade_id === unidadeFilter;
    
    return matchSearch && matchStatus && matchUnidade;
  });

  const totalOrcamentos = (orcamentos || []).length;
  const orcamentosEnviados = (orcamentos || []).filter(o => o.status === 'enviado' || o.status === 'em_analise').length;
  const orcamentosAprovados = (orcamentos || []).filter(o => o.status === 'aprovado').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Orçamentos de Compra</h1>
          <p className="text-gray-600 mt-1">Gerencie cotações enviadas aos fornecedores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-blue-700">{totalOrcamentos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Enviados</p>
            <p className="text-2xl font-bold text-yellow-700">{orcamentosEnviados}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Aprovados</p>
            <p className="text-2xl font-bold text-green-700">{orcamentosAprovados}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Taxa Aprovação</p>
            <p className="text-2xl font-bold text-purple-700">
              {totalOrcamentos > 0 ? Math.round((orcamentosAprovados / totalOrcamentos) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar orçamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Unidades</SelectItem>
            {(unidades || []).map(uni => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Orçamentos */}
      {(orcamentosFiltrados || []).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum orçamento encontrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Os orçamentos são criados na página "Custos de Obra"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {(orcamentosFiltrados || []).map((orcamento) => {
            const unidade = (unidades || []).find(u => u.id === orcamento.unidade_id);
            const loteamento = (loteamentos || []).find(l => l.id === unidade?.loteamento_id);
            const custoObra = (custosObra || []).find(c => c.id === orcamento.custo_obra_id);
            const totalFornecedores = orcamento.fornecedores_enviados?.length || 0;
            const fornecedoresRespondidos = (orcamento.fornecedores_enviados || []).filter(f => f.respondido).length;

            return (
              <Card key={orcamento.id} className="hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-gray-900">
                          #{orcamento.id.substring(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge className={statusColors[orcamento.status]}>
                          {statusLabels[orcamento.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {unidade?.codigo || 'N/A'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{loteamento?.nome || 'N/A'}</span>
                        <span className="text-gray-400">•</span>
                        <span>{custoObra?.nome || 'N/A'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(orcamento.data_orcamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-700 font-semibold">Fornecedores</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{totalFornecedores}</p>
                      <p className="text-xs text-blue-600 mt-1">enviados</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-700 font-semibold">Respondidos</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{fornecedoresRespondidos}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {totalFornecedores > 0 ? Math.round((fornecedoresRespondidos / totalFornecedores) * 100) : 0}%
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-purple-700 font-semibold">Etapas</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {orcamento.etapas_selecionadas?.length || 0}
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-orange-700 font-semibold">Validade</p>
                      </div>
                      <p className="text-sm font-bold text-orange-900">
                        {orcamento.prazo_validade ? format(new Date(orcamento.prazo_validade), "dd/MM/yyyy") : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Fornecedores */}
                  {(orcamento.fornecedores_enviados || []).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Fornecedores Contatados
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {(orcamento.fornecedores_enviados || []).map((fornEnv, idx) => {
                          const fornecedor = (fornecedores || []).find(f => f.id === fornEnv.fornecedor_id);
                          
                          return (
                            <div key={idx} className="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{fornecedor?.nome || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{fornecedor?.email || 'Sem email'}</p>
                                </div>
                                {fornEnv.respondido ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Respondido
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Aguardando
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>📧 Enviado: {fornEnv.data_envio ? format(new Date(fornEnv.data_envio), "dd/MM/yyyy HH:mm") : 'N/A'}</p>
                                {fornEnv.respondido && fornEnv.data_resposta && (
                                  <p>✅ Resposta: {format(new Date(fornEnv.data_resposta), "dd/MM/yyyy HH:mm")}</p>
                                )}
                                {fornEnv.valor_total_cotado > 0 && (
                                  <p className="font-semibold text-green-700">
                                    💰 R$ {fornEnv.valor_total_cotado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Etapas */}
                  {(orcamento.etapas_selecionadas || []).length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🔧 Etapas Incluídas:</h4>
                      <div className="flex gap-2 flex-wrap">
                        {(orcamento.etapas_selecionadas || []).map((etapa, idx) => (
                          <Badge key={idx} variant="outline">
                            {etapa.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {orcamento.observacoes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{orcamento.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}