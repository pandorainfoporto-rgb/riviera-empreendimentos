import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Send, Loader2, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function FuncaoBoletosChat({ conversa, onEnviar, onFechar }) {
  const [tituloSelecionado, setTituloSelecionado] = useState(null);
  const [boletoGerado, setBoletoGerado] = useState(null);

  const { data: titulos = [], isLoading } = useQuery({
    queryKey: ['titulos_abertos', conversa.cliente_id],
    queryFn: async () => {
      if (!conversa.cliente_id) return [];
      return await base44.entities.PagamentoCliente.filter({
        cliente_id: conversa.cliente_id,
        status: { $in: ['pendente', 'atrasado'] }
      }, '-data_vencimento');
    },
    enabled: !!conversa.cliente_id,
  });

  const gerarBoletoMutation = useMutation({
    mutationFn: async (pagamentoId) => {
      const result = await base44.functions.invoke('gerarBoletoBolix', {
        pagamento_id: pagamentoId
      });
      return result.data;
    },
    onSuccess: (data) => {
      setBoletoGerado(data);
      toast.success("Boleto gerado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao gerar boleto");
    }
  });

  const handleEnviarBoleto = async () => {
    if (!boletoGerado) return;

    const mensagem = `📄 *Boleto Gerado*\n\nVencimento: ${new Date(tituloSelecionado.data_vencimento).toLocaleDateString()}\nValor: R$ ${tituloSelecionado.valor.toFixed(2)}\n\n🔗 Link: ${boletoGerado.boleto_url}\n\n📊 Código de barras:\n${boletoGerado.codigo_barras}`;

    await onEnviar(mensagem);
    onFechar();
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600 mt-2">Buscando títulos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!conversa.cliente_id) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-700">Cliente não identificado. Não é possível buscar boletos.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onFechar}>
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (titulos.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-700">✅ Nenhum título em aberto para este cliente.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onFechar}>
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (boletoGerado) {
    return (
      <Card className="border-green-200">
        <CardContent className="py-6 space-y-4">
          <div className="text-center">
            <FileText className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-green-900">Boleto Gerado com Sucesso!</p>
          </div>

          <div className="p-3 bg-gray-50 rounded space-y-2">
            <p className="text-sm"><strong>Vencimento:</strong> {new Date(tituloSelecionado.data_vencimento).toLocaleDateString()}</p>
            <p className="text-sm"><strong>Valor:</strong> R$ {tituloSelecionado.valor.toFixed(2)}</p>
            <p className="text-xs text-gray-600 break-all"><strong>Código:</strong> {boletoGerado.codigo_barras}</p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(boletoGerado.boleto_url, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleEnviarBoleto}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar ao Cliente
            </Button>
          </div>

          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full"
            onClick={onFechar}
          >
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            Títulos em Aberto
          </h3>
          <Button size="sm" variant="ghost" onClick={onFechar}>✕</Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {titulos.map((titulo) => (
            <button
              key={titulo.id}
              onClick={() => setTituloSelecionado(titulo)}
              className={`w-full text-left p-3 border rounded-lg transition-all ${
                tituloSelecionado?.id === titulo.id 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  R$ {titulo.valor.toFixed(2)}
                </span>
                <Badge variant={titulo.status === 'atrasado' ? 'destructive' : 'outline'}>
                  {titulo.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Vencimento: {new Date(titulo.data_vencimento).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">
                Tipo: {titulo.tipo || 'Parcela'}
              </p>
            </button>
          ))}
        </div>

        {tituloSelecionado && (
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => gerarBoletoMutation.mutate(tituloSelecionado.id)}
            disabled={gerarBoletoMutation.isPending}
          >
            {gerarBoletoMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Boleto...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Boleto (Bolix)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}