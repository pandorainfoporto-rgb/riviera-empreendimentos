import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function SearchCaixaDialog({ open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: caixas = [] } = useQuery({
    queryKey: ['caixas'],
    queryFn: () => base44.entities.Caixa.list(),
  });

  const filtered = caixas.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Buscar Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filtered.map(caixa => (
              <Button
                key={caixa.id}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => onSelect(caixa)}
              >
                <div className="text-left">
                  <p className="font-medium">{caixa.nome}</p>
                  <p className="text-xs text-gray-500">
                    Saldo: R$ {(caixa.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-4">Nenhum caixa encontrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}