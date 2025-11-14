import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Check, Save, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchTipoAtivoDialog({ open, onClose, tiposAtivo, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ 
    nome: "", 
    categoria: "renda_fixa", 
    risco: "medio",
    liquidez: "diaria" 
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TipoAtivo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposAtivo'] });
      setShowForm(false);
      setFormData({ nome: "", categoria: "renda_fixa", risco: "medio", liquidez: "diaria" });
      toast.success("Tipo de ativo criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TipoAtivo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposAtivo'] });
      setShowForm(false);
      setEditingItem(null);
      setFormData({ nome: "", categoria: "renda_fixa", risco: "medio", liquidez: "diaria" });
      toast.success("Tipo de ativo atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TipoAtivo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiposAtivo'] });
      toast.success("Tipo de ativo excluído!");
    },
  });

  const filtered = tiposAtivo.filter(t =>
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (tipo) => {
    setEditingItem(tipo);
    setFormData({ 
      nome: tipo.nome, 
      categoria: tipo.categoria,
      risco: tipo.risco,
      liquidez: tipo.liquidez
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

  const riscoColors = {
    baixo: "bg-green-100 text-green-800",
    medio: "bg-yellow-100 text-yellow-800",
    alto: "bg-orange-100 text-orange-800",
    muito_alto: "bg-red-100 text-red-800",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Tipo de Ativo</DialogTitle>
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
                      <TableHead>Categoria</TableHead>
                      <TableHead>Risco</TableHead>
                      <TableHead>Liquidez</TableHead>
                      <TableHead className="w-28">Ações</TableHead>
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
                        <TableCell>{tipo.categoria}</TableCell>
                        <TableCell>
                          <Badge className={riscoColors[tipo.risco]}>
                            {tipo.risco}
                          </Badge>
                        </TableCell>
                        <TableCell>{tipo.liquidez}</TableCell>
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
                                if (confirm("Excluir tipo de ativo?")) {
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
                {editingItem ? "Editar Tipo de Ativo" : "Novo Tipo de Ativo"}
              </h3>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: CDB, LCI, Tesouro Direto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                      <SelectItem value="renda_variavel">Renda Variável</SelectItem>
                      <SelectItem value="fundos">Fundos</SelectItem>
                      <SelectItem value="imoveis">Imóveis</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risco</Label>
                  <Select value={formData.risco} onValueChange={(value) => setFormData({ ...formData, risco: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="muito_alto">Muito Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Liquidez</Label>
                <Select value={formData.liquidez} onValueChange={(value) => setFormData({ ...formData, liquidez: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ nome: "", categoria: "renda_fixa", risco: "medio", liquidez: "diaria" });
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