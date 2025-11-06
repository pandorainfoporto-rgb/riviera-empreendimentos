import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function RelatorioClientesFornecedores({ tipo }) {
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    enabled: tipo === 'clientes' || tipo === 'socios',
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list(),
    enabled: tipo === 'fornecedores',
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
    enabled: tipo === 'socios',
  });

  const dados = tipo === 'clientes' ? clientes : tipo === 'fornecedores' ? fornecedores : socios;
  const titulo = tipo === 'clientes' ? 'Clientes' : tipo === 'fornecedores' ? 'Fornecedores' : 'Sócios';

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[var(--wine-700)] mb-4">
            Total de {titulo}: {dados.length}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CPF/CNPJ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dados.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.cpf_cnpj || item.cnpj}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.telefone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}