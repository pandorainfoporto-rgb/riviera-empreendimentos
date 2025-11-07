import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, Search, Filter, Eye, Calendar, User, 
  FileText, AlertTriangle, Info, AlertCircle, Download
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LogsAuditoria() {
  const [filtroEntidade, setFiltroEntidade] = useState("todas");
  const [filtroAcao, setFiltroAcao] = useState("todas");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroSeveridade, setFiltroSeveridade] = useState("todas");
  const [logSelecionado, setLogSelecionado] = useState(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs_auditoria'],
    queryFn: () => base44.entities.LogAuditoria.list('-created_date', 500),
    enabled: user?.tipo_acesso === 'admin' || user?.role === 'admin',
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.tipo_acesso === 'admin' || user?.role === 'admin',
  });

  if (user?.tipo_acesso !== 'admin' && user?.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="border-red-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-700 mb-2">Acesso Restrito</h3>
            <p className="text-red-600">Apenas administradores podem acessar os logs de auditoria.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logsFiltrados = logs.filter(log => {
    const matchEntidade = filtroEntidade === "todas" || log.entidade === filtroEntidade;
    const matchAcao = filtroAcao === "todas" || log.acao === filtroAcao;
    const matchUsuario = !filtroUsuario || 
      log.usuario_email?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      log.usuario_nome?.toLowerCase().includes(filtroUsuario.toLowerCase());
    const matchSeveridade = filtroSeveridade === "todas" || log.severidade === filtroSeveridade;

    let matchData = true;
    if (dataInicio) {
      try {
        const logDate = parseISO(log.created_date);
        const startDate = parseISO(dataInicio);
        matchData = matchData && (logDate >= startDate);
      } catch {
        matchData = false;
      }
    }
    if (dataFim) {
      try {
        const logDate = parseISO(log.created_date);
        const endDate = parseISO(dataFim);
        endDate.setHours(23, 59, 59);
        matchData = matchData && (logDate <= endDate);
      } catch {
        matchData = false;
      }
    }

    return matchEntidade && matchAcao && matchUsuario && matchSeveridade && matchData;
  });

  const getAcaoLabel = (acao) => {
    const labels = {
      criar: 'Criar',
      atualizar: 'Atualizar',
      deletar: 'Deletar',
      login: 'Login',
      logout: 'Logout',
      acesso_negado: 'Acesso Negado',
      exportacao: 'Exportação',
      importacao: 'Importação',
    };
    return labels[acao] || acao;
  };

  const getAcaoColor = (acao) => {
    const colors = {
      criar: 'bg-green-100 text-green-700',
      atualizar: 'bg-blue-100 text-blue-700',
      deletar: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700',
      acesso_negado: 'bg-orange-100 text-orange-700',
      exportacao: 'bg-cyan-100 text-cyan-700',
      importacao: 'bg-indigo-100 text-indigo-700',
    };
    return colors[acao] || 'bg-gray-100 text-gray-700';
  };

  const getSeveridadeIcon = (severidade) => {
    if (severidade === 'critical') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (severidade === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const handleVerDetalhes = (log) => {
    setLogSelecionado(log);
    setMostrarDetalhes(true);
  };

  const handleExportar = () => {
    const csv = [
      ['Data/Hora', 'Usuário', 'Email', 'Entidade', 'Ação', 'Registro ID', 'Resumo', 'Severidade'].join(','),
      ...logsFiltrados.map(log => [
        format(parseISO(log.created_date), 'dd/MM/yyyy HH:mm:ss'),
        log.usuario_nome || '',
        log.usuario_email || '',
        log.entidade || '',
        getAcaoLabel(log.acao),
        log.registro_id || '',
        (log.resumo_mudancas || '').replace(/,/g, ';'),
        log.severidade || 'info'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-auditoria-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)] flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Logs de Auditoria
          </h1>
          <p className="text-gray-600 mt-1">Rastreamento completo de ações no sistema</p>
        </div>
        <Button
          onClick={handleExportar}
          variant="outline"
          disabled={logsFiltrados.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Total de Logs</p>
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Últimas 24h</p>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => {
                try {
                  const diff = new Date() - parseISO(l.created_date);
                  return diff < 24 * 60 * 60 * 1000;
                } catch {
                  return false;
                }
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Críticos</p>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.severidade === 'critical').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">Usuários Ativos</p>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(logs.map(l => l.usuario_email)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Entidade</Label>
              <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="PagamentoCliente">Pagamento Cliente</SelectItem>
                  <SelectItem value="PagamentoFornecedor">Pagamento Fornecedor</SelectItem>
                  <SelectItem value="User">Usuários</SelectItem>
                  <SelectItem value="Negociacao">Negociação</SelectItem>
                  <SelectItem value="Unidade">Unidade</SelectItem>
                  <SelectItem value="Consorcio">Consórcio</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="MovimentacaoCaixa">Movimentação Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ação</Label>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="criar">Criar</SelectItem>
                  <SelectItem value="atualizar">Atualizar</SelectItem>
                  <SelectItem value="deletar">Deletar</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="acesso_negado">Acesso Negado</SelectItem>
                  <SelectItem value="exportacao">Exportação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Severidade</Label>
              <Select value={filtroSeveridade} onValueChange={setFiltroSeveridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por usuário..."
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-600">
              Mostrando {logsFiltrados.length} de {logs.length} registros
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiltroEntidade("todas");
                setFiltroAcao("todas");
                setFiltroUsuario("");
                setDataInicio("");
                setDataFim("");
                setFiltroSeveridade("todas");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registros de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Resumo</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsFiltrados.map((log) => (
                    <TableRow key={log.id} className={log.severidade === 'critical' ? 'bg-red-50' : ''}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(parseISO(log.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(log.created_date), 'HH:mm:ss', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{log.usuario_nome}</p>
                            <p className="text-xs text-gray-500">{log.usuario_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entidade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAcaoColor(log.acao)}>
                          {getAcaoLabel(log.acao)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-700 truncate">
                          {log.resumo_mudancas || 'Sem detalhes'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getSeveridadeIcon(log.severidade)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalhes(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      {logSelecionado && (
        <Dialog open={mostrarDetalhes} onOpenChange={setMostrarDetalhes}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Detalhes do Log de Auditoria
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Data/Hora</Label>
                  <p className="font-medium">
                    {format(parseISO(logSelecionado.created_date), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Usuário</Label>
                  <p className="font-medium">{logSelecionado.usuario_nome}</p>
                  <p className="text-xs text-gray-500">{logSelecionado.usuario_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Entidade</Label>
                  <Badge variant="outline" className="mt-1">{logSelecionado.entidade}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Ação</Label>
                  <Badge className={getAcaoColor(logSelecionado.acao) + " mt-1"}>
                    {getAcaoLabel(logSelecionado.acao)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Registro ID</Label>
                  <p className="font-mono text-sm">{logSelecionado.registro_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Severidade</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getSeveridadeIcon(logSelecionado.severidade)}
                    <span className="capitalize">{logSelecionado.severidade}</span>
                  </div>
                </div>
              </div>

              {/* Resumo */}
              {logSelecionado.resumo_mudancas && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-sm font-semibold text-blue-900">Resumo</Label>
                  <p className="text-sm text-blue-800 mt-2">{logSelecionado.resumo_mudancas}</p>
                </div>
              )}

              {/* Campos Alterados */}
              {logSelecionado.campos_alterados && logSelecionado.campos_alterados.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Campos Alterados</Label>
                  <div className="space-y-2">
                    {logSelecionado.campos_alterados.map((campo, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <p className="font-semibold text-sm text-gray-900 mb-2">{campo.campo}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-gray-600">Anterior:</span>
                            <p className="text-red-600 font-mono break-all">
                              {campo.valor_anterior || '(vazio)'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Novo:</span>
                            <p className="text-green-600 font-mono break-all">
                              {campo.valor_novo || '(vazio)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados Completos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {logSelecionado.dados_anteriores && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Dados Anteriores</Label>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(logSelecionado.dados_anteriores, null, 2)}
                    </pre>
                  </div>
                )}
                {logSelecionado.dados_novos && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Dados Novos</Label>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(logSelecionado.dados_novos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Informações Técnicas */}
              <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                <Label className="text-sm font-semibold">Informações Técnicas</Label>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600">IP:</span>
                    <p className="font-mono">{logSelecionado.ip_address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo Usuário:</span>
                    <p className="capitalize">{logSelecionado.usuario_tipo}</p>
                  </div>
                  {logSelecionado.duracao_ms && (
                    <div>
                      <span className="text-gray-600">Duração:</span>
                      <p>{logSelecionado.duracao_ms}ms</p>
                    </div>
                  )}
                  {logSelecionado.user_agent && (
                    <div className="col-span-2">
                      <span className="text-gray-600">User Agent:</span>
                      <p className="font-mono truncate">{logSelecionado.user_agent}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contexto Adicional */}
              {logSelecionado.contexto_adicional && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Label className="text-sm font-semibold text-purple-900 mb-2 block">
                    Contexto Adicional
                  </Label>
                  <pre className="text-xs text-purple-800 whitespace-pre-wrap">
                    {JSON.stringify(logSelecionado.contexto_adicional, null, 2)}
                  </pre>
                </div>
              )}

              {/* Erro (se houver) */}
              {logSelecionado.erro_mensagem && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <Label className="text-sm font-semibold text-red-900">Erro</Label>
                  <p className="text-sm text-red-800 mt-2">{logSelecionado.erro_mensagem}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setMostrarDetalhes(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}