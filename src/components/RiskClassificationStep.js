import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, tipografia, sombras, espacamentos, raioBorda } from '../styles/designSystem';

const RiskClassificationStep = ({ data, onUpdate, isReevaluation = false, onRequestScrollToInput }) => {
  const [selectedCategory, setSelectedCategory] = useState(data.riskCategory || '');
  const justificationRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);

  const riskCategories = [
    {
      id: 'red',
      name: 'Emergência',
      color: '#FF0000',
      time: 'Atendimento Imediato',
      description: 'Paciente em risco iminente de vida',
      criteria: [
        'Parada cardiorrespiratória',
        'Choque',
        'Comprometimento das vias aéreas',
        'Convulsão em curso',
        'Hemorragia ativa grave',
      ],
    },
    {
      id: 'orange',
      name: 'Muito Urgente',
      color: '#FF8C00',
      time: 'Até 10 minutos',
      description: 'Paciente com risco de vida',
      criteria: [
        'Dor torácica intensa',
        'Dispneia grave',
        'Alteração do nível de consciência',
        'Trauma grave',
        'Sinais de choque',
      ],
    },
    {
      id: 'yellow',
      name: 'Urgente',
      color: '#FFD700',
      time: 'Até 60 minutos',
      description: 'Paciente com risco de agravamento',
      criteria: [
        'Dor abdominal intensa',
        'Cefaleia súbita e intensa',
        'Febre alta',
        'Sintomas neurológicos',
        'Trauma moderado',
      ],
    },
    {
      id: 'green',
      name: 'Pouco Urgente',
      color: '#32CD32',
      time: 'Até 120 minutos',
      description: 'Paciente com baixo risco',
      criteria: [
        'Dor moderada',
        'Sintomas respiratórios leves',
        'Trauma leve',
        'Sintomas gastrointestinais',
        'Febre baixa',
      ],
    },
    {
      id: 'blue',
      name: 'Não Urgente',
      color: '#1E90FF',
      time: 'Até 240 minutos',
      description: 'Paciente sem urgência',
      criteria: [
        'Consulta de rotina',
        'Sintomas leves',
        'Acompanhamento',
        'Procedimentos eletivos',
        'Orientações gerais',
      ],
    },
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    onUpdate('riskCategory', categoryId);
    // Após atualizar a categoria, solicitar ao layout pai para rolar ao input de justificativa
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (onRequestScrollToInput && justificationRef.current) {
          onRequestScrollToInput(justificationRef);
        }
      }, 50);
    });
  };

  const [justificationError, setJustificationError] = useState('');

  // Recentralizar o scroll quando o teclado abrir novamente, se o input estiver focado
  React.useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvt, () => {
      try {
        if (justificationRef.current?.isFocused?.() && onRequestScrollToInput) {
          onRequestScrollToInput(justificationRef);
        }
      } catch (e) {}
    });
    return () => sub?.remove?.();
  }, [onRequestScrollToInput]);

  const handleJustificationChange = (text) => {
    onUpdate('justification', text);
    if (text && justificationError) setJustificationError('');
  };

  const validateJustification = () => {
    if (!data.justification || !data.justification.trim()) {
      setJustificationError('Campo obrigatório');
      return false;
    }
    setJustificationError('');
    return true;
  };

  const getCategoryInfo = (categoryId) => {
    return riskCategories.find(cat => cat.id === categoryId);
  };

  const RiskCategoryCard = ({ category }) => {
    const isSelected = selectedCategory === category.id;
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryCard,
          { 
            borderColor: isSelected ? category.color : '#e6eaf0',
            borderWidth: isSelected ? 2 : 1,
            backgroundColor: isSelected ? category.color + '0A' : cores.branco,
          },
        ]}
        onPress={() => handleCategorySelect(category.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, isSelected && styles.selectedText]}>{category.name}</Text>
            <Text style={[styles.categoryTime, isSelected && styles.selectedText]}>{category.time}</Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color={category.color} />
          )}
        </View>
        
        <Text style={[styles.categoryDescription, isSelected && styles.selectedText]}>
          {category.description}
        </Text>
        
        <View style={styles.criteriaContainer}>
          <Text style={[styles.criteriaTitle, isSelected && styles.selectedText]}>Critérios:</Text>
          {category.criteria.map((criterion, index) => (
            <Text
              key={`${category.id}-criterion-${index}-${criterion.substring(0, 20)}`}
              style={[styles.criterion, isSelected && styles.selectedText]}
            >
              • {criterion}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const SummaryCard = () => {
    const category = getCategoryInfo(selectedCategory);
    if (!category) return null;

    return (
      <View style={[styles.summaryCard, { borderLeftColor: category.color }]}>
        <Text style={styles.summaryTitle}>Resumo da Classificação</Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Categoria:</Text>
            <View style={styles.summaryValueContainer}>
              <View style={[styles.summaryColor, { backgroundColor: category.color }]} />
              <Text style={styles.summaryValue}>{category.name}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tempo de Espera:</Text>
            <Text style={styles.summaryValue}>{category.time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paciente:</Text>
            <Text style={styles.summaryValue}>{data.name || 'Nome não informado'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Resumo dos Dados Clínicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Clínicos Coletados</Text>
          <View style={styles.clinicalDataSummary}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Pressão:</Text>
              <Text style={styles.dataValue}>{data.bloodPressure || 'N/A'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>FC:</Text>
              <Text style={styles.dataValue}>{data.heartRate || 'N/A'} bpm</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Temp:</Text>
              <Text style={styles.dataValue}>{data.temperature || 'N/A'}°C</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>FR:</Text>
              <Text style={styles.dataValue}>{data.respiratoryRate || 'N/A'} irpm</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>SpO₂:</Text>
              <Text style={styles.dataValue}>{data.oxygenSaturation || 'N/A'}%</Text>
            </View>
          </View>
        </View>

        {/* Seleção de Categoria - design original (cards com detalhes) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione a Categoria de Risco</Text>
          {riskCategories.map((category) => (
            <RiskCategoryCard key={category.id} category={category} />
          ))}
        </View>

        {/* Resumo Final */}
        {selectedCategory && <SummaryCard />}

        {/* Justificativa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Justificativa da Classificação</Text>
          <Text style={styles.inputLabel}>
            Descreva os critérios utilizados para a classificação <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            ref={justificationRef}
            style={[
              styles.input,
              styles.textArea,
              justificationError && styles.textAreaError,
            ]}
            value={data.justification}
            onChangeText={handleJustificationChange}
            placeholder="Descreva os sinais, sintomas e critérios que justificam a classificação de risco..."
            multiline
            numberOfLines={4}
            onBlur={validateJustification}
            onFocus={() => {
              if (onRequestScrollToInput && justificationRef.current) {
                onRequestScrollToInput(justificationRef);
              }
            }}
          />
          {!!justificationError && (
            <Text style={styles.errorText}>{justificationError}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  form: {
    gap: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  clinicalDataSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  // Chips de categoria
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  // Detalhes da categoria
  // estilos de detalhes removidos (voltamos a exibir dentro do card)
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  selectedText: {
    color: '#2E86AB',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  criteriaContainer: {
    marginTop: 3,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  criterion: {
    fontSize: 11,
    color: '#666',
    marginBottom: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: cores.branco,
    width: '100%',
    ...sombras.pequena,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderLeftWidth: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
});

export default RiskClassificationStep;

