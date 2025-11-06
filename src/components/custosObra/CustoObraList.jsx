import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calculator, TrendingUp, Home, BarChart, Package, Mail } from "lucide-react";

const PADROES_LABELS = {
  medio_baixo: { nome: 'Médio/Baixo', cor: 'bg-green-100 text-green-800' },
  medio: { nome: 'Médio', cor: 'bg-blue-100 text-blue-800' },
  alto: { nome: 'Alto', cor: 'bg-orange-100 text-orange-800' },
  luxo: { nome: 'Luxo', cor: 'bg-purple-100 text-purple-800' },
};

const STATUS_LABELS = {
  orcamento: { nome: 'Orçamento', cor: 'bg-gray-100 text-gray-800' },
  aprovado: { nome: 'Aprovado', cor: 'bg-blue-100 text-blue-800' },
  em_execucao: { nome: 'Em Execução', cor: 'bg-orange-100 text-orange-800' },
  concluido: { nome: 'Concluído', cor: 'bg-green-100 text-green-800' },
};

export default function CustoObraList({ 
  items = [], 
  unidades = [], 
  loteamentos = [], 
  onEdit, 
  onDelete, 
  onVerDashboard, 
  onGerenciarDespesas,
  onCriarOrcamentoCompra 
}) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum custo de obra cadastrado</p>
          <p className="text-sm text-gray-500 mt-2">
            Clique em "Novo Custo de Obra" para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(items || []).map((custo) => {
        const unidade = (unidades || []).find(u => u.id === custo.unidade_id);
        const loteamento = (loteamentos || []).find(l => l.id === unidade?.loteamento_id);
        const padrao = PADROES_LABELS[custo.padrao_obra] || PADROES_LABELS.medio;
        const status = STATUS_LABELS[custo.status] || STATUS_LABELS.orcamento;

        return (
          <Card key={custo.id} className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{custo.nome}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>{unidade?.codigo || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {loteamento?.nome || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => onEdit(custo)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(custo.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge className={padrao.cor}>
                  {padrao.nome}
                </Badge>
                <Badge className={status.cor}>
                  {status.nome}
                </Badge>
                {custo.incluir_mobilia && (
                  <Badge variant="outline">🛋️ Mobília</Badge>
                )}
                {custo.incluir_automacao && (
                  <Badge variant="outline">🤖 Automação</Badge>
                )}
                {custo.incluir_wifi_dados && (
                  <Badge variant="outline">📡 WiFi</Badge>
                )}
                {custo.incluir_aquecimento_solar && (
                  <Badge variant="outline">☀️ Aquec. Solar</Badge>
                )}
                {custo.incluir_ar_condicionado && (
                  <Badge variant="outline">❄️ Ar Cond.</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Área Total</p>
                  <p className="font-semibold text-gray-900">
                    {custo.area_total?.toLocaleString('pt-BR')} m²
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valor/m²</p>
                  <p className="font-semibold text-blue-700">
                    R$ {(custo.valor_m2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-600">Valor Total Estimado</p>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-[var(--wine-700)]">
                  R$ {(custo.valor_total_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => onVerDashboard(custo)}
                    size="sm"
                    variant="outline"
                    className="hover:bg-blue-50"
                  >
                    <BarChart className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => onGerenciarDespesas(custo)}
                    size="sm"
                    variant="outline"
                    className="hover:bg-green-50"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Despesas
                  </Button>
                </div>
                
                <Button
                  onClick={() => onCriarOrcamentoCompra(custo)}
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  📧 Orçamento de Compra
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}