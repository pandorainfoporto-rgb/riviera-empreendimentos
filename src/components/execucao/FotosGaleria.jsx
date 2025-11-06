import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Download, Image as ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FotosGaleria({ fotos, unidades, cronogramasObra, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="h-48 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma foto cadastrada</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Adicionar Foto" para incluir fotos da obra
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fotos.map(foto => {
        const unidade = unidades.find(u => u.id === foto.unidade_id);
        const cronograma = cronogramasObra.find(c => c.id === foto.cronograma_obra_id);

        return (
          <Card key={foto.id} className="overflow-hidden hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="relative group">
                <img
                  src={foto.arquivo_url}
                  alt={foto.titulo}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Foto+Indisponível';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => window.open(foto.arquivo_url, '_blank')}
                      title="Visualizar"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => onEdit(foto)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Deseja excluir esta foto?')) {
                          onDelete(foto.id);
                        }
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 truncate">
                  {foto.titulo}
                </h4>

                <div className="space-y-1 text-xs text-gray-600">
                  <p className="flex items-center gap-1">
                    <span className="font-medium">Unidade:</span>
                    <Badge variant="outline" className="text-xs">
                      {unidade?.codigo || 'N/A'}
                    </Badge>
                  </p>

                  {cronograma && (
                    <p className="truncate">
                      <span className="font-medium">Etapa:</span> {cronograma.wbs ? `${cronograma.wbs} - ` : ''}{cronograma.etapa}
                    </p>
                  )}

                  <p>
                    <span className="font-medium">Data:</span>{' '}
                    {format(parseISO(foto.data_documento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>

                  {foto.descricao && (
                    <p className="text-gray-500 line-clamp-2 mt-2">
                      {foto.descricao}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}