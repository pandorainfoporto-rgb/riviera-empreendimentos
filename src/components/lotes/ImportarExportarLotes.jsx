import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileJson, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportarExportarLotes({ open, onClose, loteamentoId }) {
  const queryClient = useQueryClient();
  const [arquivo, setArquivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const importarMutation = useMutation({
    mutationFn: async (dados) => {
      const lotes = JSON.parse(dados);
      const results = { sucesso: 0, erro: 0, erros: [] };

      for (const lote of lotes) {
        try {
          await base44.entities.Lote.create({
            ...lote,
            loteamento_id: loteamentoId
          });
          results.sucesso++;
        } catch (error) {
          results.erro++;
          results.erros.push(`Lote ${lote.numero}: ${error.message}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setResultado(results);
      queryClient.invalidateQueries(['lotes']);
      toast({ 
        title: "Importação concluída!",
        description: `${results.sucesso} lotes importados, ${results.erro} erros`
      });
    },
    onError: (error) => {
      toast({ 
        title: "Erro na importação", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleImportar = async () => {
    if (!arquivo) {
      toast({ title: "Selecione um arquivo", variant: "destructive" });
      return;
    }

    setImportando(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const texto = e.target.result;
        
        if (arquivo.name.endsWith('.json')) {
          await importarMutation.mutateAsync(texto);
        } else if (arquivo.name.endsWith('.csv')) {
          const lotes = csvParaJson(texto);
          await importarMutation.mutateAsync(JSON.stringify(lotes));
        }
      } catch (error) {
        toast({ 
          title: "Erro ao processar arquivo", 
          description: error.message, 
          variant: "destructive" 
        });
      } finally {
        setImportando(false);
      }
    };

    reader.readAsText(arquivo);
  };

  const csvParaJson = (csv) => {
    const linhas = csv.split('\n');
    const headers = linhas[0].split(',').map(h => h.trim());
    
    return linhas.slice(1).filter(linha => linha.trim()).map(linha => {
      const valores = linha.split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        let valor = valores[index]?.trim();
        
        // Converter números
        if (header === 'area' || header === 'testada' || header === 'valor_total' || header === 'valor_m2') {
          valor = parseFloat(valor) || 0;
        }
        
        // Converter coordenadas
        if (header === 'coordenadas_mapa') {
          try {
            valor = JSON.parse(valor);
          } catch {
            valor = [];
          }
        }
        
        obj[header] = valor;
      });
      
      return obj;
    });
  };

  const exportarJSON = async () => {
    try {
      const lotes = await base44.entities.Lote.filter({ loteamento_id: loteamentoId });
      
      const dadosExportar = lotes.map(lote => ({
        numero: lote.numero,
        quadra: lote.quadra,
        area: lote.area,
        testada: lote.testada,
        valor_total: lote.valor_total,
        valor_m2: lote.valor_m2,
        status: lote.status,
        coordenadas_mapa: lote.coordenadas_mapa,
        descricao_localizacao: lote.descricao_localizacao,
        numero_matricula: lote.numero_matricula,
        inscricao_municipal: lote.inscricao_municipal,
        observacoes: lote.observacoes
      }));

      const blob = new Blob([JSON.stringify(dadosExportar, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lotes_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Arquivo JSON exportado com sucesso!" });
    } catch (error) {
      toast({ 
        title: "Erro ao exportar", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const exportarCSV = async () => {
    try {
      const lotes = await base44.entities.Lote.filter({ loteamento_id: loteamentoId });
      
      const headers = [
        'numero', 'quadra', 'area', 'testada', 'valor_total', 'valor_m2', 
        'status', 'descricao_localizacao', 'numero_matricula', 
        'inscricao_municipal', 'observacoes'
      ];
      
      let csv = headers.join(',') + '\n';
      
      lotes.forEach(lote => {
        const linha = headers.map(header => {
          let valor = lote[header] || '';
          if (typeof valor === 'string' && valor.includes(',')) {
            valor = `"${valor}"`;
          }
          return valor;
        });
        csv += linha.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lotes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Arquivo CSV exportado com sucesso!" });
    } catch (error) {
      toast({ 
        title: "Erro ao exportar", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        numero: "001",
        quadra: "A",
        area: 250,
        testada: 10,
        valor_total: 150000,
        valor_m2: 600,
        status: "disponivel",
        coordenadas_mapa: [[100, 100], [200, 100], [200, 200], [100, 200]],
        descricao_localizacao: "Esquina com rua principal",
        numero_matricula: "12345",
        inscricao_municipal: "123456789",
        observacoes: "Observações do lote"
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_lotes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar / Exportar Lotes</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="importar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="importar">Importar</TabsTrigger>
            <TabsTrigger value="exportar">Exportar</TabsTrigger>
          </TabsList>

          <TabsContent value="importar" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Importe lotes em massa através de arquivos JSON ou CSV. 
                Os lotes serão associados ao loteamento selecionado.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Arquivo (JSON ou CSV)</Label>
              <Input
                type="file"
                accept=".json,.csv"
                onChange={(e) => setArquivo(e.target.files[0])}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleImportar} 
                disabled={!arquivo || importando}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importando ? "Importando..." : "Importar Lotes"}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>

            {resultado && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">Resultado da Importação:</p>
                <p className="text-green-600">✓ {resultado.sucesso} lotes importados</p>
                {resultado.erro > 0 && (
                  <>
                    <p className="text-red-600">✗ {resultado.erro} erros</p>
                    <div className="max-h-40 overflow-y-auto">
                      {resultado.erros.map((erro, idx) => (
                        <p key={idx} className="text-sm text-red-600">• {erro}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <p className="font-semibold mb-2">Formato JSON esperado:</p>
              <pre className="text-xs overflow-x-auto">
{`[
  {
    "numero": "001",
    "quadra": "A",
    "area": 250,
    "valor_total": 150000,
    "status": "disponivel",
    "coordenadas_mapa": [[x1,y1], [x2,y2], ...]
  }
]`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="exportar" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Exporte todos os lotes do loteamento atual em formato JSON ou CSV.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <Button onClick={exportarJSON} variant="outline" className="h-24 flex-col">
                <FileJson className="w-8 h-8 mb-2" />
                <span>Exportar JSON</span>
                <span className="text-xs text-gray-500">Formato completo</span>
              </Button>

              <Button onClick={exportarCSV} variant="outline" className="h-24 flex-col">
                <FileSpreadsheet className="w-8 h-8 mb-2" />
                <span>Exportar CSV</span>
                <span className="text-xs text-gray-500">Para planilhas</span>
              </Button>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm">
              <p className="font-semibold mb-2">Dica:</p>
              <p>Use o formato JSON para fazer backup completo com todas as propriedades. 
              Use CSV para análise em planilhas.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}