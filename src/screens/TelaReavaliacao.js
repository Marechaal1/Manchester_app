import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { cores, estilosComuns, icones } from '../styles/designSystem';
import OptimizedClinicalDataStep from '../components/OptimizedClinicalDataStep';
import { triagemService } from '../services/triagem.service';
import RiskClassificationStep from '../components/RiskClassificationStep';
import StepScreenLayout from '../components/StepScreenLayout';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarAutenticacao } from '../context/ContextoAutenticacao';

const ReevaluationScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { obterPacientePorId, atualizarPaciente, limparAlertasReavaliacao, carregarTriagens } = usarPaciente();
  const { podeRealizarReavaliacao } = usarAutenticacao();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar permissão de acesso
  useEffect(() => {
    if (!podeRealizarReavaliacao()) {
      Alert.alert(
        'Acesso Negado',
        'Você não tem permissão para acessar o módulo de Reavaliação. Apenas enfermeiros podem realizar esta ação.',
        [
          {
            text: 'OK',
            onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')),
          },
        ]
      );
    }
  }, [podeRealizarReavaliacao, navigation]);
  
  // Obter dados do paciente
  const originalPatient = obterPacientePorId(patientId);
  
  // Logs de debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Reavaliação - PatientId recebido:', patientId);
    console.log('🔍 Reavaliação - Paciente encontrado:', originalPatient);
    console.log('🔍 Reavaliação - Estrutura do paciente:', originalPatient ? Object.keys(originalPatient) : 'Nenhum paciente encontrado');
  }
  
  const [patientData, setPatientData] = useState({
    // Dados básicos do paciente (não editáveis)
    cpf: originalPatient?.cpf || '',
    name: originalPatient?.nome || '',
    birthDate: originalPatient?.dataNascimento || '',
    
    // Dados clínicos (editáveis na reavaliação)
    bloodPressure: originalPatient?.pressaoArterial || '',
    heartRate: originalPatient?.frequenciaCardiaca || '',
    temperature: originalPatient?.temperatura || '',
    respiratoryRate: originalPatient?.frequenciaRespiratoria || '',
    oxygenSaturation: originalPatient?.saturacaoOxigenio || '',
    weight: originalPatient?.peso || '',
    height: originalPatient?.altura || '',
    symptoms: originalPatient?.sintomas || '',
    medicalHistory: originalPatient?.historicoMedico || '',
    
    // Classificação de risco (editável)
    riskCategory: originalPatient?.categoriaRisco || '',
    justification: '',
  });
  
  // Logs de debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Reavaliação - Dados do paciente mapeados:', {
      cpf: patientData.cpf,
      name: patientData.name,
      birthDate: patientData.birthDate,
      bloodPressure: patientData.bloodPressure,
      heartRate: patientData.heartRate,
      temperature: patientData.temperature,
      riskCategory: patientData.riskCategory
    });
    
    console.log('🔍 Reavaliação - Dados originais do paciente:', {
      cpf: originalPatient?.cpf,
      nome: originalPatient?.nome,
      dataNascimento: originalPatient?.dataNascimento,
      pressaoArterial: originalPatient?.pressaoArterial,
      frequenciaCardiaca: originalPatient?.frequenciaCardiaca,
      temperatura: originalPatient?.temperatura,
      categoriaRisco: originalPatient?.categoriaRisco
    });
  }

  const steps = [
    { id: 1, title: 'Dados Clínicos', icon: 'medical' },
    { id: 2, title: 'Atualize a Categoria', icon: 'flag' },
  ];

  // Conectar foco ao scroll do layout
  const stepLayoutRef = useRef(null);
  const handleInputFocus = (inputRef, isLastRequired) => {
    if (stepLayoutRef.current?.setIsOnLastRequiredField) {
      stepLayoutRef.current.setIsOnLastRequiredField(!!isLastRequired);
    }
    if (stepLayoutRef.current?.scrollToFocusedInput) {
      stepLayoutRef.current.scrollToFocusedInput(inputRef);
    } else if (stepLayoutRef.current?.scrollToInput) {
      stepLayoutRef.current.scrollToInput(inputRef);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    Alert.alert(
      'Reavaliação Finalizada',
      `Paciente "${patientData.name}" foi reavaliado com sucesso !`,
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              console.log('🔄 Iniciando reavaliação para paciente:', patientId);
              console.log('📊 Dados clínicos:', patientData);
              console.log('🎯 Nova categoria de risco:', patientData.riskCategory);
              console.log('📝 Justificativa:', patientData.justification);
              
              // Verificar se temos um token válido
              const token = await AsyncStorage.getItem('token_autenticacao');
              console.log('🔑 Token disponível:', token ? 'Sim' : 'Não');
              if (token) {
                console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');
              }
              
              // Mapear categoria de risco para o formato do backend
              const mapearCategoriaRisco = (categoria) => {
                const mapeamento = {
                  'red': 'VERMELHO',
                  'orange': 'LARANJA', 
                  'yellow': 'AMARELO',
                  'green': 'VERDE',
                  'blue': 'AZUL'
                };
                return mapeamento[categoria] || 'AZUL';
              };

              // Preparar dados para envio
              const dadosReavaliacao = {
                dados_clinicos: {
                  pressao_arterial: String(patientData.bloodPressure || ''),
                  frequencia_cardiaca: Number(patientData.heartRate || 0) || null,
                  temperatura: Number(patientData.temperature || 0) || null,
                  frequencia_respiratoria: Number(patientData.respiratoryRate || 0) || null,
                  saturacao_oxigenio: Number(patientData.oxygenSaturation || 0) || null,
                  sintomas: patientData.symptoms || '',
                  historico_medico: patientData.medicalHistory || '',
                },
                classificacao_risco: mapearCategoriaRisco(patientData.riskCategory),
                justificativa: patientData.justification || '',
              };
              
              console.log('📤 Dados sendo enviados para reavaliação:', JSON.stringify(dadosReavaliacao, null, 2));
              
              const response = await triagemService.registrarReavaliacao(patientId, dadosReavaliacao);
              console.log('✅ Resposta da API de reavaliação:', response);
              
              // Limpar alertas de reavaliação
              limparAlertasReavaliacao(patientId);
              
              // Recarregar dados
              await carregarTriagens();
              
              // Navegar de volta
              navigation.navigate('Dashboard');
            } catch (error) {
              console.error('❌ Erro ao finalizar reavaliação:', error);
              Alert.alert(
                'Erro',
                `Erro ao finalizar reavaliação: ${error.message}`,
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const updatePatientData = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStepContent = () => {
    console.log('🔍 Renderizando conteúdo da etapa:', currentStep);
    
    switch (currentStep) {
      case 1:
        return (
          <OptimizedClinicalDataStep
            data={patientData}
            onUpdate={updatePatientData}
            isReevaluation={true}
            onInputFocus={handleInputFocus}
          />
        );
      case 2:
        return (
          <RiskClassificationStep
            data={patientData}
            onUpdate={updatePatientData}
            isReevaluation={true}
            onRequestScrollToInput={(inputRef) => {
              if (stepLayoutRef.current?.scrollToFocusedInput) {
                stepLayoutRef.current.scrollToFocusedInput(inputRef);
              }
            }}
          />
        );
      default:
        return (
          <View style={styles.errorContainer}>
            <Text>Etapa não encontrada: {currentStep}</Text>
          </View>
        );
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // Apenas Pressão Arterial obrigatória na reavaliação
        return !!patientData.bloodPressure;
      case 2:
        return patientData.riskCategory && patientData.justification;
      default:
        return false;
    }
  };

  if (!originalPatient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorTitle}>Paciente não encontrado</Text>
        <Text style={styles.errorSubtitle}>
          O paciente selecionado não foi encontrado no sistema.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        >
          <Text style={styles.backButtonText}>Voltar ao Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const header = (
    <>
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          >
            <Ionicons name={icones.voltar} size={24} color={cores.branco} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Reavaliação</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.stepsRow}>
          {steps.map((step) => (
            <View key={`step-${step.id}`} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step.id && styles.stepCircleActive,
                  currentStep === step.id && styles.stepCircleCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={currentStep >= step.id ? '#2E86AB' : 'rgba(255, 255, 255, 0.7)'}
                />
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep >= step.id && styles.stepTitleActive,
                ]}
              >
                {step.title}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      {header}
      
      {/* Main Content */}
      <StepScreenLayout
        ref={stepLayoutRef}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onFinish={handleFinish}
        onGoBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        currentStep={currentStep}
        totalSteps={2}
        isLoading={isLoading}
        isStepValid={isStepValid()}
        previousText="Anterior"
        nextText="Próximo"
        finishText="Finalizar"
        showPrevious={true}
        previousDisabled={false}
        nextDisabled={!isStepValid()}
      >
        {renderStepContent()}
      </StepScreenLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.cinzaClaro,
  },
  header: {
    backgroundColor: cores.primaria,
    paddingTop: Platform.select({ ios: 50, android: (StatusBar.currentHeight || 24) + 10 }),
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: cores.branco,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: cores.transparenteMedio,
    textAlign: 'center',
    marginTop: 4,
  },
  headerSpacer: {
    width: 34,
  },
  progressContainer: {
    backgroundColor: '#2E86AB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepCircleActive: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCircleCurrent: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  stepTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 12,
  },
  stepTitleActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#2E86AB',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  previousButtonText: {
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  nextButtonText: {
    color: 'white',
    marginRight: 5,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: cores.cinzaClaro,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backButtonText: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReevaluationScreen;