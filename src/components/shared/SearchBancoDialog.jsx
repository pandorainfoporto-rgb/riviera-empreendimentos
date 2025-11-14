import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Check, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchBancoDialog({ open, onClose, bancos, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nome: "", codigo: "", agencia: "", tipo: "comercial" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Banco.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      setShowForm(false);
      setFormData({ nome: "", codigo: "", agencia: "", tipo: "comercial" });
      toast.success("Banco criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Banco.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      setShowForm(false);
      setEditingItem(null);
      setFormData({ nome: "", codigo: "", agencia: "", tipo: "comercial" });
      toast.success("Banco atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Banco.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] });
      toast.success("Banco excluído!");
    },
  });

  const filtered = bancos.filter(b =>
    b.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (banco) => {
    setEditingItem(banco);
    setFormData({ nome: banco.nome, codigo: banco.codigo, agencia: banco.agencia, tipo: banco.tipo });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Banco</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou código..."
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
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-28">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((banco) => (
                      <TableRow 
                        key={banco.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => onSelect(banco)}
                      >
                        <TableCell className="font-semibold">{banco.nome}</TableCell>
                        <TableCell>{banco.codigo}</TableCell>
                        <TableCell>{banco.tipo}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(banco);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(banco);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Excluir banco?")) {
                                  deleteMutation.mutate(banco.id);
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
                {editingItem ? "Editar Banco" : "Novo Banco"}
              </h3>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do banco"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="cooperativa">Cooperativa</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ nome: "", codigo: "", agencia: "", tipo: "comercial" });
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