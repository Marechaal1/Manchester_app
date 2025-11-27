import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { saeService } from '../services/sae.service';
import { validateSAEComplete } from '../domain/validators/saeStepValidator';
import { handleApiError } from '../utils/errorHandler';
import { mapClinicalData } from '../domain/mappers/clinicalDataMapper';
import { formatSAEData } from '../utils/apiDataFormatter';

export const useSAE = (patient, patientId, atualizarPaciente) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  /**
   * Inicializa dados do SAE a partir do paciente
   */
  const initializeSaeData = useCallback((patient) => {
    const clinicalData = patient ? mapClinicalData(patient, 'patient', 'form') : {};
    
    return {
      // Dados clínicos (pré-preenchidos do paciente)
      ...clinicalData,
      // Dados específicos do SAE
      nursingDiagnoses: [],
      nursingInterventions: [],
      nursingOutcomes: [],
      nursingEvolution: '',
      additionalObservations: '',
      coren: '',
      responsibleNurse: '',
    };
  }, []);

  const [saeData, setSaeData] = useState(() => initializeSaeData(patient));

  const updateSaeData = useCallback((field, value) => {
    setSaeData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Atualizar dados clínicos quando o paciente mudar (mantendo valores já definidos)
  useEffect(() => {
    if (patient) {
      const clinicalData = mapClinicalData(patient, 'patient', 'form');
      setSaeData(prev => ({
        ...prev,
        // Manter valores já definidos (ex: SAE anterior) e usar triagem como fallback
        bloodPressure: prev.bloodPressure || clinicalData.bloodPressure || '',
        heartRate: prev.heartRate || clinicalData.heartRate || '',
        temperature: prev.temperature || clinicalData.temperature || '',
        respiratoryRate: prev.respiratoryRate || clinicalData.respiratoryRate || '',
        oxygenSaturation: prev.oxygenSaturation || clinicalData.oxygenSaturation || '',
        weight: prev.weight || clinicalData.weight || '',
        height: prev.height || clinicalData.height || '',
        symptoms: prev.symptoms || clinicalData.symptoms || '',
        medicalHistory: prev.medicalHistory || clinicalData.medicalHistory || '',
      }));
    }
  }, [patient]);

  const nextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  /**
   * Valida dados completos do SAE antes de salvar
   */
  const validateSAEData = useCallback(() => {
    const validation = validateSAEComplete(saeData);
    
    if (!validation.isValid) {
      Alert.alert(
        'Validação Obrigatória',
        validation.errors.join('\n'),
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  }, [saeData]);

  const prepareSAEData = useCallback(() => {
    return {
      dados_clinicos: {
        bloodPressure: saeData.bloodPressure,
        heartRate: saeData.heartRate,
        temperature: saeData.temperature,
        respiratoryRate: saeData.respiratoryRate,
        oxygenSaturation: saeData.oxygenSaturation,
        weight: saeData.weight,
        height: saeData.height,
        symptoms: saeData.symptoms,
        medicalHistory: saeData.medicalHistory,
      },
      diagnosticos_enfermagem: saeData.nursingDiagnoses,
      intervencoes_enfermagem: saeData.nursingInterventions,
      resultados_esperados_noc: saeData.nursingOutcomes,
      evolucao_enfermagem: saeData.nursingEvolution,
      observacoes_adicionais: saeData.additionalObservations,
      coren: saeData.coren,
    };
  }, [saeData]);

  const saveSAE = useCallback(async (previousSAEData = null) => {
    if (!validateSAEData()) {
      return { success: false };
    }

    try {
      setIsLoading(true);
      
      const dadosSAE = prepareSAEData();
      
      let response;
      
      if (previousSAEData && previousSAEData.id) {
        response = await saeService.atualizar(previousSAEData.id, dadosSAE);
      } else {
        const dadosCompletos = {
          ...dadosSAE,
          paciente_id: patient.idPaciente || patient.patientId,
          triagem_id: patient.id,
        };
        
        response = await saeService.criar(formatSAEData(dadosCompletos));
      }
      
      if (response.sucesso) {
        
        // Atualizar paciente localmente
        const saeRecord = {
          id: response.dados.id,
          ...saeData,
          dadosClinicos: {
            bloodPressure: saeData.bloodPressure,
            heartRate: saeData.heartRate,
            temperature: saeData.temperature,
            respiratoryRate: saeData.respiratoryRate,
            oxygenSaturation: saeData.oxygenSaturation,
            symptoms: saeData.symptoms,
            medicalHistory: saeData.medicalHistory,
          },
          triagemId: patient.id || patient.idTriagem,
          registrationDate: new Date().toISOString(),
        };

        const currentSaeRecords = patient.registrosSAE || [];
        atualizarPaciente(patientId, {
          registrosSAE: [...currentSaeRecords, saeRecord],
        });

        return { success: true, data: response.dados };
      }
      
      return { success: false, error: 'Resposta inválida do servidor' };
    } catch (error) {
      return handleApiError(error, 'Erro ao salvar SAE');
    } finally {
      setIsLoading(false);
    }
  }, [saeData, patient, patientId, atualizarPaciente, validateSAEData, prepareSAEData]);

  return {
    currentStep,
    isLoading,
    saeData,
    updateSaeData,
    nextStep,
    previousStep,
    saveSAE,
    setCurrentStep,
  };
};
