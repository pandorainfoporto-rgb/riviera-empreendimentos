import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Check, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SearchTipoDespesaDialog({ open, onClose, tiposDespesa, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TipoDespesa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
      setShowForm(false);
      setFormData({ nome: "", descricao: "" });
      toast.success("Tipo de despesa criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TipoDespesa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
      setShowForm(false);
      setEditingTipo(null);
      setFormData({ nome: "", descricao: "" });
      toast.success("Tipo de despesa atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TipoDespesa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposDespesa'] });
      toast.success("Tipo de despesa excluído!");
    },
  });

  const filtered = tiposDespesa.filter(t =>
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tipo) => {
    setEditingTipo(tipo);
    setFormData({ nome: tipo.nome, descricao: tipo.descricao || "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingTipo) {
      updateMutation.mutate({ id: editingTipo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Tipo de Despesa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showForm ? (
            <>
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
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tipo) => (
                      <TableRow 
                        key={tipo.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => onSelect(tipo)}
                      >
                        <TableCell className="font-semibold">{tipo.nome}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tipo.descricao}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(tipo);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(tipo);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Excluir tipo de despesa?")) {
                                  deleteMutation.mutate(tipo.id);
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
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {editingTipo ? "Editar Tipo de Despesa" : "Novo Tipo de Despesa"}
              </h3>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Materiais de Construção"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do tipo de despesa"
                />
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingTipo(null);
                    setFormData({ nome: "", descricao: "" });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}