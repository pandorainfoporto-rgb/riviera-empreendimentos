import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SearchTemplateDialog({ open, onClose, templates, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = templates.filter(t =>
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Buscar Template de Contrato
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="border rounded-lg max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum template encontrado</p>
                      <p className="text-sm mt-1">Cadastre templates em Documentação → Templates</p>
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
  );
}