import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categoriasLabels = {
  pagamento_consorcio: "Consórcio",
  juros_consorcio: "Juros",
  multa_consorcio: "Multas",
  pagamento_fornecedor: "Fornecedores",
  investimento: "Investimentos",
  marketing: "Marketing",
  operacional: "Operacional",
  materiais_construcao: "Materiais",
  mao_de_obra: "Mão de Obra",
  equipamentos: "Equipamentos",
  servicos_especializados: "Serviços",
  impostos_taxas: "Impostos",
  administrativo: "Administrativo",
  outros: "Outros",
};

export default function OrcamentoVsRealizado({ orcamentos = [], calcularGastoReal }) {
  const dados = (orcamentos || [])
    .map(orc => {
      const gastoReal = calcularGastoReal ? calcularGastoReal(orc.categoria, orc.mes_referencia, orc.loteamento_id) : 0;
      const valorOrcado = orc.valor_orcado || 0;
      const percentual = valorOrcado > 0 ? (gastoReal / valorOrcado) * 100 : 0;
      const limiteAlerta = orc.limite_alerta_percentual || 80;
      
      return {
        categoria: categoriasLabels[orc.categoria] || orc.categoria,
        orcado: valorOrcado,
        realizado: gastoReal,
        saldo: valorOrcado - gastoReal,
        percentual,
        excedeu: percentual > 100,
        alerta: percentual >= limiteAlerta && percentual <= 100,
      };
    })
    .filter(d => d.orcado > 0)
    .sort((a, b) => b.orcado - a.orcado)
    .slice(0, 10);

  const totalExcedidos = dados.filter(d => d.excedeu).length;
  const totalAlertas = dados.filter(d => d.alerta).length;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Orçamento vs Realizado
          </CardTitle>
          <div className="flex gap-2">
            {totalExcedidos > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {totalExcedidos} Excedido{totalExcedidos > 1 ? 's' : ''}
              </Badge>
            )}
            {totalAlertas > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {totalAlertas} Alerta{totalAlertas > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dados.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="categoria" 
                  stroke="#6b7280" 
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="orcado" fill="#3b82f6" name="Orçado" radius={[8, 8, 0, 0]} />
                <Bar dataKey="realizado" fill="#ef4444" name="Realizado" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {dados.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded">
                  <span className="text-gray-700">{item.categoria}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${item.excedeu ? 'text-red-600' : item.saldo < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {item.percentual.toFixed(1)}%
                    </span>
                    {item.excedeu && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {!item.excedeu && item.alerta && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Nenhum orçamento configurado para este período</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}