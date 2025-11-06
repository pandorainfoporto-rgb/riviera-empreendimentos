import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, User, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CorretoresList({ items, imobiliarias, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum corretor cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const imobiliaria = imobiliarias.find(i => i.id === item.imobiliaria_id);
        
        return (
          <Card 
            key={item.id} 
            className={`hover:shadow-xl transition-all duration-200 border-t-4 ${
              item.ativo ? 'border-green-500' : 'border-gray-400'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-[var(--wine-500)]" />
                    <h3 className="text-lg font-bold text-[var(--wine-700)] line-clamp-1">
                      {item.nome}
                    </h3>
                  </div>
                  {item.creci && (
                    <p className="text-sm text-gray-600 mb-1">CRECI: {item.creci}</p>
                  )}
                </div>
                <Badge className={item.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {item.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {imobiliaria && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-900 font-semibold">{imobiliaria.nome}</span>
                  </div>
                )}

                {!imobiliaria && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-purple-50 rounded">
                    <Badge className="bg-purple-100 text-purple-700">Corretor Autônomo</Badge>
                  </div>
                )}

                {item.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{item.telefone}</span>
                  </div>
                )}

                {item.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 line-clamp-1">{item.email}</span>
                  </div>
                )}

                {item.cidade && item.estado && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{item.cidade} - {item.estado}</span>
                  </div>
                )}

                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Comissão Padrão:</span>
                    <span className="text-[var(--wine-700)] font-bold">
                      {item.percentual_comissao_padrao}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 hover:bg-[var(--wine-100)] hover:text-[var(--wine-700)] hover:border-[var(--wine-400)]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-400"
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