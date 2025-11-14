import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FornecedorForm from "../fornecedores/FornecedorForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SearchFornecedorDialog({ open, onClose, fornecedores, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Fornecedor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      toast.success("Fornecedor criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fornecedor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingFornecedor(null);
      toast.success("Fornecedor atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Fornecedor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success("Fornecedor excluído!");
    },
  });

  const filtered = fornecedores.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Buscar Fornecedor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
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
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((fornecedor) => (
                    <TableRow 
                      key={fornecedor.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onDoubleClick={() => onSelect(fornecedor)}
                    >
                      <TableCell>{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cnpj}</TableCell>
                      <TableCell>{fornecedor.telefone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(fornecedor);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFornecedor(fornecedor);
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
                              if (confirm("Excluir fornecedor?")) {
                                deleteMutation.mutate(fornecedor.id);
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
        <FornecedorForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingFornecedor(null);
          }}
          onSave={(data) => {
            if (editingFornecedor) {
              updateMutation.mutate({ id: editingFornecedor.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          fornecedor={editingFornecedor}
        />
      )}
    </>
  );
}