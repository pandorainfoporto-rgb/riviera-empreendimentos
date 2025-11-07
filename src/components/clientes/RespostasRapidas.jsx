import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Copy, Eye, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categoriaColors = {
  financeiro: "bg-green-100 text-green-700",
  obra: "bg-orange-100 text-orange-700",
  documentacao: "bg-purple-100 text-purple-700",
  geral: "bg-blue-100 text-blue-700",
  tecnico: "bg-red-100 text-red-700",
  comercial: "bg-yellow-100 text-yellow-700",
  juridico: "bg-indigo-100 text-indigo-700",
  pos_venda: "bg-pink-100 text-pink-700"
};

export default function RespostasRapidas({ onUsar }) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [respostaPreview, setRespostaPreview] = useState(null);

  const { data: respostas = [], isLoading } = useQuery({
    queryKey: ['respostas_rapidas'],
    queryFn: () => base44.entities.RespostaRapida.filter({ ativa: true }),
  });

  const respostasFiltradas = respostas.filter(r => {
    const matchesBusca = r.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
                         r.conteudo?.toLowerCase().includes(busca.toLowerCase()) ||
                         r.codigo?.toLowerCase().includes(busca.toLowerCase());
    const matchesCategoria = filtroCategoria === 'todas' || r.categoria === filtroCategoria;
    return matchesBusca && matchesCategoria;
  });

  const handleUsar = (resposta) => {
    onUsar(resposta);
    
    // Atualizar estatísticas
    base44.entities.RespostaRapida.update(resposta.id, {
      total_usos: (resposta.total_usos || 0) + 1,
      ultima_utilizacao: new Date().toISOString()
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--wine-600)] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar respostas rápidas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="obra">Obra</SelectItem>
            <SelectItem value="documentacao">Documentação</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
            <SelectItem value="juridico">Jurídico</SelectItem>
            <SelectItem value="pos_venda">Pós-Venda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {respostasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {busca ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta rápida cadastrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {respostasFiltradas.map((resposta) => (
            <Card key={resposta.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{resposta.titulo}</h4>
                      <Badge variant="outline" className="text-xs">
                        {resposta.codigo}
                      </Badge>
                    </div>
                    <Badge className={categoriaColors[resposta.categoria]}>
                      {resposta.categoria}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {resposta.conteudo}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Usado {resposta.total_usos || 0}x
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRespostaPreview(resposta)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUsar(resposta)}
                      className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Usar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {respostaPreview && (
        <Dialog open={!!respostaPreview} onOpenChange={() => setRespostaPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--wine-600)]" />
                {respostaPreview.titulo}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={categoriaColors[respostaPreview.categoria]}>
                  {respostaPreview.categoria}
                </Badge>
                <Badge variant="outline">{respostaPreview.codigo}</Badge>
                {respostaPreview.enviar_email && (
                  <Badge className="bg-purple-100 text-purple-700">
                    Envia Email
                  </Badge>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {respostaPreview.conteudo}
                </p>
              </div>
              {respostaPreview.placeholders_disponiveis && respostaPreview.placeholders_disponiveis.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 mb-1"><strong>Placeholders disponíveis:</strong></p>
                  <div className="flex flex-wrap gap-1">
                    {respostaPreview.placeholders_disponiveis.map((ph, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {ph}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRespostaPreview(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleUsar(respostaPreview);
                    setRespostaPreview(null);
                  }}
                  className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Usar Esta Resposta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}