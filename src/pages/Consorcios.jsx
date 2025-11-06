import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ConsorciosList from "../components/consorcios/ConsorciosList";
import ConsorcioForm from "../components/consorcios/ConsorcioForm";
import TransferirCotaDialog from "../components/consorcios/TransferirCotaDialog";
import DocumentosConsorcio from "../components/consorcios/DocumentosConsorcio";

export default function Consorcios() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTransferirDialog, setShowTransferirDialog] = useState(false);
  const [cotaParaTransferir, setCotaParaTransferir] = useState(null);
  const [showDocumentosDialog, setShowDocumentosDialog] = useState(false);
  const [consorcioParaDocumentos, setConsorcioParaDocumentos] = useState(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['consorcios'],
    queryFn: () => base44.entities.Consorcio.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const consorcio = await base44.entities.Consorcio.create(data);
      
      if (data.faturas && data.faturas.length > 0) {
        const faturasParaCriar = data.faturas.map(fatura => ({
          ...fatura,
          consorcio_id: consorcio.id,
        }));
        
        await base44.entities.FaturaConsorcio.bulkCreate(faturasParaCriar);
      }
      
      return consorcio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consorcio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      setShowForm(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Consorcio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
    },
  });

  const transferirMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return base44.entities.Consorcio.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      setShowTransferirDialog(false);
      setCotaParaTransferir(null);
    },
  });

  const filteredItems = items.filter(item => {
    const cliente = clientes.find(c => c.id === item.cliente_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    
    return (
      item.grupo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.eh_investimento_caixa && "investimento caixa".includes(searchTerm.toLowerCase()))
    );
  });

  const handleTransferir = (cota) => {
    setCotaParaTransferir(cota);
    setShowTransferirDialog(true);
  };

  const handleDocumentos = (consorcio) => {
    setConsorcioParaDocumentos(consorcio);
    setShowDocumentosDialog(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Consórcios</h1>
          <p className="text-gray-600 mt-1">Gerencie grupos, cotas e contemplações</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Consórcio
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por grupo, cota, cliente, unidade, investimento caixa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <ConsorcioForm
          item={editingItem}
          clientes={clientes}
          unidades={unidades}
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

      <ConsorciosList
        items={filteredItems}
        clientes={clientes}
        unidades={unidades}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        onTransferir={handleTransferir}
        onDocumentos={handleDocumentos}
      />

      {showTransferirDialog && cotaParaTransferir && (
        <TransferirCotaDialog
          consorcio={cotaParaTransferir}
          clientes={clientes}
          unidades={unidades}
          onClose={() => {
            setShowTransferirDialog(false);
            setCotaParaTransferir(null);
          }}
          onConfirm={(data) => {
            transferirMutation.mutate({
              id: cotaParaTransferir.id,
              data,
            });
          }}
          isProcessing={transferirMutation.isPending}
        />
      )}

      {/* Dialog de Documentos */}
      <Dialog open={showDocumentosDialog} onOpenChange={setShowDocumentosDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentação - Grupo {consorcioParaDocumentos?.grupo} Cota {consorcioParaDocumentos?.cota}
            </DialogTitle>
          </DialogHeader>
          {consorcioParaDocumentos && (
            <DocumentosConsorcio consorcio={consorcioParaDocumentos} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}