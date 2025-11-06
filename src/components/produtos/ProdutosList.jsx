import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package, Plus } from "lucide-react";

export default function ProdutosList({ produtos = [], onEdit, onDelete, onNew }) {
  if (produtos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos produtos se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Produto
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {produtos.map((produto) => (
        <Card key={produto.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900">{produto.nome}</h3>
                  {!produto.ativo && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Inativo
                    </Badge>
                  )}
                  {produto.estoque_atual <= produto.estoque_minimo && (
                    <Badge className="bg-red-100 text-red-700">
                      Estoque Baixo
                    </Badge>
                  )}
                </div>

                {produto.descricao && (
                  <p className="text-sm text-gray-600">{produto.descricao}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Categoria:</span> {produto.categoria}
                  </div>
                  <div>
                    <span className="font-medium">Unidade:</span> {produto.unidade_medida}
                  </div>
                  {produto.valor_unitario && (
                    <div>
                      <span className="font-medium">Valor:</span> R$ {produto.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Estoque:</span> {produto.estoque_atual || 0}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(produto)}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(produto.id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}