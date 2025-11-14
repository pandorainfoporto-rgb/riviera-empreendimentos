import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SearchFornecedorDialog({ open, onClose, fornecedores, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFornecedores = fornecedores?.filter(forn => 
    forn.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forn.cnpj?.includes(searchTerm) ||
    forn.tipo_servico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Pesquisar Fornecedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CNPJ ou tipo de serviço..."
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
                  <th className="px-4 py-2 text-left text-sm font-semibold">CNPJ</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Tipo de Serviço</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFornecedores && filteredFornecedores.length > 0 ? (
                  filteredFornecedores.map(fornecedor => (
                    <tr 
                      key={fornecedor.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => onSelect(fornecedor)}
                    >
                      <td className="px-4 py-3">{fornecedor.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fornecedor.cnpj}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fornecedor.tipo_servico || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={fornecedor.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {fornecedor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => onSelect(fornecedor)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhum fornecedor encontrado
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