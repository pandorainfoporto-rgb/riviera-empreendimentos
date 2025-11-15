import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Printer, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ContratoGeradoDialog({ open, onClose, documentoId, numeroDocumento, conteudo, negociacao, cliente, unidade }) {
  const [imprimindo, setImprimindo] = useState(false);

  const imprimirContrato = () => {
    setImprimindo(true);
    
    // Criar uma janela de impressão com o conteúdo do contrato
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato - ${numeroDocumento}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${conteudo}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      setImprimindo(false);
    }, 500);
  };

  const baixarPDF = () => {
    // Criar blob com o HTML e fazer download
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Contrato - ${numeroDocumento}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${conteudo}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${numeroDocumento}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                Contrato Gerado com Sucesso!
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Número do Documento: <span className="font-mono font-bold">{numeroDocumento}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Informações da Negociação */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Cliente</p>
              <p className="font-semibold text-gray-900">{cliente?.nome}</p>
            </div>
            <div>
              <p className="text-gray-600">Unidade</p>
              <p className="font-semibold text-gray-900">{unidade?.codigo}</p>
            </div>
            <div>
              <p className="text-gray-600">Valor Total</p>
              <p className="font-bold text-green-700">
                R$ {(negociacao?.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-yellow-500 text-white">Aguardando Assinatura</Badge>
            <Badge className="bg-blue-100 text-blue-800">Unidade Reservada</Badge>
          </div>
        </div>

        {/* Preview do Contrato */}
        <div className="flex-1 overflow-hidden border-2 border-gray-200 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Visualização do Contrato
            </p>
          </div>
          <div 
            className="overflow-y-auto p-6 bg-white" 
            style={{ height: 'calc(90vh - 400px)' }}
            dangerouslySetInnerHTML={{ __html: conteudo }}
          />
        </div>

        {/* Ações */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>✅ Contrato salvo com sucesso</p>
            <p>✅ Negociação atualizada para "Aguardando Assinatura"</p>
            <p>✅ Unidade marcada como "Reservada"</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={baixarPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar HTML
            </Button>
            <Button
              onClick={imprimirContrato}
              disabled={imprimindo}
              className="gap-2 bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)]"
            >
              <Printer className="w-4 h-4" />
              {imprimindo ? 'Preparando...' : 'Imprimir'}
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}