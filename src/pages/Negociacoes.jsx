
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { addMonths } from "date-fns";

import NegociacoesList from "../components/negociacoes/NegociacoesList";
import NegociacaoForm from "../components/negociacoes/NegociacaoForm";
import GerarParcelasDialog from "../components/negociacoes/GerarParcelasDialog";

export default function Negociacoes() {
  const [showForm, setShowForm] = useState(false);
  const [showGerarDialog, setShowGerarDialog] = useState(false);
  const [selectedNegociacao, setSelectedNegociacao] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loteamentoFilter, setLoteamentoFilter] = useState("todos");
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['negociacoes'],
    queryFn: () => base44.entities.Negociacao.list('-created_date'),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => base44.entities.Unidade.list(),
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
  });

  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['imobiliarias'],
    queryFn: () => base44.entities.Imobiliaria.list(),
  });

  const { data: corretores = [] } = useQuery({
    queryKey: ['corretores'],
    queryFn: () => base44.entities.Corretor.list(),
  });

  // Verificar se veio redirecionamento do cadastro de cliente
  useEffect(() => {
    // Só executar se os dados já foram carregados
    if (!clientes || clientes.length === 0 || !unidades || unidades.length === 0) return;

    const urlParams = new URLSearchParams(location.search);
    const clienteId = urlParams.get('cliente_id');
    const unidadeId = urlParams.get('unidade_id');
    const novo = urlParams.get('novo');

    if (novo === 'true' && clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      const unidade = unidadeId ? unidades.find(u => u.id === unidadeId) : null;

      if (cliente) {
        // Pré-preencher formulário com dados do cliente
        setEditingItem({
          cliente_id: clienteId,
          unidade_id: unidadeId || "",
          valor_total: unidade?.valor_venda || 0,
          percentual_entrada: 0,
          valor_entrada: 0,
          quantidade_parcelas_entrada: 1,
          quantidade_parcelas_mensais: 0,
          valor_parcela_mensal: 0,
          percentual_mensal: 0,
          data_inicio: new Date().toISOString().split('T')[0],
          dia_vencimento: 10,
          tipo_correcao: "nenhuma",
          percentual_correcao: 0,
          tabela_correcao: "nenhuma",
          mes_correcao_anual: 1,
          status: "ativa",
          observacoes: `Negociação para ${cliente.nome}`,
        });
        setShowForm(true);

        // Limpar parâmetros da URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, clientes, unidades, navigate, location.pathname]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      try {
        // 1. Criar a negociação
        const negociacao = await base44.entities.Negociacao.create(data);

        // 2. Atualizar a unidade para status 'vendida' e vincular ao cliente
        if (data.unidade_id && data.cliente_id) {
          await base44.entities.Unidade.update(data.unidade_id, {
            status: 'vendida',
            cliente_id: data.cliente_id,
            data_venda: data.data_inicio,
          });
        }

        // 3. Gerar pagamentos de comissão se houver
        const pagamentosComissao = [];

        // Comissão da Imobiliária
        if (data.imobiliaria_id && data.comissao_imobiliaria_valor > 0) {
          const imobiliaria = imobiliarias.find(i => i.id === data.imobiliaria_id);
          
          // Criar fornecedor para a imobiliária se não existir
          let fornecedorImob = await base44.entities.Fornecedor.filter({ 
            cnpj: imobiliaria.cnpj 
          });
          
          if (!fornecedorImob || fornecedorImob.length === 0) {
            fornecedorImob = await base44.entities.Fornecedor.create({
              nome: imobiliaria.nome,
              cnpj: imobiliaria.cnpj,
              razao_social: imobiliaria.razao_social,
              telefone: imobiliaria.telefone,
              email: imobiliaria.email,
              endereco: imobiliaria.endereco,
              cidade: imobiliaria.cidade,
              estado: imobiliaria.estado,
              cep: imobiliaria.cep,
              tipo_servico: "Comissão Imobiliária",
              ativo: true,
            });
          } else {
            fornecedorImob = fornecedorImob[0];
          }

          // Criar pagamento de comissão
          const dataVencimento = addMonths(new Date(data.data_inicio), 1).toISOString().split('T')[0];
          
          pagamentosComissao.push(
            base44.entities.PagamentoFornecedor.create({
              fornecedor_id: fornecedorImob.id,
              unidade_id: data.unidade_id,
              negociacao_id: negociacao.id,
              tipo: "comissao_imobiliaria",
              valor: data.comissao_imobiliaria_valor,
              data_vencimento: dataVencimento,
              status: "pendente",
              descricao: `Comissão de venda - ${imobiliaria.nome}`,
            })
          );
        }

        // Comissão do Corretor
        if (data.corretor_id && data.comissao_corretor_valor > 0) {
          const corretor = corretores.find(c => c.id === data.corretor_id);
          
          // Criar fornecedor para o corretor se não existir
          let fornecedorCorr = await base44.entities.Fornecedor.filter({ 
            cnpj: corretor.cpf 
          });
          
          if (!fornecedorCorr || fornecedorCorr.length === 0) {
            fornecedorCorr = await base44.entities.Fornecedor.create({
              nome: corretor.nome,
              cnpj: corretor.cpf,
              telefone: corretor.telefone,
              email: corretor.email,
              endereco: corretor.endereco,
              cidade: corretor.cidade,
              estado: corretor.estado,
              cep: corretor.cep,
              tipo_servico: "Comissão Corretor",
              ativo: true,
            });
          } else {
            fornecedorCorr = fornecedorCorr[0];
          }

          // Criar pagamento de comissão
          const dataVencimento = addMonths(new Date(data.data_inicio), 1).toISOString().split('T')[0];
          
          pagamentosComissao.push(
            base44.entities.PagamentoFornecedor.create({
              fornecedor_id: fornecedorCorr.id,
              unidade_id: data.unidade_id,
              negociacao_id: negociacao.id,
              tipo: "comissao_corretor",
              valor: data.comissao_corretor_valor,
              data_vencimento: dataVencimento,
              status: "pendente",
              descricao: `Comissão de venda - ${corretor.nome}`,
            })
          );
        }

        // Executar criação de pagamentos de comissão
        if (pagamentosComissao.length > 0) {
          await Promise.all(pagamentosComissao);
          
          // Atualizar flag de comissão gerada
          await base44.entities.Negociacao.update(negociacao.id, {
            ...data, // Include all existing data to preserve other fields
            comissao_gerada: true,
          });
        }

        return negociacao;
      } catch (error) {
        console.error("Erro ao criar negociação:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentosFornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("✅ Negociação criada! Unidade vendida e vinculada ao cliente.");
    },
    onError: (error) => {
      toast.error("Erro ao criar negociação: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Buscar negociação atual para comparar mudanças
      const negociacaoAtual = items.find(n => n.id === id);
      
      // Atualizar negociação
      await base44.entities.Negociacao.update(id, data);
      
      // Se mudou status para 'concluida', atualizar unidade
      if (data.status === 'concluida' && data.unidade_id) {
        await base44.entities.Unidade.update(data.unidade_id, {
          status: 'escriturada',
        });
      }
      
      // Se mudou status para 'cancelada', liberar a unidade
      if (data.status === 'cancelada' && data.unidade_id) {
        await base44.entities.Unidade.update(data.unidade_id, {
          status: 'disponivel',
          cliente_id: null,
        });
      }

      // Se está sendo editada e mudou a unidade, atualizar vínculos
      if (data.unidade_id && negociacaoAtual?.unidade_id !== data.unidade_id) {
        // Liberar unidade antiga se houver
        if (negociacaoAtual?.unidade_id) {
          await base44.entities.Unidade.update(negociacaoAtual.unidade_id, {
            status: 'disponivel',
            cliente_id: null,
          });
        }
        
        // Vincular nova unidade
        await base44.entities.Unidade.update(data.unidade_id, {
          status: 'vendida',
          cliente_id: data.cliente_id,
          data_venda: data.data_inicio,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowForm(false);
      setEditingItem(null);
      toast.success("✅ Negociação atualizada! Unidade sincronizada.");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar negociação: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Negociacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success("Negociação excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir negociação: " + error.message);
    },
  });

  const filteredItems = items.filter(item => {
    if (!clientes || !unidades || !loteamentos) return false;
    
    const cliente = clientes.find(c => c.id === item.cliente_id);
    const unidade = unidades.find(u => u.id === item.unidade_id);
    const loteamento = unidade ? loteamentos.find(l => l.id === unidade.loteamento_id) : null;
    
    const matchesSearch = 
      cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade?.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLoteamento = loteamentoFilter === "todos" || unidade?.loteamento_id === loteamentoFilter;
    
    return matchesSearch && matchesLoteamento;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--wine-700)]">Negociações</h1>
          <p className="text-gray-600 mt-1">Gerencie as negociações com clientes</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] hover:opacity-90 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Negociação
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar negociações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={loteamentoFilter} onValueChange={setLoteamentoFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por loteamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Loteamentos</SelectItem>
            {loteamentos && loteamentos.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <NegociacaoForm
          item={editingItem}
          clientes={clientes || []}
          unidades={unidades || []}
          loteamentos={loteamentos || []}
          onSubmit={(data) => {
            if (editingItem && editingItem.id) {
              updateMutation.mutate({ id: editingItem.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          isProcessing={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showGerarDialog && selectedNegociacao && (
        <GerarParcelasDialog
          negociacao={selectedNegociacao}
          cliente={clientes?.find(c => c.id === selectedNegociacao.cliente_id)}
          unidade={unidades?.find(u => u.id === selectedNegociacao.unidade_id)}
          onClose={() => {
            setShowGerarDialog(false);
            setSelectedNegociacao(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
            queryClient.invalidateQueries({ queryKey: ['pagamentosClientes'] });
            setShowGerarDialog(false);
            setSelectedNegociacao(null);
          }}
        />
      )}

      <NegociacoesList
        items={filteredItems}
        clientes={clientes || []}
        unidades={unidades || []}
        loteamentos={loteamentos || []}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item);
          setShowForm(true);
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        onGerarParcelas={(item) => {
          setSelectedNegociacao(item);
          setShowGerarDialog(true);
        }}
      />
    </div>
  );
}
