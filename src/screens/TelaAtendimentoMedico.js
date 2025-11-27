import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, estilosComuns, icones } from '../styles/designSystem';
import { usarPaciente } from '../context/ContextoPaciente';
import { atendimentosService } from '../services/atendimentos.service';
import { formatDateToDDMMYYYY, calculateAge } from '../utils/dateUtils';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import StepScreenLayout from '../components/StepScreenLayout';

const { width: screenWidth } = Dimensions.get('window');

const MedicalTreatmentScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  console.log('🔍 AtendimentoMedico - PatientId recebido:', patientId);
  
  const { obterPacientePorId, removerPaciente, carregarTriagens } = usarPaciente();
  const { usuario: user } = usarAutenticacao();
  const fullDoctorName = (user?.nome_completo && String(user.nome_completo).trim()) 
    ? String(user.nome_completo).trim()
    : (user?.name && user?.sobrenome) 
      ? `${String(user.name).trim()} ${String(user.sobrenome).trim()}` 
      : (user?.name || user?.nome || 'Dr. Médico');
  
  // Estados principais
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarAnimation] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const stepsScrollRef = useRef(null);

  // Estados para os dados do atendimento
  const [treatmentData, setTreatmentData] = useState({
    medicalHistory: '',
    physicalExam: {
      headNeck: '',
      chest: '',
      abdomen: '',
      limbs: '',
      neurological: '',
      additional: ''
    },
    diagnoses: [],
    requestedExams: '',
    prescriptions: '',
    conduct: {
      decision: '',
      referral: '',
      recommendations: '',
      observations: ''
    },
    doctorName: fullDoctorName,
    treatmentStartTime: new Date().toISOString(),
    treatmentEndTime: null,
    status: 'em_atendimento'
  });

  // Mantém o nome completo do médico atualizado caso o usuário seja carregado/alterado após o estado inicial
  useEffect(() => {
    const computedName = (user?.nome_completo && String(user.nome_completo).trim()) 
      ? String(user.nome_completo).trim()
      : (user?.name && user?.sobrenome) 
        ? `${String(user.name).trim()} ${String(user.sobrenome).trim()}`
        : (user?.name || user?.nome || 'Dr. Médico');
    if (computedName && treatmentData.doctorName !== computedName) {
      setTreatmentData(prev => ({ ...prev, doctorName: computedName }));
    }
  }, [user]);

  // Entrada de diagnóstico livre
  const [newDiagnosisText, setNewDiagnosisText] = useState('');
 
  // Utilitários de risco (descrição e cor) usados na identificação
  const getRiskDescriptionFromCode = (category) => {
    const map = {
      red: 'Emergência',
      orange: 'Muito Urgente',
      yellow: 'Urgente',
      green: 'Pouco Urgente',
      blue: 'Não Urgente',
    };
    const key = String(category || '').toLowerCase();
    return map[key] || 'N/I';
    };

  const getRiskColorFromCode = (category) => {
    const colorsByCode = {
      red: '#FF0000',
      orange: '#FF8C00',
      yellow: '#FFD700',
      green: '#32CD32',
      blue: '#1E90FF',
    };
    const key = String(category || '').toLowerCase();
    return colorsByCode[key] || '#666';
  };

  // Etapas do atendimento
  const steps = [
    { id: 1, title: 'Identificação', icon: 'person', description: 'Dados do paciente e sinais vitais' },
    { id: 2, title: 'Anamnese', icon: 'chatbubbles', description: 'Histórico clínico e queixas' },
    { id: 3, title: 'Exame Físico', icon: 'medical', description: 'Avaliação física completa' },
    { id: 4, title: 'Diagnóstico', icon: 'clipboard', description: 'Hipóteses diagnósticas' },
    { id: 5, title: 'Exames', icon: 'flask', description: 'Solicitação de exames' },
    { id: 6, title: 'Prescrição', icon: 'medkit', description: 'Medicamentos prescritos' },
    { id: 7, title: 'Conduta', icon: 'checkmark-circle', description: 'Orientações e conduta' },
    { id: 8, title: 'Finalizar', icon: 'save', description: 'Conclusão do atendimento' }
  ];

  // Fazer scroll para a etapa atual quando o componente montar ou currentStep mudar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stepsScrollRef.current) {
        scrollToCurrentStep(currentStep);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Obter dados do paciente
  const patient = obterPacientePorId(patientId);
  console.log('🔍 AtendimentoMedico - Paciente encontrado:', patient);

  // Verificação de segurança - APÓS todos os hooks
  if (!patient) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Paciente não encontrado</Text>
          <Text style={styles.errorSubtext}>ID: {patientId}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Funções de controle
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const navigateToStep = (stepId) => {
    setCurrentStep(stepId);
    // Fazer scroll para a etapa atual
    scrollToCurrentStep(stepId);
    if (screenWidth < 768) {
      setSidebarVisible(false);
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const scrollToCurrentStep = (stepId) => {
    if (stepsScrollRef.current) {
      const stepWidth = 100; // Largura de cada etapa (80 + 20 de margin)
      const scrollPosition = (stepId - 1) * stepWidth;
      stepsScrollRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    } else {
      console.log('❌ ScrollView ref não está disponível');
    }
  };

  // Navegação entre etapas
  const handleNext = () => {
    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollToCurrentStep(nextStep);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollToCurrentStep(prevStep);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return treatmentData.medicalHistory && treatmentData.medicalHistory.trim().length > 0; // Anamnese obrigatória
      case 3:
        return true; // Exame Físico opcional
      case 4:
        return Array.isArray(treatmentData.diagnoses) && treatmentData.diagnoses.length > 0; // Diagnóstico obrigatório
      case 5:
        return true; // Exames opcionais
      case 6:
        return true; // Prescrição opcional
      case 7:
        return treatmentData.conduct.decision && treatmentData.conduct.decision.trim().length > 0; // Conduta (decisão) obrigatória
      case 8:
        return true;
      default:
        return false;
    }
  };

  const handleFinish = () => {
    const decision = treatmentData.conduct.decision;
    const referral = (treatmentData.conduct.referral || '').trim();

    if (!decision) {
      Alert.alert(
        'Campo obrigatório',
        'Selecione uma decisão: Alta ou Observação.',
        [{ text: 'OK', onPress: () => setCurrentStep(7) }]
      );
      return;
    }

    if (decision === 'Observação' && !referral) {
      Alert.alert(
        'Encaminhamento obrigatório',
        'Informe o encaminhamento ao escolher Observação.',
        [{ text: 'OK', onPress: () => setCurrentStep(7) }]
      );
      return;
    }

    Alert.alert(
      'Finalizar Atendimento',
      'Deseja finalizar o atendimento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            if (decision === 'Observação') {
              try {
                const pacienteId = patient.patientId || patient.idPaciente || patient.id;
                const examesSolicitados = Array.isArray(treatmentData.requestedExams) 
                  ? treatmentData.requestedExams 
                  : (treatmentData.requestedExams ? [treatmentData.requestedExams] : []);
                const prescricoes = Array.isArray(treatmentData.prescriptions) 
                  ? treatmentData.prescriptions 
                  : (treatmentData.prescriptions ? [treatmentData.prescriptions] : []);
                const diagnosticos = Array.isArray(treatmentData.diagnoses) 
                  ? treatmentData.diagnoses 
                  : (treatmentData.diagnoses ? [treatmentData.diagnoses] : []);

                const dadosAtendimento = {
                  paciente_id: pacienteId,
                  triagem_id: patient.id,
                  historico_medico: treatmentData.medicalHistory || '',
                  exame_fisico: treatmentData.physicalExam || {},
                  diagnosticos: diagnosticos,
                  exames_solicitados: examesSolicitados,
                  prescricoes: prescricoes,
                  conduta: treatmentData.conduct || {},
                };

                const criarResp = await atendimentosService.criar(dadosAtendimento);
                const atendimentoId = criarResp?.dados?.id;
                if (!atendimentoId) throw new Error('ID do atendimento não foi retornado pela API');
                await atendimentosService.observar(atendimentoId, treatmentData.conduct.referral);
                await carregarTriagens();
                navigation.navigate('Dashboard');
                return;
              } catch (e) {
                Alert.alert('Erro', `Falha ao enviar para observação: ${e.message || 'Erro desconhecido'}`);
                return;
              }
            }
            try {
              const pacienteIdParaAtendimento = patient.patientId || patient.idPaciente || patient.id;
              const examesSolicitados = Array.isArray(treatmentData.requestedExams) 
                ? treatmentData.requestedExams 
                : (treatmentData.requestedExams ? [treatmentData.requestedExams] : []);
              const prescricoes = Array.isArray(treatmentData.prescriptions) 
                ? treatmentData.prescriptions 
                : (treatmentData.prescriptions ? [treatmentData.prescriptions] : []);
              const diagnosticos = Array.isArray(treatmentData.diagnoses) 
                ? treatmentData.diagnoses 
                : (treatmentData.diagnoses ? [treatmentData.diagnoses] : []);

              const dadosAtendimento = {
                paciente_id: pacienteIdParaAtendimento,
                triagem_id: patient.idTriagem || patient.id,
                historico_medico: treatmentData.medicalHistory || '',
                exame_fisico: treatmentData.physicalExam || {},
                diagnosticos: diagnosticos,
                exames_solicitados: examesSolicitados,
                prescricoes: prescricoes,
                conduta: treatmentData.conduct || {},
              };

              const criarResp = await atendimentosService.criar(dadosAtendimento);
              const atendimentoId = criarResp?.dados?.id;
              if (!atendimentoId) throw new Error('ID do atendimento não foi retornado pela API');
              await atendimentosService.finalizar(atendimentoId);
              await carregarTriagens();
              navigation.navigate('Dashboard');
              return;
            } catch (e) {
              Alert.alert('Erro', `Falha ao finalizar atendimento: ${e.message || 'Erro desconhecido'}`);
              return;
            }
          }
        }
      ]
    );
  };

  // Atualizações de estado
  const updateTreatmentData = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePhysicalExam = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      physicalExam: {
        ...prev.physicalExam,
        [field]: value
      }
    }));
  };

  const updateConduct = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      conduct: {
        ...prev.conduct,
        [field]: value
      }
    }));
  };

  const addDiagnosis = (diagnosisData, isPrincipal = false) => {
    const text = typeof diagnosisData === 'string' ? diagnosisData : (diagnosisData?.name || diagnosisData?.diagnosis || diagnosisData);
    const trimmed = (text || '').toString().trim();
    if (!trimmed) return;
    const newDiagnosis = {
      id: Date.now(),
      diagnosis: trimmed,
      code: diagnosisData?.code || null,
      category: diagnosisData?.category || 'Diagnóstico livre',
      isPrincipal: isPrincipal
    };
    setTreatmentData(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, newDiagnosis]
    }));
  };

  const addTypedDiagnosis = () => {
    const value = (newDiagnosisText || '').trim();
    if (!value) {
      Alert.alert('Diagnóstico', 'Digite um diagnóstico antes de adicionar.');
      return;
    }
    addDiagnosis(value);
    setNewDiagnosisText('');
  };

  const removeDiagnosis = (id) => {
    setTreatmentData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter(d => d.id !== id)
    }));
  };

  const togglePrincipalDiagnosis = (id) => {
    setTreatmentData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d => d.id === id ? { ...d, isPrincipal: !d.isPrincipal } : { ...d, isPrincipal: false })
    }));
  };

  // Renderização por etapa
  const renderPatientIdentification = () => {
    if (!patient) return null;
    return (
      <View style={styles.formStepContainer}>
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <Text style={styles.patientName}>{patient.nome || 'Nome não disponível'}</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColorFromCode(patient.categoriaRisco) }]}>
              <Text style={styles.riskText}>{getRiskDescriptionFromCode(patient.categoriaRisco)}</Text>
            </View>
          </View>

          <View style={styles.patientInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                Nascimento: {patient.dataNascimento ? formatDateToDDMMYYYY(patient.dataNascimento) : 'N/I'} {calculateAge(patient.dataNascimento) ? `(${calculateAge(patient.dataNascimento)} anos)` : ''}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="male-female" size={20} color="#666" />
              <Text style={styles.infoText}>
                Sexo: {patient.sexo || 'N/I'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.infoText}>
                Triagem: {patient.dataTriagem ? new Date(patient.dataTriagem).toLocaleString('pt-BR') : 'N/I'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.infoText}>
                Enfermeiro: {patient.enfermeiroTriagem || 'Enfermeiro Responsável'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dados Clínicos/Sinais Vitais */}
        <View style={styles.clinicalDataCard}>
          <View style={styles.clinicalDataHeader}>
            <Ionicons name="pulse" size={20} color="#2E86AB" />
            <Text style={styles.clinicalDataTitle}>Dados Clínicos da Triagem</Text>
          </View>

          <View style={styles.clinicalDataGrid}>
            {/* Sinais Vitais */}
            <View style={styles.vitalSignsSection}>
              <Text style={styles.sectionTitle}>Sinais Vitais</Text>

              <View style={styles.vitalSignsGrid}>
                <View style={styles.vitalSignItem}>
                  <Ionicons name="heart" size={16} color="#e74c3c" />
                  <Text style={styles.vitalSignLabel}>PA:</Text>
                  <Text style={styles.vitalSignValue}>{patient.pressaoArterial || 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="pulse" size={16} color="#e74c3c" />
                  <Text style={styles.vitalSignLabel}>FC:</Text>
                  <Text style={styles.vitalSignValue}>{patient.frequenciaCardiaca || 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="thermometer" size={16} color="#f39c12" />
                  <Text style={styles.vitalSignLabel}>Temp:</Text>
                  <Text style={styles.vitalSignValue}>{patient.temperatura ? `${patient.temperatura}°C` : 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="lungs" size={16} color="#3498db" />
                  <Text style={styles.vitalSignLabel}>FR:</Text>
                  <Text style={styles.vitalSignValue}>{patient.frequenciaRespiratoria || 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="water" size={16} color="#3498db" />
                  <Text style={styles.vitalSignLabel}>SpO₂:</Text>
                  <Text style={styles.vitalSignValue}>{patient.saturacaoOxigenio ? `${patient.saturacaoOxigenio}%` : 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="scale" size={16} color="#9b59b6" />
                  <Text style={styles.vitalSignLabel}>Peso:</Text>
                  <Text style={styles.vitalSignValue}>{patient.peso ? `${patient.peso}kg` : 'N/I'}</Text>
                </View>

                <View style={styles.vitalSignItem}>
                  <Ionicons name="resize" size={16} color="#9b59b6" />
                  <Text style={styles.vitalSignLabel}>Altura:</Text>
                  <Text style={styles.vitalSignValue}>{patient.altura ? `${patient.altura}cm` : 'N/I'}</Text>
                </View>
              </View>
            </View>

            {/* Sintomas e Histórico */}
            {(patient.sintomas || patient.historicoMedico) && (
              <View style={styles.symptomsSection}>
                <Text style={styles.sectionTitle}>Informações Clínicas</Text>
                {patient.sintomas ? (
                  <View style={styles.clinicalInfoItem}>
                    <Ionicons name="medical" size={16} color="#27ae60" />
                    <View style={styles.clinicalInfoContent}>
                      <Text style={styles.clinicalInfoLabel}>Sintomas:</Text>
                      <Text style={styles.clinicalInfoValue}>{patient.sintomas}</Text>
                    </View>
                  </View>
                ) : null}
                {patient.historicoMedico ? (
                  <View style={styles.clinicalInfoItem}>
                    <Ionicons name="document-text" size={16} color="#27ae60" />
                    <View style={styles.clinicalInfoContent}>
                      <Text style={styles.clinicalInfoLabel}>Histórico Médico:</Text>
                      <Text style={styles.clinicalInfoValue}>{patient.historicoMedico}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderMedicalHistory = () => (
    <View style={styles.formStepContainer}>
      <View style={styles.sectionContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Histórico Clínico e Queixas Principais</Text>
          <TextInput
            style={[styles.enhancedTextArea, styles.textAreaWithFocus]}
            placeholder="Descreva detalhadamente o histórico clínico, queixas principais, sintomas, duração, fatores desencadeantes..."
            placeholderTextColor="#999"
            value={treatmentData.medicalHistory}
            onChangeText={(text) => updateTreatmentData('medicalHistory', text)}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {treatmentData.medicalHistory.length} caracteres
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPhysicalExam = () => (
    <ScrollView 
      style={styles.formStepContainer}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.examScrollContent}
    >
      <View style={styles.examGrid}>
        {[
          { key: 'headNeck', label: 'Cabeça e Pescoço', icon: 'person', color: '#3498db' },
          { key: 'chest', label: 'Tórax', icon: 'heart', color: '#e74c3c' },
          { key: 'abdomen', label: 'Abdome', icon: 'ellipse', color: '#f39c12' },
          { key: 'limbs', label: 'Membros', icon: 'walk', color: '#27ae60' },
          { key: 'neurological', label: 'Neurológico', icon: 'pulse', color: '#9b59b6' }
        ].map((section) => (
          <View key={section.key} style={styles.enhancedExamSection}>
            <View style={styles.examSectionHeader}>
              <View style={[styles.examIconContainer, { backgroundColor: section.color + '20' }]}> 
                <Ionicons name={section.icon} size={20} color={section.color} />
              </View>
              <Text style={styles.enhancedExamSectionTitle}>{section.label}</Text>
            </View>
            <TextInput
              style={styles.enhancedExamInput}
              placeholder={`Descreva detalhadamente o exame de ${section.label.toLowerCase()}...`}
              placeholderTextColor="#999"
              value={treatmentData.physicalExam[section.key]}
              onChangeText={(text) => updatePhysicalExam(section.key, text)}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        ))}
      </View>
      <View style={styles.enhancedExamSection}>
        <View style={styles.examSectionHeader}>
          <View style={[styles.examIconContainer, { backgroundColor: '#34495e20' }]}> 
            <Ionicons name="document-text" size={20} color="#34495e" />
          </View>
          <Text style={styles.enhancedExamSectionTitle}>Observações Complementares</Text>
        </View>
        <TextInput
          style={styles.enhancedExamInput}
          placeholder="Outras observações importantes do exame físico..."
          placeholderTextColor="#999"
          value={treatmentData.physicalExam.additional}
          onChangeText={(text) => updatePhysicalExam('additional', text)}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
    </ScrollView>
  );

  const renderDiagnosis = () => (
    <View style={styles.diagnosisStepContainer}>
      {treatmentData.diagnoses.length > 0 ? (
        <View style={styles.diagnosesList}>
          {treatmentData.diagnoses.map((diagnosis, index) => (
            <View key={diagnosis.id || index} style={styles.enhancedDiagnosisItem}>
              <View style={styles.diagnosisCardHeader}>
                <View style={styles.diagnosisCardInfo}>
                  <View style={styles.diagnosisCardTop}>
                    {diagnosis.code ? (
                      <View style={styles.diagnosisCodeBadge}>
                        <Text style={styles.diagnosisCodeText}>{diagnosis.code}</Text>
                      </View>
                    ) : null}
                    {diagnosis.category ? (
                      <View style={[styles.categoryBadge, { backgroundColor: '#e3f2fd' }]}>
                        <Text style={styles.categoryText}>{diagnosis.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.diagnosisCardName}>
                    {diagnosis.diagnosis || 'Diagnóstico não especificado'}
                  </Text>
                </View>
                <View style={styles.diagnosisCardActions}>
                  {diagnosis.isPrincipal && (
                    <View style={styles.principalBadge}>
                      <Ionicons name="star" size={12} color="white" />
                      <Text style={styles.principalText}>PRINCIPAL</Text>
                    </View>
                  )}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.diagnosisActionButton, diagnosis.isPrincipal && styles.activeActionButton]}
                      onPress={() => togglePrincipalDiagnosis(diagnosis.id)}
                    >
                      <Ionicons 
                        name={diagnosis.isPrincipal ? "star" : "star-outline"} 
                        size={18} 
                        color={diagnosis.isPrincipal ? "#f39c12" : "#666"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.diagnosisActionButton}
                      onPress={() => removeDiagnosis(diagnosis.id)}
                    >
                      <Ionicons name="trash" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.enhancedEmptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="clipboard-outline" size={48} color="#ccc" />
          </View>
          <Text style={styles.enhancedEmptyStateTitle}>Nenhum diagnóstico adicionado</Text>
          <Text style={styles.enhancedEmptyStateSubtitle}>
            Informe o diagnóstico clínico para registrar o atendimento
          </Text>
        </View>
      )}

      {/* Entrada de diagnóstico livre */}
      <View style={styles.sectionContainer}>
        <Text style={styles.inputLabel}>Adicionar diagnóstico (texto livre)</Text>
        <TextInput
          style={[styles.enhancedTextArea, styles.textAreaWithFocus]}
          placeholder="Digite o diagnóstico (ex.: Pneumonia bacteriana, Dor torácica inespecífica, etc.)"
          placeholderTextColor="#999"
          value={newDiagnosisText}
          onChangeText={setNewDiagnosisText}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
          <TouchableOpacity style={styles.addMoreButton} onPress={addTypedDiagnosis}>
            <Ionicons name="add" size={20} color="#2E86AB" />
            <Text style={styles.addMoreButtonText}>Adicionar Diagnóstico</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderExams = () => (
    <View style={styles.formStepContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Exames Solicitados</Text>
        <TextInput
          style={[styles.enhancedTextArea, styles.textAreaWithFocus]}
          placeholder="Descreva os exames complementares solicitados (ex: hemograma completo, RX de tórax, ECG...)"
          placeholderTextColor="#999"
          value={treatmentData.requestedExams}
          onChangeText={(text) => updateTreatmentData('requestedExams', text)}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <View style={styles.characterCount}>
          <Text style={styles.characterCountText}>
            {treatmentData.requestedExams.length} caracteres
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPrescriptions = () => (
    <View style={styles.formStepContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Medicamentos Prescritos</Text>
        <TextInput
          style={[styles.enhancedTextArea, styles.textAreaWithFocus]}
          placeholder="Descreva os medicamentos prescritos com dosagem, via de administração, intervalo e duração (ex: Dipirona 500mg, VO, 6/6h, 3 dias...)"
          placeholderTextColor="#999"
          value={treatmentData.prescriptions}
          onChangeText={(text) => updateTreatmentData('prescriptions', text)}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <View style={styles.characterCount}>
          <Text style={styles.characterCountText}>
            {treatmentData.prescriptions.length} caracteres
          </Text>
        </View>
      </View>
    </View>
  );

  const renderConduct = () => (
    <View style={styles.formStepContainer}>
      <View style={styles.enhancedConductCard}>
        <View style={styles.conductCardHeader}>
          <Ionicons name="medical" size={24} color="#2E86AB" />
          <Text style={styles.conductCardTitle}>Decisão Médica</Text>
        </View>
        <Text style={styles.conductCardDescription}>
          Selecione a conduta final para o paciente
        </Text>
        <View style={styles.enhancedConductOptions}>
          {[
            { key: 'Alta', label: 'Alta Médica', icon: 'checkmark-circle', color: '#27ae60', description: 'Paciente liberado para casa' },
            { key: 'Observação', label: 'Observação', icon: 'eye', color: '#f39c12', description: 'Paciente permanece em observação' }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.enhancedConductOption, treatmentData.conduct.decision === option.key && styles.enhancedConductOptionSelected, { borderColor: option.color }]}
              onPress={() => updateConduct('decision', option.key)}
              activeOpacity={0.7}
            >
              <View style={styles.conductOptionContent}>
                <View style={[styles.conductOptionIcon, { backgroundColor: treatmentData.conduct.decision === option.key ? option.color : option.color + '20' }]}>
                  <Ionicons name={option.icon} size={24} color={treatmentData.conduct.decision === option.key ? 'white' : option.color} />
                </View>
                <View style={styles.conductOptionTextContainer}>
                  <Text style={[styles.enhancedConductOptionText, treatmentData.conduct.decision === option.key && { color: option.color }]}>
                    {option.label}
                  </Text>
                  <Text style={styles.conductOptionDescription}>{option.description}</Text>
                </View>
                {treatmentData.conduct.decision === option.key && (
                  <View style={[styles.conductOptionCheck, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={16} color="white" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.enhancedConductCard}>
        <View style={styles.conductCardHeader}>
          <Ionicons name="arrow-forward" size={24} color="#2E86AB" />
          <Text style={styles.conductCardTitle}>Encaminhamento</Text>
        </View>
        <Text style={styles.conductCardDescription}>
          Especialidade ou unidade de destino (obrigatório se Observação)
        </Text>
        <View style={styles.enhancedInputContainer}>
          <TextInput
            style={[styles.enhancedConductInput, treatmentData.conduct.decision === 'Observação' && !treatmentData.conduct.referral && styles.requiredField]}
            placeholder="Ex: Cardiologia, UTI, Ambulatório..."
            placeholderTextColor="#999"
            value={treatmentData.conduct.referral}
            onChangeText={(text) => updateConduct('referral', text)}
          />
          {treatmentData.conduct.decision === 'Observação' && !treatmentData.conduct.referral && (
            <View style={styles.requiredIndicator}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={styles.requiredText}>Obrigatório</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.enhancedConductCard}>
        <View style={styles.conductCardHeader}>
          <Ionicons name="document-text" size={24} color="#2E86AB" />
          <Text style={styles.conductCardTitle}>Recomendações</Text>
        </View>
        <Text style={styles.conductCardDescription}>Cuidados pós-atendimento e orientações para o paciente</Text>
        <View style={styles.enhancedTextAreaContainer}>
          <TextInput
            style={styles.enhancedTextArea}
            placeholder="• Retornar em caso de piora\n• Tomar medicação conforme prescrito\n• Repouso relativo\n• Evitar esforços físicos..."
            placeholderTextColor="#999"
            value={treatmentData.conduct.recommendations}
            onChangeText={(text) => updateConduct('recommendations', text)}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
      </View>

      <View style={styles.enhancedConductCard}>
        <View style={styles.conductCardHeader}>
          <Ionicons name="clipboard" size={24} color="#2E86AB" />
          <Text style={styles.conductCardTitle}>Observações Adicionais</Text>
        </View>
        <Text style={styles.conductCardDescription}>Informações complementares sobre o atendimento</Text>
        <View style={styles.enhancedTextAreaContainer}>
          <TextInput
            style={styles.enhancedTextArea}
            placeholder="Observações sobre o estado do paciente, evolução durante o atendimento, informações relevantes para o próximo atendimento..."
            placeholderTextColor="#999"
            value={treatmentData.conduct.observations}
            onChangeText={(text) => updateConduct('observations', text)}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
      </View>
    </View>
  );

  const renderFinalization = () => {
    // Garantir que o nome do médico esteja sempre atualizado
    let doctorName = treatmentData.doctorName;
    
    if (!doctorName || doctorName.trim() === '' || doctorName === 'Dr. Médico') {
      if (user?.nome_completo && String(user.nome_completo).trim()) {
        doctorName = String(user.nome_completo).trim();
      } else if (user?.name && user?.sobrenome) {
        doctorName = `${String(user.name).trim()} ${String(user.sobrenome).trim()}`;
      } else if (user?.name || user?.nome) {
        doctorName = user.name || user.nome;
      } else {
        doctorName = 'Médico Responsável';
      }
    }
    
    return (
      <View style={styles.formStepContainer}>
        <View style={styles.finalizationSummary}>
          <Text style={styles.summaryTitle}>Resumo do Atendimento</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paciente:</Text>
            <Text style={styles.summaryValue}>{patient.nome}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Médico:</Text>
            <Text style={styles.summaryValue}>{doctorName}</Text>
          </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Início:</Text>
          <Text style={styles.summaryValue}>{new Date(treatmentData.treatmentStartTime).toLocaleString('pt-BR')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Conduta:</Text>
          <Text style={styles.summaryValue}>{treatmentData.conduct.decision}</Text>
        </View>
        {treatmentData.conduct.referral && (
          <View style={styles.summaryItemVertical}>
            <Text style={styles.summaryLabelVertical}>Encaminhamento:</Text>
            <TextInput style={styles.summaryTextArea} value={treatmentData.conduct.referral} editable={false} multiline scrollEnabled />
          </View>
        )}
        {treatmentData.conduct.recommendations && (
          <View style={styles.summaryItemVertical}>
            <Text style={styles.summaryLabelVertical}>Recomendações:</Text>
            <TextInput style={styles.summaryTextArea} value={treatmentData.conduct.recommendations} editable={false} multiline scrollEnabled />
          </View>
        )}
        {treatmentData.conduct.observations && (
          <View style={styles.summaryItemVertical}>
            <Text style={styles.summaryLabelVertical}>Observações:</Text>
            <TextInput style={styles.summaryTextArea} value={treatmentData.conduct.observations} editable={false} multiline scrollEnabled />
          </View>
        )}
      </View>
    </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPatientIdentification();
      case 2:
        return renderMedicalHistory();
      case 3:
        return renderPhysicalExam();
      case 4:
        return renderDiagnosis();
      case 5:
        return renderExams();
      case 6:
        return renderPrescriptions();
      case 7:
        return renderConduct();
      case 8:
        return renderFinalization();
      default:
        return null;
    }
  };

  const renderModal = () => {
    // Modal de diagnóstico removido (uso de texto livre)
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header Padronizado */}
      <View style={[estilosComuns.header, styles.headerCustom]}>
        <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
        <View style={estilosComuns.headerContent}>
          <TouchableOpacity
            style={estilosComuns.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          >
            <Ionicons name={icones.voltar} size={24} color={cores.branco} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleContainer}>
              <Text style={[estilosComuns.headerTitle, styles.headerTitleCustom]}>Atendimento Médico</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sidebarToggle}
            onPress={toggleSidebar}
          >
            <Ionicons name={icones.menu} size={24} color={cores.branco} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContentArea}>
        <View style={styles.mainContainer}>
          {/* Sidebar Menu */}
          <Animated.View 
            style={[
              styles.sidebar,
              {
                transform: [{
                  translateX: sidebarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-280, 0]
                  })
                }]
              }
            ]}
          >
            {/* ... sidebar permanece igual ... */}
          </Animated.View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Progress Steps */}
            <View style={styles.progressContainer}>
              <ScrollView 
                ref={stepsScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.stepsScrollView}
                contentContainerStyle={styles.stepsScrollContent}
                decelerationRate="fast"
                snapToInterval={100}
                snapToAlignment="center"
              >
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
                        size={16}
                        color={currentStep >= step.id ? '#2E86AB' : 'rgba(255, 255, 255, 0.7)'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stepTitle,
                        currentStep >= step.id && styles.stepTitleActive,
                      ]}
                      numberOfLines={2}
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
              </ScrollView>
            </View>

            {/* Step Content com StepScreenLayout */}
            <StepScreenLayout
              onPrevious={handlePrevious}
              onNext={handleNext}
              onFinish={handleFinish}
              onGoBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
              currentStep={currentStep}
              totalSteps={8}
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
        </View>
      </View>

      {/* Modals */}
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContentArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarContent: {
    flex: 1,
    padding: 10,
  },
  sidebarItem: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  sidebarItemActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  sidebarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarIconActive: {
    backgroundColor: '#2E86AB',
  },
  sidebarTextContainer: {
    flex: 1,
  },
  sidebarItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  sidebarItemTitleActive: {
    color: '#2E86AB',
  },
  sidebarItemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  contentContainer: {
    flex: 1,
    marginLeft: screenWidth < 768 ? 0 : 280,
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    backgroundColor: '#2E86AB',
    paddingVertical: 15,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressIndicator: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  stepsScrollView: {
    height: 80,
    width: '100%',
  },
  stepsScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 800, // Largura mínima para acomodar todas as 8 etapas
  },
  stepContainer: {
    width: 80,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 10,
  },
  formStepContainer: {
    flex: 1,
    padding: 20,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    minHeight: 24,
  },
  stepTitleActive: {
    color: 'white',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: -1,
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicalDataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicalDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  clinicalDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E86AB',
    marginLeft: 8,
  },
  clinicalDataGrid: {
    gap: 20,
  },
  vitalSignsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalSignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    flex: 1,
  },
  vitalSignLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 4,
  },
  vitalSignValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  symptomsSection: {
    gap: 12,
  },
  clinicalInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  clinicalInfoContent: {
    flex: 1,
    marginLeft: 8,
  },
  clinicalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 4,
  },
  clinicalInfoValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patientInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  enhancedTextArea: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    height: 150,
    minHeight: 150,
    maxHeight: 150,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textAreaWithFocus: {
    borderColor: '#2E86AB',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  examGrid: {
    gap: 16,
    marginBottom: 20,
  },
  examScrollContent: {
    paddingBottom: 20,
  },
  enhancedExamSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  examSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  examIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedExamSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  enhancedExamInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    height: 150,
    minHeight: 150,
    maxHeight: 150,
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  diagnosisStepContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    minHeight: 200,
    position: 'relative',
    zIndex: 1,
  },
  diagnosesList: {
    gap: 12,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  enhancedDiagnosisItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    position: 'relative',
    zIndex: 2,
  },
  diagnosisCardInfo: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  diagnosisCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  diagnosisCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  diagnosisCodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  diagnosisCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  diagnosisCardActions: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
    position: 'relative',
    zIndex: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  activeActionButton: {
    backgroundColor: '#f39c1220',
    borderColor: '#f39c12',
  },
  principalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  principalText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diagnosisActionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedEmptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  enhancedEmptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  enhancedEmptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2E86AB',
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: 'bold',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#2E86AB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  addMoreButtonText: {
    fontSize: 16,
    color: '#2E86AB',
    marginLeft: 8,
    fontWeight: '500',
  },
  enhancedConductCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  conductCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conductCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginLeft: 12,
  },
  conductCardDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  enhancedConductOptions: {
    gap: 12,
  },
  enhancedConductOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  enhancedConductOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
  },
  conductOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conductOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  conductOptionTextContainer: {
    flex: 1,
  },
  enhancedConductOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  conductOptionDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  conductOptionCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedInputContainer: {
    position: 'relative',
  },
  enhancedConductInput: {
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
    height: 150,
    minHeight: 150,
    maxHeight: 150,
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    flex: 1,
    textAlignVertical: 'top',
  },
  requiredField: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2',
  },
  requiredIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  requiredText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  enhancedTextAreaContainer: {
    position: 'relative',
  },
  textAreaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  textAreaHint: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
  },
  finalizationSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  summaryTextArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    height: 100,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    marginTop: 5,
  },
  summaryItemVertical: {
    marginBottom: 15,
  },
  summaryLabelVertical: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
  previousButtonText: {
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  nextButtonText: {
    color: 'white',
    marginRight: 5,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '95%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  enhancedModalList: {
    maxHeight: 400,
  },
  enhancedModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  diagnosisItemContent: {
    flex: 1,
  },
  diagnosisItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
  diagnosisItemCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diagnosisItemName: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptySearchState: {
    alignItems: 'center',
    padding: 40,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#2E86AB',
    padding: 15,
    borderRadius: 8,
    margin: 20,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilos customizados para header
  headerCustom: {
    backgroundColor: cores.primaria,
  },
  headerTitleCustom: {
    color: cores.branco,
    marginLeft: 8,
  },
  headerSubtitleCustom: {
    color: cores.transparentMedium,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarToggle: {
    padding: 5,
  },
});

export default MedicalTreatmentScreen;