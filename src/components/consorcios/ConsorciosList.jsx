import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, Trash2, Award, Calendar, TrendingUp, 
  ArrowRightLeft, PiggyBank, FileText, CheckCircle2 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConsorciosList({ items, clientes, unidades, isLoading, onEdit, onDelete, onTransferir, onDocumentos }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
        <p className="text-gray-600 mt-4">Carregando...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Nenhum consórcio cadastrado</p>
          <p className="text-gray-500 text-sm mt-2">Clique em "Novo Consórcio" para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {items.map((item) => {
        const cliente = clientes.find(c => c.id === item.cliente_id);
        const unidade = unidades.find(u => u.id === item.unidade_id);
        const parcelasPagas = item.parcelas_pagas || 0;
        const parcelasTotal = item.parcelas_total || 0;
        const percentualPago = parcelasTotal > 0 ? (parcelasPagas / parcelasTotal) * 100 : 0;
        
        const totalDocumentos = 
          (item.documentos_adesao?.length || 0) +
          (item.documentos_contemplacao?.length || 0) +
          (item.documentos_alienacao?.length || 0);

        return (
          <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-[var(--grape-600)]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Coluna Esquerda - Informações Principais */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[var(--wine-700)]">
                          Grupo {item.grupo} - Cota {item.cota}
                        </h3>
                        {item.eh_investimento_caixa && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                            <PiggyBank className="w-3 h-3 mr-1" />
                            Investimento Caixa
                          </Badge>
                        )}
                        {item.contemplado && (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <Award className="w-3 h-3 mr-1" />
                            Contemplado
                          </Badge>
                        )}
                      </div>
                      
                      {!item.eh_investimento_caixa && (
                        <div className="space-y-1">
                          {cliente && (
                            <p className="text-gray-700">
                              <span className="font-semibold">Cliente:</span> {cliente.nome}
                            </p>
                          )}
                          {unidade && (
                            <p className="text-gray-600 text-sm">
                              <span className="font-semibold">Unidade:</span> {unidade.codigo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Valor da Carta</p>
                      <p className="text-2xl font-bold text-[var(--wine-700)]">
                        R$ {item.valor_carta?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {parcelasPagas} de {parcelasTotal} parcelas pagas
                      </span>
                      <span className="font-semibold text-[var(--wine-700)]">
                        {percentualPago.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] h-full rounded-full transition-all"
                        style={{ width: `${percentualPago}%` }}
                      />
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Valor Parcela</p>
                      <p className="font-semibold text-gray-900">
                        R$ {item.valor_parcela?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dia Assembleia</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Dia {item.dia_assembleia}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Data Início</p>
                      <p className="font-semibold text-gray-900">
                        {item.data_inicio ? format(new Date(item.data_inicio), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Contemplação */}
                  {item.contemplado && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-900">Contemplado por {item.tipo_contemplacao}</p>
                      </div>
                      {item.tipo_contemplacao === 'lance' && (
                        <p className="text-sm text-green-700">
                          Lance de {item.percentual_lance}% - Valor: R$ {item.valor_lance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {item.data_contemplacao && (
                        <p className="text-sm text-green-700">
                          Data: {format(new Date(item.data_contemplacao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Badge de Documentos */}
                  {totalDocumentos > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">
                        {totalDocumentos} documento{totalDocumentos > 1 ? 's' : ''} anexado{totalDocumentos > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coluna Direita - Ações */}
                <div className="flex flex-col gap-2 lg:w-48">
                  <Button
                    variant="outline"
                    onClick={() => onDocumentos(item)}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Documentos
                    {totalDocumentos > 0 && (
                      <Badge className="ml-2 bg-blue-500 text-white">
                        {totalDocumentos}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onTransferir(item)}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Transferir
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onEdit(item)}
                    className="w-full border-[var(--wine-300)] text-[var(--wine-700)] hover:bg-[var(--wine-50)]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm("Deseja excluir este consórcio?")) {
                        onDelete(item.id);
                      }
                    }}
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}