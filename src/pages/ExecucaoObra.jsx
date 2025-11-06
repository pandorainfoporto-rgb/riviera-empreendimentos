
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card imports
import { Badge } from "@/components/ui/badge"; // Added Badge import

import DocumentoForm from "../components/execucao/DocumentoForm";
import FotosGaleria from "../components/execucao/FotosGaleria";
import DocumentosLista from "../components/execucao/DocumentosLista";
import NotasFiscaisLista from "../components/execucao/NotasFiscaisLista";
import EstatisticasExecucao from "../components/execucao/EstatisticasExecucao";
import ChecklistObra from "../components/execucao/ChecklistObra";
import ResourceAllocation from "../components/execucao/ResourceAllocation"; // New import
import ProgressTracker from "../components/execucao/ProgressTracker"; // New import

export default function ExecucaoObra() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedUnidade, setSelectedUnidade] = useState("todas");
  const [tipoDocumento, setTipoDocumento] = useState("foto");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const [selectedTarefaRecursos, setSelectedTarefaRecursos] = useState(null); // New state
  const [selectedTarefaProgresso, setSelectedTarefaProgresso] = useState(null); // New state

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentosObra'],
    queryFn: () => base44.entities.DocumentoObra.list('-data_documento'),
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
  });

  const { data: cronogramasObra = [] } = useQuery({
    queryKey: ['cronogramasObra'],
    queryFn: () => base44.entities.CronogramaObra.list('ordem'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentoObra.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentosObra'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentoObra.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentosObra'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentoObra.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentosObra'] });
    },
  });

  const filteredDocumentos = documentos.filter(doc => {
    const matchesUnidade = selectedUnidade === "todas" || doc.unidade_id === selectedUnidade;
    const matchesSearch =
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUnidade && matchesSearch;
  });

  const fotos = filteredDocumentos.filter(d => d.tipo === 'foto');
  const projetos = filteredDocumentos.filter(d => d.tipo === 'projeto');
  const notasFiscais = filteredDocumentos.filter(d => d.tipo === 'nota_fiscal');
  const recibos = filteredDocumentos.filter(d => d.tipo === 'recibo');
  const contratos = filteredDocumentos.filter(d => d.tipo === 'contrato');
  const documentosGerais = filteredDocumentos.filter(d => d.tipo === 'documento_geral');
  const pagamentos = filteredDocumentos.filter(d => d.tipo === 'pagamento');
  const negociacoes = filteredDocumentos.filter(d => d.tipo === 'negociacao');

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Execução de Obra</h1>
          <p className="text-gray-600 mt-1">Documentação completa da execução</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Unidades</SelectItem>
              {unidades.map(uni => (
                <SelectItem key={uni.id} value={uni.id}>
                  {uni.codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Documento
          </Button>
        </div>
      </div>

      <EstatisticasExecucao documentos={filteredDocumentos} />

      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="progresso" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 bg-gray-100">
          <TabsTrigger value="progresso">Progresso</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="fotos">Fotos ({fotos.length})</TabsTrigger>
          <TabsTrigger value="projetos">Projetos ({projetos.length})</TabsTrigger>
          <TabsTrigger value="notas">Notas Fiscais ({notasFiscais.length})</TabsTrigger>
          <TabsTrigger value="recibos">Recibos ({recibos.length})</TabsTrigger>
          <TabsTrigger value="contratos">Contratos ({contratos.length})</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos ({pagamentos.length})</TabsTrigger>
          <TabsTrigger value="negociacoes">Negociações ({negociacoes.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documentosGerais.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="progresso" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--wine-700)]">
                Acompanhamento de Progresso por Tarefa
              </h3>
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Unidades</SelectItem>
                  {unidades.map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cronogramasObra
              .filter(c => selectedUnidade === "todas" || c.unidade_id === selectedUnidade)
              .map(tarefa => {
                const unidade = unidades.find(u => u.id === tarefa.unidade_id);
                
                return (
                  <Card key={tarefa.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedTarefaProgresso(
                        selectedTarefaProgresso?.id === tarefa.id ? null : tarefa
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {tarefa.wbs && (
                            <Badge variant="outline" className="font-mono">
                              {tarefa.wbs}
                            </Badge>
                          )}
                          <div>
                            <CardTitle className="text-lg">{tarefa.etapa}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{unidade?.codigo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-[var(--wine-700)]">
                            {tarefa.percentual_conclusao || 0}%
                          </p>
                          <Badge className="mt-1">
                            {tarefa.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {selectedTarefaProgresso?.id === tarefa.id && (
                      <CardContent>
                        <ProgressTracker
                          cronogramaObra={tarefa}
                          unidade={unidade}
                        />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="recursos" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--wine-700)]">
                Alocação de Recursos por Tarefa
              </h3>
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Unidades</SelectItem>
                  {unidades.map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cronogramasObra
              .filter(c => selectedUnidade === "todas" || c.unidade_id === selectedUnidade)
              .map(tarefa => {
                const unidade = unidades.find(u => u.id === tarefa.unidade_id);
                const totalRecursos = (tarefa.recursos_alocados || []).length + (tarefa.equipe || []).length;
                
                return (
                  <Card key={tarefa.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedTarefaRecursos(
                        selectedTarefaRecursos?.id === tarefa.id ? null : tarefa
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {tarefa.wbs && (
                            <Badge variant="outline" className="font-mono">
                              {tarefa.wbs}
                            </Badge>
                          )}
                          <div>
                            <CardTitle className="text-lg">{tarefa.etapa}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{unidade?.codigo}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-2">
                          {totalRecursos} recursos
                        </Badge>
                      </div>
                    </CardHeader>

                    {selectedTarefaRecursos?.id === tarefa.id && (
                      <CardContent>
                        <ResourceAllocation
                          cronogramaObra={tarefa}
                          unidade={unidade}
                        />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <ChecklistObra
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            selectedUnidade={selectedUnidade}
          />
        </TabsContent>

        <TabsContent value="fotos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('foto');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Foto
            </Button>
          </div>
          <FotosGaleria
            fotos={fotos}
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            onEdit={(item) => {
              setTipoDocumento('foto');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="projetos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('projeto');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Projeto
            </Button>
          </div>
          <DocumentosLista
            documentos={projetos}
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            tipo="projeto"
            onEdit={(item) => {
              setTipoDocumento('projeto');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="notas" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('nota_fiscal');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Nota Fiscal
            </Button>
          </div>
          <NotasFiscaisLista
            documentos={notasFiscais}
            unidades={unidades}
            fornecedores={fornecedores}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            onEdit={(item) => {
              setTipoDocumento('nota_fiscal');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="recibos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('recibo');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Recibo
            </Button>
          </div>
          <NotasFiscaisLista
            documentos={recibos}
            unidades={unidades}
            fornecedores={fornecedores}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            onEdit={(item) => {
              setTipoDocumento('recibo');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="contratos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('contrato');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Contrato
            </Button>
          </div>
          <DocumentosLista
            documentos={contratos}
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            tipo="contrato"
            onEdit={(item) => {
              setTipoDocumento('contrato');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('pagamento');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Comprovante de Pagamento
            </Button>
          </div>
          <NotasFiscaisLista
            documentos={pagamentos}
            unidades={unidades}
            fornecedores={fornecedores}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            onEdit={(item) => {
              setTipoDocumento('pagamento');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="negociacoes" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('negociacao');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Negociação
            </Button>
          </div>
          <DocumentosLista
            documentos={negociacoes}
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            tipo="negociacao"
            onEdit={(item) => {
              setTipoDocumento('negociacao');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="documentos" className="mt-6">
          <div className="mb-4">
            <Button
              onClick={() => {
                setTipoDocumento('documento_geral');
                setEditingItem(null);
                setShowForm(true);
              }}
              variant="outline"
              className="hover:bg-[var(--wine-100)] hover:border-[var(--wine-400)]"
            >
              Adicionar Documento
            </Button>
          </div>
          <DocumentosLista
            documentos={documentosGerais}
            unidades={unidades}
            cronogramasObra={cronogramasObra}
            isLoading={isLoading}
            tipo="documento_geral"
            onEdit={(item) => {
              setTipoDocumento('documento_geral');
              setEditingItem(item);
              setShowForm(true);
            }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {showForm && (
        <DocumentoForm
          item={editingItem}
          tipoDocumento={tipoDocumento}
          unidades={unidades}
          fornecedores={fornecedores}
          cronogramasObra={cronogramasObra}
          onSubmit={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
