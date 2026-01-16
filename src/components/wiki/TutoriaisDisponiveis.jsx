import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, PlayCircle } from "lucide-react";

export default function TutoriaisDisponiveis() {
  const { data: tutoriais = [] } = useQuery({
    queryKey: ['tutoriais_ativos'],
    queryFn: async () => {
      const todos = await base44.entities.Tutorial.list('ordem');
      return todos.filter(t => t.ativo && t.video_url);
    },
  });

  if (tutoriais.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum tutorial disponível ainda</p>
        <p className="text-sm text-gray-400 mt-1">Os vídeos serão adicionados em breve</p>
      </div>
    );
  }

  const categorias = [...new Set(tutoriais.map(t => t.categoria))];

  return (
    <div className="space-y-6">
      {categorias.map(categoria => {
        const tutoriaisCategoria = tutoriais.filter(t => t.categoria === categoria);
        return (
          <div key={categoria}>
            <h3 className="font-bold text-lg mb-3 capitalize">{categoria.replace('-', ' ')}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutoriaisCategoria.map(tutorial => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-900 rounded-lg mb-3 relative overflow-hidden group">
                      <video 
                        className="w-full h-full object-cover"
                        poster={tutorial.video_url}
                      >
                        <source src={tutorial.video_url} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <h4 className="font-semibold mb-1">{tutorial.titulo}</h4>
                    <p className="text-xs text-gray-600 mb-2">{tutorial.descricao}</p>
                    {tutorial.duracao && (
                      <Badge variant="outline" className="text-xs">
                        <PlayCircle className="w-3 h-3 mr-1" />
                        {tutorial.duracao}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}