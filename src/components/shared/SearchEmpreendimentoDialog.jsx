import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle2, Edit, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SearchEmpreendimentoDialog({ open, onClose, empreendimentos, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const filteredItems = empreendimentos.filter(item =>
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    planejamento: "bg-blue-100 text-blue-800",
    em_execucao: "bg-green-100 text-green-800",
    em_pausa: "bg-yellow-100 text-yellow-800",
    concluido: "bg-gray-100 text-gray-800",
    cancelado: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    planejamento: "Planejamento",
    em_execucao: "Em Execução",
    em_pausa: "Em Pausa",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Empreendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow 
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onDoubleClick={() => onSelect(item)}
                  >
                    <TableCell className="font-semibold">{item.nome}</TableCell>
                    <TableCell className="text-sm text-gray-600">{item.endereco || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status] || "bg-gray-100"}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-700">
                      R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                        className="h-8 w-8"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum empreendimento encontrado
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}