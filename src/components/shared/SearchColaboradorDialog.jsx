import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, X } from "lucide-react";

export default function SearchColaboradorDialog({ open, onClose, colaboradores, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredColaboradores = colaboradores?.filter(col => 
    col.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.cpf?.includes(searchTerm) ||
    col.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Pesquisar Colaborador</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CPF ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Nome</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">CPF</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Cargo</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredColaboradores && filteredColaboradores.length > 0 ? (
                  filteredColaboradores.map(colaborador => (
                    <tr 
                      key={colaborador.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => onSelect(colaborador)}
                    >
                      <td className="px-4 py-3">{colaborador.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{colaborador.cpf}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{colaborador.cargo}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => onSelect(colaborador)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Nenhum colaborador encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}