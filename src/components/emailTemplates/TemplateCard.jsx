import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit, Copy, Trash2, Eye, Mail, Calendar, Send, Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoriaColors = {
  transacional: "bg-blue-100 text-blue-800",
  marketing: "bg-purple-100 text-purple-800",
  notificacao: "bg-yellow-100 text-yellow-800",
  boas_vindas: "bg-green-100 text-green-800",
  confirmacao: "bg-cyan-100 text-cyan-800",
  lembrete: "bg-orange-100 text-orange-800",
  cobranca: "bg-red-100 text-red-800",
  financeiro: "bg-indigo-100 text-indigo-800",
  obra: "bg-amber-100 text-amber-800",
  personalizado: "bg-gray-100 text-gray-800",
};

const categoriaLabels = {
  transacional: "Transacional",
  marketing: "Marketing",
  notificacao: "Notificação",
  boas_vindas: "Boas-vindas",
  confirmacao: "Confirmação",
  lembrete: "Lembrete",
  cobranca: "Cobrança",
  financeiro: "Financeiro",
  obra: "Obra",
  personalizado: "Personalizado",
};

export default function TemplateCard({ template, onEdit, onDuplicate, onDelete, onPreview }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              <Mail className="w-5 h-5 text-[var(--wine-600)] flex-shrink-0" />
              <span className="truncate">{template.nome}</span>
              {template.eh_padrao && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1 truncate">{template.codigo}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={categoriaColors[template.categoria]}>
              {categoriaLabels[template.categoria]}
            </Badge>
            {!template.ativo && (
              <Badge variant="outline" className="text-xs">Inativo</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Assunto:</p>
          <p className="text-sm text-gray-600 line-clamp-2">{template.assunto}</p>
        </div>

        {template.descricao && (
          <div>
            <p className="text-sm text-gray-500 line-clamp-2">{template.descricao}</p>
          </div>
        )}

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Send className="w-3 h-3" />
            <span>{template.total_envios || 0} envios</span>
          </div>
          {template.ultima_utilizacao && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(template.ultima_utilizacao), 'dd/MM/yy', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}