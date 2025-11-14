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
import ImobiliariaForm from "../imobiliarias/ImobiliariaForm";

export default function SearchImobiliariaDialog({ open, onClose, imobiliarias, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Imobiliaria.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      setShowForm(false);
      toast.success("Imobiliária criada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Imobiliaria.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Imobiliária atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Imobiliaria.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imobiliarias'] });
      toast.success("Imobiliária excluída!");
    },
  });

  const filtered = imobiliarias.filter(i =>
    i.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Buscar Imobiliária</DialogTitle>
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
                Nova
              </Button>
            </div>

            <div className="border rounded-lg max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((imobiliaria) => (
                    <TableRow 
                      key={imobiliaria.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onDoubleClick={() => onSelect(imobiliaria)}
                    >
                      <TableCell className="font-semibold">{imobiliaria.nome}</TableCell>
                      <TableCell>{imobiliaria.cnpj}</TableCell>
                      <TableCell>{imobiliaria.telefone}</TableCell>
                      <TableCell>
                        <Badge className={imobiliaria.ativa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {imobiliaria.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(imobiliaria);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(imobiliaria);
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
                              if (confirm("Excluir imobiliária?")) {
                                deleteMutation.mutate(imobiliaria.id);
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
        <ImobiliariaForm
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
          imobiliaria={editingItem}
        />
      )}
    </>
  );
}