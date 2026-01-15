import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle2, User, MapPin, Home, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import ClienteLoteamentoStep from "./wizard/ClienteLoteamentoStep";
import SelecionarLoteMapaStep from "./wizard/SelecionarLoteMapaStep";
import DetalhesImovelStep from "./wizard/DetalhesImovelStep";
import FinanceiroStep from "./wizard/FinanceiroStep";

const STEPS = [
  { id: 1, title: "Cliente e Loteamento", icon: User },
  { id: 2, title: "Selecionar Lote", icon: MapPin },
  { id: 3, title: "Detalhes do Imóvel", icon: Home },
  { id: 4, title: "Financeiro", icon: DollarSign }
];

export default function IntencaoCompraWizard({ open, onClose, onSave, intencao, clientes = [], loteamentos = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    cliente_id: "",
    loteamento_id: "",
    lote_id: "",
    status: "rascunho",
    orcamento_minimo: "",
    orcamento_maximo: "",
    padrao_imovel: "medio",
    area_construida_desejada: "",
    quantidade_pavimentos: 1,
    quantidade_quartos: 2,
    quantidade_suites: 1,
    quantidade_banheiros: 2,
    quantidade_lavabos: 0,
    vagas_garagem: 1,
    garagem_coberta: true,
    comodos: {
      sala_estar: true,
      sala_jantar: true,
      sala_tv: false,
      cozinha: true,
      cozinha_americana: false,
      copa: false,
      area_servico: true,
      lavanderia: false,
      despensa: false,
      escritorio: false,
      home_office: false,
      area_gourmet: false,
      churrasqueira: false,
      piscina: false,
      varanda: false,
      varanda_gourmet: false,
      jardim_inverno: false,
      closet_master: false,
      banheira: false,
      edicola: false,
      quarto_empregada: false,
    },
    adicionais: {
      ar_condicionado: false,
      aquecimento_solar: false,
      energia_solar: false,
      automacao_residencial: false,
      sistema_seguranca: false,
      cerca_eletrica: false,
      cameras: false,
      alarme: false,
      portao_automatico: false,
      interfone: false,
      wifi_estruturado: false,
      home_theater: false,
      jardim_paisagismo: false,
      iluminacao_jardim: false,
      mobilia_planejada: false,
      moveis_cozinha: false,
      moveis_banheiro: false,
    },
    preferencias_cores: {
      fachada_principal: "",
      fachada_detalhes: "",
      paredes_internas: "",
      teto: "",
      portas: "",
      janelas: "",
      observacoes_cores: "",
    },
    tipo_telhado: "",
    tipo_piso_interno: "",
    tipo_piso_externo: "",
    tipo_revestimento_parede: "",
    detalhes_especificos: "",
    gerar_custo_projeto: false,
    valor_custo_projeto: "",
    condicao_pagamento_projeto: "a_vista",
    data_vencimento_projeto: "",
    observacoes: "",
  });

  useEffect(() => {
    if (open && intencao) {
      setFormData(intencao);
      setCurrentStep(1);
    } else if (open && !intencao) {
      setCurrentStep(1);
    }
  }, [intencao, open]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFinish = () => {
    onSave(formData);
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3 text-[var(--wine-700)]">
            {intencao ? "Editar Intenção de Compra" : "Nova Intenção de Compra"}
          </DialogTitle>
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 ${
                      step.id === currentStep ? 'text-[var(--wine-700)] font-bold' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.id < currentStep ? 'bg-green-500 text-white' :
                      step.id === currentStep ? 'bg-[var(--wine-600)] text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="hidden md:inline text-xs">{step.title}</span>
                  </div>
                );
              })}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-6">
          {currentStep === 1 && (
            <ClienteLoteamentoStep
              data={formData}
              clientes={clientes}
              loteamentos={loteamentos}
              onChange={handleStepData}
              onNext={handleNext}
              onCancel={onClose}
            />
          )}

          {currentStep === 2 && (
            <SelecionarLoteMapaStep
              loteamentoId={formData.loteamento_id}
              loteIdSelecionado={formData.lote_id}
              onChange={handleStepData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <DetalhesImovelStep
              data={formData}
              onChange={handleStepData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <FinanceiroStep
              data={formData}
              onChange={handleStepData}
              onFinish={handleFinish}
              onBack={handleBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}