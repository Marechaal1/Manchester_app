import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, icones } from '../styles/designSystem';
import { resultadosNocService } from '../services/catalogos.service';

// Etapa de Resultados Esperados do SAE (NOC)
const NursingOutcomesStep = ({ data, onUpdate }) => {
  const [searchText, setSearchText] = useState('');
  

  const [outcomesCatalog, setOutcomesCatalog] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const resposta = await resultadosNocService.listar({ apenasAtivos: true });
        const lista = Array.isArray(resposta?.dados) ? resposta.dados : [];
        const normalizados = lista.map((o) => ({
          id: String(o.id ?? o.codigo ?? o.titulo),
          code: o.codigo || '',
          title: o.titulo || '',
          definition: o.definicao || '',
          domain: o.dominio || '',
        }));
        setOutcomesCatalog(normalizados);
      } catch (e) {
        setOutcomesCatalog([]);
      }
    };
    carregar();
  }, []);

  const selectedOutcomes = data.nursingOutcomes || [];

  const filteredOutcomes = outcomesCatalog.filter(o =>
    o.title.toLowerCase().includes(searchText.toLowerCase()) ||
    o.definition.toLowerCase().includes(searchText.toLowerCase()) ||
    o.domain.toLowerCase().includes(searchText.toLowerCase())
  );
  const selectedOutcomeIds = new Set((selectedOutcomes || []).map(o => String(o.id)));
  const orderedOutcomes = [...filteredOutcomes].sort((a, b) => {
    const aSel = selectedOutcomeIds.has(String(a.id)) ? 1 : 0;
    const bSel = selectedOutcomeIds.has(String(b.id)) ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  const toggleOutcome = (outcome) => {
    const isSelected = selectedOutcomes.some(o => o.id === outcome.id);
    if (isSelected) {
      const updated = selectedOutcomes.filter(o => o.id !== outcome.id);
      onUpdate('nursingOutcomes', updated);
    } else {
      const updated = [...selectedOutcomes, outcome];
      onUpdate('nursingOutcomes', updated);
    }
  };

  const removeOutcome = (outcomeId) => {
    const updated = selectedOutcomes.filter(o => o.id !== outcomeId);
    onUpdate('nursingOutcomes', updated);
  };

  const OutcomeCard = ({ outcome, isSelected }) => (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => toggleOutcome(outcome)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{outcome.title}</Text>
          <Text style={[styles.cardCode, isSelected && styles.selectedText]}>Código: {outcome.code}</Text>
        </View>
        <View>{isSelected && <Ionicons name="checkmark-circle" size={24} color={cores.primaria} />}</View>
      </View>
      <Text style={[styles.cardDefinition, isSelected && styles.selectedText]}>{outcome.definition}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.metaLabel, isSelected && styles.selectedText]}>Domínio:</Text>
        <Text style={[styles.metaValue, isSelected && styles.selectedText]}>{outcome.domain}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>Buscar resultados (NOC)</Text>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Digite parte do título, definição ou domínio..."
        />
      </View>

      <View style={styles.counterContainer}>
        <View style={styles.counterHeader}>
          <Ionicons name={icones.sucesso} size={20} color={cores.primaria} />
          <Text style={styles.counterText}>{selectedOutcomes.length} resultado(s) selecionado(s)</Text>
        </View>
        {selectedOutcomes.length === 0 && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#f39c12" />
            <Text style={styles.warningText}>Selecione pelo menos um resultado esperado</Text>
          </View>
        )}
      </View>

      

      <View style={styles.list}>
        {orderedOutcomes.map((o) => (
          <OutcomeCard key={o.id} outcome={o} isSelected={selectedOutcomes.some(s => s.id === o.id)} />
        ))}
      </View>

      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  searchLabel: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: '600' },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  counterContainer: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  counterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 16, fontWeight: 'bold', color: '#2E86AB', marginLeft: 8 },
  warningContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: 8, backgroundColor: '#fef9e7', borderRadius: 8 },
  warningText: { fontSize: 14, color: '#f39c12', marginLeft: 6, fontStyle: 'italic' },
  customContainer: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  customHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  customTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  customInputContainer: { flexDirection: 'row', alignItems: 'flex-end' },
  customInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, maxHeight: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#2E86AB', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  list: { gap: 15 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 15, borderWidth: 2, borderColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  cardSelected: { borderColor: '#2E86AB', backgroundColor: '#f8f9ff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardCode: { fontSize: 14, color: '#666', fontWeight: '500' },
  cardDefinition: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 15 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaLabel: { fontSize: 12, color: '#999', fontWeight: '500' },
  metaValue: { fontSize: 12, color: '#666' },
  selectedText: { color: '#2E86AB' },
  selectedContainer: { backgroundColor: '#e8f5e8', padding: 16, borderRadius: 12, marginTop: 20, borderLeftWidth: 4, borderLeftColor: '#27ae60' },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  selectedTitle: { fontSize: 16, fontWeight: 'bold', color: '#27ae60', marginLeft: 8 },
  selectedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d4edda' },
  selectedItemContent: { flex: 1 },
  selectedItemText: { fontSize: 14, color: '#27ae60', fontWeight: '500' },
  customLabel: { fontSize: 12, color: '#6c757d', fontStyle: 'italic' },
  removeButton: { padding: 5 },
});

export default NursingOutcomesStep;







