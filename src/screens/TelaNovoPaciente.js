import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing, borderRadius, commonStyles, icons } from '../styles/designSystem';
import OptimizedClinicalDataStep from '../components/OptimizedClinicalDataStep';
import SafetyAssessmentStep from '../components/SafetyAssessmentStep';
import RiskClassificationStep from '../components/RiskClassificationStep';
import StepScreenLayout from '../components/StepScreenLayout';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { pacientesService } from '../services/pacientes.service';

const NewPatientScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { adicionarPacienteTriado, criarPaciente, criarTriagem, carregarTriagens } = usarPaciente();
  const { ehEnfermeiro } = usarAutenticacao();
  const [patientData, setPatientData] = useState({
    // Dados básicos do paciente
    cpf: '',
    name: '',
    birthDate: '',
    
    // Dados clínicos (Etapa 1)
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    symptoms: '',
    medicalHistory: '',
    
    // Avaliação de segurança (Etapa 2)
    allergies: [],
    comorbidities: [],
    chronicMedications: [],
    specialRiskPatients: [],
    additionalObservations: '',
    
    // Classificação de risco (Etapa 3)
    riskCategory: '',
    justification: '',
  });

  const clinicalRef = useRef(null);

  const stepLayoutRef = useRef(null);

  const steps = [
    { id: 1, title: 'Dados Clínicos', icon: 'medical' },
    { id: 2, title: 'Segurança', icon: 'shield-checkmark' },
    { id: 3, title: 'Classificação', icon: 'flag' },
  ];

  const handleNext = () => {
    if (!ehEnfermeiro()) {
      Alert.alert('Acesso restrito', 'Apenas enfermeiros podem iniciar triagem.', [{ text: 'OK', onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')) }]);
      return;
    }
    if (currentStep < 3) {
      if (currentStep === 1 && clinicalRef.current?.commitAllFields) {
        clinicalRef.current.commitAllFields();
      }
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

  const mapRiskCategory = (id) => {
    switch ((id || '').toLowerCase()) {
      case 'red': return 'VERMELHO';
      case 'orange': return 'LARANJA';
      case 'yellow': return 'AMARELO';
      case 'green': return 'VERDE';
      case 'blue': return 'AZUL';
      default: return '';
    }
  };

  const toNumberOrNull = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleFinish = async () => {
    if (clinicalRef.current?.commitAllFields) {
      clinicalRef.current.commitAllFields();
    }
    setIsLoading(true);
    try {
      const toIsoDate = (brDate) => {
        if (!brDate) return null;
        const m = String(brDate).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        return `${m[3]}-${m[2]}-${m[1]}`;
      };

      // Primeiro, obter ou criar o paciente (evitar 422 por CPF duplicado)
      let pacienteId = null;
      try {
        const existente = await pacientesService.buscarPacientePorCPF(patientData.cpf);
        pacienteId = existente?.dados?.id || existente?.dados?.dados?.id || existente?.dados?.paciente?.id || existente?.dados?.id;
      } catch (e) {
        // não encontrado, criar
      }

      if (!pacienteId) {
        // Obter dados completos do paciente do formulário expansível
        const patientFormData = clinicalRef.current?.getPatientData() || {};
        const isExistingPatient = clinicalRef.current?.isExistingPatient() || false;
        
        console.log('🔍 Dados do formulário expansível:', patientFormData);
        console.log('🔍 É paciente existente:', isExistingPatient);
        
        const patientResponse = await criarPaciente({
          nome_completo: patientData.name,
          cpf: patientData.cpf,
          data_nascimento: toIsoDate(patientData.birthDate),
          sexo: patientFormData.sexo || patientData.sex || 'M',
          telefone: patientFormData.telefone || patientData.phone || '',
          email: patientFormData.email || patientData.email || '',
          endereco: patientFormData.endereco || patientData.address || '',
          cidade: patientFormData.cidade || patientData.city || '',
          estado: patientFormData.estado || patientData.state || '',
          cep: patientFormData.cep || patientData.zipCode || '',
          nome_responsavel: patientFormData.nome_responsavel || '',
          telefone_responsavel: patientFormData.telefone_responsavel || '',
          observacoes: patientFormData.observacoes || patientData.observations || '',
        });
        pacienteId = patientResponse.dados.id;
        console.log('🔍 Paciente criado com ID:', pacienteId);
      } else {
        // Paciente já existe, atualizar dados cadastrais se foram modificados
        const patientFormData = clinicalRef.current?.getPatientData() || {};
        const isExistingPatient = clinicalRef.current?.isExistingPatient() || false;
        
        if (isExistingPatient && patientFormData) {
          console.log('🔍 Atualizando dados cadastrais do paciente existente:', patientFormData);
          
          try {
            await pacientesService.atualizarPaciente(pacienteId, {
              sexo: patientFormData.sexo || '',
              telefone: patientFormData.telefone || '',
              email: patientFormData.email || '',
              endereco: patientFormData.endereco || '',
              cidade: patientFormData.cidade || '',
              estado: patientFormData.estado || '',
              cep: patientFormData.cep || '',
              nome_responsavel: patientFormData.nome_responsavel || '',
              telefone_responsavel: patientFormData.telefone_responsavel || '',
              observacoes: patientFormData.observacoes || '',
            });
            console.log('✅ Dados cadastrais do paciente atualizados com sucesso');
          } catch (error) {
            console.error('❌ Erro ao atualizar dados cadastrais:', error);
            // Não falhar a triagem por erro na atualização dos dados cadastrais
          }
        }
      }

      console.log('🔍 Paciente ID final para triagem:', pacienteId);
      
      if (!pacienteId) {
        throw new Error('ID do paciente não foi definido');
      }

      // Depois, criar a triagem
      const dadosTriagem = {
        paciente_id: pacienteId,
        classificacao_risco: mapRiskCategory(patientData.riskCategory),
        dados_clinicos: {
          pressao_arterial: String(patientData.bloodPressure || ''),
          frequencia_cardiaca: toNumberOrNull(patientData.heartRate),
          temperatura: toNumberOrNull(patientData.temperature),
          frequencia_respiratoria: toNumberOrNull(patientData.respiratoryRate),
          saturacao_oxigenio: toNumberOrNull(patientData.oxygenSaturation),
          sintomas: patientData.symptoms,
          historico_medico: patientData.medicalHistory,
        },
        diagnosticos_enfermagem: patientData.nursingDiagnoses || [],
        intervencoes_enfermagem: patientData.nursingInterventions || [],
        avaliacao_seguranca: {
          alergias: patientData.allergies || [],
          comorbidades: patientData.comorbidities || [],
          medicamentos_cronicos: patientData.chronicMedications || [],
          pacientes_risco_especial: patientData.specialRiskPatients || [],
          observacoes_adicionais: patientData.additionalObservations || '',
        },
        observacoes: patientData.justification || '',
      };
      
      console.log('🔍 Dados da triagem sendo enviados:', JSON.stringify(dadosTriagem, null, 2));
      console.log('🔍 Classificação de risco mapeada:', mapRiskCategory(patientData.riskCategory));
      console.log('🔍 Risk category original:', patientData.riskCategory);
      
      const triageResponse = await criarTriagem(dadosTriagem);

      // Recarregar lista a partir do backend (sem quebrar fluxo se falhar)
      try {
        await carregarTriagens();
      } catch (e) {
        console.log('Falha ao recarregar triagens após criar:', e?.message);
      }
      
      Alert.alert(
        'Triagem Finalizada',
        `Paciente ${patientData.name} foi triado com sucesso`,
        [
          {
            text: 'OK',
            onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        `Erro ao salvar triagem: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientData = useCallback((field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OptimizedClinicalDataStep
            ref={clinicalRef}
            data={patientData}
            onUpdate={updatePatientData}
            onInputFocus={(inputRef, isLastRequired) => {
              // Conectar com StepScreenLayout para rolar até o campo focado
              try {
                const layoutRef = stepLayoutRef?.current;
                if (layoutRef?.scrollToFocusedInput) {
                  layoutRef.scrollToFocusedInput(inputRef, isLastRequired);
                }
              } catch (e) {}
            }}
          />
        );
      case 2:
        return (
          <SafetyAssessmentStep
            data={patientData}
            onUpdate={updatePatientData}
            onInputFocus={(inputRef) => {
              try {
                const layoutRef = stepLayoutRef?.current;
                layoutRef?.scrollToFocusedInput?.(inputRef);
              } catch (e) {}
            }}
          />
        );
      case 3:
        return (
          <RiskClassificationStep
            data={patientData}
            onUpdate={updatePatientData}
            onRequestScrollToInput={(inputRef) => {
              try {
                const layoutRef = stepLayoutRef?.current;
                layoutRef?.scrollToFocusedInput?.(inputRef);
              } catch (e) {}
            }}
          />
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // Apenas Pressão Arterial obrigatória em sinais vitais
        return !!patientData.bloodPressure;
      case 2:
        return true; // Etapa 2 é opcional
      case 3:
        return patientData.riskCategory && patientData.justification;
      default:
        return false;
    }
  };

  const header = (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.progressTitleContainer}>
          <Ionicons name="person-add" size={24} color="white" />
          <Text style={styles.progressTitle}>Nova Triagem</Text>
        </View>
        <View style={styles.progressSpacer} />
      </View>
      
      <View style={styles.stepsRow}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <View
              style={[
                styles.stepCircle,
                currentStep >= step.id && styles.stepCircleActive,
                currentStep === step.id && styles.stepCircleCurrent,
              ]}
            >
              <Ionicons
                name={step.icon}
                size={20}
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
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step.id && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
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
        totalSteps={3}
        isLoading={isLoading}
        isStepValid={isStepValid()}
        previousText="Anterior"
        nextText="Próximo"
        finishText="Finalizar"
        showPrevious={true}
        previousDisabled={false}
        nextDisabled={!isStepValid()}
        scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
      >
        {renderStepContent()}
      </StepScreenLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    backgroundColor: '#2E86AB',
    paddingTop: 50, // Espaço para a barra de status
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  progressSpacer: {
    width: 34,
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
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  stepTitleActive: {
    color: 'white',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 22.5,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: -1,
    borderRadius: 1.5,
  },
  stepLineActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  // Estilos de navegação removidos - usando NavigationButtons component
});

export default NewPatientScreen;

