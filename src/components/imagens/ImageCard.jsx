import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCard({ entidadeTipo, entidadeId, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: imagens = [] } = useQuery({
    queryKey: ['imagens', entidadeTipo, entidadeId],
    queryFn: () => base44.entities.Imagem.filter({ 
      entidade_tipo: entidadeTipo, 
      entidade_id: entidadeId 
    }),
    enabled: !!entidadeId,
    staleTime: 1000 * 60 * 5,
  });

  const isPDF = (url) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

  if (imagens.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  const imagemAtual = imagens[currentIndex];

  const handlePrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imagens.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === imagens.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`relative overflow-hidden rounded-lg group ${className}`}>
      {isPDF(imagemAtual.arquivo_url) ? (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-purple-600 mb-2" />
          <p className="text-xs text-purple-700 font-medium px-2 text-center truncate w-full">
            {imagemAtual.titulo || 'PDF'}
          </p>
        </div>
      ) : (
        <img
          src={imagemAtual.arquivo_url}
          alt={imagemAtual.titulo || "Imagem"}
          className="w-full h-full object-cover"
        />
      )}

      {/* Navegação do Carrossel */}
      {imagens.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Indicadores */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagens.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Badge com contador */}
          <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs">
            {currentIndex + 1}/{imagens.length}
          </Badge>
        </>
      )}

      {/* Badge de Tipo */}
      {imagemAtual.tipo !== 'galeria' && (
        <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
          {imagemAtual.tipo}
        </Badge>
      )}
    </div>
  );
}