/**
 * Domain Layer - Mapeamento de Dados Clínicos
 * 
 * Responsável por transformar dados clínicos entre diferentes formatos
 * (backend, frontend, SAE, triagem) mantendo consistência.
 */

/**
 * Mapeia dados clínicos de um formato para outro
 * @param {Object} sourceData - Dados de origem (pode ter diferentes formatos)
 * @param {string} sourceFormat - Formato de origem: 'backend' | 'sae' | 'patient'
 * @param {string} targetFormat - Formato de destino: 'sae' | 'form'
 * @returns {Object} Dados mapeados no formato de destino
 */
export const mapClinicalData = (sourceData, sourceFormat = 'backend', targetFormat = 'form') => {
  if (!sourceData) return {};

  const mapped = {};

  // Mapear pressão arterial
  mapped.bloodPressure = extractValue(sourceData, [
    'bloodPressure',
    'pressaoArterial',
    'pressao_arterial',
    'dados_clinicos.bloodPressure',
    'dadosClinicos.bloodPressure',
    'dados_clinicos.pressao_arterial',
  ]);

  // Mapear frequência cardíaca
  mapped.heartRate = extractValue(sourceData, [
    'heartRate',
    'frequenciaCardiaca',
    'frequencia_cardiaca',
    'dados_clinicos.heartRate',
    'dadosClinicos.heartRate',
    'dados_clinicos.frequencia_cardiaca',
  ]);

  // Mapear temperatura
  mapped.temperature = extractValue(sourceData, [
    'temperature',
    'temperatura',
    'dados_clinicos.temperature',
    'dadosClinicos.temperature',
    'dados_clinicos.temperatura',
  ]);

  // Mapear frequência respiratória
  mapped.respiratoryRate = extractValue(sourceData, [
    'respiratoryRate',
    'frequenciaRespiratoria',
    'frequencia_respiratoria',
    'dados_clinicos.respiratoryRate',
    'dadosClinicos.respiratoryRate',
    'dados_clinicos.frequencia_respiratoria',
  ]);

  // Mapear saturação de oxigênio
  mapped.oxygenSaturation = extractValue(sourceData, [
    'oxygenSaturation',
    'saturacaoOxigenio',
    'saturacao_oxigenio',
    'dados_clinicos.oxygenSaturation',
    'dadosClinicos.oxygenSaturation',
    'dados_clinicos.saturacao_oxigenio',
  ]);

  // Mapear peso
  mapped.weight = extractValue(sourceData, [
    'weight',
    'peso',
    'dados_clinicos.weight',
    'dadosClinicos.weight',
    'dados_clinicos.peso',
  ]);

  // Mapear altura
  mapped.height = extractValue(sourceData, [
    'height',
    'altura',
    'dados_clinicos.height',
    'dadosClinicos.height',
    'dados_clinicos.altura',
  ]);

  // Mapear sintomas
  mapped.symptoms = extractValue(sourceData, [
    'symptoms',
    'sintomas',
    'dados_clinicos.symptoms',
    'dadosClinicos.symptoms',
    'dados_clinicos.sintomas',
  ]);

  // Mapear histórico médico
  mapped.medicalHistory = extractValue(sourceData, [
    'medicalHistory',
    'historicoMedico',
    'historico_medico',
    'dados_clinicos.medicalHistory',
    'dadosClinicos.medicalHistory',
    'dados_clinicos.historico_medico',
  ]);

  // Converter valores numéricos para string (formato esperado pelo formulário)
  if (targetFormat === 'form') {
    Object.keys(mapped).forEach(key => {
      if (mapped[key] !== null && mapped[key] !== undefined && mapped[key] !== '') {
        mapped[key] = String(mapped[key]);
      } else {
        mapped[key] = '';
      }
    });
  }

  return mapped;
};

/**
 * Extrai valor de um objeto usando múltiplas chaves possíveis
 * @param {Object} obj - Objeto de origem
 * @param {string[]} keys - Array de chaves possíveis (suporta notação de ponto para objetos aninhados)
 * @returns {any} Valor encontrado ou null
 */
const extractValue = (obj, keys) => {
  for (const key of keys) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = obj;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }
      if (value !== null && value !== undefined) {
        return value;
      }
    } else if (obj && key in obj && obj[key] !== null && obj[key] !== undefined) {
      return obj[key];
    }
  }
  return null;
};

/**
 * Normaliza dados clínicos de SAE para formato de formulário
 * @param {Object} saeData - Dados do SAE
 * @returns {Object} Dados normalizados
 */
export const normalizeSAEClinicalData = (saeData) => {
  if (!saeData) return {};

  const clinicalData = saeData.dados_clinicos || saeData.dadosClinicos || saeData;
  return mapClinicalData(clinicalData, 'sae', 'form');
};

