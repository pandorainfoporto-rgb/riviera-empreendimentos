import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Image, FileText, Receipt, DollarSign, FileCheck, Handshake } from "lucide-react";

export default function EstatisticasExecucao({ documentos, imagensUnidades = [] }) {
  const fotos = documentos.filter(d => d.tipo === 'foto').length;
  const projetos = documentos.filter(d => d.tipo === 'projeto').length;
  const notasFiscais = documentos.filter(d => d.tipo === 'nota_fiscal').length;
  const contratos = documentos.filter(d => d.tipo === 'contrato').length;
  
  const fotosUnidades = imagensUnidades.filter(img => 
    img.tipo === 'galeria' || img.tipo === 'fachada' || img.tipo === 'principal'
  ).length;
  
  const plantasUnidades = imagensUnidades.filter(img => img.tipo === 'planta').length;

  const totalFotos = fotos + fotosUnidades;
  const totalProjetos = projetos + plantasUnidades;
  
  const valorNotas = documentos
    .filter(d => d.tipo === 'nota_fiscal')
    .reduce((sum, d) => sum + (d.valor || 0), 0);
  
  const valorRecibos = documentos
    .filter(d => d.tipo === 'recibo')
    .reduce((sum, d) => sum + (d.valor || 0), 0);

  const stats = [
    { icon: Image, label: "Fotos", value: totalFotos, color: "purple" },
    { icon: FileText, label: "Projetos", value: totalProjetos, color: "blue" },
    { icon: Receipt, label: "Notas Fiscais", value: notasFiscais, color: "orange" },
    { icon: FileCheck, label: "Contratos", value: contratos, color: "teal" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total NFs</p>
              <p className="text-sm font-bold text-gray-900">
                R$ {valorNotas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Recibos</p>
              <p className="text-sm font-bold text-gray-900">
                R$ {valorRecibos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}