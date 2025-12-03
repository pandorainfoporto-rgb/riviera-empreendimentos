import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: FileText },
  aguardando_projeto: { label: "Aguardando Projeto", color: "bg-blue-100 text-blue-800", icon: Clock },
  aguardando_reuniao: { label: "Aguardando Reunião", color: "bg-purple-100 text-purple-800", icon: Calendar },
  alteracao_projeto: { label: "Alteração de Projeto", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const padraoLabels = {
  economico: "Econômico",
  medio_baixo: "Médio Baixo",
  medio: "Médio",
  medio_alto: "Médio Alto",
  alto: "Alto Padrão",
  luxo: "Luxo",
};

export default function IntencaoCompraList({
  intencoes = [],
  clientes = [],
  loteamentos = [],
  onEdit,
  onDelete,
  onView,
  onUploadProjeto,
  onAlterarStatus,
  onGerarCustoObra,
}) {
  const getCliente = (id) => clientes.find(c => c.id === id);
  const getLoteamento = (id) => loteamentos.find(l => l.id === id);

  const formatCurrency = (value) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (intencoes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Nenhuma intenção de compra encontrada.</p>
        <p className="text-sm text-gray-500 mt-1">Crie uma nova intenção de compra para começar.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Loteamento</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intencoes.map((intencao) => {
              const cliente = getCliente(intencao.cliente_id);
              const loteamento = getLoteamento(intencao.loteamento_id);
              const status = statusConfig[intencao.status] || statusConfig.rascunho;
              const StatusIcon = status.icon;

              return (
                <TableRow key={intencao.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-semibold">{cliente?.nome || "Cliente não encontrado"}</p>
                      <p className="text-xs text-gray-500">{cliente?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {loteamento?.nome || <span className="text-gray-400">Não definido</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {padraoLabels[intencao.padrao_imovel] || intencao.padrao_imovel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {intencao.orcamento_minimo || intencao.orcamento_maximo ? (
                        <>
                          <span>{formatCurrency(intencao.orcamento_minimo)}</span>
                          {intencao.orcamento_maximo && (
                            <span className="text-gray-400"> - {formatCurrency(intencao.orcamento_maximo)}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">Não definido</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(intencao.created_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(intencao)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(intencao)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {intencao.status === "rascunho" && (
                          <DropdownMenuItem onClick={() => onAlterarStatus(intencao, "aguardando_projeto")}>
                            <Clock className="w-4 h-4 mr-2" />
                            Enviar para Projeto
                          </DropdownMenuItem>
                        )}
                        
                        {intencao.status === "aguardando_projeto" && (
                          <DropdownMenuItem onClick={() => onUploadProjeto(intencao)}>
                            <FileUp className="w-4 h-4 mr-2" />
                            Upload Projeto
                          </DropdownMenuItem>
                        )}
                        
                        {intencao.status === "aguardando_reuniao" && (
                          <>
                            <DropdownMenuItem onClick={() => onAlterarStatus(intencao, "aprovado")}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Aprovar Projeto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAlterarStatus(intencao, "alteracao_projeto")}>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Solicitar Alteração
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {intencao.status === "alteracao_projeto" && (
                          <DropdownMenuItem onClick={() => onUploadProjeto(intencao)}>
                            <FileUp className="w-4 h-4 mr-2" />
                            Upload Nova Versão
                          </DropdownMenuItem>
                        )}
                        
                        {intencao.status === "aprovado" && !intencao.custo_obra_id && (
                          <DropdownMenuItem onClick={() => onGerarCustoObra(intencao)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Gerar Custo de Obra
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(intencao.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}