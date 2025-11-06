import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Edit, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeadsList({ leads, onLeadClick, onEdit, imobiliarias, corretores }) {
  return (
    <div className="space-y-2">
      {leads.map((lead) => {
        const imobiliaria = imobiliarias.find(i => i.id === lead.imobiliaria_id);
        const corretor = corretores.find(c => c.id === lead.corretor_id);

        return (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onLeadClick(lead)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{lead.nome_cliente}</h3>
                    <Badge className={`${
                      lead.temperatura_lead === 'muito_quente' ? 'bg-red-100 text-red-700' :
                      lead.temperatura_lead === 'quente' ? 'bg-orange-100 text-orange-700' :
                      lead.temperatura_lead === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.temperatura_lead}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.telefone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </div>
                    {imobiliaria && (
                      <div className="text-purple-600">
                        {imobiliaria.nome}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge variant="outline">{lead.status}</Badge>
                    <Badge className="bg-purple-100 text-purple-700">{lead.estagio_funil}</Badge>
                  </div>
                  {lead.valor_proposta && (
                    <div className="flex items-center gap-1 text-green-700 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      R$ {lead.valor_proposta.toLocaleString('pt-BR')}
                    </div>
                  )}
                  {lead.data_proxima_acao && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(lead.data_proxima_acao), 'dd/MM', { locale: ptBR })}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(lead);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {leads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Nenhum lead encontrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}