import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Share, FileText } from "lucide-react";

export default function VisualizarDocumentoDialog({ documento, open, onClose }) {
  if (!documento) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{documento.titulo}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{documento.numero_documento}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline">
                <Share className="w-4 h-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-white">
          <div 
            dangerouslySetInnerHTML={{ __html: documento.conteudo_atual }}
            className="prose max-w-none"
          />
        </div>

        {documento.assinaturas && documento.assinaturas.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Assinaturas</h4>
            <div className="space-y-2">
              {documento.assinaturas.map((assinatura, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>{assinatura.nome} ({assinatura.tipo})</span>
                  <Badge variant={assinatura.assinado ? "default" : "secondary"}>
                    {assinatura.assinado ? 'Assinado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}