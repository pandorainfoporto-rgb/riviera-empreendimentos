import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Copy, Upload, Trash2, Plus, FileText, Check } from "lucide-react";
import { toast } from "sonner";

export default function Tutoriais() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const queryClient = useQueryClient();

  const { data: tutoriais = [] } = useQuery({
    queryKey: ['tutoriais'],
    queryFn: () => base44.entities.Tutorial.list('ordem'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tutorial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutoriais']);
      setShowDialog(false);
      setEditingTutorial(null);
      toast.success("Tutorial criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tutorial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutoriais']);
      setShowDialog(false);
      setEditingTutorial(null);
      toast.success("Tutorial atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tutorial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutoriais']);
      toast.success("Tutorial removido!");
    },
  });

  const handleUploadVideo = async (tutorialId, file) => {
    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Tutorial.update(tutorialId, { video_url: file_url });
      queryClient.invalidateQueries(['tutoriais']);
      toast.success("Vídeo enviado!");
    } catch (error) {
      toast.error("Erro ao enviar vídeo");
    } finally {
      setUploadingVideo(false);
    }
  };

  const scriptsSugeridos = [
    {
      categoria: "visao-geral",
      titulo: "Visão Geral do Sistema Riviera",
      duracao: "5 min",
      script: `Olá! Bem-vindo ao Sistema Riviera, sua solução completa para gestão imobiliária.

Neste tutorial, vou apresentar as principais funcionalidades do sistema.

O Riviera é dividido em módulos principais: Gestão, onde você controla loteamentos, unidades, clientes e parceiros. Financeiro, com caixas, bancos, contas a pagar e receber. Operacional, para cronograma e execução de obras. E Relatórios, com análises detalhadas do seu negócio.

No menu lateral, você encontra tudo organizado por categoria. Use a barra de busca no topo para encontrar rapidamente qualquer funcionalidade.

O dashboard principal mostra os indicadores mais importantes: vendas do mês, pagamentos pendentes, obras em andamento e alertas do sistema.

Você pode personalizar sua visualização clicando no ícone de engrenagem. Escolha modo claro ou escuro, e configure suas notificações.

O Riviera integra-se com bancos para conciliação automática, gateways de pagamento, e oferece portais exclusivos para clientes, sócios e imobiliárias.

Explore o sistema com confiança. Estamos aqui para facilitar sua gestão imobiliária. Vamos começar!`
    },
    {
      categoria: "loteamentos",
      titulo: "Cadastrar seu Primeiro Loteamento",
      duracao: "6 min",
      script: `Vamos cadastrar seu primeiro loteamento no Riviera!

Acesse o menu Cadastros e clique em Loteamentos. Depois, clique no botão Novo Loteamento no canto superior direito.

O assistente te guiará em 4 etapas simples.

Primeira etapa: Dados Básicos. Preencha o nome do loteamento, descrição, área total e quantidade de lotes. Você também pode fazer upload de imagens para propaganda.

Segunda etapa: Localização. Informe o endereço completo. O sistema suporta busca de CEP automática. Você pode também marcar no mapa a localização exata.

Terceira etapa: Upload da Planta. Faça upload do arquivo DWG ou imagem da planta do loteamento. Isso será usado para mapear os lotes visualmente.

Quarta etapa: Mapeamento de Lotes. Aqui está o diferencial! Clique nos pontos da planta para delimitar cada lote. O sistema calcula automaticamente a área. Você pode editar número, quadra e valor de cada lote.

Após mapear todos os lotes, clique em Finalizar. Pronto! Seu loteamento está cadastrado e os lotes disponíveis para venda.

Dica importante: Você pode voltar a qualquer momento para editar o mapeamento ou adicionar novos lotes. Simples e eficiente!`
    },
    {
      categoria: "vendas",
      titulo: "Registrar uma Venda",
      duracao: "7 min",
      script: `Vamos registrar sua primeira venda no Riviera!

O processo de venda no Riviera segue 4 etapas: Intenção de Compra, Custo de Obra, Negociação e Finalização.

Primeiro, acesse Gestão e clique em Negociações. Depois em Nova Intenção de Compra.

Etapa 1: Selecione o cliente. Se ainda não cadastrou, clique em Novo Cliente e preencha os dados.

Etapa 2: Escolha o loteamento e o lote. Você pode visualizar o mapa e selecionar o lote disponível. O sistema mostra status, área e valor.

Etapa 3: Defina as características do imóvel desejado. Padrão de acabamento, quantidade de quartos, banheiros, e características especiais como piscina, área gourmet.

Etapa 4: O sistema pode gerar automaticamente o custo de obra baseado na sua preferência. Revise e ajuste se necessário.

Agora, vamos para a Negociação. Defina valor total, entrada, quantidade de parcelas e condições de pagamento. O sistema calcula automaticamente as parcelas.

Você pode aplicar correção monetária, escolher índices como IGPM ou IPCA, e definir data de vencimento.

Depois de revisar tudo, gere o contrato. O sistema cria automaticamente o documento com base no seu template. O cliente pode assinar digitalmente pelo portal.

Após assinatura, finalize a negociação. O sistema cria a unidade, gera as parcelas de pagamento e envia notificações automáticas.

Pronto! Venda registrada com sucesso. O financeiro já está alimentado automaticamente!`
    },
    {
      categoria: "financeiro",
      titulo: "Controle Financeiro Básico",
      duracao: "6 min",
      script: `Vamos dominar o controle financeiro no Riviera!

O módulo financeiro é dividido em: Receber, Pagar, Caixas, Bancos e Conciliação.

Começando por Receber: Aqui você visualiza todos os pagamentos de clientes. O sistema mostra status, valor, vencimento e pode enviar cobranças automáticas.

Quando um cliente paga, clique em Receber. Selecione o caixa ou banco de destino, confirme o valor e pronto! O sistema atualiza automaticamente todos os relatórios.

Agora Pagar: Registre todas as contas a pagar. Fornecedores, colaboradores, impostos. Você pode vincular ao centro de custo e obra específica.

Para efetuar um pagamento, clique em Pagar, selecione a conta de origem, e confirme. O sistema gera comprovante e registra a movimentação.

Os Caixas mostram saldo em tempo real. Você pode transferir valores entre caixas, registrar suprimentos e sangrias.

A Integração Bancária permite sincronizar extratos automaticamente. Configure uma vez e o sistema importa movimentações diariamente.

A Conciliação Bancária compara seus registros com o extrato do banco. O sistema identifica divergências e sugere conciliações automáticas.

Dica valiosa: Configure alertas de vencimento. O sistema notifica você e seus clientes sobre pagamentos próximos do vencimento.

Com o Riviera, seu financeiro fica organizado, automático e confiável!`
    },
    {
      categoria: "obras",
      titulo: "Gestão de Obras e Cronograma",
      duracao: "6 min",
      script: `Vamos gerenciar obras profissionalmente com o Riviera!

Acesse o módulo Operacional. Aqui você controla cronograma, execução, custos e compras.

Começando pelo Cronograma: Clique em Cronograma de Obra. Crie um novo cronograma vinculado à unidade em construção.

Adicione etapas da obra: Fundação, Estrutura, Alvenaria, Acabamento. Para cada etapa, defina duração, data início e fim previstas.

Você pode adicionar tarefas dentro de cada etapa. Por exemplo, na Fundação: Escavação, Ferragem, Concretagem. Defina responsáveis e dependências entre tarefas.

O sistema gera automaticamente um gráfico de Gantt visual. Você vê todo o cronograma de forma clara e pode ajustar datas arrastando as barras.

Agora a Execução: Aqui você registra o andamento real. Marque tarefas como concluídas, faça upload de fotos, e adicione observações.

O sistema compara planejado versus realizado. Identifica atrasos e envia alertas automáticos.

Custos de Obra: Registre todos os gastos por categoria: Material, Mão de Obra, Equipamentos. O sistema calcula custo total e compara com orçamento previsto.

Orçamentos de Compra: Peça cotações de fornecedores. O sistema compara preços e te ajuda a escolher a melhor opção.

Compras: Após aprovar um orçamento, gere a ordem de compra. Controle entregas, notas fiscais e pagamentos.

Tudo integrado! Os gastos de obra alimentam automaticamente o financeiro. Você tem controle total, transparência e eficiência na gestão de obras!`
    }
  ];

  const handleCopyScript = (script) => {
    navigator.clipboard.writeText(script);
    toast.success("Script copiado!");
  };

  const handleCreateFromSuggestion = (suggestion) => {
    setEditingTutorial({
      titulo: suggestion.titulo,
      categoria: suggestion.categoria,
      duracao: suggestion.duracao,
      script_base: suggestion.script,
      descricao: `Tutorial sobre ${suggestion.titulo.toLowerCase()}`,
      ordem: tutoriais.length
    });
    setShowDialog(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tutoriais em Vídeo</h1>
          <p className="text-gray-600 mt-1">Gerencie os tutoriais do sistema</p>
        </div>
        <Button onClick={() => { setEditingTutorial(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Tutorial
        </Button>
      </div>

      {/* Scripts Sugeridos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Scripts Base Sugeridos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Copie os scripts abaixo, produza o vídeo em plataforma externa e depois faça upload.
          </p>
          <div className="grid gap-4">
            {scriptsSugeridos.map((sugestao, idx) => (
              <Card key={idx} className="border-l-4 border-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{sugestao.titulo}</h3>
                        <Badge>{sugestao.categoria}</Badge>
                        <Badge variant="outline">{sugestao.duracao}</Badge>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                          {sugestao.script}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleCopyScript(sugestao.script)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Script
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCreateFromSuggestion(sugestao)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tutoriais Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            Tutoriais Cadastrados ({tutoriais.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tutoriais.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum tutorial cadastrado ainda</p>
          ) : (
            <div className="grid gap-4">
              {tutoriais.map((tutorial) => (
                <Card key={tutorial.id} className={tutorial.video_url ? 'border-green-200' : 'border-orange-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold">{tutorial.titulo}</h3>
                          <Badge>{tutorial.categoria}</Badge>
                          {tutorial.video_url ? (
                            <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" /> Vídeo OK</Badge>
                          ) : (
                            <Badge variant="outline">Sem vídeo</Badge>
                          )}
                          {tutorial.mostrar_primeiros_passos && (
                            <Badge className="bg-blue-600">Primeiros Passos</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{tutorial.descricao}</p>
                        {tutorial.video_url && (
                          <video controls className="w-full max-w-2xl rounded-lg mb-3">
                            <source src={tutorial.video_url} type="video/mp4" />
                          </video>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <label>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleUploadVideo(tutorial.id, e.target.files[0]);
                              }
                            }}
                            disabled={uploadingVideo}
                          />
                          <Button size="sm" asChild disabled={uploadingVideo}>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {tutorial.video_url ? 'Substituir Vídeo' : 'Upload Vídeo'}
                            </span>
                          </Button>
                        </label>
                        <Button size="sm" variant="outline" onClick={() => { setEditingTutorial(tutorial); setShowDialog(true); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          if (confirm("Remover tutorial?")) {
                            deleteMutation.mutate(tutorial.id);
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTutorial?.id ? 'Editar Tutorial' : 'Novo Tutorial'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
              titulo: formData.get('titulo'),
              categoria: formData.get('categoria'),
              descricao: formData.get('descricao'),
              duracao: formData.get('duracao'),
              script_base: formData.get('script_base'),
              ordem: parseInt(formData.get('ordem') || 0),
              mostrar_primeiros_passos: formData.get('mostrar_primeiros_passos') === 'on',
              ativo: true
            };
            if (editingTutorial?.id) {
              updateMutation.mutate({ id: editingTutorial.id, data });
            } else {
              createMutation.mutate(data);
            }
          }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input name="titulo" defaultValue={editingTutorial?.titulo} required />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select name="categoria" defaultValue={editingTutorial?.categoria || "outros"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visao-geral">Visão Geral</SelectItem>
                  <SelectItem value="loteamentos">Loteamentos</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="consorcios">Consórcios</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input name="descricao" defaultValue={editingTutorial?.descricao} />
            </div>
            <div>
              <label className="text-sm font-medium">Duração</label>
              <Input name="duracao" defaultValue={editingTutorial?.duracao} placeholder="Ex: 5 min" />
            </div>
            <div>
              <label className="text-sm font-medium">Script Base</label>
              <Textarea name="script_base" defaultValue={editingTutorial?.script_base} rows={10} />
            </div>
            <div>
              <label className="text-sm font-medium">Ordem</label>
              <Input type="number" name="ordem" defaultValue={editingTutorial?.ordem || 0} />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                name="mostrar_primeiros_passos" 
                id="mostrar_primeiros_passos"
                defaultChecked={editingTutorial?.mostrar_primeiros_passos || false}
                className="w-4 h-4"
              />
              <label htmlFor="mostrar_primeiros_passos" className="text-sm font-medium">
                Mostrar na página Primeiros Passos
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}