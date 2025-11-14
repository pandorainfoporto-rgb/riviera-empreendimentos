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

export default function SearchCorretoraDialog({ open, onClose, corretoras, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nome: "", cnpj: "", codigo_corretora: "", tipo: "completa" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Corretora.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretoras'] });
      setShowForm(false);
      setFormData({ nome: "", cnpj: "", codigo_corretora: "", tipo: "completa" });
      toast.success("Corretora criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Corretora.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretoras'] });
      setShowForm(false);
      setEditingItem(null);
      setFormData({ nome: "", cnpj: "", codigo_corretora: "", tipo: "completa" });
      toast.success("Corretora atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Corretora.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretoras'] });
      toast.success("Corretora excluída!");
    },
  });

  const filtered = corretoras.filter(c =>
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (corretora) => {
    setEditingItem(corretora);
    setFormData({ 
      nome: corretora.nome, 
      cnpj: corretora.cnpj, 
      codigo_corretora: corretora.codigo_corretora,
      tipo: corretora.tipo 
    });
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
          <DialogTitle>Buscar Corretora</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showForm ? (
            <>
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
                  Nova
                </Button>
              </div>

              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-28">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((corretora) => (
                      <TableRow 
                        key={corretora.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => onSelect(corretora)}
                      >
                        <TableCell className="font-semibold">{corretora.nome}</TableCell>
                        <TableCell>{corretora.cnpj}</TableCell>
                        <TableCell>{corretora.codigo_corretora}</TableCell>
                        <TableCell>{corretora.tipo}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(corretora);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(corretora);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Excluir corretora?")) {
                                  deleteMutation.mutate(corretora.id);
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
                {editingItem ? "Editar Corretora" : "Nova Corretora"}
              </h3>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da corretora"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formData.codigo_corretora}
                    onChange={(e) => setFormData({ ...formData, codigo_corretora: e.target.value })}
                    placeholder="Código da corretora"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acoes">Ações</SelectItem>
                    <SelectItem value="fundos">Fundos</SelectItem>
                    <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                    <SelectItem value="multimercado">Multimercado</SelectItem>
                    <SelectItem value="completa">Completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ nome: "", cnpj: "", codigo_corretora: "", tipo: "completa" });
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