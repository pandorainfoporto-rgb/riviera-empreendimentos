import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Plus } from "lucide-react";

const statusColors = {
  planejamento: "bg-gray-100 text-gray-800",
  aprovacao: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  em_comercializacao: "bg-blue-100 text-blue-800",
  concluido: "bg-purple-100 text-purple-800",
};

const statusLabels = {
  planejamento: "Planejamento",
  aprovacao: "Em Aprovação",
  aprovado: "Aprovado",
  em_comercializacao: "Em Comercialização",
  concluido: "Concluído",
};

export default function LoteamentosList({ loteamentos = [], onEdit, onDelete, onNew }) {
  if (loteamentos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum loteamento encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos loteamentos se necessário
          </p>
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Loteamento
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {loteamentos.map((loteamento) => (
        <Card key={loteamento.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900">{loteamento.nome}</h3>
                  <Badge className={statusColors[loteamento.status] || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[loteamento.status] || loteamento.status}
                  </Badge>
                </div>

                {loteamento.descricao && (
                  <p className="text-sm text-gray-600">{loteamento.descricao}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                  {loteamento.endereco && (
                    <div>
                      <span className="font-medium">Endereço:</span> {loteamento.endereco}
                    </div>
                  )}
                  {loteamento.area_total && (
                    <div>
                      <span className="font-medium">Área Total:</span> {loteamento.area_total.toLocaleString('pt-BR')} m²
                    </div>
                  )}
                  {loteamento.quantidade_lotes && (
                    <div>
                      <span className="font-medium">Lotes:</span> {loteamento.quantidade_lotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(loteamento)}
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(loteamento.id)}
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