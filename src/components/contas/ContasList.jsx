import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Landmark, CheckCircle2, XCircle } from "lucide-react";

export default function ContasList({ contas = [], bancos = [], onEdit, onDelete }) {
  const tiposContaLabels = {
    corrente: "Conta Corrente",
    poupanca: "Poupança",
    investimento: "Investimento",
    aplicacao: "Aplicação",
  };

  return (
    <div className="grid gap-4">
      {contas.map((conta) => {
        const banco = bancos.find(b => b.id === conta.banco_id);

        return (
          <Card key={conta.id} className={`${!conta.ativa ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${conta.ativa ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Landmark className={`w-6 h-6 ${conta.ativa ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {banco?.nome || 'Banco não encontrado'}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {tiposContaLabels[conta.tipo_conta] || conta.tipo_conta}
                      </Badge>
                      {conta.ativa ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Número da Conta</p>
                        <p className="font-semibold text-gray-900">{conta.numero_conta}</p>
                      </div>

                      {conta.titular && (
                        <div>
                          <p className="text-gray-500 text-xs">Titular</p>
                          <p className="font-semibold text-gray-900">{conta.titular}</p>
                        </div>
                      )}

                      {banco?.agencia && (
                        <div>
                          <p className="text-gray-500 text-xs">Agência</p>
                          <p className="font-semibold text-gray-900">{banco.agencia}</p>
                        </div>
                      )}

                      {conta.saldo_inicial !== undefined && (
                        <div>
                          <p className="text-gray-500 text-xs">Saldo Inicial</p>
                          <p className="font-semibold text-gray-900">
                            R$ {(conta.saldo_inicial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>

                    {conta.observacoes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        💬 {conta.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => onEdit(conta)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(conta.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {contas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Landmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma conta cadastrada</p>
            <p className="text-sm text-gray-500 mt-2">
              Clique em "Nova Conta" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}