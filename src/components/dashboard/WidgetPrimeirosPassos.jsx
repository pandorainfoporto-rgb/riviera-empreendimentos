import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Rocket, CheckCircle2, ArrowRight, X } from "lucide-react";

export default function WidgetPrimeirosPassos({ 
  checklistItens, 
  onDismiss 
}) {
  const itensConcluidos = checklistItens.filter(i => i.concluido).length;
  const progresso = (itensConcluidos / checklistItens.length) * 100;

  // Mostrar apenas os 3 primeiros não concluídos
  const itensParaMostrar = checklistItens
    .filter(i => !i.concluido)
    .slice(0, 3);

  if (progresso === 100 || itensParaMostrar.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-[var(--wine-400)] shadow-lg relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 w-6 h-6"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>

      <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-[var(--grape-50)] pb-3">
        <CardTitle className="flex items-center gap-2 text-[var(--wine-700)]">
          <Rocket className="w-5 h-5" />
          Primeiros Passos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-600">Progresso</span>
            <span className="text-xs font-bold text-[var(--wine-700)]">
              {itensConcluidos}/{checklistItens.length}
            </span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        <div className="space-y-2">
          {itensParaMostrar.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm flex-1 min-w-0 truncate">{item.titulo}</span>
              <Link to={createPageUrl(item.link)}>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <Link to={createPageUrl('PrimeirosPassos')}>
          <Button className="w-full mt-3 bg-[var(--wine-600)] hover:bg-[var(--wine-700)] text-xs">
            Ver Todos os Passos
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}