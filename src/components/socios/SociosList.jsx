import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2, Users, UserPlus } from "lucide-react";

export default function SociosList({ socios = [], onEdit, onDelete, onNew }) {
  if (socios.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum sócio encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos sócios se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Sócio
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {socios.map((socio) => {
        const initials = socio.nome
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'SC';

        return (
          <Card key={socio.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600">
                    <AvatarFallback className="text-white font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{socio.nome}</h3>
                      {socio.eh_fornecedor && (
                        <Badge className="bg-green-100 text-green-700">Também é Fornecedor</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">CPF/CNPJ:</span> {socio.cpf_cnpj}
                      </div>
                      {socio.telefone && (
                        <div>
                          <span className="font-medium">Telefone:</span> {socio.telefone}
                        </div>
                      )}
                      {socio.email && (
                        <div>
                          <span className="font-medium">Email:</span> {socio.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onEdit(socio)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(socio.id)}
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