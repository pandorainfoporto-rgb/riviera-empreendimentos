import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Eye, Star, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function ImageGallery({ entidadeTipo, entidadeId, allowDelete = true }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: imagens = [], isLoading } = useQuery({
    queryKey: ['imagens', entidadeTipo, entidadeId],
    queryFn: () => base44.entities.Imagem.filter({ 
      entidade_tipo: entidadeTipo, 
      entidade_id: entidadeId 
    }),
    enabled: !!entidadeId,
    staleTime: 1000 * 60 * 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Imagem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imagens', entidadeTipo, entidadeId] });
      toast.success("Imagem removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const setAsPrincipalMutation = useMutation({
    mutationFn: async (imagemId) => {
      // Remover flag principal de todas as outras
      const updates = imagens
        .filter(img => img.tipo === 'principal' && img.id !== imagemId)
        .map(img => base44.entities.Imagem.update(img.id, { tipo: 'galeria' }));
      
      await Promise.all(updates);

      // Definir a selecionada como principal
      await base44.entities.Imagem.update(imagemId, { tipo: 'principal' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imagens', entidadeTipo, entidadeId] });
      toast.success("Imagem principal definida!");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--wine-600)]"></div>
      </div>
    );
  }

  if (imagens.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500 text-sm">Nenhuma imagem adicionada ainda</p>
      </div>
    );
  }

  const imagemPrincipal = imagens.find(img => img.tipo === 'principal');
  const outrasImagens = imagens.filter(img => img.tipo !== 'principal');

  return (
    <>
      <div className="space-y-4">
        {/* Imagem Principal */}
        {imagemPrincipal && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-lg">Imagem Principal</h3>
            </div>
            <Card className="overflow-hidden border-2 border-yellow-400">
              <div className="relative group aspect-video">
                <img
                  src={imagemPrincipal.arquivo_url}
                  alt={imagemPrincipal.titulo || "Imagem principal"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => setSelectedImage(imagemPrincipal)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {allowDelete && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        if (confirm("Deseja remover esta imagem?")) {
                          deleteMutation.mutate(imagemPrincipal.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                  Principal
                </Badge>
              </div>
              {imagemPrincipal.titulo && (
                <CardContent className="p-3">
                  <p className="text-sm font-semibold">{imagemPrincipal.titulo}</p>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Galeria de Outras Imagens */}
        {outrasImagens.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3">Galeria ({outrasImagens.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {outrasImagens.map((imagem) => (
                <Card key={imagem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative group aspect-square">
                    <img
                      src={imagem.arquivo_url}
                      alt={imagem.titulo || "Imagem"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => setSelectedImage(imagem)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {allowDelete && (
                        <>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => setAsPrincipalMutation.mutate(imagem.id)}
                            title="Definir como principal"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              if (confirm("Deseja remover esta imagem?")) {
                                deleteMutation.mutate(imagem.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    {imagem.tipo !== 'galeria' && (
                      <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                        {imagem.tipo}
                      </Badge>
                    )}
                  </div>
                  {imagem.titulo && (
                    <CardContent className="p-2">
                      <p className="text-xs truncate">{imagem.titulo}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Visualização */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedImage.arquivo_url}
                alt={selectedImage.titulo || "Imagem"}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              {(selectedImage.titulo || selectedImage.descricao) && (
                <div className="p-4 bg-white">
                  {selectedImage.titulo && (
                    <h3 className="font-bold text-lg mb-1">{selectedImage.titulo}</h3>
                  )}
                  {selectedImage.descricao && (
                    <p className="text-sm text-gray-600">{selectedImage.descricao}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge>{selectedImage.tipo}</Badge>
                    {selectedImage.tamanho_bytes && (
                      <Badge variant="outline">
                        {(selectedImage.tamanho_bytes / 1024).toFixed(0)} KB
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}