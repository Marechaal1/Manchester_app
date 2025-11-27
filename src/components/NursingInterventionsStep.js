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
import { intervencoesCipeService } from '../services/catalogos.service';
import { cores, tipografia, sombras, espacamentos, raioBorda, estilosComuns, icones } from '../styles/designSystem';

const NursingInterventionsStep = ({ data, onUpdate }) => {
  const [searchText, setSearchText] = useState('');
  

  // Estado para intervenções (carregadas do backend)
  const [nursingInterventions, setNursingInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Removido fallback local: sempre usar backend
  const fallbackInterventions = [
    {
      id: '001',
      code: '10001',
      title: 'Administrar analgésicos',
      definition: 'Administrar medicamentos para alívio da dor',
      domain: 'Fisiológico',
      category: 'Medicação',
    },
    {
      id: '002',
      code: '10002',
      title: 'Avaliar dor',
      definition: 'Avaliar intensidade, localização e características da dor',
      domain: 'Fisiológico',
      category: 'Avaliação',
    },
    {
      id: '003',
      code: '10003',
      title: 'Promover relaxamento',
      definition: 'Técnicas para reduzir tensão e ansiedade',
      domain: 'Psicológico',
      category: 'Terapia',
    },
    {
      id: '004',
      code: '10004',
      title: 'Educar sobre autocuidado',
      definition: 'Orientar sobre práticas de autocuidado',
      domain: 'Educação',
      category: 'Instrução',
    },
    {
      id: '005',
      code: '10005',
      title: 'Prevenir infecção',
      definition: 'Implementar medidas de prevenção de infecção',
      domain: 'Fisiológico',
      category: 'Prevenção',
    },
    {
      id: '006',
      code: '10006',
      title: 'Monitorar sinais vitais',
      definition: 'Avaliar e registrar sinais vitais regularmente',
      domain: 'Fisiológico',
      category: 'Monitoramento',
    },
    {
      id: '007',
      code: '10007',
      title: 'Reposicionar paciente',
      definition: 'Mudar posição do paciente para conforto e prevenção',
      domain: 'Fisiológico',
      category: 'Mobilidade',
    },
    {
      id: '008',
      code: '10008',
      title: 'Avaliar risco de quedas',
      definition: 'Identificar fatores de risco para quedas',
      domain: 'Segurança',
      category: 'Avaliação',
    },
    {
      id: '009',
      code: '10009',
      title: 'Promover higiene',
      definition: 'Assistir com atividades de higiene pessoal',
      domain: 'Fisiológico',
      category: 'Autocuidado',
    },
    {
      id: '010',
      code: '10010',
      title: 'Orientar sobre medicação',
      definition: 'Explicar uso correto de medicamentos',
      domain: 'Educação',
      category: 'Instrução',
    },
    {
      id: '011',
      code: '10011',
      title: 'Avaliar padrão respiratório',
      definition: 'Monitorar respiração e oxigenação',
      domain: 'Fisiológico',
      category: 'Avaliação',
    },
    {
      id: '012',
      code: '10012',
      title: 'Manter hidratação',
      definition: 'Garantir ingestão adequada de líquidos',
      domain: 'Fisiológico',
      category: 'Nutrição',
    },
    {
      id: '013',
      code: '10013',
      title: 'Promover mobilidade',
      definition: 'Incentivar movimento e exercícios',
      domain: 'Fisiológico',
      category: 'Mobilidade',
    },
    {
      id: '014',
      code: '10014',
      title: 'Avaliar sono',
      definition: 'Monitorar qualidade e quantidade do sono',
      domain: 'Fisiológico',
      category: 'Avaliação',
    },
    {
      id: '015',
      code: '10015',
      title: 'Cuidar da pele',
      definition: 'Manter integridade e higiene da pele',
      domain: 'Fisiológico',
      category: 'Autocuidado',
    },
  ];

  useEffect(() => {
    const carregar = async () => {
      try {
        setIsLoading(true);
        const resposta = await intervencoesCipeService.listar({ apenasAtivos: true });
        const lista = Array.isArray(resposta?.dados) ? resposta.dados : [];
        const normalizados = lista.map((i) => ({
          id: String(i.id ?? i.codigo ?? i.titulo),
          code: i.codigo || '',
          title: i.titulo || '',
          definition: i.definicao || '',
          domain: i.dominio || '',
          category: i.categoria || '',
        }));
        setNursingInterventions(normalizados);
      } catch (e) {
        setNursingInterventions([]);
      } finally {
        setIsLoading(false);
      }
    };
    carregar();
  }, []);

  const [selectedInterventions, setSelectedInterventions] = useState(data.nursingInterventions || []);

  const filteredInterventions = nursingInterventions.filter(intervention =>
    intervention.title.toLowerCase().includes(searchText.toLowerCase()) ||
    intervention.definition.toLowerCase().includes(searchText.toLowerCase()) ||
    intervention.domain.toLowerCase().includes(searchText.toLowerCase())
  );
  const selectedInterventionIds = new Set((selectedInterventions || []).map(i => String(i.id)));
  const orderedInterventions = [...filteredInterventions].sort((a, b) => {
    const aSel = selectedInterventionIds.has(String(a.id)) ? 1 : 0;
    const bSel = selectedInterventionIds.has(String(b.id)) ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  const toggleIntervention = (intervention) => {
    const isSelected = selectedInterventions.some(i => i.id === intervention.id);
    
    if (isSelected) {
      const updated = selectedInterventions.filter(i => i.id !== intervention.id);
      setSelectedInterventions(updated);
      onUpdate('nursingInterventions', updated);
    } else {
      const updated = [...selectedInterventions, intervention];
      setSelectedInterventions(updated);
      onUpdate('nursingInterventions', updated);
    }
  };

  

  const removeIntervention = (interventionId) => {
    const updated = selectedInterventions.filter(i => i.id !== interventionId);
    setSelectedInterventions(updated);
    onUpdate('nursingInterventions', updated);
  };

  const isInterventionSelected = (interventionId) => {
    return selectedInterventions.some(i => i.id === interventionId);
  };

  const InterventionCard = ({ intervention, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.interventionCard,
        isSelected && styles.interventionCardSelected,
      ]}
      onPress={() => toggleIntervention(intervention)}
    >
      <View style={styles.interventionHeader}>
        <View style={styles.interventionInfo}>
          <Text style={[styles.interventionTitle, isSelected && styles.selectedText]}>
            {intervention.title}
          </Text>
          <Text style={[styles.interventionCode, isSelected && styles.selectedText]}>
            Código: {intervention.code}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#2E86AB" />
          )}
        </View>
      </View>
      
      <Text style={[styles.interventionDefinition, isSelected && styles.selectedText]}>
        {intervention.definition}
      </Text>
      
      <View style={styles.interventionMeta}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, isSelected && styles.selectedText]}>Domínio:</Text>
          <Text style={[styles.metaValue, isSelected && styles.selectedText]}>
            {intervention.domain}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, isSelected && styles.selectedText]}>Categoria:</Text>
          <Text style={[styles.metaValue, isSelected && styles.selectedText]}>
            {intervention.category}
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
          <Ionicons name={icones.intervencoes} size={20} color={cores.primaria} />
          <Text style={styles.counterText}>
            {selectedInterventions.length} intervenção(ões) selecionada(s)
          </Text>
        </View>
        {selectedInterventions.length === 0 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#f39c12" />
            <Text style={styles.warningText}>
              É obrigatório selecionar pelo menos uma intervenção
            </Text>
          </View>
        )}
      </View>

      

      

      

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Buscar intervenções</Text>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Digite parte do título, definição ou domínio..."
        />
      </View>

      {/* Lista de intervenções */}
      <View style={styles.interventionsList}>
        {orderedInterventions.map((intervention) => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            isSelected={isInterventionSelected(intervention.id)}
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
  
  interventionsList: {
    gap: 15,
  },
  interventionCard: {
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
  interventionCardSelected: {
    borderColor: '#2E86AB',
    backgroundColor: '#f8f9ff',
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  interventionInfo: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  interventionCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  checkboxContainer: {
    marginLeft: 10,
  },
  interventionDefinition: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  interventionMeta: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d4edda',
  },
  selectedItemContent: {
    flex: 1,
  },
  selectedItemText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  
  removeButton: {
    padding: 5,
  },
});

export default NursingInterventionsStep;
