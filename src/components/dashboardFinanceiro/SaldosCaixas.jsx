import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SaldosCaixas({ caixas = [] }) {
  const caixasAtivos = (caixas || []).filter(c => c.ativo);
  
  const caixasPorTipo = {
    dinheiro: (caixasAtivos || []).filter(c => c.tipo === 'dinheiro'),
    conta_bancaria: (caixasAtivos || []).filter(c => c.tipo === 'conta_bancaria'),
    corretora: (caixasAtivos || []).filter(c => c.tipo === 'corretora'),
  };

  const totalPorTipo = {
    dinheiro: (caixasPorTipo.dinheiro || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
    conta_bancaria: (caixasPorTipo.conta_bancaria || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
    corretora: (caixasPorTipo.corretora || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0),
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[var(--wine-700)] flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Saldos dos Caixas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">💵 Dinheiro</span>
              <Badge variant="outline">{caixasPorTipo.dinheiro.length} caixa(s)</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {totalPorTipo.dinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {caixasPorTipo.dinheiro.length > 0 && (
              <div className="mt-2 space-y-1">
                {(caixasPorTipo.dinheiro || []).map(caixa => (
                  <div key={caixa.id} className="flex justify-between text-xs text-gray-600">
                    <span>{caixa.nome}</span>
                    <span className="font-mono">R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">🏦 Contas Bancárias</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">{caixasPorTipo.conta_bancaria.length} conta(s)</Badge>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              R$ {totalPorTipo.conta_bancaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {caixasPorTipo.conta_bancaria.length > 0 && (
              <div className="mt-2 space-y-1">
                {(caixasPorTipo.conta_bancaria || []).map(caixa => (
                  <div key={caixa.id} className="flex justify-between text-xs text-blue-700">
                    <span>{caixa.nome}</span>
                    <span className="font-mono">R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">📈 Corretoras</span>
              <Badge variant="outline" className="bg-purple-100 text-purple-700">{caixasPorTipo.corretora.length} corretora(s)</Badge>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              R$ {totalPorTipo.corretora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {caixasPorTipo.corretora.length > 0 && (
              <div className="mt-2 space-y-1">
                {(caixasPorTipo.corretora || []).map(caixa => (
                  <div key={caixa.id} className="flex justify-between text-xs text-purple-700">
                    <span>{caixa.nome}</span>
                    <span className="font-mono">R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}