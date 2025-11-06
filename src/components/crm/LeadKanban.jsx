import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const estagios = [
  { id: "prospeccao", nome: "Prospecção", cor: "bg-gray-100" },
  { id: "qualificacao", nome: "Qualificação", cor: "bg-blue-100" },
  { id: "proposta", nome: "Proposta", cor: "bg-purple-100" },
  { id: "negociacao", nome: "Negociação", cor: "bg-orange-100" },
  { id: "fechamento", nome: "Fechamento", cor: "bg-green-100" },
];

const temperaturaColors = {
  frio: "bg-blue-100 text-blue-700",
  morno: "bg-yellow-100 text-yellow-700",
  quente: "bg-orange-100 text-orange-700",
  muito_quente: "bg-red-100 text-red-700",
};

export default function LeadKanban({ leads, onLeadClick, onUpdateLead, imobiliarias, corretores }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const leadId = result.draggableId;
    const novoEstagio = result.destination.droppableId;
    
    onUpdateLead(leadId, { estagio_funil: novoEstagio });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {estagios.map((estagio) => {
          const leadsEstagio = leads.filter(l => l.estagio_funil === estagio.id);
          const valorTotal = leadsEstagio.reduce((sum, l) => sum + (l.valor_proposta || 0), 0);

          return (
            <Droppable key={estagio.id} droppableId={estagio.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg ${estagio.cor} p-2 ${
                    snapshot.isDraggingOver ? 'ring-2 ring-[var(--wine-600)]' : ''
                  }`}
                >
                  <div className="mb-3 p-2 bg-white rounded-lg shadow-sm">
                    <h3 className="font-semibold text-sm">{estagio.nome}</h3>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-600">{leadsEstagio.length} leads</p>
                      {valorTotal > 0 && (
                        <p className="text-xs font-semibold text-green-600">
                          R$ {(valorTotal / 1000).toFixed(0)}k
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[200px]">
                    {leadsEstagio.map((lead, index) => {
                      const imobiliaria = imobiliarias.find(i => i.id === lead.imobiliaria_id);
                      const corretor = corretores.find(c => c.id === lead.corretor_id);

                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => onLeadClick(lead)}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-sm line-clamp-1">
                                    {lead.nome_cliente}
                                  </h4>
                                  {lead.temperatura_lead && (
                                    <Badge className={`text-xs ${temperaturaColors[lead.temperatura_lead]}`}>
                                      {lead.temperatura_lead}
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-1 text-xs text-gray-600">
                                  {lead.telefone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span className="truncate">{lead.telefone}</span>
                                    </div>
                                  )}
                                  {lead.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate">{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.valor_proposta && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span className="font-semibold text-green-700">
                                        R$ {lead.valor_proposta.toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                  {imobiliaria && (
                                    <div className="flex items-center gap-1 text-purple-600">
                                      <TrendingUp className="w-3 h-3" />
                                      <span className="truncate">{imobiliaria.nome}</span>
                                    </div>
                                  )}
                                </div>

                                {lead.data_proxima_acao && (
                                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(lead.data_proxima_acao).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}