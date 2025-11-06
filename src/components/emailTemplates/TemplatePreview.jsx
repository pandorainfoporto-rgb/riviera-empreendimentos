import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Send, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TemplatePreview({ template, onClose, onEdit }) {
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [modoVisualizacao, setModoVisualizacao] = useState("preview"); // preview ou html

  const processarTemplate = () => {
    let conteudo = template.conteudo_html;
    
    // Substituir placeholders
    Object.entries(placeholderValues).forEach(([chave, valor]) => {
      conteudo = conteudo.replaceAll(chave, valor || chave);
    });

    return conteudo;
  };

  const conteudoProcessado = processarTemplate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-[var(--wine-700)]">Preview: {template.nome}</h2>
            <p className="text-sm text-gray-600">{template.codigo}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Placeholders */}
          {template.placeholders_disponiveis && template.placeholders_disponiveis.length > 0 && (
            <div className="w-80 border-r p-4 overflow-y-auto bg-gray-50">
              <h3 className="font-semibold mb-4 text-[var(--wine-700)]">Testar Placeholders</h3>
              <p className="text-xs text-gray-600 mb-4">
                Preencha os valores para ver como o email ficará
              </p>
              <div className="space-y-3">
                {template.placeholders_disponiveis.map((ph, i) => (
                  <div key={i}>
                    <Label className="text-xs">
                      <code className="font-mono">{ph.chave}</code>
                      {ph.obrigatorio && <span className="text-red-600 ml-1">*</span>}
                    </Label>
                    <p className="text-xs text-gray-500 mb-1">{ph.descricao}</p>
                    <Input
                      type={ph.tipo === 'numero' ? 'number' : ph.tipo === 'data' ? 'date' : 'text'}
                      value={placeholderValues[ph.chave] || ''}
                      onChange={(e) => setPlaceholderValues({
                        ...placeholderValues,
                        [ph.chave]: e.target.value
                      })}
                      placeholder={`Ex: ${ph.tipo === 'moeda' ? 'R$ 1.000,00' : ph.tipo === 'data' ? '01/01/2024' : 'valor...'}`}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Preview Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={modoVisualizacao} onValueChange={setModoVisualizacao}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">
                    <Code className="w-4 h-4 mr-2" />
                    HTML
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="mt-0">
                <Card>
                  <CardHeader className="bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">De:</Badge>
                        <span className="text-sm">
                          {template.configuracoes?.remetente_nome} 
                          &lt;{template.configuracoes?.remetente_email}&gt;
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Assunto:</Badge>
                        <span className="text-sm font-semibold">{template.assunto}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: conteudoProcessado }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{conteudoProcessado}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}