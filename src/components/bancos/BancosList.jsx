import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Building2, Plus } from "lucide-react";

export default function BancosList({ bancos = [], onEdit, onDelete, onNew }) {
  if (bancos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum banco encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos bancos se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Banco
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {bancos.map((banco) => (
        <Card key={banco.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-lg text-gray-900">{banco.nome}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                  {banco.codigo && (
                    <div>
                      <span className="font-medium">Código:</span> {banco.codigo}
                    </div>
                  )}
                  {banco.agencia && (
                    <div>
                      <span className="font-medium">Agência:</span> {banco.agencia}
                    </div>
                  )}
                  {banco.tipo && (
                    <div>
                      <span className="font-medium">Tipo:</span> {banco.tipo}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(banco)}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(banco.id)}
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