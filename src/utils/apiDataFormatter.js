/**
 * Utilitário para formatar dados antes de enviar para a API
 * 
 * Garante que os tipos estejam corretos conforme esperado pelo backend
 */

/**
 * Converte um valor para string, garantindo que IDs sejam sempre strings
 * @param {any} value - Valor a ser convertido
 * @returns {string} Valor convertido para string
 */
export const ensureString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

/**
 * Converte um ID para string (garante compatibilidade com backend)
 * @param {string|number|null|undefined} id - ID a ser convertido
 * @returns {string} ID como string
 */
export const formatId = (id) => {
  if (id === null || id === undefined) {
    return '';
  }
  return String(id);
};

/**
 * Formata dados de triagem para envio à API
 * @param {Object} dados - Dados da triagem
 * @returns {Object} Dados formatados
 */
export const formatTriagemData = (dados) => {
  return {
    ...dados,
    paciente_id: formatId(dados.paciente_id),
  };
};

/**
 * Formata dados de reavaliação para envio à API
 * @param {Object} dados - Dados da reavaliação
 * @returns {Object} Dados formatados
 */
export const formatReavaliacaoData = (dados) => {
  return {
    ...dados,
    // Garantir que dados_clinicos estejam no formato correto
    dados_clinicos: dados.dados_clinicos || {},
    classificacao_risco: dados.classificacao_risco || null,
    justificativa: dados.justificativa || null,
  };
};

/**
 * Formata dados de SAE para envio à API
 * @param {Object} dados - Dados do SAE
 * @returns {Object} Dados formatados
 */
export const formatSAEData = (dados) => {
  return {
    ...dados,
    paciente_id: formatId(dados.paciente_id),
    triagem_id: formatId(dados.triagem_id),
  };
};

/**
 * Formata dados de atendimento médico para envio à API
 * @param {Object} dados - Dados do atendimento
 * @returns {Object} Dados formatados
 */
export const formatAtendimentoData = (dados) => {
  return {
    ...dados,
    paciente_id: formatId(dados.paciente_id),
    triagem_id: formatId(dados.triagem_id),
  };
};

