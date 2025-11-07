
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2, User, UserPlus, MessageSquare } from "lucide-react";

export default function ClientesList({ clientes = [], onEditar, onVisualizar, onCriarNegociacao, onDeletar, onNew }) {
  const handleEnviarMensagem = (cliente, e) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    // Navegar para página de mensagens com cliente selecionado
    window.location.href = `#/MensagensClientes?cliente_id=${cliente.id}`;
  };

  if (clientes.length === 0) {
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
          {onNew && (
            <Button
              onClick={onNew}
              className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clientes.map((cliente) => {
        const initials = cliente.nome
          ?.split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'CL';

        return (
          <Card
            key={cliente.id}
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => onVisualizar(cliente)}
          >
            <CardHeader className="px-6 pt-6 pb-3">
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
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

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onEditar(cliente); }}
                  className="gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onDeletar(cliente.id); }}
                  className="gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Deletar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleEnviarMensagem(cliente, e)}
                  className="gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  Mensagem
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
