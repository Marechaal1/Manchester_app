import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SafetyAssessmentStep = ({ data, onUpdate, onInputFocus }) => {
  const [newAllergy, setNewAllergy] = useState('');
  const [newComorbidity, setNewComorbidity] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newSpecialRisk, setNewSpecialRisk] = useState('');

  // Refs para acionar scroll-ao-foco no layout pai
  const allergyRef = useRef(null);
  const comorbidityRef = useRef(null);
  const medicationRef = useRef(null);
  const specialRiskRef = useRef(null);

  const allergyCategories = [
    'Medicamentos',
    'Alimentos',
    'Látex',
    'Outros',
  ];

  const comorbidityOptions = [
    'Hipertensão',
    'Diabetes',
    'Doenças Cardíacas',
    'Doenças Respiratórias',
    'Doenças Renais',
    'Doenças Neurológicas',
    'Câncer',
    'Outras',
  ];

  const specialRiskCategories = [
    'Gestante',
    'Imunossuprimido',
    'Idoso Frágil',
    'Criança',
    'Outros',
  ];

  const addItem = (type, item, category = '') => {
    if (!item.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      name: item.trim(),
      category: category,
      date: new Date().toISOString(),
    };

    const currentItems = data[type] || [];
    onUpdate(type, [...currentItems, newItem]);
  };

  const removeItem = (type, itemId) => {
    const currentItems = data[type] || [];
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    onUpdate(type, updatedItems);
  };

  const showCategoryPicker = (type, categories) => {
    Alert.alert(
      'Selecionar Categoria',
      'Escolha uma categoria:',
      [
        ...categories.map(category => ({
          text: category,
          onPress: () => addItem(type, category, category),
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const ItemList = ({ title, items, onRemove, emptyMessage }) => (
    <View style={styles.itemList}>
      <Text style={styles.itemListTitle}>{title}</Text>
      {items && items.length > 0 ? (
        items.map((item, index) => (
          <View key={item.id || index} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.category && (
                <Text style={styles.itemCategory}>({item.category})</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      )}
    </View>
  );

  const CategoryButton = ({ 
    title, 
    icon, 
    color, 
    onPress 
  }) => (
    <TouchableOpacity
      style={[styles.categoryButton, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryButtonContent}>
        <View style={[styles.categoryIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <Text style={styles.categoryButtonText}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Alergias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alergias</Text>
          <View style={styles.inputWithAdd}>
            <TextInput
              ref={allergyRef}
              style={styles.addInput}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Descreva a alergia (ex.: Dipirona, Amendoim)"
              returnKeyType="done"
              onFocus={() => onInputFocus?.(allergyRef)}
              onSubmitEditing={() => { addItem('allergies', newAllergy); setNewAllergy(''); }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { addItem('allergies', newAllergy); setNewAllergy(''); }}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          <ItemList
            title="Alergias Registradas"
            items={data.allergies}
            onRemove={(id) => removeItem('allergies', id)}
            emptyMessage="Nenhuma alergia registrada"
          />
        </View>

        {/* Comorbidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comorbidades</Text>
          <View style={styles.inputWithAdd}>
            <TextInput
              ref={comorbidityRef}
              style={styles.addInput}
              value={newComorbidity}
              onChangeText={setNewComorbidity}
              placeholder="Descreva a comorbidade (ex.: Hipertensão)"
              returnKeyType="done"
              onFocus={() => onInputFocus?.(comorbidityRef)}
              onSubmitEditing={() => { addItem('comorbidities', newComorbidity); setNewComorbidity(''); }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { addItem('comorbidities', newComorbidity); setNewComorbidity(''); }}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          <ItemList
            title="Comorbidades Registradas"
            items={data.comorbidities}
            onRemove={(id) => removeItem('comorbidities', id)}
            emptyMessage="Nenhuma comorbidade registrada"
          />
        </View>

        {/* Medicamentos Crônicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uso Crônico de Medicamentos</Text>
          <View style={styles.inputWithAdd}>
            <TextInput
              ref={medicationRef}
              style={styles.addInput}
              value={newMedication}
              onChangeText={setNewMedication}
              placeholder="Descreva o medicamento em uso"
              returnKeyType="done"
              onFocus={() => onInputFocus?.(medicationRef)}
              onSubmitEditing={() => { addItem('chronicMedications', newMedication); setNewMedication(''); }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { addItem('chronicMedications', newMedication); setNewMedication(''); }}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          <ItemList
            title="Medicamentos em Uso"
            items={data.chronicMedications}
            onRemove={(id) => removeItem('chronicMedications', id)}
            emptyMessage="Nenhum medicamento registrado"
          />
        </View>

        {/* Pacientes de Risco Especial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pacientes de Risco Especial</Text>
          <View style={styles.inputWithAdd}>
            <TextInput
              ref={specialRiskRef}
              style={styles.addInput}
              value={newSpecialRisk}
              onChangeText={setNewSpecialRisk}
              placeholder="Descreva o risco especial (ex.: Gestante)"
              returnKeyType="done"
              onFocus={() => onInputFocus?.(specialRiskRef)}
              onSubmitEditing={() => { addItem('specialRiskPatients', newSpecialRisk); setNewSpecialRisk(''); }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { addItem('specialRiskPatients', newSpecialRisk); setNewSpecialRisk(''); }}
            >
              <Ionicons name="add" size={22} color="white" />
            </TouchableOpacity>
          </View>
          
          <ItemList
            title="Riscos Especiais Identificados"
            items={data.specialRiskPatients}
            onRemove={(id) => removeItem('specialRiskPatients', id)}
            emptyMessage="Nenhum risco especial identificado"
          />
        </View>

        {/* Observações Complementares */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações Complementares</Text>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            value={data.additionalObservations}
            onChangeText={(text) => onUpdate('additionalObservations', text)}
            placeholder="Informações adicionais relevantes para a segurança do paciente"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botão de Nenhuma Informação */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.noneButton}
            onPress={() => {
              Alert.alert(
                'Confirmar',
                'Deseja marcar que não há informações de segurança a registrar?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Confirmar', 
                    onPress: () => {
                      onUpdate('allergies', [{ id: 'none', name: 'Nenhuma alergia conhecida', category: 'Nenhuma' }]);
                      onUpdate('comorbidities', [{ id: 'none', name: 'Nenhuma comorbidade conhecida', category: 'Nenhuma' }]);
                      onUpdate('chronicMedications', [{ id: 'none', name: 'Nenhum medicamento em uso', category: 'Nenhuma' }]);
                      onUpdate('specialRiskPatients', [{ id: 'none', name: 'Nenhum risco especial identificado', category: 'Nenhuma' }]);
                    }
                  },
                ]
              );
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.noneButtonText}>Nenhuma Informação a Registrar</Text>
          </TouchableOpacity>
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
    gap: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2E86AB',
    paddingBottom: 5,
  },
  inputWithAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2E86AB',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  itemList: {
    marginTop: 10,
  },
  itemListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E86AB',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 5,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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
  noneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#27ae60',
    borderStyle: 'dashed',
  },
  noneButtonText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  categoryButton: {
    borderLeftWidth: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default SafetyAssessmentStep;

