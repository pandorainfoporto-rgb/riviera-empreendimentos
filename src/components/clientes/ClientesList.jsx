
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Added Dialog components
import { Edit, Trash2, User, MessageSquare } from "lucide-react"; // Added MessageSquare, removed UserPlus as it's no longer used

import ComunicacaoCliente from "./ComunicacaoCliente"; // Added ComunicacaoCliente

export default function ClientesList({ clientes = [], onEdit, onDelete }) { // Removed 'onNew' prop as per outline
  const [clienteComunicacao, setClienteComunicacao] = useState(null);

  // Assuming 'clientesFiltrados' is simply 'clientes' if no explicit filter/search logic is provided in the outline.
  const clientesFiltrados = clientes; 

  if (clientesFiltrados.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Verifique e cadastre novos clientes se necessário
          </p>
          {/* The "Cadastrar Primeiro Cliente" button relying on 'onNew' prop was removed
              as 'onNew' is no longer in the component's props as per the outline. */}
        </CardContent>
      </Card>
    );
  }

  return (
    <> {/* Using a React Fragment to wrap the grid and the dialog */}
      <div className="grid gap-4"> {/* Preserving the grid layout for the cards */}
        {clientesFiltrados.map((cliente) => {
          const initials = cliente.nome
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'CL';

          return (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              {/* Existing CardContent for client details, adjusted padding and removed old buttons */}
              <CardContent className="p-6 pb-4">
                <div className="flex items-start"> {/* Removed justify-between as buttons are now in a separate CardContent */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-[var(--wine-600)] to-[var(--grape-600)]">
                      <AvatarFallback className="text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-gray-900">{cliente.nome}</h3>
                        {cliente.eh_inquilino && (
                          <Badge className="bg-purple-100 text-purple-700">Inquilino</Badge>
                        )}
                        {cliente.eh_cliente_externo_consorcio && (
                          <Badge className="bg-blue-100 text-blue-700">Cliente Externo</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">CPF/CNPJ:</span> {cliente.cpf_cnpj}
                        </div>
                        {cliente.telefone && (
                          <div>
                            <span className="font-medium">Telefone:</span> {cliente.telefone}
                          </div>
                        )}
                        {cliente.email && (
                          <div>
                            <span className="font-medium">Email:</span> {cliente.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Old action buttons (Edit, Trash2) were removed from here */}
                </div>
              </CardContent>

              {/* New CardContent for action buttons */}
              <CardContent className="pt-0 pb-6 px-6">
                <div className="flex gap-2"> {/* Removed mt-4 as it's now in a new CardContent */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setClienteComunicacao(cliente)}
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Comunicação
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(cliente)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {/* Trash2 button re-added with new styling */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(cliente.id)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog Comunicação */}
      {clienteComunicacao && (
        <Dialog open={!!clienteComunicacao} onOpenChange={() => setClienteComunicacao(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comunicação com Cliente</DialogTitle>
            </DialogHeader>
            <ComunicacaoCliente cliente={clienteComunicacao} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
