import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Zap, Edit, Trash2, Receipt, DollarSign, FileText, 
  Calendar, Search, Package, Loader2, Code
} from "lucide-react";
import { toast } from "sonner";

const iconesDisponiveis = {
  Receipt: Receipt,
  DollarSign: DollarSign,
  FileText: FileText,
  Calendar: Calendar,
  Search: Search,
  Package: Package,
  Zap: Zap,
};

const coresDisponiveis = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-green-100 text-green-800 border-green-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default function FuncoesChat() {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [funcaoEditando, setFuncaoEditando] = useState(null);
  const [busca, setBusca] = useState("");
  
  const [novaFuncao, setNovaFuncao] = useState({
    atalho: "",
    titulo: "",
    descricao: "",
    tipo_funcao: "personalizada",
    backend_function: "",
    icone: "Zap",
    cor: "blue",
    categoria: "outros",
    requer_selecao_titulo: false,
    ativo: true,
    variaveis_disponiveis: []
  });

  const queryClient = useQueryClient();

  const { data: funcoes = [], isLoading } = useQuery({
    queryKey: ['funcoes_chat'],
    queryFn: () => base44.entities.FuncaoChat.list('-created_date'),
  });

  const criarFuncaoMutation = useMutation({
    mutationFn: (dados) => base44.entities.FuncaoChat.create(dados),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes_chat']);
      toast.success("Função criada com sucesso!");
      setDialogAberto(false);
      resetarFormulario();
    },
    onError: () => toast.error("Erro ao criar função"),
  });

  const editarFuncaoMutation = useMutation({
    mutationFn: ({ id, dados }) => base44.entities.FuncaoChat.update(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes_chat']);
      toast.success("Função atualizada!");
      setDialogAberto(false);
      resetarFormulario();
    },
    onError: () => toast.error("Erro ao atualizar função"),
  });

  const deletarFuncaoMutation = useMutation({
    mutationFn: (id) => base44.entities.FuncaoChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['funcoes_chat']);
      toast.success("Função deletada!");
    },
    onError: () => toast.error("Erro ao deletar função"),
  });

  const resetarFormulario = () => {
    setNovaFuncao({
      atalho: "",
      titulo: "",
      descricao: "",
      tipo_funcao: "personalizada",
      backend_function: "",
      icone: "Zap",
      cor: "blue",
      categoria: "outros",
      requer_selecao_titulo: false,
      ativo: true,
      variaveis_disponiveis: []
    });
    setFuncaoEditando(null);
  };

  const handleEditar = (funcao) => {
    setFuncaoEditando(funcao);
    setNovaFuncao(funcao);
    setDialogAberto(true);
  };

  const handleSalvar = () => {
    if (!novaFuncao.atalho || !novaFuncao.titulo) {
      toast.error("Preencha atalho e título");
      return;
    }

    if (funcaoEditando) {
      editarFuncaoMutation.mutate({ id: funcaoEditando.id, dados: novaFuncao });
    } else {
      criarFuncaoMutation.mutate(novaFuncao);
    }
  };

  const funcoesFiltradas = funcoes.filter(f => 
    f.atalho.toLowerCase().includes(busca.toLowerCase()) ||
    f.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  const IconeComponent = iconesDisponiveis[novaFuncao.icone] || Zap;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              Funções do Chat
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie funções especiais ativadas com <strong>#</strong> no chat
            </p>
          </div>

          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetarFormulario}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Função
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {funcaoEditando ? "Editar Função" : "Nova Função"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Atalho</Label>
                    <Input
                      placeholder="Ex: boleto"
                      value={novaFuncao.atalho}
                      onChange={(e) => setNovaFuncao({...novaFuncao, atalho: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Digite #atalho no chat</p>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input
                      placeholder="Ex: Gerar Boleto"
                      value={novaFuncao.titulo}
                      onChange={(e) => setNovaFuncao({...novaFuncao, titulo: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o que a função faz..."
                    value={novaFuncao.descricao}
                    onChange={(e) => setNovaFuncao({...novaFuncao, descricao: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Função</Label>
                    <Select 
                      value={novaFuncao.tipo_funcao} 
                      onValueChange={(v) => setNovaFuncao({...novaFuncao, tipo_funcao: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gerar_boleto">Gerar Boleto</SelectItem>
                        <SelectItem value="gerar_pix">Gerar PIX</SelectItem>
                        <SelectItem value="gerar_protocolo">Gerar Protocolo</SelectItem>
                        <SelectItem value="enviar_contrato">Enviar Contrato</SelectItem>
                        <SelectItem value="enviar_nota">Enviar Nota Fiscal</SelectItem>
                        <SelectItem value="consultar_saldo">Consultar Saldo</SelectItem>
                        <SelectItem value="agendar_visita">Agendar Visita</SelectItem>
                        <SelectItem value="personalizada">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select 
                      value={novaFuncao.categoria} 
                      onValueChange={(v) => setNovaFuncao({...novaFuncao, categoria: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="documentacao">Documentação</SelectItem>
                        <SelectItem value="agendamento">Agendamento</SelectItem>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Função Backend</Label>
                  <Input
                    placeholder="Ex: gerarBoletoBolix"
                    value={novaFuncao.backend_function}
                    onChange={(e) => setNovaFuncao({...novaFuncao, backend_function: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Nome da função backend que será executada</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ícone</Label>
                    <Select 
                      value={novaFuncao.icone} 
                      onValueChange={(v) => setNovaFuncao({...novaFuncao, icone: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(iconesDisponiveis).map(icone => (
                          <SelectItem key={icone} value={icone}>{icone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cor</Label>
                    <Select 
                      value={novaFuncao.cor} 
                      onValueChange={(v) => setNovaFuncao({...novaFuncao, cor: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
                        <SelectItem value="yellow">Amarelo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <Switch
                    checked={novaFuncao.requer_selecao_titulo}
                    onCheckedChange={(v) => setNovaFuncao({...novaFuncao, requer_selecao_titulo: v})}
                  />
                  <Label>Requer seleção de título financeiro</Label>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <Switch
                    checked={novaFuncao.ativo}
                    onCheckedChange={(v) => setNovaFuncao({...novaFuncao, ativo: v})}
                  />
                  <Label>Função ativa</Label>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Variáveis Disponíveis do Sistema
                  </p>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p><code>{'{{conversa.cliente_id}}'}</code> - ID do cliente</p>
                    <p><code>{'{{conversa.lead_id}}'}</code> - ID do lead</p>
                    <p><code>{'{{conversa.canal_id}}'}</code> - ID do canal</p>
                    <p><code>{'{{cliente.nome}}'}</code> - Nome do cliente</p>
                    <p><code>{'{{cliente.email}}'}</code> - Email do cliente</p>
                    <p><code>{'{{user.full_name}}'}</code> - Nome do atendente</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogAberto(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSalvar} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={criarFuncaoMutation.isPending || editarFuncaoMutation.isPending}
                  >
                    {(criarFuncaoMutation.isPending || editarFuncaoMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      funcaoEditando ? "Atualizar" : "Criar Função"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar funções..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {funcoesFiltradas.map((funcao) => {
              const Icone = iconesDisponiveis[funcao.icone] || Zap;
              
              return (
                <Card key={funcao.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${coresDisponiveis[funcao.cor]}`}>
                          <Icone className="w-6 h-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gray-900 text-white font-mono">
                              #{funcao.atalho}
                            </Badge>
                            <h3 className="font-semibold text-lg">{funcao.titulo}</h3>
                            {!funcao.ativo && (
                              <Badge variant="outline" className="text-gray-500">Inativa</Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{funcao.descricao}</p>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{funcao.tipo_funcao.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline">{funcao.categoria}</Badge>
                            {funcao.backend_function && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {funcao.backend_function}
                              </Badge>
                            )}
                            {funcao.requer_selecao_titulo && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Seleção de Título
                              </Badge>
                            )}
                          </div>

                          {funcao.uso_contador > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Usada {funcao.uso_contador}x
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditar(funcao)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Deletar esta função?')) {
                              deletarFuncaoMutation.mutate(funcao.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {funcoesFiltradas.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma função cadastrada ainda</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}