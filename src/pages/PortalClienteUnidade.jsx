import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, MapPin, Ruler, Bed, Car, Bath, Calendar, AlertCircle, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors = {
  disponivel: "bg-green-100 text-green-700",
  reservada: "bg-yellow-100 text-yellow-700",
  vendida: "bg-blue-100 text-blue-700",
  escriturada: "bg-purple-100 text-purple-700",
  em_construcao: "bg-orange-100 text-orange-700",
};

const statusLabels = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  escriturada: "Escriturada",
  em_construcao: "Em Construção",
};

const tipoLabels = {
  apartamento: "Apartamento",
  casa: "Casa",
  lote: "Lote",
  sala_comercial: "Sala Comercial",
  terreno: "Terreno",
  outros: "Outros",
};

export default function PortalClienteUnidade() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: cliente, isLoading: clienteLoading } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidades = [], isLoading: loadingUnidades } = useQuery({
    queryKey: ['minhasUnidades', cliente?.id],
    queryFn: () => base44.entities.Unidade.filter({ cliente_id: cliente.id }),
    enabled: !!cliente?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: loteamentos = [] } = useQuery({
    queryKey: ['loteamentos'],
    queryFn: () => base44.entities.Loteamento.list(),
    staleTime: 1000 * 60 * 5,
  });

  if (clienteLoading || loadingUnidades) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--wine-600)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suas unidades...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <p className="text-gray-600 font-semibold mb-2">Cliente não encontrado</p>
        <p className="text-sm text-gray-500">Contate o administrador</p>
      </div>
    );
  }

  if (unidades.length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600 font-semibold mb-2">Nenhuma unidade vinculada</p>
        <p className="text-sm text-gray-500">
          Seu cadastro ainda não possui unidades vinculadas. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  const getLoteamento = (loteamentoId) => {
    return loteamentos.find(l => l.id === loteamentoId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[var(--wine-600)] to-[var(--grape-600)] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {unidades.length === 1 ? 'Minha Unidade' : 'Minhas Unidades'}
            </h1>
            <p className="text-white/90 mt-1">
              {unidades.length} {unidades.length === 1 ? 'unidade' : 'unidades'} vinculada{unidades.length !== 1 && 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {unidades.map((unidade) => {
          const loteamento = getLoteamento(unidade.loteamento_id);
          
          return (
            <Card key={unidade.id} className="shadow-xl border-t-4 border-[var(--wine-600)]">
              <CardHeader className="bg-gradient-to-r from-[var(--wine-50)] to-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 bg-[var(--wine-600)] rounded-xl text-white">
                      <Home className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-[var(--wine-700)]">{unidade.codigo}</h2>
                      <p className="text-sm text-gray-600">{tipoLabels[unidade.tipo]}</p>
                    </div>
                  </CardTitle>
                  <Badge className={statusColors[unidade.status] + " text-sm py-2 px-4"}>
                    {statusLabels[unidade.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Ruler className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Área Total</p>
                      <p className="text-2xl font-bold text-gray-900">{unidade.area_total} m²</p>
                    </div>
                  </div>

                  {unidade.area_construida && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Ruler className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Área Construída</p>
                        <p className="text-2xl font-bold text-gray-900">{unidade.area_construida} m²</p>
                      </div>
                    </div>
                  )}

                  {unidade.quartos > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bed className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quartos</p>
                        <p className="text-2xl font-bold text-gray-900">{unidade.quartos}</p>
                      </div>
                    </div>
                  )}

                  {unidade.banheiros > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Bath className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Banheiros</p>
                        <p className="text-2xl font-bold text-gray-900">{unidade.banheiros}</p>
                      </div>
                    </div>
                  )}

                  {unidade.vagas_garagem > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Car className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vagas de Garagem</p>
                        <p className="text-2xl font-bold text-gray-900">{unidade.vagas_garagem}</p>
                      </div>
                    </div>
                  )}

                  {unidade.andar && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Home className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Andar</p>
                        <p className="text-2xl font-bold text-gray-900">{unidade.andar}º</p>
                      </div>
                    </div>
                  )}
                </div>

                {loteamento && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-[var(--wine-600)]" />
                      <h3 className="font-bold text-gray-900">Loteamento</h3>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">{loteamento.nome}</p>
                    {loteamento.descricao && (
                      <p className="text-sm text-gray-600 mb-3">{loteamento.descricao}</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {loteamento.endereco && (
                        <div>
                          <p className="text-gray-600">Endereço</p>
                          <p className="font-semibold text-gray-900">{loteamento.endereco}</p>
                        </div>
                      )}
                      {loteamento.cidade && loteamento.estado && (
                        <div>
                          <p className="text-gray-600">Cidade/Estado</p>
                          <p className="font-semibold text-gray-900">{loteamento.cidade} - {loteamento.estado}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {unidade.data_inicio_obra && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-900 font-semibold">Início da Obra</p>
                      </div>
                      <p className="text-xl font-bold text-blue-700">
                        {format(parseISO(unidade.data_inicio_obra), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}

                  {unidade.data_prevista_conclusao && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-900 font-semibold">Previsão de Entrega</p>
                      </div>
                      <p className="text-xl font-bold text-green-700">
                        {format(parseISO(unidade.data_prevista_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>

                {unidade.observacoes && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">Observações</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{unidade.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <style>{`
        :root {
          --wine-600: #922B3E;
          --wine-700: #7C2D3E;
          --wine-50: #FBF1F3;
          --grape-600: #7D5999;
        }
      `}</style>
    </div>
  );
}