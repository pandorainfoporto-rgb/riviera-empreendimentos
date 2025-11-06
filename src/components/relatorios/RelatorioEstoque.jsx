import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RelatorioEstoque({ tipo }) {
  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => base44.entities.Produto.list(),
  });

  const produtosAtivos = produtos.filter(p => p.ativo);
  const produtosBaixoEstoque = produtosAtivos.filter(p => 
    (p.estoque_atual || 0) <= (p.estoque_minimo || 0) && p.estoque_minimo > 0
  );

  const valorTotalEstoque = produtosAtivos.reduce((sum, p) => 
    sum + ((p.estoque_atual || 0) * (p.valor_unitario || 0)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Produtos</p>
            <p className="text-3xl font-bold text-gray-900">{produtosAtivos.length}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-red-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Baixo Estoque</p>
            <p className="text-3xl font-bold text-red-600">{produtosBaixoEstoque.length}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-green-500">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Valor Total</p>
            <p className="text-xl font-bold text-green-600">
              R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {produtosAtivos.map(prod => {
          const baixoEstoque = (prod.estoque_atual || 0) <= (prod.estoque_minimo || 0) && prod.estoque_minimo > 0;
          const valorTotal = (prod.estoque_atual || 0) * (prod.valor_unitario || 0);

          return (
            <Card key={prod.id} className={`shadow-lg ${baixoEstoque ? 'border-l-4 border-red-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{prod.nome}</h3>
                      {baixoEstoque && (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Baixo Estoque
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{prod.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estoque Atual</p>
                    <p className="text-2xl font-bold text-[var(--wine-700)]">
                      {prod.estoque_atual || 0} {prod.unidade_medida}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mínimo: {prod.estoque_minimo || 0} {prod.unidade_medida}
                    </p>
                    <p className="text-sm font-semibold text-green-600 mt-2">
                      Valor: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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