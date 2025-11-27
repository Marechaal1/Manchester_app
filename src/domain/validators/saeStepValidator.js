/**
 * Domain Layer - Validação de Etapas SAE
 * 
 * Contém as regras de validação para cada etapa do SAE
 */

/**
 * Valida se uma etapa do SAE está completa e pode avançar
 * @param {number} step - Número da etapa (1-5)
 * @param {Object} saeData - Dados do SAE
 * @returns {Object} { isValid: boolean, message?: string }
 */
export const validateSAEStep = (step, saeData) => {
  switch (step) {
    case 1:
      // Etapa 1: Dados clínicos - não bloqueia avanço
      return { isValid: true };

    case 2:
      // Etapa 2: Diagnósticos de enfermagem - obrigatório
      if (!saeData.nursingDiagnoses || saeData.nursingDiagnoses.length === 0) {
        return {
          isValid: false,
          message: 'É necessário selecionar pelo menos um diagnóstico de enfermagem conforme CIPE.',
        };
      }
      return { isValid: true };

    case 3:
      // Etapa 3: Intervenções de enfermagem - obrigatório
      if (!saeData.nursingInterventions || saeData.nursingInterventions.length === 0) {
        return {
          isValid: false,
          message: 'É necessário selecionar pelo menos uma intervenção de enfermagem conforme CIPE.',
        };
      }
      return { isValid: true };

    case 4:
      // Etapa 4: Resultados esperados (NOC) - opcional
      return { isValid: true };

    case 5:
      // Etapa 5: Evolução de enfermagem - opcional
      return { isValid: true };

    default:
      return { isValid: false, message: 'Etapa inválida' };
  }
};

/**
 * Valida todos os dados do SAE antes de salvar
 * @param {Object} saeData - Dados do SAE
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateSAEComplete = (saeData) => {
  const errors = [];

  // Validar diagnósticos
  if (!saeData.nursingDiagnoses || saeData.nursingDiagnoses.length === 0) {
    errors.push('É necessário selecionar pelo menos um diagnóstico de enfermagem.');
  }

  // Validar intervenções
  if (!saeData.nursingInterventions || saeData.nursingInterventions.length === 0) {
    errors.push('É necessário selecionar pelo menos uma intervenção de enfermagem.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

