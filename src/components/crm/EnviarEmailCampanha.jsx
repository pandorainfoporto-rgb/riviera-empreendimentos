import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Send, Mail, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EnviarEmailCampanha({ leads, onClose }) {
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [leadsSelecionados, setLeadsSelecionados] = useState([]);
  const [selecionarTodos, setSelecionarTodos] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.filter({ ativo: true }),
  });

  const enviarCampanhaMutation = useMutation({
    mutationFn: async ({ template_codigo, leads_ids }) => {
      const promises = leads_ids.map(async (leadId) => {
        const lead = leads.find(l => l.id === leadId);
        
        return await base44.functions.invoke('processarEmailTemplate', {
          template_codigo,
          destinatario: lead.email,
          placeholders: {
            '{{nome_cliente}}': lead.nome_cliente,
            '{{email_cliente}}': lead.email,
            '{{telefone_cliente}}': lead.telefone,
          }
        });
      });

      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Campanha enviada com sucesso!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao enviar campanha: " + error.message);
    },
  });

  const handleSelecionarTodos = (checked) => {
    setSelecionarTodos(checked);
    if (checked) {
      setLeadsSelecionados(leads.map(l => l.id));
    } else {
      setLeadsSelecionados([]);
    }
  };

  const handleToggleLead = (leadId) => {
    if (leadsSelecionados.includes(leadId)) {
      setLeadsSelecionados(leadsSelecionados.filter(id => id !== leadId));
    } else {
      setLeadsSelecionados([...leadsSelecionados, leadId]);
    }
  };

  const handleEnviar = () => {
    if (!templateSelecionado) {
      toast.error("Selecione um template");
      return;
    }
    if (leadsSelecionados.length === 0) {
      toast.error("Selecione ao menos um lead");
      return;
    }

    const template = templates.find(t => t.codigo === templateSelecionado);
    
    if (confirm(`Enviar email "${template.nome}" para ${leadsSelecionados.length} lead(s)?`)) {
      enviarCampanhaMutation.mutate({
        template_codigo: templateSelecionado,
        leads_ids: leadsSelecionados,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Enviar Campanha de Email
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Seleção de Template */}
            <div>
              <label className="font-semibold mb-2 block">Selecionar Template</label>
              <Select value={templateSelecionado} onValueChange={setTemplateSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template de email..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.codigo}>
                      {t.nome} - {t.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Leads */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-semibold">Selecionar Destinatários</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selecionarTodos}
                    onCheckedChange={handleSelecionarTodos}
                  />
                  <span className="text-sm">Selecionar Todos ({leads.length})</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto space-y-2">
                {leads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={leadsSelecionados.includes(lead.id)}
                        onCheckedChange={() => handleToggleLead(lead.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{lead.nome_cliente}</p>
                        <p className="text-xs text-gray-600">{lead.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">{lead.temperatura_lead}</Badge>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">{lead.estagio_funil}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{leadsSelecionados.length} lead(s) selecionado(s)</span>
              </div>
            </div>
          </div>
        </CardContent>

        <div className="p-6 border-t flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-600">
            Será enviado para {leadsSelecionados.length} destinatário(s)
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnviar}
              disabled={enviarCampanhaMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {enviarCampanhaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Campanha
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}