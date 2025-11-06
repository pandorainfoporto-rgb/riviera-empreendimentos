import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building, UserPlus } from "lucide-react";

export default function FornecedoresList({ fornecedores = [], onEdit, onDelete, onNew }) {
  if (fornecedores.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos fornecedores se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Fornecedor
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {fornecedores.map((fornecedor) => (
        <Card key={fornecedor.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900">{fornecedor.nome}</h3>
                  {!fornecedor.ativo && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Inativo
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">CNPJ:</span> {fornecedor.cnpj}
                  </div>
                  {fornecedor.telefone && (
                    <div>
                      <span className="font-medium">Telefone:</span> {fornecedor.telefone}
                    </div>
                  )}
                  {fornecedor.email && (
                    <div>
                      <span className="font-medium">Email:</span> {fornecedor.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(fornecedor)}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(fornecedor.id)}
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