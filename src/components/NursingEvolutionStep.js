import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { templatesEvolucaoService } from '../services/catalogos.service';
// COREN é gerenciado no web; não exibir input aqui

const NursingEvolutionStep = ({ data, onUpdate, patient, onInputFocus }) => {
  const [evolutionText, setEvolutionText] = useState(data.nursingEvolution || '');
  const [additionalObservations, setAdditionalObservations] = useState(data.additionalObservations || '');
  const evolutionRef = useRef(null);
  const observationsRef = useRef(null);
  // sem dependência de autenticação nesta etapa

  const getRiskDescription = (category) => {
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

  const handleEvolutionChange = (text) => {
    setEvolutionText(text);
    onUpdate('nursingEvolution', text);
  };

  const handleObservationsChange = (text) => {
    setAdditionalObservations(text);
    onUpdate('additionalObservations', text);
  };

  const addTemplate = (template) => {
    const currentText = evolutionText;
    const newText = currentText ? `${currentText}\n\n${template}` : template;
    setEvolutionText(newText);
    onUpdate('nursingEvolution', newText);
  };

  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    const carregarTemplates = async () => {
      try {
        const resposta = await templatesEvolucaoService.listar({ apenasAtivos: true });
        const lista = Array.isArray(resposta?.dados) ? resposta.dados : [];
        const normalizados = lista.map(t => ({ id: String(t.id), title: t.titulo, template: t.conteudo }));
        setTemplates(normalizados);
      } catch (e) {
        setTemplates([]);
      }
    };
    carregarTemplates();
  }, []);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateEvolutionHeader = () => {
    return `Evolução de Enfermagem - ${getCurrentDateTime()}\nPaciente: ${patient?.nome || 'Nome não disponível'}\nID: ${patient?.idEtiqueta || 'N/I'}\nResponsável: ${data.responsibleNurse} - ${data.coren}\n\n`;
  };

  const TemplateButton = ({ template }) => (
    <TouchableOpacity
      style={styles.templateButton}
      onPress={() => addTemplate(template.template)}
    >
      <Text style={styles.templateButtonText}>{template.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

      {/* Identificação Profissional removida: COREN é definido no gerenciador web */}

      {/* Informações do Paciente */}
      <View style={styles.patientInfo}>
        <View style={styles.patientInfoHeader}>
          <Ionicons name="person-circle" size={20} color="#2E86AB" />
          <Text style={styles.patientInfoTitle}>Informações do Paciente</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Nome:</Text>
          <Text style={styles.patientInfoValue}>{patient?.nome || 'Nome não disponível'}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>CPF:</Text>
          <Text style={styles.patientInfoValue}>{patient?.cpf || 'N/I'}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>ID:</Text>
          <Text style={styles.patientInfoValue}>{patient?.idEtiqueta || 'N/I'}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Classificação de Risco:</Text>
          <Text style={styles.patientInfoValue}>{getRiskDescription(patient?.categoriaRisco)}</Text>
        </View>
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Data de Nascimento:</Text>
          <Text style={styles.patientInfoValue}>{formatDateToDDMMYYYY(patient?.dataNascimento)}</Text>
        </View>
        {patient?.sexo && (
          <View style={styles.patientInfoRow}>
            <Text style={styles.patientInfoLabel}>Sexo:</Text>
            <Text style={styles.patientInfoValue}>{patient.sexo}</Text>
          </View>
        )}
        <View style={styles.patientInfoRow}>
          <Text style={styles.patientInfoLabel}>Data/Hora:</Text>
          <Text style={styles.patientInfoValue}>{getCurrentDateTime()}</Text>
        </View>
      </View>

      {/* Sinais Vitais (prioriza os preenchidos na SAE; fallback: triagem) */}
      {(
        data?.bloodPressure || data?.heartRate || data?.temperature || data?.respiratoryRate || data?.oxygenSaturation ||
        patient?.pressaoArterial || patient?.frequenciaCardiaca || patient?.temperatura || patient?.frequenciaRespiratoria || patient?.saturacaoOxigenio
      ) && (
        <View style={styles.triageVitalSignsCard}>
          <View style={styles.triageVitalSignsHeader}>
            <Ionicons name="pulse" size={16} color="#27ae60" />
            <Text style={styles.triageVitalSignsTitle}>Sinais Vitais</Text>
          </View>
          <View style={styles.triageVitalSignsGrid}>
            {(data?.bloodPressure || patient?.pressaoArterial) && (
              <View style={styles.triageVitalSignItem}>
                <Text style={styles.triageVitalSignLabel}>PA:</Text>
                <Text style={styles.triageVitalSignValue}>{data?.bloodPressure || patient?.pressaoArterial}</Text>
              </View>
            )}
            {(data?.heartRate || patient?.frequenciaCardiaca) && (
              <View style={styles.triageVitalSignItem}>
                <Text style={styles.triageVitalSignLabel}>FC:</Text>
                <Text style={styles.triageVitalSignValue}>{data?.heartRate || patient?.frequenciaCardiaca}</Text>
              </View>
            )}
            {(data?.temperature || patient?.temperatura) && (
              <View style={styles.triageVitalSignItem}>
                <Text style={styles.triageVitalSignLabel}>Temp:</Text>
                <Text style={styles.triageVitalSignValue}>{(data?.temperature || patient?.temperatura) + '°C'}</Text>
              </View>
            )}
            {(data?.respiratoryRate || patient?.frequenciaRespiratoria) && (
              <View style={styles.triageVitalSignItem}>
                <Text style={styles.triageVitalSignLabel}>FR:</Text>
                <Text style={styles.triageVitalSignValue}>{data?.respiratoryRate || patient?.frequenciaRespiratoria}</Text>
              </View>
            )}
            {(data?.oxygenSaturation || patient?.saturacaoOxigenio) && (
              <View style={styles.triageVitalSignItem}>
                <Text style={styles.triageVitalSignLabel}>SpO₂:</Text>
                <Text style={styles.triageVitalSignValue}>{(data?.oxygenSaturation || patient?.saturacaoOxigenio) + '%'}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Informações Clínicas (prioriza SAE; fallback: triagem) */}
      {(data?.symptoms || data?.medicalHistory || patient?.sintomas || patient?.historicoMedico) && (
        <View style={styles.triageClinicalInfoCard}>
          <View style={styles.triageClinicalInfoHeader}>
            <Ionicons name="document-text" size={16} color="#27ae60" />
            <Text style={styles.triageClinicalInfoTitle}>Informações Clínicas</Text>
          </View>
          
          {(data?.symptoms || patient?.sintomas) && (
            <View style={styles.triageClinicalInfoItem}>
              <Ionicons name="medical" size={14} color="#27ae60" />
              <View style={styles.triageClinicalInfoContent}>
                <Text style={styles.triageClinicalInfoLabel}>Sintomas:</Text>
                <Text style={styles.triageClinicalInfoValue}>{data?.symptoms || patient?.sintomas}</Text>
              </View>
            </View>
          )}
          
          {(data?.medicalHistory || patient?.historicoMedico) && (
            <View style={styles.triageClinicalInfoItem}>
              <Ionicons name="document" size={14} color="#27ae60" />
              <View style={styles.triageClinicalInfoContent}>
                <Text style={styles.triageClinicalInfoLabel}>Histórico Médico:</Text>
                <Text style={styles.triageClinicalInfoValue}>{data?.medicalHistory || patient?.historicoMedico}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Diagnósticos, Intervenções e Resultados Selecionados */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Ionicons name="list" size={20} color="#2E86AB" />
          <Text style={styles.summaryTitle}>Diagnósticos, Intervenções e Resultados Selecionados</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>Diagnósticos de Enfermagem:</Text>
          {data.nursingDiagnoses && data.nursingDiagnoses.length > 0 ? (
            data.nursingDiagnoses.map((diagnosis, index) => (
              <Text key={index} style={styles.summaryItem}>
                • {diagnosis.code} - {diagnosis.title}
              </Text>
            ))
          ) : (
            <Text style={styles.noItems}>Nenhum diagnóstico selecionado</Text>
          )}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>Intervenções de Enfermagem:</Text>
          {data.nursingInterventions && data.nursingInterventions.length > 0 ? (
            data.nursingInterventions.map((intervention, index) => (
              <Text key={index} style={styles.summaryItem}>
                • {intervention.code} - {intervention.title}
              </Text>
            ))
          ) : (
            <Text style={styles.noItems}>Nenhuma intervenção selecionada</Text>
          )}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summarySectionTitle}>Resultados Esperados (NOC):</Text>
          {data.nursingOutcomes && data.nursingOutcomes.length > 0 ? (
            data.nursingOutcomes.map((outcome, index) => (
              <Text key={index} style={styles.summaryItem}>
                • {outcome.code} - {outcome.title}
              </Text>
            ))
          ) : (
            <Text style={styles.noItems}>Nenhum resultado selecionado</Text>
          )}
        </View>
      </View>

      {/* Templates de Evolução */}
      <View style={styles.templatesContainer}>
        <Text style={styles.templatesTitle}>Templates de Evolução:</Text>
        <View style={styles.templatesGrid}>
          {templates.map((template) => (
            <TemplateButton key={template.id} template={template} />
          ))}
        </View>
      </View>

      {/* Campo de Evolução */}
      <View style={styles.evolutionContainer}>
        <View style={styles.evolutionHeader}>
          <Ionicons name="trending-up" size={20} color="#2E86AB" />
          <Text style={styles.evolutionTitle}>
            Evolução de Enfermagem <Text style={styles.required}>*</Text>
          </Text>
        </View>
        <TextInput
          style={styles.evolutionInput}
          value={evolutionText}
          onChangeText={handleEvolutionChange}
          placeholder="Descreva a evolução clínica do paciente..."
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          ref={evolutionRef}
          onFocus={() => onInputFocus?.(evolutionRef)}
        />
        <Text style={styles.characterCount}>
          {evolutionText.length} caracteres
        </Text>
      </View>

      {/* Observações Adicionais */}
      <View style={styles.observationsContainer}>
        <Text style={styles.observationsTitle}>Observações Adicionais</Text>
        <TextInput
          style={styles.observationsInput}
          value={additionalObservations}
          onChangeText={handleObservationsChange}
          placeholder="Informações complementares não estruturadas..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          ref={observationsRef}
          onFocus={() => onInputFocus?.(observationsRef)}
        />
      </View>

      {/* Resumo da SAE */}
      <View style={styles.saeSummary}>
        <Text style={styles.saeSummaryTitle}>Resumo da SAE</Text>
        <View style={styles.saeSummaryContent}>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>Responsável:</Text> {data.responsibleNurse}
          </Text>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>COREN:</Text> {data.coren}
          </Text>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>Data/Hora:</Text> {getCurrentDateTime()}
          </Text>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>Diagnósticos:</Text> {data.nursingDiagnoses?.length || 0}
          </Text>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>Intervenções:</Text> {data.nursingInterventions?.length || 0}
          </Text>
          <Text style={styles.saeSummaryText}>
            <Text style={styles.saeSummaryLabel}>Resultados:</Text> {data.nursingOutcomes?.length || 0}
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  proIdContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  proIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proIdTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  proIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proIdLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginRight: 8,
  },
  proIdInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  patientInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  patientInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  patientInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summarySection: {
    marginBottom: 15,
  },
  summarySectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 10,
  },
  noItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  templatesContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateButtonText: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '500',
  },
  evolutionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  evolutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  required: {
    color: '#e74c3c',
  },
  evolutionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  observationsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  observationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saeSummary: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  saeSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10,
  },
  saeSummaryContent: {
    gap: 5,
  },
  saeSummaryText: {
    fontSize: 14,
    color: '#27ae60',
  },
  saeSummaryLabel: {
    fontWeight: 'bold',
  },
  // Estilos para dados da triagem
  triageVitalSignsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  triageVitalSignsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  triageVitalSignsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginLeft: 6,
  },
  triageVitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triageVitalSignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
  },
  triageVitalSignLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 4,
  },
  triageVitalSignValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  triageClinicalInfoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  triageClinicalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  triageClinicalInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginLeft: 6,
  },
  triageClinicalInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  triageClinicalInfoContent: {
    flex: 1,
    marginLeft: 6,
  },
  triageClinicalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 2,
  },
  triageClinicalInfoValue: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

export default NursingEvolutionStep;
