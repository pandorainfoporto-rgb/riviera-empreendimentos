import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2, User, UserPlus } from "lucide-react";

export default function ClientesList({ clientes = [], onEdit, onDelete, onNew }) {
  if (clientes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos clientes se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {clientes.map((cliente) => {
        const initials = cliente.nome
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'CL';

        return (
          <Card key={cliente.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                    <AvatarFallback className="text-white font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{cliente.nome}</h3>
                      {cliente.eh_inquilino && (
                        <Badge className="bg-purple-100 text-purple-700">Inquilino</Badge>
                      )}
                      {cliente.eh_cliente_externo_consorcio && (
                        <Badge className="bg-blue-100 text-blue-700">Cliente Externo</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">CPF/CNPJ:</span> {cliente.cpf_cnpj}
                      </div>
                      {cliente.telefone && (
                        <div>
                          <span className="font-medium">Telefone:</span> {cliente.telefone}
                        </div>
                      )}
                      {cliente.email && (
                        <div>
                          <span className="font-medium">Email:</span> {cliente.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(cliente)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(cliente.id)}
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
        );
      })}
    </div>
  );
}