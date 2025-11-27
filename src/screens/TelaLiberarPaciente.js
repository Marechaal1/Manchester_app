import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { estilosComuns } from '../styles/designSystem';
import { atendimentosService } from '../services/atendimentos.service';

const TelaLiberarPaciente = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { obterPacientePorId, atualizarPaciente, carregarTriagens } = usarPaciente();
  
  // Log para debug
  console.log('🏥 LiberarPaciente - Função atualizarPaciente disponível:', typeof atualizarPaciente);
  const { usuario, ehMedico } = usarAutenticacao();
  
  const [paciente, setPaciente] = useState(null);
  const [justificativa, setJustificativa] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Carregar dados do paciente
  useEffect(() => {
    const carregarPaciente = async () => {
      try {
        const dadosPaciente = obterPacientePorId(patientId);
        setPaciente(dadosPaciente);
      } catch (error) {
        console.error('❌ Erro ao carregar paciente:', error);
        Alert.alert('Erro', 'Erro ao carregar dados do paciente');
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard');
      }
    };

    carregarPaciente();
  }, [patientId, obterPacientePorId, navigation]);

  // Verificar permissão ao entrar na tela
  useEffect(() => {
    const tipo = String(usuario?.tipo_usuario || usuario?.tipo || '').toUpperCase();
    const podeLiberar = ehMedico() || !!usuario?.permite_liberar_observacao;
    if (!podeLiberar) {
      Alert.alert('Acesso negado', 'Você não tem permissão para liberar pacientes.', [
        { text: 'OK', onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')) }
      ]);
    }
  }, [usuario, ehMedico, navigation]);

  // Validar formulário
  const validarFormulario = () => {
    if (!justificativa.trim()) {
      Alert.alert('Erro', 'Por favor, informe a justificativa para a liberação do paciente.');
      return false;
    }

    if (justificativa.trim().length < 10) {
      Alert.alert('Erro', 'A justificativa deve ter pelo menos 10 caracteres.');
      return false;
    }

    return true;
  };

  // Liberar paciente
  const liberarPaciente = async () => {
    if (!validarFormulario()) return;

    try {
      setCarregando(true);
      
      Alert.alert(
        'Confirmar Liberação',
        `Deseja liberar o paciente ${paciente?.nome}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                console.log('🏥 LiberarPaciente - Iniciando liberação do paciente:', paciente.id);
                
                // Buscar atendimento médico ativo para o paciente
                const atendimentosResponse = await atendimentosService.listar({ 
                  paciente_id: paciente.idPaciente || paciente.id,
                  status: 'OBSERVACAO' 
                });
                
                console.log('🔍 LiberarPaciente - Atendimentos encontrados:', atendimentosResponse);
                
                if (!atendimentosResponse?.dados?.data || atendimentosResponse.dados.data.length === 0) {
                  throw new Error('Nenhum atendimento em observação encontrado para este paciente');
                }
                
                const atendimentoAtivo = atendimentosResponse.dados.data[0];
                console.log('✅ LiberarPaciente - Atendimento ativo encontrado:', atendimentoAtivo.id);
                
                // Finalizar o atendimento médico via API
                const dadosFinalizacao = {
                  justificativa_liberacao: justificativa.trim(),
                  liberado_por: (usuario?.nome_completo || usuario?.name || usuario?.nome || 'Enfermeiro'),
                  data_liberacao: new Date().toISOString()
                };
                
                await atendimentosService.finalizar(atendimentoAtivo.id, dadosFinalizacao);
                console.log('✅ LiberarPaciente - Atendimento finalizado via API');
                
                // Recarregar dados do dashboard para refletir as mudanças
                console.log('🔄 LiberarPaciente - Recarregando dados do dashboard...');
                await carregarTriagens();
                
                Alert.alert(
                  'Sucesso',
                  'Paciente liberado com sucesso!',
                  [
                    {
                      text: 'OK',
                      onPress: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))
                    }
                  ]
                );
              } catch (error) {
                console.error('❌ Erro ao liberar paciente:', error);
                Alert.alert('Erro', error.message || 'Erro ao liberar paciente');
              } finally {
                setCarregando(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erro ao processar liberação:', error);
      Alert.alert('Erro', 'Erro ao processar liberação do paciente');
      setCarregando(false);
    }
  };

  if (!paciente) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carregando...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando dados do paciente...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liberar Paciente</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Paciente */}
        <View style={styles.patientInfo}>
          <Text style={styles.sectionTitle}>Informações do Paciente</Text>
          <View style={styles.patientCard}>
            <View style={styles.patientRow}>
              <Ionicons name="person" size={20} color="#2E86AB" />
              <Text style={styles.patientLabel}>Nome:</Text>
              <Text style={styles.patientValue}>{paciente.nome}</Text>
            </View>
            
            <View style={styles.patientRow}>
              <Ionicons name="card" size={20} color="#2E86AB" />
              <Text style={styles.patientLabel}>CPF:</Text>
              <Text style={styles.patientValue}>{paciente.cpf}</Text>
            </View>
            
            <View style={styles.patientRow}>
              <Ionicons name="calendar" size={20} color="#2E86AB" />
              <Text style={styles.patientLabel}>Data de Nascimento:</Text>
              <Text style={styles.patientValue}>
                {paciente.dataNascimento ? 
                  new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : 
                  'Não informado'
                }
              </Text>
            </View>
            
            <View style={styles.patientRow}>
              <Ionicons name="time" size={20} color="#2E86AB" />
              <Text style={styles.patientLabel}>Status:</Text>
              <Text style={[styles.patientValue, styles.statusText]}>Em Observação</Text>
            </View>
          </View>
        </View>

        {/* Formulário de Justificativa */}
        <View style={styles.justificationSection}>
          <Text style={styles.sectionTitle}>Justificativa da Liberação *</Text>
          <Text style={styles.sectionSubtitle}>
            Descreva o motivo da liberação do paciente e as condições clínicas observadas.
          </Text>
          
          <TextInput
            style={styles.justificationInput}
            value={justificativa}
            onChangeText={setJustificativa}
            placeholder="Ex: Paciente apresentou melhora significativa dos sintomas, sinais vitais estáveis, orientações fornecidas para cuidados domiciliares..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          
          <Text style={styles.characterCount}>
            {justificativa.length}/500 caracteres
          </Text>
        </View>

        {/* Informações Adicionais */}
        <View style={styles.additionalInfo}>
          <Text style={styles.sectionTitle}>Informações da Liberação</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle" size={20} color="#666" />
              <Text style={styles.infoLabel}>Liberado por:</Text>
              <Text style={styles.infoValue}>{usuario?.nome_completo || usuario?.name || usuario?.nome || 'Enfermeiro'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Data/Hora:</Text>
              <Text style={styles.infoValue}>
                {new Date().toLocaleString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          disabled={carregando}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.confirmButton, carregando && styles.disabledButton]}
          onPress={liberarPaciente}
          disabled={carregando}
        >
          {carregando ? (
            <Text style={styles.confirmButtonText}>Liberando...</Text>
          ) : (
            <Text style={styles.confirmButtonText}>Liberar Paciente</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2E86AB',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  patientInfo: {
    marginBottom: 30,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginRight: 10,
    minWidth: 80,
  },
  patientValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  statusText: {
    color: '#f39c12',
    fontWeight: '600',
  },
  justificationSection: {
    marginBottom: 30,
  },
  justificationInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  additionalInfo: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginRight: 10,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
});

export default TelaLiberarPaciente;
