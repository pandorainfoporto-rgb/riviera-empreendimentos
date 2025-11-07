import { base44 } from "@/api/base44Client";

/**
 * Função helper para registrar logs de auditoria
 * 
 * @param {string} entidade - Nome da entidade (ex: 'Cliente', 'PagamentoCliente')
 * @param {string} acao - Tipo de ação ('criar', 'atualizar', 'deletar')
 * @param {string} registro_id - ID do registro afetado
 * @param {object} dados_anteriores - Dados antes da alteração (para updates/deletes)
 * @param {object} dados_novos - Dados após a alteração (para creates/updates)
 * @param {object} contexto_adicional - Contexto adicional opcional
 * @param {string} severidade - Nível de severidade ('info', 'warning', 'critical')
 */
export async function registrarLog({
  entidade,
  acao,
  registro_id,
  dados_anteriores = null,
  dados_novos = null,
  contexto_adicional = null,
  severidade = 'info'
}) {
  try {
    await base44.functions.invoke('registrarLog', {
      entidade,
      registro_id,
      acao,
      dados_anteriores,
      dados_novos,
      contexto_adicional,
      severidade
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    // Não lançar erro para não afetar a operação principal
  }
}

// Wrapper específico para operações CRUD comuns
export const AuditoriaHelper = {
  /**
   * Registra criação de registro
   */
  criar: async (entidade, registro_id, dados, contexto = null) => {
    await registrarLog({
      entidade,
      acao: 'criar',
      registro_id,
      dados_novos: dados,
      contexto_adicional: contexto,
      severidade: 'info'
    });
  },

  /**
   * Registra atualização de registro
   */
  atualizar: async (entidade, registro_id, dados_anteriores, dados_novos, contexto = null) => {
    await registrarLog({
      entidade,
      acao: 'atualizar',
      registro_id,
      dados_anteriores,
      dados_novos,
      contexto_adicional: contexto,
      severidade: 'info'
    });
  },

  /**
   * Registra deleção de registro
   */
  deletar: async (entidade, registro_id, dados_deletados, contexto = null) => {
    await registrarLog({
      entidade,
      acao: 'deletar',
      registro_id,
      dados_anteriores: dados_deletados,
      contexto_adicional: contexto,
      severidade: 'warning'
    });
  },

  /**
   * Registra ação crítica (ex: mudança de permissões)
   */
  acaoCritica: async (entidade, registro_id, acao, dados_anteriores, dados_novos, contexto = null) => {
    await registrarLog({
      entidade,
      acao,
      registro_id,
      dados_anteriores,
      dados_novos,
      contexto_adicional: contexto,
      severidade: 'critical'
    });
  }
};

export default registrarLog;