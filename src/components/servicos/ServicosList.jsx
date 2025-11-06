import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Wrench, Plus } from "lucide-react";

export default function ServicosList({ servicos = [], onEdit, onDelete, onNew }) {
  if (servicos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos serviços se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Serviço
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {servicos.map((servico) => (
        <Card key={servico.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900">{servico.nome}</h3>
                  {!servico.ativo && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Inativo
                    </Badge>
                  )}
                </div>

                {servico.descricao && (
                  <p className="text-sm text-gray-600">{servico.descricao}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Categoria:</span> {servico.categoria}
                  </div>
                  <div>
                    <span className="font-medium">Unidade:</span> {servico.unidade_medida}
                  </div>
                  {servico.valor_unitario && (
                    <div>
                      <span className="font-medium">Valor:</span> R$ {servico.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(servico)}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(servico.id)}
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