import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, Trash2, CheckCircle2, MapPin, Phone, Mail, Star } from "lucide-react";

export default function EmpresasList({ items = [], onEdit, onDelete }) {
  if (!items || items.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Nenhuma empresa cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((empresa) => (
        <Card key={empresa.id} className={`shadow-lg hover:shadow-xl transition-all ${empresa.eh_principal ? 'border-2 border-yellow-400 bg-yellow-50/30' : ''}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    empresa.eh_principal ? 'bg-yellow-100' : 'bg-[var(--wine-100)]'
                  }`}>
                    {empresa.eh_principal ? (
                      <Star className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <Building2 className="w-6 h-6 text-[var(--wine-600)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{empresa.nome_fantasia || empresa.razao_social}</h3>
                      {empresa.eh_principal && (
                        <Badge className="bg-yellow-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                      {empresa.ativa ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Inativa</Badge>
                      )}
                    </div>
                    {empresa.razao_social !== empresa.nome_fantasia && (
                      <p className="text-sm text-gray-600">{empresa.razao_social}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">CNPJ:</span>
                      <span className="font-medium">{empresa.cnpj || '-'}</span>
                    </div>
                    {empresa.inscricao_estadual && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">I.E.:</span>
                        <span className="font-medium">{empresa.inscricao_estadual}</span>
                      </div>
                    )}
                    {empresa.cidade && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{empresa.cidade}/{empresa.estado}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {empresa.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{empresa.telefone}</span>
                      </div>
                    )}
                    {empresa.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{empresa.email}</span>
                      </div>
                    )}
                    {empresa.tipo_empresa && (
                      <Badge variant="outline" className="capitalize">
                        {empresa.tipo_empresa.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>

                {empresa.responsavel_legal && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-1">Responsável Legal</p>
                    <p className="font-medium text-sm">{empresa.responsavel_legal}</p>
                    {empresa.responsavel_legal_cargo && (
                      <p className="text-sm text-gray-600">{empresa.responsavel_legal_cargo}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex md:flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(empresa)}
                  className="flex-1 md:flex-none"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(empresa.id)}
                  className="text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}