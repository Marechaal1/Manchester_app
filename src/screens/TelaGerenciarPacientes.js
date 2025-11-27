import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usarPaciente } from '../context/ContextoPaciente';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { estilosComuns } from '../styles/designSystem';
import FormularioPaciente from '../components/FormularioPaciente';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import pacientesService from '../services/pacientes.service';

const TelaGerenciarPacientes = ({ navigation }) => {
  const { obterPacientes, carregarPacientes, carregando, erro, pacientes: pacientesContexto } = usarPaciente();
  const { ehEnfermeiro } = usarAutenticacao();
  
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(false);

  // Carregar dados quando a tela for montada
  useEffect(() => {
    const carregarDados = async () => {
      if (carregandoInicial) return; // Evitar múltiplas chamadas
      
      try {
        setCarregandoInicial(true);
        console.log('🔄 TelaGerenciarPacientes - Carregando pacientes da API...');
        await carregarPacientes();
      } catch (error) {
        console.error('❌ TelaGerenciarPacientes - Erro ao carregar pacientes:', error);
        Alert.alert('Erro', `Erro ao carregar lista de pacientes: ${error.message}`);
      } finally {
        setCarregandoInicial(false);
      }
    };

    carregarDados();
  }, []); // Array vazio para executar apenas uma vez

  // Sincronizar com o estado do contexto
  useEffect(() => {
    if (pacientesContexto && pacientesContexto.length > 0) {
      console.log('🔄 TelaGerenciarPacientes - Sincronizando com contexto:', pacientesContexto.length);
      setPacientes(pacientesContexto);
      setPacientesFiltrados(pacientesContexto);
    }
  }, [pacientesContexto]);

  // Filtrar pacientes baseado na busca
  useEffect(() => {
    if (!busca.trim()) {
      setPacientesFiltrados(pacientes);
    } else {
      const filtrados = pacientes.filter(paciente => 
        (paciente.nome_completo || paciente.nome)?.toLowerCase().includes(busca.toLowerCase()) ||
        paciente.cpf?.includes(busca) ||
        paciente.idEtiqueta?.toLowerCase().includes(busca.toLowerCase())
      );
      setPacientesFiltrados(filtrados);
    }
  }, [busca, pacientes]);

  // Verificar se é enfermeiro
  useEffect(() => {
    if (!ehEnfermeiro()) {
      Alert.alert('Acesso Negado', 'Apenas enfermeiros podem gerenciar pacientes');
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard');
    }
  }, [ehEnfermeiro, navigation]);

  // Função de refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await carregarPacientes();
    } catch (error) {
      console.error('❌ TelaGerenciarPacientes - Erro ao atualizar pacientes:', error);
    } finally {
      setRefreshing(false);
    }
  }, [carregarPacientes]);

  // Abrir modal de edição
  const abrirModalEdicao = (paciente) => {
    setPacienteSelecionado(paciente);
    setModalVisivel(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalVisivel(false);
    setPacienteSelecionado(null);
  };


  // Salvar/Atualizar paciente (persistência real na API)
  const salvarPaciente = async (dadosPaciente) => {
    try {
      setSalvando(true);
      console.log('💾 TelaGerenciarPacientes - Salvando paciente (payload):', dadosPaciente);

      let resposta;
      if (pacienteSelecionado?.id) {
        // Atualizar paciente existente
        resposta = await pacientesService.atualizarPaciente(pacienteSelecionado.id, dadosPaciente);
        console.log('✅ Paciente atualizado:', resposta);
      } else {
        // Criar novo paciente
        resposta = await pacientesService.criarPaciente(dadosPaciente);
        console.log('✅ Paciente criado:', resposta);
      }

      Alert.alert(
        'Sucesso',
        'Paciente salvo com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              fecharModal();
              carregarPacientes(); // Recarregar lista
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ TelaGerenciarPacientes - Erro ao salvar paciente:', error);
      Alert.alert('Erro', error?.message || 'Erro ao salvar paciente. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Renderizar item da lista
  const renderPaciente = ({ item: paciente }) => (
    <TouchableOpacity
      style={styles.pacienteCard}
      onPress={() => abrirModalEdicao(paciente)}
    >
      <View style={styles.pacienteHeader}>
        <View style={styles.pacienteInfo}>
          <Text style={styles.pacienteNome}>{paciente.nome_completo || paciente.nome || 'Nome não informado'}</Text>
          <Text style={styles.pacienteCpf}>CPF: {paciente.cpf || 'Não informado'}</Text>
        </View>
        <View style={styles.pacienteActions}>
          <Ionicons name="create-outline" size={20} color="#2E86AB" />
        </View>
      </View>
      
      <View style={styles.pacienteDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <Text style={styles.detailText}>ID: {paciente.idEtiqueta || 'N/A'}</Text>
        </View>
        
        {(paciente.data_nascimento || paciente.dataNascimento) && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              Nascimento: {formatDateToDDMMYYYY(paciente.data_nascimento || paciente.dataNascimento)}
            </Text>
          </View>
        )}
        
        {paciente.sexo && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Sexo: {paciente.sexo}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Renderizar modal de edição
  const renderModalEdicao = () => (
    <Modal
      visible={modalVisivel}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={fecharModal}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {pacienteSelecionado ? 'Editar Paciente' : 'Novo Paciente'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <FormularioPaciente
          paciente={pacienteSelecionado}
          onSave={salvarPaciente}
          onCancel={fecharModal}
          carregando={salvando}
          modoEdicao={!!pacienteSelecionado}
        />
      </View>
    </Modal>
  );

  if (!ehEnfermeiro()) {
    return null;
  }

  return (
    <View style={estilosComuns.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Pacientes</Text>
        <TouchableOpacity
          style={styles.newPatientButton}
          onPress={() => abrirModalEdicao(null)}
        >
          <Ionicons name="person-add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Barra de Busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, CPF ou ID..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor="#999"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Indicador de Carregamento */}
      {carregando && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando pacientes...</Text>
        </View>
      )}

      {/* Lista de Pacientes */}
      <FlatList
        data={pacientesFiltrados}
        renderItem={renderPaciente}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {carregando 
                ? 'Carregando...' 
                : busca 
                  ? 'Nenhum paciente encontrado' 
                  : 'Nenhum paciente cadastrado'
              }
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {carregando 
                ? 'Aguarde enquanto carregamos os dados'
                : busca 
                  ? 'Tente ajustar os termos de busca'
                  : 'Clique no botão verde + para cadastrar um novo paciente'
              }
            </Text>
            {erro && (
              <Text style={styles.errorText}>
                Erro: {erro}
              </Text>
            )}
          </View>
        }
      />

      {/* Modal de Edição */}
      {renderModalEdicao()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2E86AB',
    paddingTop: 50, // Espaço para a barra de status
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
  newPatientButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 20,
  },
  pacienteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pacienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pacienteInfo: {
    flex: 1,
  },
  pacienteNome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pacienteCpf: {
    fontSize: 14,
    color: '#666',
  },
  pacienteActions: {
    padding: 8,
  },
  pacienteDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default TelaGerenciarPacientes;
