import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AvaliacaoAtendimento({ conversa, onConcluir }) {
  const [notaAtendimento, setNotaAtendimento] = useState(0);
  const [notaEmpresa, setNotaEmpresa] = useState(0);
  const [comentario, setComentario] = useState("");
  const [etapa, setEtapa] = useState("atendimento"); // atendimento, empresa, comentario

  const avaliarMutation = useMutation({
    mutationFn: async (dados) => {
      return await base44.entities.AvaliacaoAtendimento.create(dados);
    },
    onSuccess: () => {
      toast.success("Obrigado pela sua avaliação!");
      onConcluir();
    },
    onError: () => {
      toast.error("Erro ao enviar avaliação");
    }
  });

  const handleProximaEtapa = () => {
    if (etapa === "atendimento" && notaAtendimento > 0) {
      setEtapa("empresa");
    } else if (etapa === "empresa" && notaEmpresa > 0) {
      setEtapa("comentario");
    }
  };

  const handleEnviar = () => {
    if (notaAtendimento === 0 || notaEmpresa === 0) {
      toast.error("Por favor, avalie o atendimento e a empresa");
      return;
    }

    avaliarMutation.mutate({
      conversa_id: conversa.id,
      cliente_id: conversa.cliente_id,
      lead_id: conversa.lead_id,
      atendente_id: conversa.atendente_id,
      atendente_nome: conversa.atendente_nome,
      canal: conversa.canal_id,
      nota_atendimento: notaAtendimento,
      nota_empresa: notaEmpresa,
      comentario: comentario,
      data_avaliacao: new Date().toISOString(),
    });
  };

  const renderEstrelas = (nota, setNota) => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setNota(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                n <= nota
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardContent className="py-8 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Avalie seu Atendimento
          </h3>
          <p className="text-sm text-gray-600">
            Sua opinião é muito importante para nós!
          </p>
        </div>

        {etapa === "atendimento" && (
          <div className="space-y-4">
            <p className="text-center font-semibold text-gray-800">
              Como você avalia o atendimento?
            </p>
            {renderEstrelas(notaAtendimento, setNotaAtendimento)}
            {notaAtendimento > 0 && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleProximaEtapa}
              >
                Continuar
              </Button>
            )}
          </div>
        )}

        {etapa === "empresa" && (
          <div className="space-y-4">
            <p className="text-center font-semibold text-gray-800">
              Como você avalia nossa empresa?
            </p>
            {renderEstrelas(notaEmpresa, setNotaEmpresa)}
            {notaEmpresa > 0 && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleProximaEtapa}
              >
                Continuar
              </Button>
            )}
          </div>
        )}

        {etapa === "comentario" && (
          <div className="space-y-4">
            <p className="text-center font-semibold text-gray-800 mb-2">
              Gostaria de deixar algum comentário ou sugestão?
            </p>
            <Textarea
              placeholder="Seu comentário (opcional)..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEnviar}
              >
                Pular
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleEnviar}
                disabled={avaliarMutation.isPending}
              >
                {avaliarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Avaliação
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${etapa === "atendimento" ? "bg-blue-600" : "bg-gray-300"}`} />
          <div className={`w-2 h-2 rounded-full ${etapa === "empresa" ? "bg-blue-600" : "bg-gray-300"}`} />
          <div className={`w-2 h-2 rounded-full ${etapa === "comentario" ? "bg-blue-600" : "bg-gray-300"}`} />
        </div>
      </CardContent>
    </Card>
  );
}