import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import TemplateDocumentoForm from "../documentos/TemplateDocumentoForm";

export default function SearchTemplateDialog({ open, onClose, templates, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentoTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentoTemplates'] });
      setShowForm(false);
      toast.success("Template criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DocumentoTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentoTemplates'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("Template atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentoTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentoTemplates'] });
      toast.success("Template excluído!");
    },
  });

  const filtered = templates.filter(t =>
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open && !showForm} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Buscar Template de Contrato
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  autoFocus
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
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum template encontrado</p>
                        <p className="text-sm mt-1">Clique em "Novo" para criar um template</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((template) => (
                      <TableRow 
                        key={template.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onDoubleClick={() => onSelect(template)}
                      >
                        <TableCell className="font-semibold">{template.nome}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {template.descricao || "Sem descrição"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {template.tipo || "contrato"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(template);
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(template);
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
                                if (confirm("Excluir template?")) {
                                  deleteMutation.mutate(template.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filtered.length > 0 && (
              <p className="text-xs text-gray-500 text-center">
                💡 Dica: Dê duplo clique em um template para selecioná-lo
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showForm && (
        <TemplateDocumentoForm
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
          template={editingItem}
        />
      )}
    </>
  );
}