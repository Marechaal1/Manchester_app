import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saeService } from '../services/sae.service';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { cores, tipografia, sombras, espacamentos, raioBorda, estilosComuns, icones } from '../styles/designSystem';

const ViewSAEScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { usuario: user } = usarAutenticacao();
  const [saeData, setSaeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSAEData();
  }, [patientId]);

  const loadSAEData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Carregando SAE para paciente:', patientId);
      
      // Buscar SAE da triagem específica
      const response = await saeService.listar({ triagem_id: patientId });
      
      if (response.sucesso && response.dados?.data?.length > 0) {
        const saeRecord = response.dados.data[0]; // Pegar a mais recente
        console.log('✅ SAE encontrada:', saeRecord);
        console.log('📊 Estrutura dos dados SAE:');
        console.log('   - diagnosticos_enfermagem:', typeof saeRecord.diagnosticos_enfermagem, saeRecord.diagnosticos_enfermagem);
        console.log('   - intervencoes_enfermagem:', typeof saeRecord.intervencoes_enfermagem, saeRecord.intervencoes_enfermagem);
        console.log('   - dados_clinicos:', typeof saeRecord.dados_clinicos, saeRecord.dados_clinicos);
        setSaeData(saeRecord);
      } else {
        console.log('ℹ️ Nenhuma SAE encontrada para o paciente');
        setError('Nenhuma SAE encontrada para este paciente');
      }
    } catch (error) {
      console.log('❌ Erro ao carregar SAE:', error.message);
      setError('Erro ao carregar SAE: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderClinicalData = () => {
    if (!saeData?.dados_clinicos) return null;
    
    const clinicalData = saeData.dados_clinicos;
    
    // Função para renderizar valor de forma segura
    const renderValue = (value) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return value.toString();
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return 'N/A';
    };

    // Dados vitais organizados em cards
    const vitalSigns = [
      { label: 'Pressão Arterial', value: clinicalData.bloodPressure, icon: 'heart', color: cores.erro },
      { label: 'Frequência Cardíaca', value: clinicalData.heartRate, unit: 'bpm', icon: 'pulse', color: cores.erro },
      { label: 'Temperatura', value: clinicalData.temperature, unit: '°C', icon: 'thermometer', color: cores.aviso },
      { label: 'Frequência Respiratória', value: clinicalData.respiratoryRate, unit: 'rpm', icon: 'air', color: cores.primaria },
      { label: 'Saturação de Oxigênio', value: clinicalData.oxygenSaturation, unit: '%', icon: 'water', color: cores.primaria },
      { label: 'Peso', value: clinicalData.weight, unit: 'kg', icon: 'scale', color: cores.cinza },
      { label: 'Altura', value: clinicalData.height, unit: 'cm', icon: 'resize', color: cores.cinza },
    ].filter(item => item.value);
    
    return (
      <View style={estilosComuns.secao}>
        <View style={estilosComuns.cabecalhoSecao}>
          <Ionicons name="pulse" size={20} color={cores.primaria} />
          <Text style={estilosComuns.tituloSecao}>Dados Clínicos</Text>
        </View>
        
        {/* Grid de sinais vitais */}
        <View style={styles.vitalSignsGrid}>
          {vitalSigns.map((vital, index) => (
            <View key={index} style={[styles.vitalCard, { borderLeftColor: vital.color }]}>
              <View style={styles.vitalHeader}>
                <Ionicons name={vital.icon} size={16} color={vital.color} />
                <Text style={styles.vitalLabel}>{vital.label}</Text>
              </View>
              <Text style={styles.vitalValue}>
                {renderValue(vital.value)}{vital.unit ? ` ${vital.unit}` : ''}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Sintomas */}
        {clinicalData.symptoms && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Sintomas:</Text>
            <Text style={styles.infoValue}>{renderValue(clinicalData.symptoms)}</Text>
          </View>
        )}
        
        {/* Histórico Médico */}
        {clinicalData.medicalHistory && (
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Histórico Médico:</Text>
            <Text style={styles.infoValue}>{renderValue(clinicalData.medicalHistory)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderNursingDiagnoses = () => {
    if (!saeData?.diagnosticos_enfermagem || saeData.diagnosticos_enfermagem.length === 0) {
      return null;
    }
    
    return (
      <View style={estilosComuns.secao}>
        <View style={estilosComuns.cabecalhoSecao}>
          <Ionicons name="clipboard" size={20} color={cores.primaria} />
          <Text style={estilosComuns.tituloSecao}>Diagnósticos de Enfermagem</Text>
        </View>
        {saeData.diagnosticos_enfermagem.map((diagnosis, index) => {
          // Tratar se diagnosis é um objeto ou string
          const diagnosisText = typeof diagnosis === 'string' 
            ? diagnosis 
            : diagnosis?.title || diagnosis?.definition || JSON.stringify(diagnosis);
          
          return (
            <View key={index} style={styles.diagnosisCard}>
              <View style={styles.diagnosisHeader}>
                <Ionicons name="medical" size={16} color={cores.primaria} />
                <Text style={styles.diagnosisNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.diagnosisText}>{diagnosisText}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderNursingInterventions = () => {
    if (!saeData?.intervencoes_enfermagem || saeData.intervencoes_enfermagem.length === 0) {
      return null;
    }
    
    return (
      <View style={estilosComuns.secao}>
        <View style={estilosComuns.cabecalhoSecao}>
          <Ionicons name="eye-outline" size={20} color={cores.primaria} />
          <Text style={estilosComuns.tituloSecao}>Intervenções de Enfermagem</Text>
        </View>
        {saeData.intervencoes_enfermagem.map((intervention, index) => {
          // Tratar se intervention é um objeto ou string
          const interventionText = typeof intervention === 'string' 
            ? intervention 
            : intervention?.title || intervention?.description || JSON.stringify(intervention);
          
          return (
            <View key={index} style={styles.interventionCard}>
              <View style={styles.interventionHeader}>
                <Ionicons name="checkmark-circle" size={16} color={cores.sucesso} />
                <Text style={styles.interventionNumber}>#{index + 1}</Text>
              </View>
              <Text style={styles.interventionText}>{interventionText}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderNursingEvolution = () => {
    if (!saeData?.evolucao_enfermagem) {
      return null;
    }
    
    return (
      <View style={estilosComuns.secao}>
        <View style={estilosComuns.cabecalhoSecao}>
          <Ionicons name="trending-up" size={20} color={cores.primaria} />
          <Text style={estilosComuns.tituloSecao}>Evolução de Enfermagem</Text>
        </View>
        <View style={styles.evolutionCard}>
          <View style={styles.evolutionHeader}>
            <Ionicons name="time" size={16} color={cores.aviso} />
            <Text style={styles.evolutionLabel}>Evolução</Text>
          </View>
          <Text style={styles.evolutionText}>{saeData.evolucao_enfermagem}</Text>
        </View>
      </View>
    );
  };

  const renderAdditionalObservations = () => {
    if (!saeData?.observacoes_adicionais) {
      return null;
    }
    
    return (
      <View style={estilosComuns.secao}>
        <View style={estilosComuns.cabecalhoSecao}>
          <Ionicons name="document-text" size={20} color={cores.primaria} />
          <Text style={estilosComuns.tituloSecao}>Observações Adicionais</Text>
        </View>
        <View style={styles.observationsCard}>
          <View style={styles.observationsHeader}>
            <Ionicons name="eye" size={16} color={cores.cinza} />
            <Text style={styles.observationsLabel}>Observações</Text>
          </View>
          <Text style={styles.observationsText}>{saeData.observacoes_adicionais}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={estilosComuns.container}>
        <View style={estilosComuns.header}>
          <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
          <View style={estilosComuns.headerContent}>
            <TouchableOpacity
              style={estilosComuns.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={cores.branco} />
            </TouchableOpacity>
            <Text style={estilosComuns.headerTitle}>SAE - Visualização</Text>
            <View style={estilosComuns.progressSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={cores.primaria} />
          <Text style={styles.loadingText}>Carregando SAE...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilosComuns.container}>
        <View style={estilosComuns.header}>
          <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
          <View style={estilosComuns.headerContent}>
            <TouchableOpacity
              style={estilosComuns.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={cores.branco} />
            </TouchableOpacity>
            <Text style={estilosComuns.headerTitle}>SAE - Visualização</Text>
            <View style={estilosComuns.progressSpacer} />
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={cores.erro} />
          <Text style={styles.errorTitle}>Erro ao Carregar SAE</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={[estilosComuns.botao, estilosComuns.botaoSucesso]} onPress={loadSAEData}>
            <Text style={estilosComuns.textoBotao}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[estilosComuns.botao, estilosComuns.botaoSecundario]} onPress={() => navigation.goBack()}>
            <Text style={estilosComuns.textoBotaoSecundario}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!saeData) {
    return (
      <View style={estilosComuns.container}>
        <View style={estilosComuns.header}>
          <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
          <View style={estilosComuns.headerContent}>
            <TouchableOpacity
              style={estilosComuns.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={cores.branco} />
            </TouchableOpacity>
            <Text style={estilosComuns.headerTitle}>SAE - Visualização</Text>
            <View style={estilosComuns.progressSpacer} />
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color={cores.cinza} />
          <Text style={styles.emptyTitle}>Nenhuma SAE Encontrada</Text>
          <Text style={styles.emptyMessage}>
            Este paciente não possui SAE registrada.
          </Text>
          <TouchableOpacity style={[estilosComuns.botao, estilosComuns.botaoSecundario]} onPress={() => navigation.goBack()}>
            <Text style={estilosComuns.textoBotaoSecundario}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={estilosComuns.container}>
      {/* Header Padronizado */}
      <View style={estilosComuns.header}>
        <StatusBar barStyle="light-content" backgroundColor={cores.primaria} />
        <View style={estilosComuns.headerContent}>
          <TouchableOpacity
            style={estilosComuns.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
          >
            <Ionicons name="arrow-back" size={24} color={cores.branco} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleContainer}>
              <Text style={estilosComuns.headerTitle}>
                SAE - Visualização
              </Text>
            </View>
            <Text style={estilosComuns.headerSubtitle}>
              Sistematização da Assistência de Enfermagem
            </Text>
          </View>
          <View style={estilosComuns.progressSpacer} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Informações da SAE */}
        <View style={estilosComuns.secao}>
          <View style={estilosComuns.cabecalhoSecao}>
            <Ionicons name="information-circle" size={20} color={cores.primaria} />
            <Text style={estilosComuns.tituloSecao}>Informações da SAE</Text>
          </View>
          <View style={styles.saeInfoGrid}>
            <View style={styles.saeInfoItem}>
              <Ionicons name="time" size={16} color={cores.primaria} />
              <Text style={styles.saeInfoLabel}>Data/Hora:</Text>
              <Text style={styles.saeInfoValue}>{formatDate(saeData.data_registro)}</Text>
            </View>
            <View style={styles.saeInfoItem}>
              <Ionicons name="person" size={16} color={cores.primaria} />
              <Text style={styles.saeInfoLabel}>Responsável:</Text>
              <Text style={styles.saeInfoValue}>{saeData.responsavel_nome || 'N/A'}</Text>
            </View>
            <View style={styles.saeInfoItem}>
              <Ionicons name="card" size={16} color={cores.primaria} />
              <Text style={styles.saeInfoLabel}>COREN:</Text>
              <Text style={styles.saeInfoValue}>{saeData.responsavel_coren || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Dados Clínicos */}
        {renderClinicalData()}

        {/* Diagnósticos de Enfermagem */}
        {renderNursingDiagnoses()}

        {/* Intervenções de Enfermagem */}
        {renderNursingInterventions()}

        {/* Evolução de Enfermagem */}
        {renderNursingEvolution()}

        {/* Observações Adicionais */}
        {renderAdditionalObservations()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estados de loading, erro e vazio
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xl,
  },
  loadingText: {
    ...tipografia.corpo,
    marginTop: espacamentos.lg,
    color: cores.cinza,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xl,
  },
  errorTitle: {
    ...tipografia.titulo,
    color: cores.erro,
    marginTop: espacamentos.lg,
    marginBottom: espacamentos.sm,
  },
  errorMessage: {
    ...tipografia.corpo,
    color: cores.cinza,
    textAlign: 'center',
    marginBottom: espacamentos.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xl,
  },
  emptyTitle: {
    ...tipografia.titulo,
    color: cores.cinza,
    marginTop: espacamentos.lg,
    marginBottom: espacamentos.sm,
  },
  emptyMessage: {
    ...tipografia.corpo,
    color: cores.cinza,
    textAlign: 'center',
    marginBottom: espacamentos.xxl,
  },

  // Header customizado
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  headerTitleCustom: {
    marginLeft: espacamentos.sm,
  },
  headerSubtitleCustom: {
    textAlign: 'center',
  },

  // Conteúdo
  content: {
    flex: 1,
    padding: espacamentos.lg,
  },

  // Informações da SAE
  saeInfoGrid: {
    gap: espacamentos.md,
  },
  saeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espacamentos.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.cinzaClaro,
  },
  saeInfoLabel: {
    ...tipografia.corpo,
    fontWeight: '600',
    color: cores.cinza,
    marginLeft: espacamentos.sm,
    marginRight: espacamentos.sm,
    minWidth: 100,
  },
  saeInfoValue: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    flex: 1,
  },

  // Sinais vitais
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamentos.sm,
    marginBottom: espacamentos.lg,
  },
  vitalCard: {
    backgroundColor: cores.cinzaClaro,
    borderRadius: raioBorda.sm,
    padding: espacamentos.md,
    borderLeftWidth: 4,
    minWidth: '45%',
    flex: 1,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  vitalLabel: {
    ...tipografia.legenda,
    marginLeft: espacamentos.xs,
    color: cores.cinza,
  },
  vitalValue: {
    ...tipografia.cabecalho,
    color: cores.cinzaEscuro,
  },

  // Seções de informação
  infoSection: {
    marginTop: espacamentos.md,
    paddingTop: espacamentos.md,
    borderTopWidth: 1,
    borderTopColor: cores.cinzaClaro,
  },
  infoLabel: {
    ...tipografia.corpo,
    fontWeight: '600',
    color: cores.cinza,
    marginBottom: espacamentos.xs,
  },
  infoValue: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    lineHeight: 20,
  },

  // Diagnósticos
  diagnosisCard: {
    backgroundColor: cores.cinzaClaro,
    borderRadius: raioBorda.sm,
    padding: espacamentos.md,
    marginBottom: espacamentos.sm,
    borderLeftWidth: 4,
    borderLeftColor: cores.primaria,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  diagnosisNumber: {
    ...tipografia.legenda,
    marginLeft: espacamentos.xs,
    color: cores.primaria,
    fontWeight: '600',
  },
  diagnosisText: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    lineHeight: 20,
  },

  // Intervenções
  interventionCard: {
    backgroundColor: cores.cinzaClaro,
    borderRadius: raioBorda.sm,
    padding: espacamentos.md,
    marginBottom: espacamentos.sm,
    borderLeftWidth: 4,
    borderLeftColor: cores.sucesso,
  },
  interventionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  interventionNumber: {
    ...tipografia.legenda,
    marginLeft: espacamentos.xs,
    color: cores.sucesso,
    fontWeight: '600',
  },
  interventionText: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    lineHeight: 20,
  },

  // Evolução
  evolutionCard: {
    backgroundColor: cores.cinzaClaro,
    borderRadius: raioBorda.sm,
    padding: espacamentos.md,
    borderLeftWidth: 4,
    borderLeftColor: cores.aviso,
  },
  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  evolutionLabel: {
    ...tipografia.legenda,
    marginLeft: espacamentos.xs,
    color: cores.aviso,
    fontWeight: '600',
  },
  evolutionText: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    lineHeight: 20,
  },

  // Observações
  observationsCard: {
    backgroundColor: cores.cinzaClaro,
    borderRadius: raioBorda.sm,
    padding: espacamentos.md,
    borderLeftWidth: 4,
    borderLeftColor: cores.cinza,
  },
  observationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.xs,
  },
  observationsLabel: {
    ...tipografia.legenda,
    marginLeft: espacamentos.xs,
    color: cores.cinza,
    fontWeight: '600',
  },
  observationsText: {
    ...tipografia.corpo,
    color: cores.cinzaEscuro,
    lineHeight: 20,
  },
});

export default ViewSAEScreen;
