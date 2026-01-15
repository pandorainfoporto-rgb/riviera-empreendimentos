import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Upload, Map, MapPin } from "lucide-react";
import DadosLoteamentoStep from "./wizard/DadosLoteamentoStep";
import LocalizacaoStep from "./wizard/LocalizacaoStep";
import UploadDWGStep from "./wizard/UploadDWGStep";
import MapeamentoLotesStep from "./wizard/MapeamentoLotesStep";

const STEPS = [
  { id: 1, title: "Dados do Loteamento", icon: CheckCircle2 },
  { id: 2, title: "Localização", icon: MapPin },
  { id: 3, title: "Upload DWG", icon: Upload },
  { id: 4, title: "Mapeamento de Lotes", icon: Map }
];

export default function LoteamentoWizard({ open, loteamento, onSave, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    imagem_principal_url: "",
    imagens_propaganda: [],
    latitude: null,
    longitude: null,
    tipo_logradouro: "Rua",
    logradouro: "",
    numero: "",
    complemento: "",
    referencia: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    area_total: 0,
    quantidade_lotes: 0,
    valor_total: 0,
    observacoes: "",
    arquivo_dwg_url: "",
    arquivo_planta_url: "",
    mapa_lotes_config: null,
  });

  const [lotesSalvos, setLotesSalvos] = useState([]);
  const [loteamentoId, setLoteamentoId] = useState(loteamento?.id || null);

  React.useEffect(() => {
    if (open && loteamento) {
      // Modo edição - carregar todos os dados do loteamento
      setFormData({
        ...loteamento,
        nome: loteamento.nome || "",
        descricao: loteamento.descricao || "",
        imagem_principal_url: loteamento.imagem_principal_url || "",
        imagens_propaganda: loteamento.imagens_propaganda || [],
        latitude: loteamento.latitude || null,
        longitude: loteamento.longitude || null,
        tipo_logradouro: loteamento.tipo_logradouro || "Rua",
        logradouro: loteamento.logradouro || "",
        numero: loteamento.numero || "",
        complemento: loteamento.complemento || "",
        referencia: loteamento.referencia || "",
        bairro: loteamento.bairro || "",
        cidade: loteamento.cidade || "",
        estado: loteamento.estado || "",
        cep: loteamento.cep || "",
        area_total: loteamento.area_total || 0,
        quantidade_lotes: loteamento.quantidade_lotes || 0,
        valor_total: loteamento.valor_total || 0,
        observacoes: loteamento.observacoes || "",
        arquivo_dwg_url: loteamento.arquivo_dwg_url || "",
        arquivo_planta_url: loteamento.arquivo_planta_url || "",
        mapa_lotes_config: loteamento.mapa_lotes_config || null,
      });
      setLoteamentoId(loteamento.id);
      setCurrentStep(1);
    } else if (open && !loteamento) {
      // Modo criação
      setFormData({
        nome: "",
        descricao: "",
        imagem_principal_url: "",
        imagens_propaganda: [],
        latitude: null,
        longitude: null,
        tipo_logradouro: "Rua",
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        area_total: 0,
        quantidade_lotes: 0,
        valor_total: 0,
        observacoes: "",
        arquivo_dwg_url: "",
        arquivo_planta_url: "",
        mapa_lotes_config: null,
      });
      setLoteamentoId(null);
      setCurrentStep(1);
    }
  }, [loteamento, open]);

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

  const handleStepComplete = async (data) => {
    const dadosAtualizados = { ...formData, ...data };
    setFormData(dadosAtualizados);
    
    if (currentStep === 1) {
      // Salvar dados básicos do loteamento (apenas no passo 1)
      if (!loteamentoId) {
        // Criação: só salva se ainda não foi criado
        const savedLoteamento = await onSave(dadosAtualizados);
        if (savedLoteamento?.id) {
          setLoteamentoId(savedLoteamento.id);
          setFormData({ ...dadosAtualizados, id: savedLoteamento.id });
        }
      }
      handleNext();
    } else if (currentStep === 2) {
      // Atualizar localização
      if (loteamentoId) {
        await onSave(dadosAtualizados);
      }
      handleNext();
    } else if (currentStep === 3) {
      // Atualizar arquivos apenas
      if (loteamentoId) {
        await onSave(dadosAtualizados);
      }
      handleNext();
    } else if (currentStep === 4) {
      // Finalizar wizard - dados de mapeamento já foram salvos no próprio step
      onClose();
    }
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3 text-[var(--wine-700)]">
            {loteamento ? "Editar Loteamento" : "Novo Loteamento"}
          </DialogTitle>
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
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
                    {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <span className="hidden md:inline text-sm">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </DialogHeader>

        <div className="mt-6">
          {currentStep === 1 && (
            <DadosLoteamentoStep
              data={formData}
              onNext={handleStepComplete}
              onCancel={onClose}
            />
          )}

          {currentStep === 2 && (
            <LocalizacaoStep
              data={formData}
              onNext={handleStepComplete}
              onBack={handleBack}
              onCancel={onClose}
            />
          )}

          {currentStep === 3 && (
            <UploadDWGStep
              loteamentoId={loteamentoId}
              data={formData}
              onNext={handleStepComplete}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <MapeamentoLotesStep
              loteamentoId={loteamentoId}
              data={formData}
              onFinish={handleStepComplete}
              onBack={handleBack}
              lotesSalvos={lotesSalvos}
              setLotesSalvos={setLotesSalvos}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}