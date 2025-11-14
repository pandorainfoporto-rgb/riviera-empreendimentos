import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIPOS_LOGRADOURO = [
  "Rua", "Avenida", "Travessa", "Alameda", "Rodovia", "Estrada", 
  "Praça", "Largo", "Via", "Caminho", "Beco", "Outros"
];

const ESTADOS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" }
];

export default function EnderecoForm({ endereco, onChange, prefix = "" }) {
  const [openCidade, setOpenCidade] = useState(false);
  const [searchCidade, setSearchCidade] = useState("");
  const [cidades, setCidades] = useState([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  const handleChange = (field, value) => {
    onChange({
      ...endereco,
      [field]: value
    });
  };

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setLoadingCEP(true);
    try {
      const response = await base44.functions.invoke('consultaCEP', { cep: cepLimpo });
      const data = response.data;
      
      if (data && !data.erro) {
        onChange({
          ...endereco,
          cep: cep,
          tipo_logradouro: data.logradouro?.split(' ')[0] || "Rua",
          logradouro: data.logradouro?.replace(/^(Rua|Avenida|Travessa|Alameda|Rodovia|Estrada|Praça|Largo|Via|Caminho|Beco)\s+/i, '') || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || ""
        });
        toast.success("CEP encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCEP(false);
    }
  };

  // Buscar cidades quando estado mudar
  useEffect(() => {
    const carregarCidades = async () => {
      if (!endereco?.estado) {
        setCidades([]);
        return;
      }

      setLoadingCidades(true);
      try {
        const response = await base44.entities.CidadeBrasil.filter(
          { uf: endereco.estado },
          'nome',
          1000
        );
        setCidades(response || []);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        setCidades([]);
      } finally {
        setLoadingCidades(false);
      }
    };

    carregarCidades();
  }, [endereco?.estado]);

  const cidadesFiltradas = cidades.filter(cidade =>
    cidade.nome.toLowerCase().includes(searchCidade.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}cep`}>CEP</Label>
          <div className="relative">
            <Input
              id={`${prefix}cep`}
              value={endereco?.cep || ""}
              onChange={(e) => handleChange("cep", e.target.value)}
              onBlur={(e) => buscarCEP(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {loadingCEP && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}estado`}>Estado</Label>
          <Select
            value={endereco?.estado || ""}
            onValueChange={(value) => {
              handleChange("estado", value);
              handleChange("cidade", ""); // Limpar cidade ao mudar estado
            }}
          >
            <SelectTrigger id={`${prefix}estado`}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}cidade`}>Cidade</Label>
          <Popover open={openCidade} onOpenChange={setOpenCidade}>
            <PopoverTrigger asChild>
              <Button
                id={`${prefix}cidade`}
                variant="outline"
                role="combobox"
                aria-expanded={openCidade}
                className="w-full justify-between"
                disabled={!endereco?.estado}
              >
                {endereco?.cidade || "Selecione a cidade"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput 
                  placeholder="Buscar cidade..." 
                  value={searchCidade}
                  onValueChange={setSearchCidade}
                />
                <CommandEmpty>
                  {loadingCidades ? "Carregando..." : "Nenhuma cidade encontrada"}
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {cidadesFiltradas.map((cidade) => (
                    <CommandItem
                      key={cidade.id}
                      value={cidade.nome}
                      onSelect={() => {
                        handleChange("cidade", cidade.nome);
                        setOpenCidade(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          endereco?.cidade === cidade.nome ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {cidade.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}tipo_logradouro`}>Tipo</Label>
          <Select
            value={endereco?.tipo_logradouro || "Rua"}
            onValueChange={(value) => handleChange("tipo_logradouro", value)}
          >
            <SelectTrigger id={`${prefix}tipo_logradouro`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_LOGRADOURO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor={`${prefix}logradouro`}>Logradouro</Label>
          <Input
            id={`${prefix}logradouro`}
            value={endereco?.logradouro || ""}
            onChange={(e) => handleChange("logradouro", e.target.value)}
            placeholder="Nome da rua, avenida, etc."
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}numero`}>Número</Label>
          <Input
            id={`${prefix}numero`}
            value={endereco?.numero || ""}
            onChange={(e) => handleChange("numero", e.target.value)}
            placeholder="Nº"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor={`${prefix}complemento`}>Complemento</Label>
          <Input
            id={`${prefix}complemento`}
            value={endereco?.complemento || ""}
            onChange={(e) => handleChange("complemento", e.target.value)}
            placeholder="Apto, sala, bloco, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}referencia`}>Referência</Label>
          <Input
            id={`${prefix}referencia`}
            value={endereco?.referencia || ""}
            onChange={(e) => handleChange("referencia", e.target.value)}
            placeholder="Ponto de referência"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}bairro`}>Bairro</Label>
        <Input
          id={`${prefix}bairro`}
          value={endereco?.bairro || ""}
          onChange={(e) => handleChange("bairro", e.target.value)}
          placeholder="Nome do bairro"
        />
      </div>
    </div>
  );
}