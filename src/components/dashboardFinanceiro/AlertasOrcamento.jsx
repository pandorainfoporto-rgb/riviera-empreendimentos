import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const categoriasLabels = {
  pagamento_consorcio: "Pagamento Consórcio",
  juros_consorcio: "Juros Consórcio",
  multa_consorcio: "Multa Consórcio",
  pagamento_fornecedor: "Pagamento Fornecedor",
  investimento: "Investimento",
  marketing: "Marketing",
  operacional: "Operacional",
  materiais_construcao: "Materiais de Construção",
  mao_de_obra: "Mão de Obra",
  equipamentos: "Equipamentos",
  servicos_especializados: "Serviços Especializados",
  impostos_taxas: "Impostos e Taxas",
  administrativo: "Administrativo",
  outros: "Outros",
};

export default function AlertasOrcamento({ orcamentos = [], calcularGastoReal }) {
  const alertas = (orcamentos || [])
    .map(orc => {
      const gastoReal = calcularGastoReal ? calcularGastoReal(orc.categoria, orc.mes_referencia, orc.loteamento_id) : 0;
      const valorOrcado = orc.valor_orcado || 0;
      const percentualGasto = valorOrcado > 0 ? (gastoReal / valorOrcado) * 100 : 0;
      const limiteAlerta = orc.limite_alerta_percentual || 80;
      const excedeu = percentualGasto > 100;
      const alerta = percentualGasto >= limiteAlerta && !excedeu;

      return {
        orcamento: orc,
        gastoReal,
        percentualGasto,
        excedeu,
        alerta,
        temProblema: excedeu || alerta,
      };
    })
    .filter(item => item.temProblema)
    .sort((a, b) => b.percentualGasto - a.percentualGasto);

  const totalExcedidos = alertas.filter(a => a.excedeu).length;
  const totalProximos = alertas.filter(a => a.alerta).length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Alertas de Orçamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertas.length > 0 ? (
          <div className="space-y-3">
            {/* Resumo */}
            <div className="flex gap-2 mb-4">
              {totalExcedidos > 0 && (
                <Badge className="bg-red-100 text-red-700">
                  {totalExcedidos} Excedido{totalExcedidos > 1 ? 's' : ''}
                </Badge>
              )}
              {totalProximos > 0 && (
                <Badge className="bg-amber-100 text-amber-700">
                  {totalProximos} Próximo{totalProximos > 1 ? 's' : ''} do limite
                </Badge>
              )}
            </div>

            {/* Lista de Alertas */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alertas.map((item, index) => {
                const saldo = (item.orcamento.valor_orcado || 0) - item.gastoReal;
                return (
                  <Alert 
                    key={index}
                    className={`${item.excedeu ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${item.excedeu ? 'text-red-600' : 'text-amber-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold ${item.excedeu ? 'text-red-900' : 'text-amber-900'}`}>
                            {categoriasLabels[item.orcamento.categoria] || item.orcamento.categoria}
                          </h4>
                          <Badge variant="outline" className={item.excedeu ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'}>
                            {item.percentualGasto.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <AlertDescription className={`text-sm ${item.excedeu ? 'text-red-800' : 'text-amber-800'}`}>
                          {item.excedeu ? (
                            <>
                              Orçamento excedido em <strong>R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            </>
                          ) : (
                            <>
                              Restam <strong>R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> do orçamento
                            </>
                          )}
                        </AlertDescription>

                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Orçado: R$ {(item.orcamento.valor_orcado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span>Gasto: R$ {item.gastoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <Progress 
                            value={Math.min(item.percentualGasto, 100)} 
                            className={`h-2 ${item.excedeu ? 'bg-red-200' : 'bg-amber-200'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold mb-1">Tudo sob controle!</p>
            <p className="text-sm text-gray-500">
              Nenhum orçamento próximo do limite ou excedido
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}