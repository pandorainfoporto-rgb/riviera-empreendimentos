import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Home, MapPin, DollarSign, User } from "lucide-react";

const statusColors = {
  disponivel: "bg-green-100 text-green-800",
  reservada: "bg-yellow-100 text-yellow-800",
  vendida: "bg-blue-100 text-blue-800",
  escriturada: "bg-purple-100 text-purple-800",
  em_construcao: "bg-orange-100 text-orange-800",
};

const statusLabels = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  escriturada: "Escriturada",
  em_construcao: "Em Construção",
};

const tipoLabels = {
  apartamento: "Apartamento",
  casa: "Casa",
  lote: "Lote",
  sala_comercial: "Sala Comercial",
  terreno: "Terreno",
  outros: "Outros",
};

export default function UnidadesList({ unidades, loteamentos, clientes, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando unidades...</p>
      </div>
    );
  }

  if (!unidades || unidades.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nenhuma unidade cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  // Funções auxiliares com proteção contra undefined
  const contarQuartos = (unidade) => {
    const terreo = unidade.detalhamento_pavimentos?.pavimento_terreo?.quartos?.length || 0;
    const superior = unidade.detalhamento_pavimentos?.pavimento_superior?.quartos?.length || 0;
    return terreo + superior;
  };

  const contarSuites = (unidade) => {
    const terreo = unidade.detalhamento_pavimentos?.pavimento_terreo?.quartos?.filter(q => q.eh_suite).length || 0;
    const superior = unidade.detalhamento_pavimentos?.pavimento_superior?.quartos?.filter(q => q.eh_suite).length || 0;
    return terreo + superior;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {unidades.map((unidade) => {
        const loteamento = loteamentos?.find(l => l.id === unidade.loteamento_id);
        const cliente = clientes?.find(c => c.id === unidade.cliente_id);
        const totalQuartos = contarQuartos(unidade);
        const totalSuites = contarSuites(unidade);

        return (
          <Card key={unidade.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-[var(--wine-600)]">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[var(--wine-700)] mb-1">
                    {unidade.codigo}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {loteamento?.nome || "Sem loteamento"}
                  </p>
                </div>
                <Badge className={`${statusColors[unidade.status]} text-xs`}>
                  {statusLabels[unidade.status]}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{tipoLabels[unidade.tipo]}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Área Total:</span>
                    <p className="font-semibold text-gray-900">{unidade.area_total || 0}m²</p>
                  </div>
                  {(unidade.area_construida || 0) > 0 && (
                    <div>
                      <span className="text-gray-500">Construída:</span>
                      <p className="font-semibold text-gray-900">{unidade.area_construida}m²</p>
                    </div>
                  )}
                </div>

                {totalQuartos > 0 && (
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>🛏️ {totalQuartos} quarto(s)</span>
                    {totalSuites > 0 && <span>✨ {totalSuites} suíte(s)</span>}
                    {(unidade.vagas_garagem || 0) > 0 && <span>🚗 {unidade.vagas_garagem} vaga(s)</span>}
                  </div>
                )}

                {unidade.bloco && (
                  <p className="text-sm text-gray-600">
                    Bloco: <span className="font-medium">{unidade.bloco}</span>
                    {unidade.andar && ` - ${unidade.andar}`}
                  </p>
                )}

                {(unidade.valor_venda || 0) > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] rounded-lg">
                    <DollarSign className="w-5 h-5 text-[var(--wine-700)]" />
                    <div>
                      <p className="text-xs text-gray-600">Valor de Venda</p>
                      <p className="text-lg font-bold text-[var(--wine-700)]">
                        R$ {unidade.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}

                {cliente && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600">Proprietário</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{cliente.nome}</p>
                    </div>
                  </div>
                )}

                {unidade.matricula && (
                  <p className="text-xs text-gray-500">
                    Matrícula: {unidade.matricula}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => onEdit(unidade)}
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Deseja realmente excluir a unidade ${unidade.codigo}?`)) {
                      onDelete(unidade.id);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-100 hover:border-red-400 hover:text-red-700"
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