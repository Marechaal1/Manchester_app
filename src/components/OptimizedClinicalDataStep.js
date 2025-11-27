import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pacientesService } from '../services/pacientes.service';
import { stripCpfDigits } from '../utils/cpfUtils';
import { applyDateMask, formatDateToDDMMYYYY, parseDateFromDDMMYYYY, isValidDate } from '../utils/dateUtils';
import EnhancedFormField from './EnhancedFormField';
import PatientBasicInfoFields from './form/PatientBasicInfoFields';
import VitalSignsFields from './form/VitalSignsFields';
import SymptomsHistoryFields from './form/SymptomsHistoryFields';
import useFormFocus from '../hooks/useFormFocus';

const OptimizedClinicalDataStep = forwardRef(({ 
  data, 
  onUpdate, 
  isReevaluation = false, 
  isSAE = false, 
  patient = null, 
  onFocusError = null,
  onInputFocus = null
}, ref) => {
  const { registerField, focusNextField } = useFormFocus();
  
  // Estado local para todos os campos
  const [localValues, setLocalValues] = useState({
    // Dados básicos
    cpf: data.cpf || '',
    name: data.name || '',
    birthDate: data.birthDate || '',
    // Sinais vitais
    bloodPressure: data.bloodPressure || '',
    heartRate: data.heartRate || '',
    temperature: data.temperature || '',
    respiratoryRate: data.respiratoryRate || '',
    oxygenSaturation: data.oxygenSaturation || '',
    // Campos de peso e altura removidos da etapa
    // Sintomas e histórico
    symptoms: data.symptoms || '',
    medicalHistory: data.medicalHistory || '',
  });

  // Sincronizar valores locais quando os dados (providos pelo hook useSAE) forem atualizados
  // Isso garante que, ao iniciar a SAE, os sinais vitais vindos da triagem sejam pré-preenchidos
  useEffect(() => {
    if (!data) return;
    setLocalValues((current) => ({
      ...current,
      bloodPressure: current.bloodPressure || data.bloodPressure || '',
      heartRate: current.heartRate || data.heartRate || '',
      temperature: current.temperature || data.temperature || '',
      respiratoryRate: current.respiratoryRate || data.respiratoryRate || '',
      oxygenSaturation: current.oxygenSaturation || data.oxygenSaturation || '',
      symptoms: current.symptoms || data.symptoms || '',
      medicalHistory: current.medicalHistory || data.medicalHistory || '',
    }));
  }, [data]);

  const [validationErrors, setValidationErrors] = useState({});
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [isPatientDataExpanded, setIsPatientDataExpanded] = useState(false);
  const [fullPatientData, setFullPatientData] = useState(null);
  const [editablePatientData, setEditablePatientData] = useState(null);
  const [isEditingPatientData, setIsEditingPatientData] = useState(false);

  // Refs para os campos
  const fieldRefs = {
    // Dados básicos
    cpf: useRef(null),
    name: useRef(null),
    birthDate: useRef(null),
    // Dados cadastrais expandidos (mantidos imediatamente após básicos para navegação sequencial)
    sexo: useRef(null),
    telefone: useRef(null),
    email: useRef(null),
    endereco: useRef(null),
    cidade: useRef(null),
    estado: useRef(null),
    cep: useRef(null),
    nome_responsavel: useRef(null),
    telefone_responsavel: useRef(null),
    observacoes: useRef(null),
    // Sinais vitais
    bloodPressure: useRef(null),
    heartRate: useRef(null),
    temperature: useRef(null),
    respiratoryRate: useRef(null),
    oxygenSaturation: useRef(null),
    // weight e height removidos
    // Sintomas e histórico
    symptoms: useRef(null),
    medicalHistory: useRef(null),
  };

  // Registrar campos no hook de foco
  useEffect(() => {
    Object.entries(fieldRefs).forEach(([fieldName, ref]) => {
      registerField(fieldName, ref);
    });
  }, [registerField]);

  // Atualizar dados quando props mudam
  useEffect(() => {
    setLocalValues({
      cpf: data.cpf || '',
      name: data.name || '',
      birthDate: data.birthDate || '',
      bloodPressure: data.bloodPressure || '',
      heartRate: data.heartRate || '',
      temperature: data.temperature || '',
      respiratoryRate: data.respiratoryRate || '',
      oxygenSaturation: data.oxygenSaturation || '',
      // peso e altura removidos
      symptoms: data.symptoms || '',
      medicalHistory: data.medicalHistory || '',
    });
  }, [data]);

  // Expor métodos para o componente pai
  useImperativeHandle(ref, () => ({
    getPatientData: () => editablePatientData,
    isExistingPatient: () => isExistingPatient,
    getFullPatientData: () => fullPatientData,
    validateForm: () => validateForm(),
  }));

  // Determinar se é o último campo obrigatório da etapa
  const isLastRequiredField = (fieldName) => {
    const requiredOrder = ['bloodPressure'];
    const idx = requiredOrder.indexOf(fieldName);
    return idx === requiredOrder.length - 1;
  };

  const updateLocalValue = (field, value) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Notificar o componente pai
    onUpdate?.(field, value);
  };

  const validateForm = () => {
    const errors = {};
    
    // Validar campos obrigatórios (apenas Pressão Arterial nos sinais vitais)
    if (!localValues.bloodPressure) errors.bloodPressure = 'Pressão arterial é obrigatória';
    
    // Validar data de nascimento
    if (localValues.birthDate && !isValidDate(localValues.birthDate)) {
      errors.birthDate = 'Data de nascimento inválida';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldSubmit = (fieldName) => {
    // Focar no próximo campo
    focusNextField(fieldName);
  };

  const handleFieldFocus = (fieldName) => {
    console.log('🎯 Campo focado no OptimizedClinicalDataStep:', fieldName);
    const fieldRef = fieldRefs[fieldName];
    if (fieldRef?.current && onInputFocus) {
      console.log('📞 Chamando callback onInputFocus');
      onInputFocus(fieldRef, isLastRequiredField(fieldName)); // Passar o ref e se é o último obrigatório
    }
  };

  const handleDateChange = (text) => {
    const maskedDate = applyDateMask(text);
    updateLocalValue('birthDate', maskedDate);
  };

  const handleCpfBlur = async () => {
    const cpfDigits = stripCpfDigits(localValues.cpf || '');
    if (cpfDigits.length === 11) {
      try {
        const response = await pacientesService.buscarPorCpf(cpfDigits);
        if (response.dados) {
          const patientData = response.dados;
          setFullPatientData(patientData);
          setIsExistingPatient(true);
          
          // Preencher dados básicos
          updateLocalValue('name', patientData.nome_completo || patientData.nome || '');
          updateLocalValue('birthDate', formatDateToDDMMYYYY(patientData.data_nascimento || patientData.dataNascimento));
          
          Alert.alert(
            'Paciente Encontrado',
            `Paciente ${patientData.nome_completo || patientData.nome} encontrado no sistema.`,
            [{ text: 'OK' }]
          );
        } else {
          setIsExistingPatient(false);
          setFullPatientData(null);
        }
      } catch (error) {
        // CPF não encontrado: limpar e habilitar edição
        setIsExistingPatient(false);
        setFullPatientData(null);
        setLocalValues(prev => ({ ...prev, name: '', birthDate: '' }));
      }
    }
  };

  const togglePatientDataExpansion = () => {
    if (fullPatientData) {
      // Paciente cadastrado - modo somente leitura
      setEditablePatientData(fullPatientData);
      setIsEditingPatientData(false);
    } else {
      // Paciente não cadastrado - modo edição
      setEditablePatientData({
        sexo: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        nome_responsavel: '',
        telefone_responsavel: '',
        observacoes: '',
      });
      setIsEditingPatientData(true);
    }
    setIsPatientDataExpanded(!isPatientDataExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Dados do Paciente - ocultar em reavaliação e em SAE */}
      {!isReevaluation && !isSAE && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#2E86AB" />
            <Text style={styles.sectionTitle}>Dados do Paciente</Text>
          </View>

          <PatientBasicInfoFields
            values={localValues}
            errors={validationErrors}
            fieldRefs={fieldRefs}
            onChange={updateLocalValue}
            onCpfBlur={handleCpfBlur}
            onInputFocus={onInputFocus}
            onSubmit={handleFieldSubmit}
            // CPF sempre editável; nome/data bloqueados quando paciente existe
            editableCpf={true}
            editableName={!isExistingPatient}
            editableBirthDate={!isExistingPatient}
          />

          {/* Botão para expandir dados adicionais */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={togglePatientDataExpansion}
          >
            <Ionicons 
              name={isPatientDataExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#2E86AB" 
            />
          </TouchableOpacity>

          {/* Dados Expandidos */}
          {isPatientDataExpanded && editablePatientData && (
            <View style={styles.expandedSection}>
              <EnhancedFormField
                ref={fieldRefs.sexo}
                label="Sexo"
                value={editablePatientData.sexo}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, sexo: value }))}
                placeholder="M/F/O"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.sexo)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('sexo')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.telefone}
                label="Telefone"
                value={editablePatientData.telefone}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, telefone: value }))}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.telefone)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('telefone')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.email}
                label="Email"
                value={editablePatientData.email}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, email: value }))}
                placeholder="email@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.email)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('email')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.endereco}
                label="Endereço"
                value={editablePatientData.endereco}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, endereco: value }))}
                placeholder="Rua, número, bairro"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.endereco)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('endereco')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.cidade}
                label="Cidade"
                value={editablePatientData.cidade}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, cidade: value }))}
                placeholder="Nome da cidade"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.cidade)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('cidade')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.estado}
                label="Estado"
                value={editablePatientData.estado}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, estado: value }))}
                placeholder="UF"
                maxLength={2}
                autoCapitalize="characters"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.estado)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('estado')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.cep}
                label="CEP"
                value={editablePatientData.cep}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, cep: value }))}
                placeholder="00000-000"
                keyboardType="numeric"
                maxLength={9}
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.cep)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('cep')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.nome_responsavel}
                label="Nome do Responsável"
                value={editablePatientData.nome_responsavel}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, nome_responsavel: value }))}
                placeholder="Nome do responsável (se menor de idade)"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.nome_responsavel)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('nome_responsavel')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.telefone_responsavel}
                label="Telefone do Responsável"
                value={editablePatientData.telefone_responsavel}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, telefone_responsavel: value }))}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.telefone_responsavel)}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => handleFieldSubmit('telefone_responsavel')}
              />
              
              <EnhancedFormField
                ref={fieldRefs.observacoes}
                label="Observações"
                value={editablePatientData.observacoes}
                onChangeText={(value) => setEditablePatientData(prev => ({ ...prev, observacoes: value }))}
                placeholder="Observações adicionais"
                multiline
                numberOfLines={3}
                editable={isEditingPatientData}
                onFocus={() => onInputFocus?.(fieldRefs.observacoes)}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>
          )}
        </View>
      )}

      {/* Sinais Vitais */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse" size={20} color="#e74c3c" />
          <Text style={styles.sectionTitle}>Sinais Vitais</Text>
        </View>

        <VitalSignsFields
          values={localValues}
          errors={validationErrors}
          fieldRefs={fieldRefs}
          onChange={updateLocalValue}
          onInputFocus={onInputFocus}
          onSubmit={handleFieldSubmit}
        />
      </View>

      {/* Sintomas e Histórico */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={20} color="#27ae60" />
          <Text style={styles.sectionTitle}>Sintomas e Histórico</Text>
        </View>

        <SymptomsHistoryFields
          values={localValues}
          errors={validationErrors}
          fieldRefs={fieldRefs}
          onChange={updateLocalValue}
          onInputFocus={onInputFocus}
          onSubmit={handleFieldSubmit}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginVertical: 10,
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default OptimizedClinicalDataStep;
