import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { normalizeSAEClinicalData } from '../domain/mappers/clinicalDataMapper';

/**
 * Hook para gerenciar o carregamento e pré-preenchimento de SAE anterior
 * 
 * Extrai a lógica de negócio de carregamento de SAE existente da tela
 */
export const usePreviousSAE = (patient, user, updateSaeData) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPreviousSAE, setHasPreviousSAE] = useState(false);
  const [previousSAEData, setPreviousSAEData] = useState(null);

  /**
   * Encontra o SAE mais recente para a triagem atual
   */
  const findLatestSAEForCurrentTriage = useCallback((patient) => {
    if (!patient) return null;

    const registros = Array.isArray(patient.registrosSAE) ? patient.registrosSAE : [];
    if (registros.length === 0) return null;

    const triagemIdAtual = patient.idTriagem || patient.id;
    
    // Filtrar registros da mesma triagem
    const registrosMesmaTriagem = registros.filter(r => {
      const rid = r.triagemId || r.triagem_id || null;
      return triagemIdAtual ? rid === triagemIdAtual : true;
    });

    // Retornar o mais recente da mesma triagem, ou o mais recente geral
    if (registrosMesmaTriagem.length > 0) {
      return registrosMesmaTriagem[registrosMesmaTriagem.length - 1];
    }
    
    return registros.length > 0 ? registros[registros.length - 1] : null;
  }, []);

  /**
   * Pré-preenche os dados do formulário com dados do SAE anterior
   */
  const prefillSAEData = useCallback((existingSAE, user, updateSaeData) => {
    if (!existingSAE) return;

    // Pré-preencher diagnósticos, intervenções e evolução
    updateSaeData('nursingDiagnoses', existingSAE.nursingDiagnoses || []);
    updateSaeData('nursingInterventions', existingSAE.nursingInterventions || []);
    updateSaeData('nursingEvolution', existingSAE.nursingEvolution || '');
    updateSaeData('additionalObservations', existingSAE.additionalObservations || '');
    updateSaeData('coren', existingSAE.coren || user?.coren || '');
    updateSaeData(
      'responsibleNurse',
      existingSAE.responsibleNurse || user?.nome_completo || user?.name || user?.nome || ''
    );

    // Pré-preencher dados clínicos usando o mapper
    const clinicalData = normalizeSAEClinicalData(existingSAE);
    Object.keys(clinicalData).forEach(key => {
      if (clinicalData[key]) {
        updateSaeData(key, clinicalData[key]);
      }
    });
  }, []);

  /**
   * Inicializa dados padrão quando não há SAE anterior
   */
  const initializeDefaultData = useCallback((user, updateSaeData) => {
    updateSaeData('coren', user?.coren || '');
    updateSaeData(
      'responsibleNurse',
      user?.nome_completo || user?.name || user?.nome || ''
    );
  }, []);

  /**
   * Carrega SAE existente
   */
  const loadPreviousSAE = useCallback(async () => {
    if (!patient) {
      setIsLoading(false);
      return;
    }

    if (!patient?.patientId && !patient?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const existingSAE = findLatestSAEForCurrentTriage(patient);

      if (existingSAE) {
        setHasPreviousSAE(true);
        setPreviousSAEData(existingSAE);
        prefillSAEData(existingSAE, user, updateSaeData);
      } else {
        setHasPreviousSAE(false);
        setPreviousSAEData(null);
        initializeDefaultData(user, updateSaeData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar SAE existente:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do SAE existente.');
      setHasPreviousSAE(false);
      setPreviousSAEData(null);
      initializeDefaultData(user, updateSaeData);
    } finally {
      setIsLoading(false);
    }
  }, [patient, user, updateSaeData, findLatestSAEForCurrentTriage, prefillSAEData, initializeDefaultData]);

  useEffect(() => {
    loadPreviousSAE();
  }, [loadPreviousSAE]);

  return {
    isLoading,
    hasPreviousSAE,
    previousSAEData,
    reload: loadPreviousSAE,
  };
};

