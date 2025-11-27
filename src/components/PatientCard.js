import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { usarConfiguracaoReavaliacao } from '../context/ContextoConfiguracaoReavaliacao';

const PatientCard = ({ patient, onPress }) => {
  const { ehMedico } = usarAutenticacao();
  const { obterTempoReavaliacao } = usarConfiguracaoReavaliacao();
  // Função para verificar status de reavaliação (usa parâmetros do backend)
  const verificarStatusReavaliacao = (dataTriagem, categoriaRisco, ultimaReavaliacao) => {
    const agora = new Date();
    const dataTriagemObj = new Date(dataTriagem);
    const tempoDecorrido = agora - dataTriagemObj;
    
    // Buscar tempo de reavaliação configurado (em minutos)
    const tempoReavaliacao = obterTempoReavaliacao(categoriaRisco) || 60;
    const tempoReavaliacaoMs = tempoReavaliacao * 60 * 1000; // Converter para milissegundos
    
    // Se há uma reavaliação recente, só considerar vencida quando ultrapassar o tempo configurado
    if (ultimaReavaliacao) {
      const ultimaReavaliacaoObj = new Date(ultimaReavaliacao);
      const tempoDesdeReavaliacao = agora - ultimaReavaliacaoObj;
      if (tempoDesdeReavaliacao < tempoReavaliacaoMs) {
        return { precisaReavaliar: false, status: 'normal', categoria: 'normal' };
      }
      
      // Se ultrapassou o tempo configurado desde a última reavaliação, verificar novamente
      const precisaReavaliar = tempoDesdeReavaliacao >= tempoReavaliacaoMs;
      const categoria = precisaReavaliar ? 'critica' : 'normal';
      
      return {
        precisaReavaliar,
        tempoRestante: Math.max(0, tempoReavaliacaoMs - tempoDesdeReavaliacao),
        categoria
      };
    }
    
    // Se não há reavaliação, verificar se precisa reavaliar baseado na data da triagem
    const precisaReavaliar = tempoDecorrido >= tempoReavaliacaoMs;
    const categoria = precisaReavaliar ? 'critica' : 'normal';
    
    return {
      precisaReavaliar,
      tempoRestante: Math.max(0, tempoReavaliacaoMs - tempoDecorrido),
      categoria
    };
  };

  const getRiskColor = (category) => {
    const colors = {
      red: '#E53E3E',
      orange: '#DD6B20',
      yellow: '#D69E2E',
      green: '#38A169',
      blue: '#3182CE',
    };
    return colors[category] || colors.blue;
  };

  const getRiskIcon = (category) => {
    const icons = {
      red: 'medical',
      orange: 'warning',
      yellow: 'time',
      green: 'checkmark-circle',
      blue: 'information-circle',
    };
    return icons[category] || icons.blue;
  };

  // Função para obter ícone e cor de reavaliação
  const getReevaluationAlert = () => {
    // Oculta indicadores de reavaliação para pacientes em atendimento ou observação
    if (patient.status === 'atendimento' || patient.status === 'observacao') {
      return null;
    }
    
    // Se o paciente está aguardando reavaliação, mostrar alerta
    if (patient.status === 'aguardando_reavaliacao') {
      return {
        icon: 'alert-circle',
        color: '#E53E3E', // Vermelho para aguardando reavaliação
        backgroundColor: '#FED7D7'
      };
    }
    
    // Verificar se precisa de reavaliação baseado no tempo
    const reevaluationStatus = verificarStatusReavaliacao(
      patient.dataTriagem, 
      patient.categoriaRisco, 
      patient.ultimaReavaliacao
    );
    
    if (reevaluationStatus.precisaReavaliar) {
      if (reevaluationStatus.categoria === 'critica') {
        return {
          icon: 'alert-circle',
          color: '#E53E3E', // Vermelho para vencida
          backgroundColor: '#FED7D7'
        };
      } else if (reevaluationStatus.categoria === 'alta') {
        return {
          icon: 'warning',
          color: '#D69E2E', // Amarelo para próxima
          backgroundColor: '#FEFCBF'
        };
      }
    }
    
    return null;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    try {
      // Ex.: 25/11/2025 00:32 no fuso de São Paulo
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch (e) {
      // Fallback simples se Intl não estiver disponível
      const d = new Date(date.getTime());
      const pad = (n) => String(n).padStart(2, '0');
      const dia = pad(d.getDate());
      const mes = pad(d.getMonth() + 1);
      const ano = d.getFullYear();
      const hora = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${dia}/${mes}/${ano} ${hora}:${min}`;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'triado': 'Triado',
      'aguardando_reavaliacao': 'Aguardando Reavaliação',
      'observacao': 'Observação',
      'atendimento': 'Atendimento',
      'finalizado': 'Finalizado'
    };
    return statusMap[status] || 'Pendente';
  };

  const getRiskClassificationText = (category) => {
    const riskMap = {
      'red': 'Emergência',
      'orange': 'Muito Urgente',
      'yellow': 'Urgente',
      'green': 'Pouco Urgente',
      'blue': 'Não Urgente'
    };
    return riskMap[category] || 'Não Urgente';
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: getRiskColor(patient.categoriaRisco) }]}
      onPress={() => onPress && onPress(patient)}
      activeOpacity={0.7}
    >
      {/* Header compacto */}
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {patient.nome || 'Paciente'}
          </Text>
          <Text style={styles.patientId}>
            {patient.idEtiqueta || patient.id}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {/* Indicador de alerta de reavaliação - oculto para médicos */}
          {(() => {
            if (ehMedico && ehMedico()) {
              return null;
            }
            const reevaluationAlert = getReevaluationAlert();
            console.log('🔍 PatientCard - Indicador de reavaliação:', {
              paciente: patient.nome,
              status: patient.status,
              reevaluationAlert,
              dataTriagem: patient.dataTriagem,
              categoriaRisco: patient.categoriaRisco,
              ultimaReavaliacao: patient.ultimaReavaliacao
            });
            
            if (reevaluationAlert) {
              return (
                <View style={[styles.riskBadge, { backgroundColor: reevaluationAlert.backgroundColor, borderWidth: 1, borderColor: reevaluationAlert.color }]}>
                  <Ionicons 
                    name={reevaluationAlert.icon} 
                    size={14} 
                    color={reevaluationAlert.color} 
                  />
                </View>
              );
            }
            
            return null; // Não mostra ícone de classificação de risco
          })()}
          
          {/* Indicador de SAE */}
          {patient.registrosSAE && patient.registrosSAE.length > 0 && (
            <View style={styles.saeBadge}>
              <Ionicons name="clipboard-outline" size={12} color="#2E86AB" />
            </View>
          )}
        </View>
      </View>
      
      {/* Informações essenciais em linha única */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={12} color="#666" />
          <Text style={styles.infoText}>{formatTime(patient.dataTriagem)}</Text>
        </View>
        
        {patient.pressaoArterial && (
          <View style={styles.infoItem}>
            <Ionicons name="heart" size={12} color="#666" />
            <Text style={styles.infoText}>{patient.pressaoArterial}</Text>
          </View>
        )}
        
        {patient.temperatura && (
          <View style={styles.infoItem}>
            <Ionicons name="thermometer" size={12} color="#666" />
            <Text style={styles.infoText}>{patient.temperatura}°C</Text>
          </View>
        )}
      </View>
      
      {/* Classificação de risco e status */}
      <View style={styles.statusRow}>
        <Text style={styles.riskClassificationText}>
          {getRiskClassificationText(patient.categoriaRisco)}
        </Text>
        <Text style={styles.statusText}>
          {getStatusText(patient.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Alinhamento no topo para acomodar nomes longos
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
    marginRight: 8,
    minHeight: 40, // Altura mínima para acomodar nomes longos
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
    lineHeight: 18, // Altura de linha para melhor legibilidade
  },
  patientId: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinhamento no topo
    gap: 6,
    paddingTop: 2, // Pequeno espaçamento do topo
  },
  riskBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E86AB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskClassificationText: {
    fontSize: 12,
    color: '#2D3748',
    fontWeight: '600',
    flex: 1, // Permite que o texto ocupe mais espaço
    marginRight: 8, // Espaçamento do status
  },
  statusText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0, // Impede que o status seja comprimido
  },
});

export default PatientCard;
