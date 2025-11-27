import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../styles/designSystem';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { useSAE } from '../hooks/useSAE';
import { usePreviousSAE } from '../hooks/usePreviousSAE';
import { validateSAEStep } from '../domain/validators/saeStepValidator';
import { handleApiError } from '../utils/errorHandler';
import SAENavigationHeader from '../components/SAENavigationHeader';
import StepScreenLayout from '../components/StepScreenLayout';
import SAEStepContent from '../components/SAEStepContent';

/**
 * Tela de Sistematização da Assistência de Enfermagem (SAE)
 * 
 * Refatorada seguindo Clean Architecture:
 * - Lógica de negócio extraída para hooks e domain layer
 * - Validações centralizadas
 * - Tratamento de erros padronizado
 */
const SAEScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { obterPacientesTriados, atualizarPaciente, carregarTriagens } = usarPaciente();
  const { usuario: user } = usarAutenticacao();
  
  const stepLayoutRef = useRef(null);
  
  // Obter dados do paciente
  const patients = obterPacientesTriados() || [];
  const patient = patients.find(p => p.id === patientId);

  // Hook personalizado para gerenciar SAE
  const {
    currentStep,
    isLoading: isSaving,
    saeData,
    updateSaeData,
    nextStep,
    previousStep,
    saveSAE,
  } = useSAE(patient, patientId, atualizarPaciente);

  // Hook para gerenciar carregamento de SAE anterior
  const {
    isLoading: isLoadingPreviousSAE,
    previousSAEData,
  } = usePreviousSAE(patient, user, updateSaeData);

  /**
   * Callback para scroll quando input recebe foco
   */
  const handleInputFocus = useCallback((inputRef, isLastRequired) => {
    const layout = stepLayoutRef.current;
    if (!layout) return;

    if (layout.setIsOnLastRequiredField) {
      layout.setIsOnLastRequiredField(!!isLastRequired);
    }
    
    if (layout.scrollToFocusedInput) {
      layout.scrollToFocusedInput(inputRef);
    } else if (layout.scrollToInput) {
      layout.scrollToInput(inputRef);
    }
  }, []);

  /**
   * Valida se a etapa atual está completa
   */
  const isStepValid = useCallback(() => {
    const validation = validateSAEStep(currentStep, saeData);
    return validation.isValid;
  }, [currentStep, saeData]);

  /**
   * Navega para etapa anterior
   */
  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  /**
   * Finaliza o SAE e salva os dados
   */
  const handleFinish = useCallback(async () => {
    const result = await saveSAE(previousSAEData);
    
    if (result.success) {
      try {
        await carregarTriagens();
      } catch (error) {
        console.error('Erro ao recarregar triagens:', error);
      }
      
      Alert.alert(
        'SAE Registrada',
        'Sistematização da Assistência de Enfermagem registrada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } else {
      const errorMessage = result.error || 'Falha ao registrar SAE';
      Alert.alert('Erro', errorMessage, [{ text: 'OK' }]);
    }
  }, [saveSAE, previousSAEData, carregarTriagens, navigation]);

  /**
   * Navega para próxima etapa ou finaliza
   */
  const handleNext = useCallback(() => {
    if (currentStep < 5) {
      nextStep();
    } else {
      handleFinish();
    }
  }, [currentStep, nextStep, handleFinish]);

  /**
   * Navega de volta ou para o Dashboard
   */
  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  }, [navigation]);

  // Verificação de segurança - paciente não encontrado
  if (!patient) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#e74c3c" />
          <Text style={styles.errorTitle}>Paciente não encontrado</Text>
          <Text style={styles.errorSubtitle}>
            O paciente selecionado não foi encontrado no sistema.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Estado de carregamento
  if (isLoadingPreviousSAE) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={styles.loadingText}>Carregando SAE...</Text>
        </View>
      </View>
    );
  }

  const header = (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={cores.branco} />
      <SAENavigationHeader
        currentStep={currentStep}
        totalSteps={5}
        onPrevious={previousStep}
        onNext={handleNext}
        onFinish={handleFinish}
        isLoading={isSaving}
        isLastStep={currentStep === 5}
        navigation={navigation}
      />
    </>
  );

  return (
    <View style={styles.container}>
      {header}
      <StepScreenLayout
        ref={stepLayoutRef}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFinish={handleFinish}
        onGoBack={handleGoBack}
        currentStep={currentStep}
        totalSteps={5}
        isLoading={isSaving}
        isStepValid={isStepValid()}
        previousText="Anterior"
        nextText="Próximo"
        finishText="Finalizar"
        showPrevious={true}
        previousDisabled={false}
        nextDisabled={!isStepValid()}
      >
        <SAEStepContent
          currentStep={currentStep}
          saeData={saeData}
          onUpdate={updateSaeData}
          patient={patient}
          onInputFocus={handleInputFocus}
        />
      </StepScreenLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cores.fundo,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: cores.cinza,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: cores.fundo,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.primaria,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: cores.cinza,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: cores.primaria,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SAEScreen;
