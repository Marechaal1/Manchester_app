import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarConfiguracaoReavaliacao } from '../context/ContextoConfiguracaoReavaliacao';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import ReevaluationAlert from '../components/ReevaluationAlert';
import MenuLateral from '../components/MenuLateral';
import PatientCard from '../components/PatientCard';
import { useNotifications } from '../hooks/useNotifications';

// Cores do protocolo Manchester
const MANCHESTER_COLORS = {
  red: '#FF0000',      // Emergência (0-10 min)
  orange: '#FF8C00',   // Muito urgente (10-60 min)
  yellow: '#FFD700',   // Urgente (60-240 min)
  green: '#32CD32',    // Padrão (240+ min)
  blue: '#1E90FF',     // Não urgente (até 24h)
};

const DashboardScreenSimple = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  // Header terá paddingTop padronizado via styles.header
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [guidanceVisible, setGuidanceVisible] = useState(false);
  const { 
    obterPacientesTriados, 
    obterEstatisticasPacientes, 
    atualizarPaciente, 
    limparAlertasReavaliacao,
    carregarTriagens,
    triagens,
    carregando,
    erro
  } = usarPaciente();
  const { obterTempoReavaliacao, carregando: carregandoParametros, erro: erroParametros, parametrosBackend } = usarConfiguracaoReavaliacao();
  const { usuario, ehEnfermeiro, ehMedico, podeRealizarTriagem, podeIniciarAtendimento, fazerLogout } = usarAutenticacao();
  const { sendCriticalReevaluationNotification } = useNotifications();
  const notifiedCriticalRef = useRef(new Set());

  // Hooks para tempo de espera - devem estar no nível superior
  const waitTimeData = useRef(new Map());
  const waitStatusData = useRef(new Map());

  // Função para calcular tempo de espera
  const calcularTempoEspera = (dataTriagem, categoriaRisco) => {
    if (!dataTriagem) return '--:--';
    
    const agora = new Date();
    const dataTriagemObj = new Date(dataTriagem);
    const diferenca = agora - dataTriagemObj;
    
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
    
    return `${horas}h ${minutos}min ${segundos}s`;
  };

  // Função para obter status do tempo de espera
  const obterStatusTempoEspera = (dataTriagem, categoriaRisco) => {
    if (!dataTriagem) return { color: '#666', status: 'normal' };
    
    const agora = new Date();
    const dataTriagemObj = new Date(dataTriagem);
    const diferenca = agora - dataTriagemObj;
    
    // Tempos limite em milissegundos
    const temposLimite = {
      red: 10 * 60 * 1000,      // 10 minutos
      orange: 60 * 60 * 1000,   // 60 minutos
      yellow: 240 * 60 * 1000,  // 240 minutos
      green: 1440 * 60 * 1000,  // 24 horas
      blue: 1440 * 60 * 1000,   // 24 horas
    };
    
    const limite = temposLimite[categoriaRisco] || temposLimite.blue;
    
    if (diferenca > limite) {
      return { color: '#e74c3c', status: 'overdue' };
    } else if (diferenca > limite * 0.8) {
      return { color: '#f39c12', status: 'warning' };
    } else {
      return { color: '#27ae60', status: 'normal' };
    }
  };

  // Função para verificar status de reavaliação
  const verificarStatusReavaliacao = (dataTriagem, categoriaRisco, ultimaReavaliacao) => {
    console.log('⏰ verificarStatusReavaliacao - Iniciando verificação...');
    console.log('⏰ verificarStatusReavaliacao - Parâmetros:', {
      dataTriagem,
      categoriaRisco,
      ultimaReavaliacao
    });
    
    const agora = new Date();
    const dataTriagemObj = new Date(dataTriagem);
    const tempoDecorrido = agora - dataTriagemObj;
    const tempoReavaliacao = obterTempoReavaliacao(categoriaRisco) * 60 * 1000; // Converter para milissegundos
    
    console.log('⏰ verificarStatusReavaliacao - Cálculos:', {
      agora: agora.toISOString(),
      dataTriagemObj: dataTriagemObj.toISOString(),
      tempoDecorrido: tempoDecorrido,
      tempoDecorridoMinutos: Math.round(tempoDecorrido / (60 * 1000)),
      tempoReavaliacao: tempoReavaliacao,
      tempoReavaliacaoMinutos: Math.round(tempoReavaliacao / (60 * 1000))
    });
    
    // Se há uma reavaliação recente, só considerar vencida quando ultrapassar o tempo configurado
    if (ultimaReavaliacao) {
      console.log('⏰ verificarStatusReavaliacao - Há última reavaliação, verificando...');
      const ultimaReavaliacaoObj = new Date(ultimaReavaliacao);
      const tempoDesdeUltimaReavaliacao = agora - ultimaReavaliacaoObj;
      const cincoMinutos = 5 * 60 * 1000; // legado
      const tempoLimiteMs = tempoReavaliacao; // já em ms
      
      console.log('⏰ verificarStatusReavaliacao - Tempo desde última reavaliação:', {
        ultimaReavaliacaoObj: ultimaReavaliacaoObj.toISOString(),
        tempoDesdeUltimaReavaliacao: tempoDesdeUltimaReavaliacao,
        tempoDesdeUltimaReavaliacaoMinutos: Math.round(tempoDesdeUltimaReavaliacao / (60 * 1000)),
        cincoMinutos: cincoMinutos,
        tempoLimiteMs
      });
      
      // Se a última reavaliação foi há menos que o tempo configurado, não precisa reavaliar
      if (tempoDesdeUltimaReavaliacao < tempoLimiteMs) {
        console.log('⏰ verificarStatusReavaliacao - Dentro do tempo configurado, não precisa reavaliar');
        return {
          precisaReavaliar: false,
          tempoRestante: 0,
          categoria: 'normal'
        };
      }
      
      // Se ultrapassou o tempo configurado desde a última reavaliação, verificar novamente
      const precisaReavaliar = tempoDesdeUltimaReavaliacao >= tempoLimiteMs;
      const categoria = precisaReavaliar ? 'critica' : 'normal';
      
      console.log('⏰ verificarStatusReavaliacao - Resultado com última reavaliação:', {
        precisaReavaliar,
        categoria,
        tempoRestante: Math.max(0, tempoReavaliacao - tempoDesdeUltimaReavaliacao)
      });
      
      return {
        precisaReavaliar,
        tempoRestante: Math.max(0, tempoReavaliacao - tempoDesdeUltimaReavaliacao),
        categoria
      };
    }
    
    // Se não há reavaliação, verificar se precisa reavaliar baseado na data da triagem
    const precisaReavaliar = tempoDecorrido >= tempoReavaliacao;
    const categoria = precisaReavaliar ? 'critica' : 'normal';
    
    console.log('⏰ verificarStatusReavaliacao - Resultado sem última reavaliação:', {
      precisaReavaliar,
      categoria,
      tempoRestante: Math.max(0, tempoReavaliacao - tempoDecorrido)
    });
    
    return {
      precisaReavaliar,
      tempoRestante: Math.max(0, tempoReavaliacao - tempoDecorrido),
      categoria
    };
  };

  // Função para obter alertas de reavaliação
  const obterAlertasReavaliacao = (pacientes) => {
    console.log('🔍 obterAlertasReavaliacao - Iniciando verificação...');
    console.log('🔍 obterAlertasReavaliacao - Pacientes recebidos:', pacientes?.length || 0);
    
    if (!pacientes || !Array.isArray(pacientes)) {
      console.log('🔍 obterAlertasReavaliacao - Pacientes inválidos, retornando arrays vazios');
      return { critical: [], high: [] };
    }
    
    const critical = [];
    const high = [];
    
    pacientes.forEach((patient, index) => {
      console.log(`🔍 obterAlertasReavaliacao - Verificando paciente ${index + 1}:`, {
        id: patient.id,
        nome: patient.nome,
        dataTriagem: patient.dataTriagem,
        categoriaRisco: patient.categoriaRisco,
        ultimaReavaliacao: patient.ultimaReavaliacao
      });
      
      const status = verificarStatusReavaliacao(patient.dataTriagem, patient.categoriaRisco, patient.ultimaReavaliacao);
      console.log(`🔍 obterAlertasReavaliacao - Status do paciente ${index + 1}:`, status);
      
      if (status.precisaReavaliar) {
        const alert = {
          patient,
          status,
          message: status.categoria === 'critica' ? 'Reavaliação vencida!' : 'Reavaliação necessária'
        };
        
        console.log(`🔍 obterAlertasReavaliacao - Alerta criado para paciente ${index + 1}:`, alert);
        
        if (status.categoria === 'critica') {
          critical.push(alert);
          console.log(`🔍 obterAlertasReavaliacao - Alerta crítico adicionado. Total críticos: ${critical.length}`);
        } else {
          high.push(alert);
          console.log(`🔍 obterAlertasReavaliacao - Alerta de alta prioridade adicionado. Total alta: ${high.length}`);
        }
      } else {
        console.log(`🔍 obterAlertasReavaliacao - Paciente ${index + 1} não precisa reavaliação`);
      }
    });
    
    console.log('🔍 obterAlertasReavaliacao - Resultado final:', { critical: critical.length, high: high.length });
    return { critical, high };
  };

  // Verificar autenticação
  useEffect(() => {
    console.log('🔍 DashboardScreen - Verificando autenticação...');
    console.log('👤 Usuário:', usuario);
    console.log('🔐 Autenticado:', ehEnfermeiro() || ehMedico());
  }, [usuario]);

  // Log dos parâmetros carregados do backend
  useEffect(() => {
    if (parametrosBackend) {
      console.log('📊 Dashboard - Parâmetros carregados do backend:', parametrosBackend);
      console.log('📊 Dashboard - Tempos de reavaliação atuais:', parametrosBackend.temposReavaliacao);
    }
  }, [parametrosBackend]);

  // Log de erros de carregamento de parâmetros
  useEffect(() => {
    if (erroParametros) {
      console.warn('⚠️ Dashboard - Erro ao carregar parâmetros do backend:', erroParametros);
    }
  }, [erroParametros]);

  // Carregar dados da API quando a tela for montada
  useEffect(() => {
    console.log('🔄 Dashboard - Iniciando carregamento de dados...');
    carregarTriagens();
  }, [carregarTriagens]); // Agora pode usar carregarTriagens pois está memoizada

  // Obter pacientes triados do contexto
  const allPatients = obterPacientesTriados() || [];
  console.log('📊 Dashboard - Total de pacientes carregados:', allPatients.length);
  console.log('📊 Dashboard - Pacientes em observação:', allPatients.filter(p => p.status === 'observacao').map(p => ({ nome: p.nome, status: p.status, dischargeTime: p.dischargeTime })));
  console.log('📊 Dashboard - Pacientes finalizados:', allPatients.filter(p => p.status === 'finalizado').map(p => ({ nome: p.nome, status: p.status, dischargeTime: p.dischargeTime })));
  
  // Log detalhado de todos os pacientes para debug
  console.log('📊 Dashboard - Todos os pacientes:', allPatients.map(p => ({ 
    id: p.id, 
    nome: p.nome, 
    status: p.status, 
    dischargeTime: p.dischargeTime,
    idPaciente: p.idPaciente 
  })));
  
  // Contadores para rodapé do médico
  const doctorCounts = {
    triados: allPatients.filter(p => (p.status === 'triado' || p.status === 'aguardando_reavaliacao') && !p.dischargeTime && p.status !== 'finalizado').length,
    observacao: allPatients.filter(p => p.status === 'observacao' && !p.dischargeTime && p.status !== 'finalizado').length,
  };

  // Filtrar pacientes baseado no perfil do usuário e seleção
  const patients = allPatients.filter(patient => {
    // Excluir pacientes que já receberam alta (finalizados)
    if (patient.status === 'finalizado' || patient.dischargeTime) {
      return false;
    }
    
    // Médicos veem pacientes triados, aguardando reavaliação e em atendimento
    if (ehMedico()) {
      // Selecão por filtro explícito no rodapé do médico
      if (selectedFilter === 'triados') {
        return patient.status === 'triado' || patient.status === 'aguardando_reavaliacao';
      }
      if (selectedFilter === 'observacao') {
        return patient.status === 'observacao';
      }
      // Padrão: mostrar triados/aguardando/atendimento
      return (
        patient.status === 'triado' ||
        patient.status === 'aguardando_reavaliacao' ||
        patient.status === 'atendimento'
      );
    }
    
    // Enfermeiros veem todos os pacientes não finalizados
    if (ehEnfermeiro()) {
      if (!selectedFilter) return patient.status === 'triado' || patient.status === 'aguardando_reavaliacao';
      if (selectedFilter === 'triados') return patient.status === 'triado' || patient.status === 'aguardando_reavaliacao';
      if (selectedFilter === 'reevaluation') {
        // Mostrar pacientes com reavaliação vencida (dinâmico) ou status já marcado,
        // exceto observação/atendimento/finalizados
        const status = String(patient.status || '').toLowerCase();
        const isActive = status !== 'finalizado' && !patient.dischargeTime;
        if (!isActive) return false;
        if (status === 'observacao' || status === 'atendimento') return false;
        if (status === 'aguardando_reavaliacao') return true;
        const dyn = verificarStatusReavaliacao(patient.dataTriagem, patient.categoriaRisco, patient.ultimaReavaliacao);
        return Boolean(dyn?.precisaReavaliar);
      }
      if (selectedFilter === 'atendimento') return patient.status === 'atendimento';
      if (selectedFilter === 'procedimento') {
        // Mostrar pacientes em observação (procedimentos internos)
        const isInObservation = patient.status === 'observacao';
        const isNotDischarged = !patient.dischargeTime;
        const isNotFinalized = patient.status !== 'finalizado';
        
        // Não mostrar pacientes finalizados ou com alta
        if (patient.status === 'finalizado' || patient.dischargeTime) {
          console.log('🚫 Dashboard - Paciente finalizado/alta removido do filtro:', patient.nome, {
            status: patient.status,
            dischargeTime: patient.dischargeTime
          });
          return false;
        }
        
        // Verificar se há atendimento ativo em observação
        if (isInObservation && isNotDischarged && isNotFinalized) {
          console.log('✅ Dashboard - Paciente em observação incluído:', patient.nome, {
            status: patient.status,
            dischargeTime: patient.dischargeTime
          });
          return true;
        }
        
        return false;
      }
    }
    
    return true;
  });
  
  // Obter estatísticas do contexto
  const stats = obterEstatisticasPacientes();
  
  // Calcular contador de reavaliação (dinâmico + status), ignorando observação/atendimento/finalizados
  const reevaluationCount = allPatients.filter(patient => {
    const status = String(patient.status || '').toLowerCase();
    const isActive = status !== 'finalizado' && !patient.dischargeTime;
    if (!isActive) return false;
    if (status === 'observacao' || status === 'atendimento') return false;
    if (status === 'aguardando_reavaliacao') return true;
    const dyn = verificarStatusReavaliacao(patient.dataTriagem, patient.categoriaRisco, patient.ultimaReavaliacao);
    return Boolean(dyn?.precisaReavaliar);
  }).length;
  
  // Log para debug do contador de reavaliação
  console.log('🔍 Dashboard - Debug reavaliação:', {
    totalPacientes: allPatients.length,
    reevaluationCount,
    pacientesAguardandoReavaliacao: allPatients.filter(p => p.status === 'aguardando_reavaliacao').map(p => ({
      id: p.id,
      nome: p.nome,
      status: p.status,
      precisaReavaliar: p.precisaReavaliar,
      categoriaRisco: p.categoriaRisco,
      dataTriagem: p.dataTriagem,
      ultimaReavaliacao: p.ultimaReavaliacao
    }))
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await carregarTriagens();
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterSelect = (filterKey) => {
    if (selectedFilter === filterKey) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(filterKey);
    }
  };

  const getHeaderTitle = () => {
    if (ehMedico()) {
      if (!selectedFilter || selectedFilter === 'triados') return 'Pacientes Triados';
      if (selectedFilter === 'observacao') return 'Observação';
      return 'Pacientes Triados';
    }
    if (!selectedFilter || selectedFilter === 'triados') return 'Pacientes Triados';
    if (selectedFilter === 'reevaluation') return 'Reavaliação';
    if (selectedFilter === 'atendimento') return 'Atendimento';
    if (selectedFilter === 'procedimento') return 'Observação';
    return 'Pacientes Triados';
  };

  const handleNewPatient = () => {
    if (!ehEnfermeiro()) {
      Alert.alert('Acesso restrito', 'Apenas enfermeiros podem iniciar triagem.');
      return;
    }
    navigation.navigate('NovoPaciente');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: async () => {
          try {
            console.log('🔄 Iniciando logout...');
            await fazerLogout();
            console.log('✅ Logout realizado com sucesso');
            // A navegação será feita automaticamente pelo contexto
          } catch (erro) {
            console.error('❌ Erro ao fazer logout:', erro);
            Alert.alert('Erro', 'Erro ao fazer logout. Tente novamente.');
          }
        }}
      ]
    );
  };

  const handleManagePatients = () => {
    setSidebarOpen(false);
    navigation.navigate('GerenciarPacientes');
  };

  const handleCloseActionMenu = () => {
    setActionMenuVisible(false);
    setSelectedPatient(null);
  };


  const handleDismissAlert = (patientId) => {
    setDismissedAlerts(prev => new Set([...prev, patientId]));
  };

  // Obter alertas de reavaliação (excluir pacientes em atendimento e observação)
  const reevaluationAlerts = obterAlertasReavaliacao(
    allPatients.filter(p => p.status !== 'atendimento' && p.status !== 'observacao')
  );
  const criticalAlerts = (reevaluationAlerts.critical || []).filter(alert => 
    alert.patient.status !== 'atendimento' && !dismissedAlerts.has(alert.patient.id)
  );
  const highAlerts = (reevaluationAlerts.high || []).filter(alert => 
    alert.patient.status !== 'atendimento' && !dismissedAlerts.has(alert.patient.id)
  );

  // Reabilitar notificações para pacientes que deixaram de estar vencidos
  useEffect(() => {
    try {
      (allPatients || []).forEach((p) => {
        const st = verificarStatusReavaliacao(p.dataTriagem, p.categoriaRisco, p.ultimaReavaliacao);
        if (!st?.precisaReavaliar && notifiedCriticalRef.current?.has(p.id)) {
          notifiedCriticalRef.current.delete(p.id);
        }
      });
    } catch (e) {
      console.log('⚠️ Erro ao reabilitar notificações:', e?.message);
    }
  }, [allPatients]);
  // Função de teste para notificação
  const testarNotificacao = () => {
    console.log('🧪 Testando notificação...');
    sendCriticalReevaluationNotification('Paciente Teste', 'TEST001', 'Reavaliação vencida - TESTE');
  };

  // Timer para atualizar dados periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Timer - Atualizando dados...');
      carregarTriagens();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [carregarTriagens]);

  // Enviar notificação push quando a reavaliação vencer (crítico)
  useEffect(() => {
    console.log('🔔 Dashboard - Verificando notificações críticas...');
    console.log('🔔 Dashboard - É enfermeiro?', ehEnfermeiro());
    console.log('🔔 Dashboard - Alertas críticos:', criticalAlerts.length);
    console.log('🔔 Dashboard - Alertas críticos detalhes:', criticalAlerts);
    
    if (!ehEnfermeiro()) {
      console.log('🔔 Dashboard - Usuário não é enfermeiro, não enviando notificações');
      return;
    }
    
    criticalAlerts.forEach((alert, index) => {
      console.log(`🔔 Dashboard - Processando alerta ${index + 1}:`, alert);
      console.log(`🔔 Dashboard - ID do paciente:`, alert.patient.id);
      console.log(`🔔 Dashboard - Já notificado?`, notifiedCriticalRef.current.has(alert.patient.id));
      
      if (!notifiedCriticalRef.current.has(alert.patient.id) && alert.patient.status !== 'atendimento') {
        const patientName = alert.patient.nome || 'Paciente';
        const patientTagId = alert.patient.idEtiqueta || alert.patient.id || 'N/A';
        const timeMessage = alert.message || 'Reavaliação vencida';

        console.log('🔔 Dashboard - Enviando notificação para:', {
          patientName,
          patientTagId,
          timeMessage
        });

        sendCriticalReevaluationNotification(patientName, patientTagId, timeMessage);
        notifiedCriticalRef.current.add(alert.patient.id);
        
        console.log('🔔 Dashboard - Notificação enviada e ID adicionado ao controle');
      } else {
        console.log('🔔 Dashboard - Paciente já foi notificado, pulando...');
      }
    });
  }, [criticalAlerts, ehEnfermeiro, sendCriticalReevaluationNotification]);


  const handlePatientCardPress = (patient) => {
    console.log('🔍 Dashboard - Paciente selecionado:', patient);
    console.log('🔍 Dashboard - ID do paciente:', patient?.id);
    setSelectedPatient(patient);
    setActionMenuVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(true)}
        >
          <Ionicons name="menu" size={24} color="#2E86AB" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          {/* Removido texto de parâmetros atualizados */}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {ehEnfermeiro() && (
            <TouchableOpacity
              style={styles.newPatientButton}
              onPress={handleNewPatient}
            >
              <Ionicons name="person-add" size={24} color="#2E86AB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Alertas movidos para o topo da lista para reduzir espaçamento geral */}

      {/* Removido texto "Sistema de Triagem Manchester" */}

      {/* Lista de Pacientes */}
      <ScrollView
        style={styles.patientsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Alertas de Reavaliação (somente para enfermeiro) */}
        {ehEnfermeiro() && criticalAlerts.length > 0 && (
          <View style={{ paddingTop: 6, paddingBottom: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ paddingLeft: 12 }}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {criticalAlerts
                .filter(alert => alert.patient.status !== 'observacao')
                .map((alert, index) => (
                  <ReevaluationAlert
                    key={`critical-${alert.patient.id}-${index}`}
                    patient={alert.patient}
                    reevaluationStatus={alert.status}
                    onReevaluate={() => {
                      setActionMenuVisible(false);
                      navigation.navigate('Reavaliacao', { patientId: alert.patient.id });
                    }}
                    onDismiss={() => handleDismissAlert(alert.patient.id)}
                  />
                ))}
            </ScrollView>
          </View>
        )}

        {carregando && patients.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E86AB" />
            <Text style={styles.loadingText}>Carregando pacientes...</Text>
          </View>
        ) : erro ? (
          <View style={styles.erroContainer}>
            <Ionicons name="alert-circle" size={64} color="#e74c3c" />
            <Text style={styles.erroTitle}>Erro ao carregar dados</Text>
            <Text style={styles.erroSubtitle}>{erro}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onPress={handlePatientCardPress} 
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Nenhum Paciente Triado</Text>
            <Text style={styles.emptyStateSubtitle}>
              Clique em "Novo Atendimento" para começar a triagem
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rodapé de filtros */}
      <View style={styles.statsContainer}>
        {ehEnfermeiro() ? (
          <>
            <TouchableOpacity style={[styles.statCard, selectedFilter === 'triados' && styles.selectedStatCard]} onPress={() => handleFilterSelect('triados')}>
              <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
              <Text style={styles.statNumber}>{stats.triados}</Text>
              <Text style={styles.statLabel}>Triados</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, selectedFilter === 'reevaluation' && styles.selectedStatCard]} onPress={() => handleFilterSelect('reevaluation')}>
              <Ionicons name="refresh" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{reevaluationCount}</Text>
              <Text style={styles.statLabel}>Reavaliação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, selectedFilter === 'atendimento' && styles.selectedStatCard]} onPress={() => handleFilterSelect('atendimento')}>
              <Ionicons name="medical" size={24} color="#2E86AB" />
              <Text style={styles.statNumber}>{stats.atendimento}</Text>
              <Text style={styles.statLabel}>Atendimento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statCard, selectedFilter === 'procedimento' && styles.selectedStatCard]} onPress={() => handleFilterSelect('procedimento')}>
              <Ionicons name="eye-outline" size={24} color="#8A2BE2" />
              <Text style={styles.statNumber}>{stats.procedimento || 0}</Text>
              <Text style={styles.statLabel}>Observação</Text>
            </TouchableOpacity>
          </>
        ) : (
          ehMedico() && (
            <>
              <TouchableOpacity style={[styles.statCard, (selectedFilter === null || selectedFilter === 'triados') && styles.selectedStatCard]} onPress={() => handleFilterSelect('triados')}>
                <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
                <Text style={styles.statNumber}>{doctorCounts.triados}</Text>
                <Text style={styles.statLabel}>Triados</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statCard, selectedFilter === 'observacao' && styles.selectedStatCard]} onPress={() => handleFilterSelect('observacao')}>
                <Ionicons name="eye-outline" size={24} color="#8A2BE2" />
                <Text style={styles.statNumber}>{doctorCounts.observacao}</Text>
                <Text style={styles.statLabel}>Observação</Text>
              </TouchableOpacity>
            </>
          )
        )}
      </View>

      {/* Menu Lateral */}
      <MenuLateral
        estaAberto={sidebarOpen}
        aoFechar={() => setSidebarOpen(false)}
        aoNovoPaciente={ehEnfermeiro() ? handleNewPatient : undefined}
        aoGerenciarPacientes={ehEnfermeiro() ? handleManagePatients : undefined}
        aoLogout={handleLogout}
      />

      {/* Modal de Ações do Paciente */}
      <Modal
        visible={actionMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>
                Ações - {selectedPatient?.nome}
              </Text>
              <TouchableOpacity onPress={() => setActionMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              {ehEnfermeiro() && (
                <>
                  {/* Ocultar Reavaliar para pacientes em observação */}
                  {selectedPatient?.status !== 'observacao' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        setActionMenuVisible(false);
                        navigation.navigate('Reavaliacao', { patientId: selectedPatient.id });
                      }}
                    >
                      <Ionicons name="refresh" size={24} color="#FFD700" />
                      <Text style={styles.actionButtonText}>Reavaliar</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Prioridade: Orientações Médicas, SAE, Visualizar SAE, Liberar Paciente */}
                  {selectedPatient?.status === 'observacao' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        setActionMenuVisible(false);
                        setGuidanceVisible(true);
                      }}
                    >
                      <Ionicons name="eye-outline" size={24} color="#2E86AB" />
                      <Text style={styles.actionButtonText}>Orientações Médicas</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setActionMenuVisible(false);
                      navigation.navigate('SAE', { patientId: selectedPatient.id });
                    }}
                  >
                    <Ionicons name="medical" size={24} color="#2E86AB" />
                    <Text style={styles.actionButtonText}>SAE</Text>
                  </TouchableOpacity>

                  {/* Opção de liberar paciente apenas para pacientes em observação */}
                {String(selectedPatient?.status || '').toLowerCase() === 'observacao' && !!usuario?.permite_liberar_observacao && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.dischargeButton]}
                      onPress={() => {
                        setActionMenuVisible(false);
                        navigation.navigate('LiberarPaciente', { patientId: selectedPatient.id });
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                      <Text style={[styles.actionButtonText, styles.dischargeButtonText]}>Liberar Paciente</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {ehMedico() && (
                <>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setActionMenuVisible(false);
                      console.log('🔍 Dashboard - Navegando para AtendimentoMedico com patientId:', selectedPatient.id);
                      navigation.navigate('AtendimentoMedico', { patientId: selectedPatient.id });
                    }}
                  >
                    <Ionicons name="medical" size={24} color="#2E86AB" />
                    <Text style={styles.actionButtonText}>Atendimento Médico</Text>
                  </TouchableOpacity>
                  {String(selectedPatient?.status || '').toLowerCase() === 'observacao' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.dischargeButton]}
                      onPress={() => {
                        setActionMenuVisible(false);
                        navigation.navigate('LiberarPaciente', { patientId: selectedPatient.id });
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                      <Text style={[styles.actionButtonText, styles.dischargeButtonText]}>Liberar Paciente</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              
              {/* Visualizar SAE antes do Liberar Paciente */}
              {selectedPatient?.registrosSAE && selectedPatient.registrosSAE.length > 0 && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setActionMenuVisible(false);
                    navigation.navigate('VisualizarSAE', { patientId: selectedPatient.id });
                  }}
                >
                  <Ionicons name="eye" size={24} color="#666" />
                  <Text style={styles.actionButtonText}>Visualizar SAE</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setActionMenuVisible(false)}
              >
                <Ionicons name="close" size={24} color="#e74c3c" />
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Orientações Médicas */}
      <Modal
        visible={guidanceVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuidanceVisible(false)}
      >
        <View style={styles.guidanceOverlay}>
          <View style={styles.guidanceModal}>
            <View style={styles.guidanceHeader}>
              <Text style={styles.guidanceTitle}>Orientações Médicas</Text>
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
                  {selectedPatient?.observacaoMedica ? String(selectedPatient.observacaoMedica) : 'Nenhuma orientação médica registrada ainda.'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 50, android: (StatusBar.currentHeight || 24) + 10 }),
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  newPatientButton: {
    padding: 5,
  },
  systemTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  patientsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  waitTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  patientInfo: {
    marginBottom: 12,
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saeText: {
    color: '#1E90FF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  patientStatus: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reevaluationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reevaluationText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionText: {
    color: '#2E86AB',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedStatCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  erroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  erroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
  },
  erroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do Modal de Ações
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  dischargeButton: {
    backgroundColor: '#f0fff4',
    borderColor: '#9ae6b4',
  },
  dischargeButtonText: {
    color: '#27ae60',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  cancelButtonText: {
    color: '#e74c3c',
  },
  guidanceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  guidanceModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 480,
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
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default DashboardScreenSimple;