import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function SearchPlanoContasDialog({ open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contas = [] } = useQuery({
    queryKey: ['planoContas'],
    queryFn: async () => {
      try {
        return await base44.entities.PlanoContas.list();
      } catch {
        return [];
      }
    },
  });

  const filtered = contas.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Buscar Conta Contábil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.length > 0 ? (
              filtered.map(conta => (
                <Button
                  key={conta.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => onSelect(conta)}
                >
                  <div className="text-left">
                    <p className="font-medium">{conta.codigo} - {conta.nome}</p>
                    {conta.tipo && (
                      <p className="text-xs text-gray-500 capitalize">{conta.tipo}</p>
                    )}
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                {contas.length === 0 ? "Nenhuma conta contábil cadastrada" : "Nenhuma conta encontrada"}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}