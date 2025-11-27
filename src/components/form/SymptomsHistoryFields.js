import React from 'react';
import { View } from 'react-native';
import EnhancedFormField from '../EnhancedFormField';

const SymptomsHistoryFields = ({
  values,
  errors = {},
  fieldRefs = {},
  onChange,
  onInputFocus,
  onSubmit,
}) => {
  const handleFocus = (fieldName) => {
    const ref = fieldRefs[fieldName];
    if (ref?.current && onInputFocus) {
      onInputFocus(ref);
    }
  };

  return (
    <View>
      <EnhancedFormField
        ref={fieldRefs.symptoms}
        label="Sintomas"
        value={values.symptoms}
        onChangeText={(value) => onChange('symptoms', value)}
        placeholder="Descreva os sintomas apresentados pelo paciente"
        multiline
        numberOfLines={4}
        // não obrigatório
        onFocus={() => handleFocus('symptoms')}
        onSubmitEditing={() => onSubmit?.('symptoms')}
        returnKeyType="next"
        error={errors.symptoms}
      />

      <EnhancedFormField
        ref={fieldRefs.medicalHistory}
        label="Histórico Médico"
        value={values.medicalHistory}
        onChangeText={(value) => onChange('medicalHistory', value)}
        placeholder="Histórico médico relevante, medicações, alergias, etc."
        multiline
        numberOfLines={4}
        onFocus={() => handleFocus('medicalHistory')}
        onSubmitEditing={() => onSubmit?.('medicalHistory')}
        returnKeyType="done"
      />
    </View>
  );
};

export default SymptomsHistoryFields;













