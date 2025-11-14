import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import CaixaForm from "../caixas/CaixaForm";

export default function SearchCaixaDialog({ open, onClose, caixas, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCaixa, setEditingCaixa] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Caixa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      setShowForm(false);
      toast.success("Caixa criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Caixa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      setShowForm(false);
      setEditingCaixa(null);
      toast.success("Caixa atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Caixa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      toast.success("Caixa excluído!");
    },
  });

  const filtered = caixas.filter(c =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Buscar Caixa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </div>

            <div className="border rounded-lg max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((caixa) => (
                    <TableRow 
                      key={caixa.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onDoubleClick={() => onSelect(caixa)}
                    >
                      <TableCell>{caixa.nome}</TableCell>
                      <TableCell>{caixa.tipo}</TableCell>
                      <TableCell>R$ {(caixa.saldo_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(caixa);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCaixa(caixa);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Excluir caixa?")) {
                                deleteMutation.mutate(caixa.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showForm && (
        <CaixaForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingCaixa(null);
          }}
          onSave={(data) => {
            if (editingCaixa) {
              updateMutation.mutate({ id: editingCaixa.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          caixa={editingCaixa}
        />
      )}
    </>
  );
}