import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usarPaciente } from '../context/ContextoPaciente';
import { atendimentosService } from '../services/atendimentos.service';
import { triagemService } from '../services/triagem.service';
import { usarAutenticacao } from '../context/ContextoAutenticacao';

// Cores do protocolo Manchester
const MANCHESTER_COLORS = {
  red: '#FF0000',      // Emergência (0-10 min)
  orange: '#FF8C00',   // Muito urgente (10-60 min)
  yellow: '#FFD700',   // Urgente (60-240 min)
  green: '#32CD32',    // Padrão (240+ min)
  blue: '#1E90FF',     // Não urgente (até 24h)
};

const InternalProceduresScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [guidanceVisible, setGuidanceVisible] = useState(false);
  const { obterPacientesTriados, atualizarPaciente, removerPaciente, carregarTriagens } = usarPaciente();
  const { ehEnfermeiro, ehMedico, usuario } = usarAutenticacao();

  // Obter apenas pacientes em observação (procedimentos internos) - não finalizados
  const allPatients = obterPacientesTriados() || [];
  console.log('📊 Total de pacientes carregados:', allPatients.length);
  
  const patients = allPatients.filter(patient => {
    // Verificar se está em observação e não foi finalizado
    const isInObservation = patient.status === 'observacao';
    const isNotDischarged = !patient.dischargeTime;
    const isNotFinalized = patient.status !== 'finalizado';
    
    // Verificações adicionais para garantir que não foi liberado
    const hasActiveObservation = patient.observationStartTime && !patient.dischargeTime;
    const isNotReleased = !patient.dischargeTime && patient.status !== 'finalizado';
    
    console.log(`Paciente ${patient.name}: status=${patient.status}, dischargeTime=${patient.dischargeTime}, isInObservation=${isInObservation}, isNotDischarged=${isNotDischarged}, isNotFinalized=${isNotFinalized}, hasActiveObservation=${hasActiveObservation}, isNotReleased=${isNotReleased}`);
    
    return isInObservation && isNotDischarged && isNotFinalized && hasActiveObservation && isNotReleased;
  });
  
  console.log('📊 Pacientes em procedimentos internos:', patients.length);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Recarregar do backend através do contexto
      await carregarTriagens?.();
    } finally {
      setRefreshing(false);
    }
  };

  // Atualizar a lista ao focar na tela (ex.: após enviar para observação)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarTriagens?.();
    });
    return unsubscribe;
  }, [navigation, carregarTriagens]);

  const handlePatientCardPress = (patient) => {
    setSelectedPatient(patient);
    setActionMenuVisible(true);
  };

  const handleSAE = (patient) => {
    navigation.navigate('SAE', { patientId: patient.id });
  };

  const handleViewSAE = (patient) => {
    navigation.navigate('ViewSAE', { patientId: patient.patientId });
  };

  const handleReevaluate = (patient) => {
    navigation.navigate('Reevaluation', { patientId: patient.id });
  };

  const handleCloseActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedPatient(null);
  };

  const liberarPaciente = async (patient) => {
    try {
      console.log('🔄 Liberando paciente:', patient.name);
      
      // Buscar todos os atendimentos em observação para este paciente
      console.log('🔄 Buscando todos os atendimentos em observação...');
      const atendimentosResponse = await atendimentosService.listar({ 
        paciente_id: patient.patientId,
        status: 'OBSERVACAO'
      });
      
      const atendimentosEmObs = atendimentosResponse.dados?.data || [];
      console.log(`📊 Encontrados ${atendimentosEmObs.length} atendimentos em observação`);
      
      // Finalizar todos os atendimentos em observação
      for (const atendimento of atendimentosEmObs) {
        console.log(`🔄 Finalizando atendimento ${atendimento.id}...`);
        await atendimentosService.finalizar(atendimento.id);
      }
      
      // Concluir triagem no backend (só se não estiver já concluída)
      if (patient?.id) {
        console.log('🔄 Verificando status da triagem:', patient.id);
        try {
          await triagemService.concluirTriagem(patient.id);
          console.log('✅ Triagem concluída');
        } catch (triagemError) {
          console.log('ℹ️ Triagem já estava concluída ou erro:', triagemError.message);
        }
      }
      
      // Recarregar dados do backend para atualizar a lista
      console.log('🔄 Recarregando dados...');
      await carregarTriagens();
      
      setActionMenuVisible(false);
      setSelectedPatient(null);
      
      console.log('✅ Paciente liberado com sucesso');
      Alert.alert('Paciente liberado', 'Observação finalizada e alta concedida.');
    } catch (e) {
      console.log('❌ Erro ao liberar paciente:', e.message);
      Alert.alert('Erro', e.message || 'Falha ao liberar paciente');
    }
  };

  const PatientCard = ({ patient }) => {
    // Mapear categoria de risco para cores e textos
    const getPriorityInfo = (riskCategory) => {
      const priorityMap = {
        'red': { color: 'red', text: 'Emergência' },
        'orange': { color: 'orange', text: 'Muito Urgente' },
        'yellow': { color: 'yellow', text: 'Urgente' },
        'green': { color: 'green', text: 'Pouco Urgente' },
        'blue': { color: 'blue', text: 'Não Urgente' },
      };
      return priorityMap[riskCategory] || { color: 'blue', text: 'Não Urgente' };
    };

    const priorityInfo = getPriorityInfo(patient.riskCategory);

    // Função para formatar observação médica
    const formatMedicalObservation = (observacao) => {
      if (typeof observacao === 'string') {
        return observacao;
      }
      
      if (typeof observacao === 'object' && observacao !== null) {
        // Exibir apenas o encaminhamento
        if (observacao.encaminhamento) {
          return observacao.encaminhamento;
        }
        
        // Fallback para outros campos se não houver encaminhamento
        if (observacao.observations) {
          return observacao.observations;
        }
        if (observacao.decision) {
          return observacao.decision;
        }
        if (observacao.recommendations) {
          return observacao.recommendations;
        }
        
        return 'Observação médica registrada';
      }
      
      return 'Observação médica registrada';
    };

    // Componente de observação médica expansível
    const ExpandableMedicalObservation = ({ observacao, medicoResponsavel }) => {
      const [isExpanded, setIsExpanded] = useState(false);
      const [animation] = useState(new Animated.Value(0));

      const toggleExpansion = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);
        
        Animated.timing(animation, {
          toValue: newExpandedState ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      };

      const getPreviewText = (observacao) => {
        if (typeof observacao === 'string') {
          return observacao.length > 50 ? observacao.substring(0, 50) + '...' : observacao;
        }
        
        if (typeof observacao === 'object' && observacao !== null) {
          if (observacao.encaminhamento) {
            return observacao.encaminhamento.length > 50 
              ? observacao.encaminhamento.substring(0, 50) + '...' 
              : observacao.encaminhamento;
          }
          if (observacao.observations) {
            return observacao.observations.length > 50 
              ? observacao.observations.substring(0, 50) + '...' 
              : observacao.observations;
          }
          if (observacao.decision) {
            return observacao.decision.length > 50 
              ? observacao.decision.substring(0, 50) + '...' 
              : observacao.decision;
          }
        }
        
        return 'Observação médica registrada';
      };

      const rotateInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      });

      return (
        <View style={styles.expandableContainer}>
          <TouchableOpacity 
            style={styles.expandableHeader}
            onPress={toggleExpansion}
            activeOpacity={0.7}
          >
            <View style={styles.expandableHeaderContent}>
              <View style={styles.expandableHeaderLeft}>
                <Ionicons name="medical" size={16} color="#2E86AB" />
                <Text style={styles.expandableHeaderText}>Observação Médica</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <Ionicons name="chevron-down" size={16} color="#2E86AB" />
              </Animated.View>
            </View>
            <Text style={styles.expandablePreview}>
              {getPreviewText(observacao)}
            </Text>
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.expandableContent,
              {
                maxHeight: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200], // Ajustar conforme necessário
                }),
                opacity: animation,
              }
            ]}
          >
            <View style={styles.expandableDetails}>
              {typeof observacao === 'object' && observacao !== null ? (
                <View style={styles.medicalDetails}>
                  {observacao.encaminhamento ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Encaminhamento:</Text>
                      <Text style={styles.detailValue}>{observacao.encaminhamento}</Text>
                    </View>
                  ) : null}
                  {observacao.recommendations ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Recomendações:</Text>
                      <Text style={styles.detailValue}>{observacao.recommendations}</Text>
                    </View>
                  ) : null}
                  {observacao.observations ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Observações:</Text>
                      <Text style={styles.detailValue}>{observacao.observations}</Text>
                    </View>
                  ) : null}
                  {observacao.decision ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Decisão:</Text>
                      <Text style={styles.detailValue}>{observacao.decision}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.expandableFullText}>
                  {formatMedicalObservation(observacao)}
                </Text>
              )}
              {medicoResponsavel && (
                <Text style={styles.medicoResponsavel}>
                  Dr(a). {medicoResponsavel}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      );
    };
    const observationTime = new Date(patient.observationStartTime || patient.triageDate).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <TouchableOpacity
        style={[styles.patientCard, { borderLeftColor: MANCHESTER_COLORS[priorityInfo.color] }]}
        onPress={() => handlePatientCardPress(patient)}
        activeOpacity={0.7}
      >
        <View style={styles.patientHeader}>
          <Text style={styles.patientName}>
            {patient.name}
          </Text>
          <View style={styles.timeContainer}>
          <Text style={styles.patientTime}>Início da Observação: {observationTime}</Text>
            <View style={styles.procedureBadge}>
            <Ionicons name="eye-outline" size={14} color="#8E44AD" />
              <Text style={styles.procedureText}>Procedimento</Text>
            </View>
          </View>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.tagId}>ID: {patient.tagId}</Text>
        </View>
        <View style={styles.badgesRow}>
          <View style={[styles.priorityBadge, { backgroundColor: MANCHESTER_COLORS[priorityInfo.color] }]}>
            <Text style={styles.priorityText}>{priorityInfo.text}</Text>
          </View>
          {patient.saeRecords && patient.saeRecords.length > 0 && (
            <View style={styles.saeBadge}>
              <Ionicons name="clipboard" size={12} color="#2E86AB" />
              <Text style={styles.saeText}>SAE</Text>
            </View>
          )}
        </View>
        <View style={styles.statusContainer}>
          {patient.observacaoMedica && (
            <ExpandableMedicalObservation 
              observacao={patient.observacaoMedica}
              medicoResponsavel={patient.medicoResponsavel}
            />
          )}
          <View style={styles.procedureInfo}>
            <Ionicons name="eye-outline" size={16} color="#8E44AD" />
            <Text style={styles.procedureInfoText}>
              Em observação (sem contagem de espera)
            </Text>
          </View>
        </View>
        
        {/* Indicador de ação */}
        <View style={styles.actionIndicator}>
          <Ionicons name="chevron-forward" size={20} color="#2E86AB" />
          <Text style={styles.actionIndicatorText}>Toque para ações</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        >
          <Ionicons name="arrow-back" size={24} color="#2E86AB" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Procedimentos Internos</Text>
          <Text style={styles.headerSubtitle}>Pacientes em procedimentos internos</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Lista de Pacientes */}
      <ScrollView
        style={styles.patientsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="eye-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Nenhum Procedimento Interno</Text>
            <Text style={styles.emptyStateSubtitle}>
              Não há pacientes em procedimentos internos no momento
            </Text>
          </View>
        )}
      </ScrollView>
      {/* Modal de Ações do Paciente */}
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseActionMenu}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleCloseActionMenu}>
          <View style={styles.actionModal}>
            <Text style={styles.actionModalTitle}>Ações</Text>
            {/* 1) Orientações Médicas (somente se em observação) */}
            {selectedPatient?.status === 'observacao' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => { setGuidanceVisible(true); }}>
                <Ionicons name="eye-outline" size={18} color="#2E86AB" />
                <Text style={styles.actionButtonText}>Ver orientações médicas</Text>
              </TouchableOpacity>
            )}
            {/* 2) SAE */}
            <TouchableOpacity style={styles.actionButton} onPress={() => { handleSAE(selectedPatient); handleCloseActionMenu(); }}>
              <Ionicons name="clipboard" size={18} color="#2E86AB" />
              <Text style={styles.actionButtonText}>Abrir SAE</Text>
            </TouchableOpacity>
            {/* 3) Visualizar SAE */}
            <TouchableOpacity style={styles.actionButton} onPress={() => { handleViewSAE(selectedPatient); handleCloseActionMenu(); }}>
              <Ionicons name="document-text" size={18} color="#2E86AB" />
              <Text style={styles.actionButtonText}>Visualizar SAE</Text>
            </TouchableOpacity>
            {/* 4) Liberar Paciente (apenas se permitido) */}
            { (ehMedico?.() || !!usuario?.permite_liberar_observacao) && (
              <TouchableOpacity style={[styles.actionButton, styles.actionDanger]} onPress={() => { liberarPaciente(selectedPatient); }}>
                <Ionicons name="checkmark-done" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, styles.actionDangerText]}>Liberar Paciente</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Orientações Médicas */}
      <Modal
        visible={guidanceVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuidanceVisible(false)}
      >
        <View style={styles.guidanceBackdrop}>
          <View style={styles.guidanceModal}>
            <View style={styles.guidanceHeader}>
              <Text style={styles.guidanceTitle}>Orientações médicas</Text>
              <TouchableOpacity onPress={() => setGuidanceVisible(false)}>
                <Ionicons name="close" size={22} color="#2E86AB" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.guidanceContent}>
              {typeof selectedPatient?.observacaoMedica === 'object' && selectedPatient?.observacaoMedica !== null ? (
                <View>
                  {selectedPatient.observacaoMedica.encaminhamento ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Encaminhamento</Text>
                      <Text style={styles.detailValue}>{selectedPatient.observacaoMedica.encaminhamento}</Text>
                    </View>
                  ) : null}
                  {selectedPatient.observacaoMedica.recommendations ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Recomendações</Text>
                      <Text style={styles.detailValue}>{selectedPatient.observacaoMedica.recommendations}</Text>
                    </View>
                  ) : null}
                  {selectedPatient.observacaoMedica.observations ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Observações</Text>
                      <Text style={styles.detailValue}>{selectedPatient.observacaoMedica.observations}</Text>
                    </View>
                  ) : null}
                  {selectedPatient.observacaoMedica.decision ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Decisão</Text>
                      <Text style={styles.detailValue}>{selectedPatient.observacaoMedica.decision}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.detailValue}>
                  {selectedPatient?.observacaoMedica
                    ? formatMedicalObservation(selectedPatient?.observacaoMedica)
                    : 'Nenhuma orientação médica registrada ainda.'}
                </Text>
              )}
              {selectedPatient?.medicoResponsavel && (
                <Text style={[styles.detailLabel, { marginTop: 12 }]}>Responsável: Dr(a). {selectedPatient.medicoResponsavel}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerSpacer: {
    width: 34,
  },
  patientsList: {
    flex: 1,
    padding: 15,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  patientTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  procedureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#8E44AD20',
    borderWidth: 1,
    borderColor: '#8E44AD',
  },
  procedureText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E44AD',
    marginLeft: 4,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  saeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  saeText: {
    color: '#2E86AB',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  expandableContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2E86AB',
    overflow: 'hidden',
  },
  expandableHeader: {
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  expandableHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginLeft: 8,
  },
  expandablePreview: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  expandableContent: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  expandableDetails: {
    padding: 12,
  },
  medicalDetails: {
    gap: 8,
    marginBottom: 8,
  },
  detailRow: {
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  expandableFullText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  medicoResponsavel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  procedureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#8E44AD10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8E44AD',
  },
  procedureInfoText: {
    fontSize: 12,
    color: '#8E44AD',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionIndicatorText: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '500',
    marginLeft: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    backgroundColor: 'white',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: '600',
  },
  actionDanger: {
    marginTop: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionDangerText: {
    color: '#fff',
  },
  guidanceBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  guidanceModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  guidanceContent: {
    maxHeight: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InternalProceduresScreen;
