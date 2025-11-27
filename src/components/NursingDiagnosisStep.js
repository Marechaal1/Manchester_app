import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { diagnosticosCipeService } from '../services/catalogos.service';

const NursingDiagnosisStep = ({ data, onUpdate }) => {
  const [searchText, setSearchText] = useState('');

  // Estado para diagnósticos (buscados do backend)
  const [nursingDiagnoses, setNursingDiagnoses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const carregarDiagnosticos = async () => {
      try {
        setIsLoading(true);
        const resposta = await diagnosticosCipeService.listar({ apenasAtivos: true });
        const lista = Array.isArray(resposta?.dados) ? resposta.dados : [];
        // Normalizar para o formato usado pelo componente
        const normalizados = lista.map((d) => ({
          id: String(d.id ?? d.codigo ?? d.titulo),
          code: d.codigo || '',
          title: d.titulo || '',
          definition: d.definicao || '',
          domain: d.dominio || '',
          category: d.categoria || '',
        }));
        setNursingDiagnoses(normalizados);
      } catch (e) {
        setNursingDiagnoses([]);
      } finally {
        setIsLoading(false);
      }
    };
    carregarDiagnosticos();
  }, []);

  const [selectedDiagnoses, setSelectedDiagnoses] = useState(data.nursingDiagnoses || []);

  const filteredDiagnoses = nursingDiagnoses.filter(diagnosis =>
    diagnosis.title.toLowerCase().includes(searchText.toLowerCase()) ||
    diagnosis.definition.toLowerCase().includes(searchText.toLowerCase()) ||
    diagnosis.domain.toLowerCase().includes(searchText.toLowerCase())
  );
  const selectedIds = new Set((selectedDiagnoses || []).map(d => String(d.id)));
  const orderedDiagnoses = [...filteredDiagnoses].sort((a, b) => {
    const aSel = selectedIds.has(String(a.id)) ? 1 : 0;
    const bSel = selectedIds.has(String(b.id)) ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel; // selecionados primeiro
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  const toggleDiagnosis = (diagnosis) => {
    const isSelected = selectedDiagnoses.some(d => d.id === diagnosis.id);
    
    if (isSelected) {
      const updated = selectedDiagnoses.filter(d => d.id !== diagnosis.id);
      setSelectedDiagnoses(updated);
      onUpdate('nursingDiagnoses', updated);
    } else {
      const updated = [...selectedDiagnoses, diagnosis];
      setSelectedDiagnoses(updated);
      onUpdate('nursingDiagnoses', updated);
    }
  };

  const isDiagnosisSelected = (diagnosisId) => {
    return selectedDiagnoses.some(d => d.id === diagnosisId);
  };

  const DiagnosisCard = ({ diagnosis, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.diagnosisCard,
        isSelected && styles.diagnosisCardSelected,
      ]}
      onPress={() => toggleDiagnosis(diagnosis)}
    >
      <View style={styles.diagnosisHeader}>
        <View style={styles.diagnosisInfo}>
          <Text style={[styles.diagnosisTitle, isSelected && styles.selectedText]}>
            {diagnosis.title}
          </Text>
          <Text style={[styles.diagnosisCode, isSelected && styles.selectedText]}>
            Código: {diagnosis.code}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#2E86AB" />
          )}
        </View>
      </View>
      
      <Text style={[styles.diagnosisDefinition, isSelected && styles.selectedText]}>
        {diagnosis.definition}
      </Text>
      
      <View style={styles.diagnosisMeta}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, isSelected && styles.selectedText]}>Domínio:</Text>
          <Text style={[styles.metaValue, isSelected && styles.selectedText]}>
            {diagnosis.domain}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, isSelected && styles.selectedText]}>Categoria:</Text>
          <Text style={[styles.metaValue, isSelected && styles.selectedText]}>
            {diagnosis.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Busca movida para baixo dos selecionados */}

      {/* Contador de seleções */}
      <View style={styles.counterContainer}>
        <View style={styles.counterHeader}>
          <Ionicons name="clipboard" size={20} color="#2E86AB" />
          <Text style={styles.counterText}>
            {selectedDiagnoses.length} diagnóstico(s) selecionado(s)
          </Text>
        </View>
        {selectedDiagnoses.length === 0 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#f39c12" />
            <Text style={styles.warningText}>
              É obrigatório selecionar pelo menos um diagnóstico
            </Text>
          </View>
        )}
      </View>

      {/* Diagnósticos selecionados removidos conforme solicitado */}

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Buscar diagnósticos</Text>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Digite parte do título, definição ou domínio..."
        />
      </View>

      {/* Lista de diagnósticos */}
      <View style={styles.diagnosesList}>
        {orderedDiagnoses.map((diagnosis) => (
          <DiagnosisCard
            key={diagnosis.id}
            diagnosis={diagnosis}
            isSelected={isDiagnosisSelected(diagnosis.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  counterContainer: {
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
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef9e7',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#f39c12',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  diagnosesList: {
    gap: 15,
  },
  diagnosisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  diagnosisCardSelected: {
    borderColor: '#2E86AB',
    backgroundColor: '#f8f9ff',
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diagnosisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  diagnosisCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  checkboxContainer: {
    marginLeft: 10,
  },
  diagnosisDefinition: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  diagnosisMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedText: {
    color: '#2E86AB',
  },
  selectedContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginLeft: 8,
  },
  selectedItem: {
    paddingVertical: 5,
  },
  selectedItemText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
});

export default NursingDiagnosisStep;
