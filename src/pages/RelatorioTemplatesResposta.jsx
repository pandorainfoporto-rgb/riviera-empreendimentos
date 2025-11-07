import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Download, TrendingUp, Star, Mail, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriaColors = {
  financeiro: "bg-green-100 text-green-700",
  obra: "bg-orange-100 text-orange-700",
  documentacao: "bg-blue-100 text-blue-700",
  agendamento: "bg-purple-100 text-purple-700",
  suporte: "bg-yellow-100 text-yellow-700",
  geral: "bg-gray-100 text-gray-700",
  urgente: "bg-red-100 text-red-700",
  boas_vindas: "bg-pink-100 text-pink-700",
  follow_up: "bg-indigo-100 text-indigo-700"
};

export default function RelatorioTemplatesRespostaPage() {
  const [periodo, setPeriodo] = useState("30");
  const [exportando, setExportando] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['respostas_template_relatorio'],
    queryFn: () => base44.entities.RespostaTemplate.list('-total_usos'),
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens_completo'],
    queryFn: () => base44.entities.Mensagem.list(),
  });

  // Estatísticas
  const totalTemplates = templates.length;
  const templatesAtivos = templates.filter(t => t.ativo).length;
  const templatesFavoritos = templates.filter(t => t.favorito).length;
  const totalUsos = templates.reduce((sum, t) => sum + (t.total_usos || 0), 0);

  // Templates mais usados
  const templatesMaisUsados = templates
    .filter(t => t.total_usos > 0)
    .sort((a, b) => b.total_usos - a.total_usos)
    .slice(0, 10);

  // Templates por categoria
  const templatesPorCategoria = Object.entries(
    templates.reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + 1;
      return acc;
    }, {})
  ).map(([cat, qtd]) => ({
    name: cat,
    quantidade: qtd,
    usos: templates.filter(t => t.categoria === cat).reduce((sum, t) => sum + (t.total_usos || 0), 0)
  }));

  // Efetividade dos templates (mensagens que foram respondidas)
  const efetividadeTemplates = templates.map(t => {
    const mensagensComTemplate = mensagens.filter(m => m.template_sugerido_id === t.id);
    const mensagensRespondidas = mensagensComTemplate.filter(m => m.respondida);
    
    return {
      nome: t.nome,
      categoria: t.categoria,
      total_usos: t.total_usos || 0,
      taxa_resposta: mensagensComTemplate.length > 0
        ? Math.round((mensagensRespondidas.length / mensagensComTemplate.length) * 100)
        : 0
    };
  }).filter(t => t.total_usos > 0)
    .sort((a, b) => b.taxa_resposta - a.taxa_resposta)
    .slice(0, 10);

  const exportarCSV = () => {
    setExportando(true);
    
    const csv = [
      ['Relatório de Templates de Resposta'],
      [''],
      ['RESUMO GERAL'],
      ['Total de Templates', totalTemplates],
      ['Templates Ativos', templatesAtivos],
      ['Templates Favoritos', templatesFavoritos],
      ['Total de Usos', totalUsos],
      [''],
      ['TEMPLATES MAIS USADOS'],
      ['Template', 'Categoria', 'Total Usos', 'Envia Email', 'Favorito'],
      ...templatesMaisUsados.map(t => [
        t.nome,
        t.categoria,
        t.total_usos,
        t.enviar_email_automatico ? 'Sim' : 'Não',
        t.favorito ? 'Sim' : 'Não'
      ]),
      [''],
      ['EFETIVIDADE DOS TEMPLATES'],
      ['Template', 'Total Usos', 'Taxa de Resposta (%)'],
      ...efetividadeTemplates.map(t => [
        t.nome,
        t.total_usos,
        t.taxa_resposta
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-templates-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setExportando(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Uso de Templates</h1>
          <p className="text-gray-600 mt-1">Análise de efetividade e performance</p>
        </div>
        <Button
          onClick={exportarCSV}
          disabled={exportando}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-3xl font-bold text-gray-900">{totalTemplates}</p>
                <p className="text-xs text-gray-500 mt-1">{templatesAtivos} ativos</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usos</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsos}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favoritos</p>
                <p className="text-3xl font-bold text-gray-900">{templatesFavoritos}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Email</p>
                <p className="text-3xl font-bold text-gray-900">
                  {templates.filter(t => t.enviar_email_automatico).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Templates por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={templatesPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#922B3E" name="Quantidade" />
                <Bar dataKey="usos" fill="#7D5999" name="Total Usos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efetividade dos Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efetividadeTemplates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="taxa_resposta" fill="#10B981" name="Taxa Resposta (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Templates Mais Usados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templatesMaisUsados.map((template, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-bold text-lg text-gray-400">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{template.nome}</p>
                      {template.favorito && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge className={categoriaColors[template.categoria]}>
                        {template.categoria}
                      </Badge>
                      {template.enviar_email_automatico && (
                        <Badge variant="outline">
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--wine-600)]">{template.total_usos}</p>
                  <p className="text-xs text-gray-600">usos</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}