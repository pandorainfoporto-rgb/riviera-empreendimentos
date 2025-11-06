import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Mail, Phone } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  ativo: "bg-green-100 text-green-800",
  ferias: "bg-blue-100 text-blue-800",
  afastado: "bg-orange-100 text-orange-800",
  demitido: "bg-gray-100 text-gray-800",
};

export default function ColaboradoresList({ items, centrosCusto, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Nenhum colaborador encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(colaborador => {
        const centroCusto = centrosCusto.find(cc => cc.id === colaborador.centro_custo_id);
        const iniciais = colaborador.nome_completo
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'CO';

        return (
          <Card key={colaborador.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                  {colaborador.foto_url ? (
                    <AvatarImage src={colaborador.foto_url} />
                  ) : (
                    <AvatarFallback className="text-white font-bold">
                      {iniciais}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{colaborador.nome_completo}</h3>
                  <p className="text-sm text-gray-600">{colaborador.cargo}</p>
                  <Badge className={`mt-1 ${statusColors[colaborador.status]}`}>
                    {colaborador.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {colaborador.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{colaborador.email}</span>
                  </div>
                )}
                {colaborador.telefone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{colaborador.telefone}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Admissão:</span>{' '}
                  {format(parseISO(colaborador.data_admissao), "dd/MM/yyyy")}
                </p>
                {centroCusto && (
                  <p className="text-gray-600">
                    <span className="font-medium">Centro Custo:</span> {centroCusto.codigo}
                  </p>
                )}
                <p className="font-bold text-green-700 text-base">
                  R$ {(colaborador.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(colaborador)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(colaborador.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}