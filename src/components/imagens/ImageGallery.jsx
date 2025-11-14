import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Eye, Star, Image as ImageIcon, FileText, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ImageGallery({ entidadeTipo, entidadeId, allowDelete = true }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const queryClient = useQueryClient();

  const { data: imagens = [], isLoading, refetch } = useQuery({
    queryKey: ['imagens', entidadeTipo, entidadeId],
    queryFn: () => base44.entities.Imagem.filter({ 
      entidade_tipo: entidadeTipo, 
      entidade_id: entidadeId 
    }),
    enabled: !!entidadeId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Imagem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imagens', entidadeTipo, entidadeId] });
      toast.success("Arquivo removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const setAsPrincipalMutation = useMutation({
    mutationFn: async (imagemId) => {
      const updates = imagens
        .filter(img => img.tipo === 'principal' && img.id !== imagemId)
        .map(img => base44.entities.Imagem.update(img.id, { tipo: 'galeria' }));
      
      await Promise.all(updates);
      await base44.entities.Imagem.update(imagemId, { tipo: 'principal' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imagens', entidadeTipo, entidadeId] });
      toast.success("Imagem principal definida!");
    },
  });

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Deseja remover este arquivo?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const isPDF = (url) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

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
        <p className="text-gray-500 text-sm mb-3">Nenhum arquivo adicionado ainda</p>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    );
  }

  const imagemPrincipal = imagens.find(img => img.tipo === 'principal');
  const plantas = imagens.filter(img => img.tipo === 'planta');
  const outrasImagens = imagens.filter(img => img.tipo !== 'principal' && img.tipo !== 'planta');

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              refetch();
              toast.info("Atualizando galeria...");
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Galeria
          </Button>
        </div>

        {imagemPrincipal && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-lg">Imagem Principal</h3>
            </div>
            <Card className="overflow-hidden border-2 border-yellow-400">
              <div className="relative group aspect-video bg-gray-100">
                {isPDF(imagemPrincipal.arquivo_url) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-24 h-24 text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={imagemPrincipal.arquivo_url}
                    alt={imagemPrincipal.titulo || "Imagem principal"}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedImage(imagemPrincipal);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {allowDelete && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDelete(e, imagemPrincipal.id)}
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

        {plantas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg">Plantas Arquitetônicas ({plantas.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {plantas.map((planta) => (
                <Card key={planta.id} className="overflow-hidden hover:shadow-lg transition-shadow border-purple-200">
                  <div className="relative group aspect-square bg-gray-100">
                    {isPDF(planta.arquivo_url) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileText className="w-16 h-16 text-purple-600 mb-2" />
                        <p className="text-xs text-center text-gray-600 truncate w-full px-2">
                          {planta.titulo || 'PDF'}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={planta.arquivo_url}
                        alt={planta.titulo || "Planta"}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedImage(planta);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(planta.arquivo_url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {allowDelete && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDelete(e, planta.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Badge className="absolute top-2 left-2 bg-purple-600 text-white text-xs">
                      Planta
                    </Badge>
                  </div>
                  {planta.titulo && (
                    <CardContent className="p-2">
                      <p className="text-xs truncate font-medium">{planta.titulo}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {outrasImagens.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-3">Galeria ({outrasImagens.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {outrasImagens.map((imagem) => (
                <Card key={imagem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative group aspect-square bg-gray-100">
                    {isPDF(imagem.arquivo_url) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <FileText className="w-16 h-16 text-gray-600 mb-2" />
                        <p className="text-xs text-center text-gray-600 truncate w-full px-2">
                          {imagem.titulo || 'PDF'}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={imagem.arquivo_url}
                        alt={imagem.titulo || "Imagem"}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedImage(imagem);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {allowDelete && (
                        <>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAsPrincipalMutation.mutate(imagem.id);
                            }}
                            title="Definir como principal"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDelete(e, imagem.id)}
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

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{selectedImage?.titulo || "Visualização"}</span>
              {isPDF(selectedImage?.arquivo_url) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(selectedImage.arquivo_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative max-h-[75vh] overflow-auto bg-gray-100 rounded-lg">
            {isPDF(selectedImage?.arquivo_url) ? (
              <iframe
                src={selectedImage.arquivo_url}
                className="w-full h-[75vh] border-0"
                title="Visualizador de PDF"
              />
            ) : (
              <img
                src={selectedImage?.arquivo_url}
                alt={selectedImage?.titulo || "Imagem"}
                className="w-full h-auto object-contain"
              />
            )}
          </div>

          {(selectedImage?.descricao || selectedImage?.tipo) && (
            <div className="pt-3 border-t space-y-2">
              {selectedImage.descricao && (
                <p className="text-sm text-gray-600">{selectedImage.descricao}</p>
              )}
              <div className="flex gap-2">
                <Badge>{selectedImage.tipo}</Badge>
                {selectedImage.tamanho_bytes && (
                  <Badge variant="outline">
                    {(selectedImage.tamanho_bytes / 1024).toFixed(0)} KB
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}