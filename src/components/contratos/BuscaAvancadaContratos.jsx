import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function BuscaAvancadaContratos({ contratos, onVoltar }) {
  const [termoBusca, setTermoBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = async () => {
    if (!termoBusca.trim()) {
      toast.error("Digite um termo para buscar");
      return;
    }

    try {
      setBuscando(true);
      const contratos_ids = contratos.map(c => c.id);
      
      const response = await base44.functions.invoke('buscarEmContratos', {
        termo_busca: termoBusca,
        contratos_ids
      });

      if (response.data.success) {
        setResultados(response.data.resultados);
        toast.success(`${response.data.total_encontrados} resultados encontrados`);
      } else {
        toast.error("Erro na busca");
      }
    } catch (error) {
      toast.error("Erro ao buscar: " + error.message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Busca Avançada em Contratos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar termo nos contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Digite o termo para buscar (ex: 'rescisão', 'multa', 'prazo')"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
            />
            <Button onClick={handleBuscar} disabled={buscando}>
              {buscando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            A busca avançada utiliza IA para encontrar o termo dentro dos PDFs dos contratos
          </p>
        </CardContent>
      </Card>

      {resultados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Resultados ({resultados.length})</h2>
          {resultados.map((resultado, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{resultado.titulo}</h3>
                    {resultado.numero_contrato && (
                      <p className="text-sm text-gray-600">Nº {resultado.numero_contrato}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={resultado.relevancia === 'alta' ? 'default' : 'outline'}>
                      {resultado.relevancia}
                    </Badge>
                    <Badge variant="outline">
                      {resultado.ocorrencias} ocorrência{resultado.ocorrencias !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Contextos encontrados:</p>
                  {resultado.contextos.map((contexto, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-sm text-gray-700 italic">"{contexto}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}