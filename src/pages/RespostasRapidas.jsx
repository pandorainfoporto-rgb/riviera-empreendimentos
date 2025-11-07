import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Plus, Search, Edit, Trash2, Copy, Eye, MessageSquare
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import RespostaRapidaForm from "../components/comunicacao/RespostaRapidaForm";

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

export default function RespostasRapidasPage() {
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [respostaEditando, setRespostaEditando] = useState(null);
  const [respostaParaDeletar, setRespostaParaDeletar] = useState(null);
  const queryClient = useQueryClient();

  const { data: respostas = [], isLoading } = useQuery({
    queryKey: ['respostas_rapidas_all'],
    queryFn: () => base44.entities.RespostaRapida.list('-total_usos'),
  });

  const deletarMutation = useMutation({
    mutationFn: (id) => base44.entities.RespostaRapida.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_all']);
      setRespostaParaDeletar(null);
    },
  });

  const duplicarMutation = useMutation({
    mutationFn: async (resposta) => {
      const nova = {
        ...resposta,
        titulo: `${resposta.titulo} (Cópia)`,
        codigo: `${resposta.codigo}_COPY`,
        total_usos: 0
      };
      delete nova.id;
      delete nova.created_date;
      delete nova.updated_date;
      delete nova.created_by;
      
      return base44.entities.RespostaRapida.create(nova);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['respostas_rapidas_all']);
    },
  });

  const respostasFiltradas = respostas.filter(r =>
    r.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
    r.codigo?.toLowerCase().includes(busca.toLowerCase()) ||
    r.conteudo?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Respostas Rápidas</h1>
          <p className="text-gray-600 mt-1">Gerencie mensagens pré-definidas para atendimento ágil</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Resposta
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar respostas..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        </div>
      ) : respostasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {busca ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta cadastrada'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Crie respostas rápidas para agilizar o atendimento'}
            </p>
            {!busca && (
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Resposta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {respostasFiltradas.map((resposta) => (
            <Card key={resposta.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate mb-2">{resposta.titulo}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={categoriaColors[resposta.categoria]}>
                        {resposta.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {resposta.codigo}
                      </Badge>
                      <Badge variant="outline">
                        {resposta.total_usos || 0} usos
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {resposta.conteudo}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRespostaEditando(resposta);
                      setShowForm(true);
                    }}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicarMutation.mutate(resposta)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRespostaParaDeletar(resposta)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <RespostaRapidaForm
          resposta={respostaEditando}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setRespostaEditando(null);
          }}
        />
      )}

      <AlertDialog open={!!respostaParaDeletar} onOpenChange={() => setRespostaParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a resposta rápida "{respostaParaDeletar?.titulo}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletarMutation.mutate(respostaParaDeletar.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}