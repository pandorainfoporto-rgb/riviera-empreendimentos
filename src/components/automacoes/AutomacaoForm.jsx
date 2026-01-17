import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AutomacaoForm({ automacao, onClose, onSuccess }) {
  const [tipo, setTipo] = useState(automacao?.automation_type || 'scheduled');
  const [nome, setNome] = useState(automacao?.name || '');
  const [descricao, setDescricao] = useState(automacao?.description || '');
  const [funcao, setFuncao] = useState(automacao?.function_name || '');
  
  // Agendadas
  const [modoAgendamento, setModoAgendamento] = useState(automacao?.schedule_mode || 'recurring');
  const [tipoAgendamento, setTipoAgendamento] = useState(automacao?.schedule_type || 'simple');
  const [intervalo, setIntervalo] = useState(automacao?.repeat_interval || 1);
  const [unidade, setUnidade] = useState(automacao?.repeat_unit || 'days');
  const [horario, setHorario] = useState(automacao?.start_time || '09:00');
  const [cronExpr, setCronExpr] = useState(automacao?.cron_expression || '');
  const [dataUnica, setDataUnica] = useState(automacao?.one_time_date || '');
  const [diasSemana, setDiasSemana] = useState(automacao?.repeat_on_days || []);
  const [diaMes, setDiaMes] = useState(automacao?.repeat_on_day_of_month || 1);
  
  // Entidades
  const [entidade, setEntidade] = useState(automacao?.entity_name || '');
  const [eventos, setEventos] = useState(automacao?.event_types || []);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        automation_type: tipo,
        name: nome,
        function_name: funcao,
        description: descricao || undefined,
        is_active: true
      };

      if (tipo === 'scheduled') {
        payload.schedule_mode = modoAgendamento;
        
        if (modoAgendamento === 'one-time') {
          payload.one_time_date = dataUnica;
        } else {
          payload.schedule_type = tipoAgendamento;
          
          if (tipoAgendamento === 'cron') {
            payload.cron_expression = cronExpr;
          } else {
            payload.repeat_interval = parseInt(intervalo);
            payload.repeat_unit = unidade;
            
            if (horario) payload.start_time = horario;
            
            if (unidade === 'weeks' && diasSemana.length > 0) {
              payload.repeat_on_days = diasSemana;
            }
            
            if (unidade === 'months') {
              payload.repeat_on_day_of_month = parseInt(diaMes);
            }
          }
        }
      } else {
        payload.entity_name = entidade;
        payload.event_types = eventos;
      }

      const token = await base44.auth.getToken();
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar automação');
      }

      onSuccess();
    } catch (error) {
      alert('Erro ao criar automação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle>{automacao ? 'Editar' : 'Nova'} Automação</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Automação</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendada (horário fixo)</SelectItem>
                <SelectItem value="entity">Por Evento (quando dados mudam)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome da Automação *</Label>
            <Input 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Enviar lembretes de cobrança"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que esta automação faz..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Função Backend *</Label>
            <Input 
              value={funcao} 
              onChange={(e) => setFuncao(e.target.value)}
              placeholder="Ex: enviarLembretesCobranca"
              required
            />
            <p className="text-xs text-gray-500">Nome da função em functions/ que será executada</p>
          </div>

          {tipo === 'scheduled' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Modo de Agendamento</Label>
                <Select value={modoAgendamento} onValueChange={setModoAgendamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recorrente</SelectItem>
                    <SelectItem value="one-time">Uma vez</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {modoAgendamento === 'one-time' ? (
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input 
                    type="datetime-local"
                    value={dataUnica}
                    onChange={(e) => setDataUnica(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Agendamento</Label>
                    <Select value={tipoAgendamento} onValueChange={setTipoAgendamento}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simples (intervalos)</SelectItem>
                        <SelectItem value="cron">Avançado (cron)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoAgendamento === 'cron' ? (
                    <div className="space-y-2">
                      <Label>Expressão Cron *</Label>
                      <Input 
                        value={cronExpr}
                        onChange={(e) => setCronExpr(e.target.value)}
                        placeholder="0 9 * * 1-5"
                        required
                      />
                      <p className="text-xs text-gray-500">Ex: 0 9 * * 1-5 = 9h seg-sex</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Repetir a cada *</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={intervalo}
                            onChange={(e) => setIntervalo(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidade *</Label>
                          <Select value={unidade} onValueChange={setUnidade}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutos</SelectItem>
                              <SelectItem value="hours">Horas</SelectItem>
                              <SelectItem value="days">Dias</SelectItem>
                              <SelectItem value="weeks">Semanas</SelectItem>
                              <SelectItem value="months">Meses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Horário de Início</Label>
                        <Input 
                          type="time"
                          value={horario}
                          onChange={(e) => setHorario(e.target.value)}
                        />
                      </div>

                      {unidade === 'weeks' && (
                        <div className="space-y-2">
                          <Label>Dias da Semana</Label>
                          <div className="grid grid-cols-7 gap-2">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`dia-${idx}`}
                                  checked={diasSemana.includes(idx)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setDiasSemana([...diasSemana, idx]);
                                    } else {
                                      setDiasSemana(diasSemana.filter(d => d !== idx));
                                    }
                                  }}
                                />
                                <Label htmlFor={`dia-${idx}`} className="text-xs">{dia}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {unidade === 'months' && (
                        <div className="space-y-2">
                          <Label>Dia do Mês</Label>
                          <Input 
                            type="number"
                            min="1"
                            max="31"
                            value={diaMes}
                            onChange={(e) => setDiaMes(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {tipo === 'entity' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Entidade *</Label>
                <Input 
                  value={entidade}
                  onChange={(e) => setEntidade(e.target.value)}
                  placeholder="Ex: PagamentoCliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Eventos que disparam a automação *</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="create"
                      checked={eventos.includes('create')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEventos([...eventos, 'create']);
                        } else {
                          setEventos(eventos.filter(e => e !== 'create'));
                        }
                      }}
                    />
                    <Label htmlFor="create">Quando criar novo registro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="update"
                      checked={eventos.includes('update')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEventos([...eventos, 'update']);
                        } else {
                          setEventos(eventos.filter(e => e !== 'update'));
                        }
                      }}
                    />
                    <Label htmlFor="update">Quando atualizar registro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="delete"
                      checked={eventos.includes('delete')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEventos([...eventos, 'delete']);
                        } else {
                          setEventos(eventos.filter(e => e !== 'delete'));
                        }
                      }}
                    />
                    <Label htmlFor="delete">Quando deletar registro</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[var(--wine-600)] hover:bg-[var(--wine-700)]"
            >
              {loading ? 'Salvando...' : automacao ? 'Salvar' : 'Criar Automação'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}