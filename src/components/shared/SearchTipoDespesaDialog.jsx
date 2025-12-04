import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function SearchTipoDespesaDialog({ open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tipos = [] } = useQuery({
    queryKey: ['tiposDespesa'],
    queryFn: () => base44.entities.TipoDespesa.list(),
  });

  const filtered = tipos.filter(t => 
    t.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Buscar Tipo de Despesa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.map(tipo => (
              <Button
                key={tipo.id}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => onSelect(tipo)}
              >
                <div className="text-left">
                  <p className="font-medium">{tipo.nome}</p>
                  {tipo.codigo && (
                    <p className="text-xs text-gray-500">Código: {tipo.codigo}</p>
                  )}
                </div>
              </Button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-4">Nenhum tipo de despesa encontrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}