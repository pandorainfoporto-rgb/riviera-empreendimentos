import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import FornecedorForm from "../fornecedores/FornecedorForm";

export default function SearchFornecedorDialog({ open, onClose, fornecedores, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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
      setEditingItem(null);
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

  const filtered = fornecedores?.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm) ||
    f.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.tipo_servico?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Buscar Fornecedor / Empresa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CNPJ, razão social ou tipo de serviço..."
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
                    <TableHead>Tipo de Serviço</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((fornecedor) => (
                      <TableRow 
                        key={fornecedor.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => onSelect(fornecedor)}
                      >
                        <TableCell className="font-semibold">{fornecedor.nome}</TableCell>
                        <TableCell>{fornecedor.cnpj}</TableCell>
                        <TableCell>{fornecedor.tipo_servico || '-'}</TableCell>
                        <TableCell>{fornecedor.telefone}</TableCell>
                        <TableCell>
                          <Badge className={fornecedor.ativo !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {fornecedor.ativo !== false ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
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
                                setEditingItem(fornecedor);
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  )}
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
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          fornecedor={editingItem}
        />
      )}
    </>
  );
}