import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Clock, User, Monitor, FileText, 
  DollarSign, BarChart, LogIn, LogOut, Download,
  Eye, Calendar, Filter, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const acaoConfig = {
  login: { label: 'Login', icon: LogIn, color: 'bg-green-100 text-green-800' },
  logout: { label: 'Logout', icon: LogOut, color: 'bg-gray-100 text-gray-800' },
  visualizou_dashboard: { label: 'Visualizou Dashboard', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  visualizou_aportes: { label: 'Visualizou Aportes', icon: DollarSign, color: 'bg-yellow-100 text-yellow-800' },
  visualizou_atas: { label: 'Visualizou Atas', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  visualizou_relatorios: { label: 'Visualizou Relatórios', icon: BarChart, color: 'bg-indigo-100 text-indigo-800' },
  pagou_aporte: { label: 'Pagou Aporte', icon: DollarSign, color: 'bg-green-100 text-green-800' },
  download_documento: { label: 'Download Documento', icon: Download, color: 'bg-orange-100 text-orange-800' },
};

export default function LogsAcessoSocios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [acaoFilter, setAcaoFilter] = useState("todos");
  const [socioFilter, setSocioFilter] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logsAcessoSocios'],
    queryFn: () => base44.entities.LogAcessoSocio.list('-created_date', 500),
  });

  const { data: socios = [] } = useQuery({
    queryKey: ['socios'],
    queryFn: () => base44.entities.Socio.list(),
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.nome_socio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAcao = acaoFilter === "todos" || log.acao === acaoFilter;
    const matchesSocio = socioFilter === "todos" || log.socio_id === socioFilter;
    
    let matchesData = true;
    if (dataInicio) {
      matchesData = matchesData && log.data_hora >= dataInicio;
    }
    if (dataFim) {
      matchesData = matchesData && log.data_hora <= dataFim + 'T23:59:59';
    }

    return matchesSearch && matchesAcao && matchesSocio && matchesData;
  });

  // Estatísticas
  const totalLogins = logs.filter(l => l.acao === 'login').length;
  const sociosAtivos = new Set(logs.map(l => l.socio_id)).size;
  const ultimasHoras = logs.filter(l => {
    const logDate = new Date(l.data_hora);
    const agora = new Date();
    return (agora - logDate) < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Logs de Acesso - Sócios</h1>
          <p className="text-gray-600 mt-1">Monitore as atividades dos sócios no portal</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <LogIn className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Logins</p>
                <p className="text-2xl font-bold">{totalLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Sócios Ativos</p>
                <p className="text-2xl font-bold">{sociosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Atividades (24h)</p>
                <p className="text-2xl font-bold">{ultimasHoras}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={socioFilter} onValueChange={setSocioFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sócio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Sócios</SelectItem>
                {socios.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={acaoFilter} onValueChange={setAcaoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Ações</SelectItem>
                {Object.entries(acaoConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              placeholder="Data início"
            />

            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              placeholder="Data fim"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Registros de Atividade ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum registro encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const config = acaoConfig[log.acao] || { 
                  label: log.acao, 
                  icon: Eye, 
                  color: 'bg-gray-100 text-gray-800' 
                };
                const Icon = config.icon;

                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${config.color.replace('text-', 'bg-').replace('800', '100')}`}>
                      <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{log.nome_socio}</span>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{log.descricao}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.data_hora || log.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {log.email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.email}
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}