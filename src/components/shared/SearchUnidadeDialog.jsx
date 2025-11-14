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

export default function SearchUnidadeDialog({ open, onClose, unidades, onSelect, onOpenForm }) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Unidade.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast.success("Unidade excluída!");
    },
  });

  const filtered = unidades.filter(u =>
    u.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    disponivel: "bg-green-100 text-green-800",
    reservada: "bg-yellow-100 text-yellow-800",
    vendida: "bg-blue-100 text-blue-800",
    escriturada: "bg-purple-100 text-purple-800",
    em_construcao: "bg-orange-100 text-orange-800",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Unidade</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por código ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => onOpenForm(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova
            </Button>
          </div>

          <div className="border rounded-lg max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Área (m²)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((unidade) => (
                  <TableRow 
                    key={unidade.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => onSelect(unidade)}
                  >
                    <TableCell className="font-semibold">{unidade.codigo}</TableCell>
                    <TableCell>{unidade.tipo}</TableCell>
                    <TableCell>{unidade.area_total}</TableCell>
                    <TableCell>R$ {(unidade.valor_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[unidade.status]}>
                        {unidade.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(unidade);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenForm(unidade);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Excluir unidade?")) {
                              deleteMutation.mutate(unidade.id);
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
  );
}