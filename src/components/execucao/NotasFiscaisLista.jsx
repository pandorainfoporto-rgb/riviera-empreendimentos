import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Download, Receipt, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  pago: "bg-blue-100 text-blue-800",
  arquivado: "bg-gray-100 text-gray-800",
};

export default function NotasFiscaisLista({ documentos, unidades, fornecedores, cronogramasObra, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum documento cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documentos.map(doc => {
        const unidade = unidades.find(u => u.id === doc.unidade_id);
        const fornecedor = fornecedores.find(f => f.id === doc.fornecedor_id);
        const cronograma = cronogramasObra.find(c => c.id === doc.cronograma_obra_id);

        return (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4 text-[var(--wine-600)]" />
                    <h4 className="font-semibold text-gray-900">{doc.titulo}</h4>
                    {doc.status && (
                      <Badge className={statusColors[doc.status]}>
                        {doc.status}
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Unidade:</span>
                      <Badge variant="outline">{unidade?.codigo || 'N/A'}</Badge>
                    </p>

                    {doc.numero_documento && (
                      <p>
                        <span className="font-medium">Nº Documento:</span> {doc.numero_documento}
                      </p>
                    )}

                    {fornecedor && (
                      <p>
                        <span className="font-medium">Fornecedor:</span> {fornecedor.nome}
                      </p>
                    )}

                    {cronograma && (
                      <p className="truncate">
                        <span className="font-medium">Etapa:</span> {cronograma.wbs ? `${cronograma.wbs} - ` : ''}{cronograma.etapa}
                      </p>
                    )}

                    <p>
                      <span className="font-medium">Data:</span>{' '}
                      {format(parseISO(doc.data_documento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>

                    {doc.valor > 0 && (
                      <p className="flex items-center gap-1 font-semibold text-green-700">
                        <DollarSign className="w-3 h-3" />
                        R$ {(doc.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {doc.descricao && (
                    <p className="text-sm text-gray-500 mt-2">{doc.descricao}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(doc.arquivo_url, '_blank')}
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(doc)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Deseja excluir este documento?')) {
                        onDelete(doc.id);
                      }
                    }}
                    className="text-red-600"
                    title="Excluir"
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