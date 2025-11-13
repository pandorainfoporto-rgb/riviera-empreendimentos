import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, MapPin, Ruler, Bed, Car, Bath, Calendar, AlertCircle } from "lucide-react";
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

  const { data: cliente } = useQuery({
    queryKey: ['meuCliente', user?.cliente_id],
    queryFn: async () => {
      const clientes = await base44.entities.Cliente.list();
      return clientes.find(c => c.id === user.cliente_id) || null;
    },
    enabled: !!user?.cliente_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidade } = useQuery({
    queryKey: ['unidadeCliente', cliente?.unidade_id],
    queryFn: async () => {
      const unidades = await base44.entities.Unidade.list();
      return unidades.find(u => u.id === cliente?.unidade_id) || null;
    },
    enabled: !!cliente?.unidade_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: loteamento } = useQuery({
    queryKey: ['loteamentoUnidade', unidade?.loteamento_id],
    queryFn: async () => {
      const loteamentos = await base44.entities.Loteamento.list();
      return loteamentos.find(l => l.id === unidade?.loteamento_id) || null;
    },
    enabled: !!unidade?.loteamento_id,
    staleTime: 1000 * 60 * 5,
  });

  if (!unidade) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600">Nenhuma unidade vinculada ao seu cadastro</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--wine-700)]">Minha Unidade</h1>
        <p className="text-gray-600 mt-1">Informações completas sobre sua unidade</p>
      </div>

      <Card className="shadow-xl border-t-4 border-[var(--wine-600)]">
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
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {loteamento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--wine-600)]" />
              Loteamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{loteamento.nome}</h3>
            {loteamento.descricao && (
              <p className="text-gray-600 mb-4">{loteamento.descricao}</p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {loteamento.endereco && (
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-semibold text-gray-900">{loteamento.endereco}</p>
                </div>
              )}
              {loteamento.cidade && loteamento.estado && (
                <div>
                  <p className="text-sm text-gray-600">Cidade/Estado</p>
                  <p className="font-semibold text-gray-900">{loteamento.cidade} - {loteamento.estado}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {unidade.data_inicio_obra && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--wine-600)]" />
                Início da Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--wine-700)]">
                {format(parseISO(unidade.data_inicio_obra), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        )}

        {unidade.data_prevista_conclusao && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--wine-600)]" />
                Previsão de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--wine-700)]">
                {format(parseISO(unidade.data_prevista_conclusao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {unidade.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{unidade.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}