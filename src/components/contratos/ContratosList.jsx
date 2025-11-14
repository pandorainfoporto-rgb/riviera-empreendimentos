import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  rascunho: "bg-gray-100 text-gray-800",
  ativo: "bg-green-100 text-green-800",
  vencido: "bg-red-100 text-red-800",
  rescindido: "bg-orange-100 text-orange-800",
  renovado: "bg-blue-100 text-blue-800"
};

const tipoLabels = {
  compra_venda: "Compra e Venda",
  locacao: "Locação",
  prestacao_servicos: "Prestação de Serviços",
  fornecimento: "Fornecimento",
  parceria: "Parceria",
  empreitada: "Empreitada",
  consorcio: "Consórcio",
  outros: "Outros"
};

export default function ContratosList({ contratos, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (contratos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Nenhum contrato cadastrado</p>
      </div>
    );
  }

  const calcularDiasParaVencer = (dataFim) => {
    if (!dataFim) return null;
    const hoje = new Date();
    const fim = new Date(dataFim);
    return Math.floor((fim - hoje) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="grid gap-4">
      {contratos.map((contrato) => {
        const diasParaVencer = calcularDiasParaVencer(contrato.data_fim_vigencia);
        const alertaVencimento = diasParaVencer !== null && diasParaVencer > 0 && diasParaVencer <= 30;

        return (
          <Card key={contrato.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-[var(--wine-600)]" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contrato.titulo}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={statusColors[contrato.status]}>
                      {contrato.status}
                    </Badge>
                    <Badge variant="outline">
                      {tipoLabels[contrato.tipo] || contrato.tipo}
                    </Badge>
                    {contrato.numero_contrato && (
                      <Badge variant="outline">
                        Nº {contrato.numero_contrato}
                      </Badge>
                    )}
                    {alertaVencimento && (
                      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Vence em {diasParaVencer} dias
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Início:</span>{" "}
                      <span className="font-medium">
                        {contrato.data_inicio_vigencia 
                          ? format(new Date(contrato.data_inicio_vigencia), 'dd/MM/yyyy')
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fim:</span>{" "}
                      <span className="font-medium">
                        {contrato.data_fim_vigencia 
                          ? format(new Date(contrato.data_fim_vigencia), 'dd/MM/yyyy')
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>{" "}
                      <span className="font-medium text-green-600">
                        R$ {(contrato.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {contrato.partes_envolvidas && contrato.partes_envolvidas.length > 0 && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Partes: </span>
                      {contrato.partes_envolvidas.map(p => p.nome).join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {contrato.arquivo_pdf_url && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.open(contrato.arquivo_pdf_url, '_blank')}
                      title="Ver PDF"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(contrato)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onDelete(contrato.id)}
                    className="text-red-600 hover:bg-red-50"
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