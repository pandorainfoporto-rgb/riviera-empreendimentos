import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon } from "lucide-react";

export default function ImageCard({ entidadeTipo, entidadeId, className = "" }) {
  const { data: imagens = [] } = useQuery({
    queryKey: ['imagens', entidadeTipo, entidadeId],
    queryFn: () => base44.entities.Imagem.filter({ 
      entidade_tipo: entidadeTipo, 
      entidade_id: entidadeId 
    }),
    enabled: !!entidadeId,
    staleTime: 1000 * 60 * 5,
  });

  const imagemPrincipal = imagens.find(img => img.tipo === 'principal') || imagens[0];

  if (!imagemPrincipal) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <img
        src={imagemPrincipal.arquivo_url}
        alt={imagemPrincipal.titulo || "Imagem"}
        className="w-full h-full object-cover"
      />
      {imagens.length > 1 && (
        <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
          +{imagens.length - 1}
        </Badge>
      )}
    </div>
  );
}