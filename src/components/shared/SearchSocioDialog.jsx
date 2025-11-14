import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SocioForm from "../socios/SocioForm";

export default function SearchSocioDialog({ open, onClose, socios, unidades, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Socio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
      setShowForm(false);
      toast.success("Sócio criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Socio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Sócio atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Socio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] });
      toast.success("Sócio excluído!");
    },
  });

  const filtered = socios.filter(s =>
    s.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cpf_cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Buscar Sócio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou CPF/CNPJ..."
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
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((socio) => (
                    <TableRow 
                      key={socio.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onDoubleClick={() => onSelect(socio)}
                    >
                      <TableCell className="font-semibold">{socio.nome}</TableCell>
                      <TableCell>{socio.cpf_cnpj}</TableCell>
                      <TableCell>{socio.telefone}</TableCell>
                      <TableCell>{socio.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(socio);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(socio);
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
                              if (confirm("Excluir sócio?")) {
                                deleteMutation.mutate(socio.id);
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
        <SocioForm
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
          socio={editingItem}
          unidades={unidades}
        />
      )}
    </>
  );
}