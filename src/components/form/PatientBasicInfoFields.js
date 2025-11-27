import React from 'react';
import { View } from 'react-native';
import EnhancedFormField from '../EnhancedFormField';
import { applyDateMask } from '../../utils/dateUtils';
import { applyCpfMask } from '../../utils/cpfUtils';

const PatientBasicInfoFields = ({
  values,
  errors = {},
  fieldRefs = {},
  onChange,
  onCpfBlur,
  onInputFocus,
  onSubmit,
  editable = true,
  editableCpf,
  editableName,
  editableBirthDate,
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
        ref={fieldRefs.cpf}
        label="CPF"
        value={values.cpf}
        onChangeText={(value) => onChange('cpf', applyCpfMask(value))}
        placeholder="000.000.000-00"
        keyboardType="numeric"
        maxLength={14}
        onBlur={onCpfBlur}
        onFocus={() => handleFocus('cpf')}
        onSubmitEditing={() => onSubmit?.('cpf')}
        returnKeyType="next"
        error={errors.cpf}
        editable={typeof editableCpf === 'boolean' ? editableCpf : editable}
      />

      <EnhancedFormField
        ref={fieldRefs.name}
        label="Nome Completo"
        value={values.name}
        onChangeText={(value) => onChange('name', value)}
        placeholder="Digite o nome completo"
        onFocus={() => handleFocus('name')}
        onSubmitEditing={() => onSubmit?.('name')}
        returnKeyType="next"
        error={errors.name}
        editable={typeof editableName === 'boolean' ? editableName : editable}
      />

      <EnhancedFormField
        ref={fieldRefs.birthDate}
        label="Data de Nascimento"
        value={values.birthDate}
        onChangeText={(text) => onChange('birthDate', applyDateMask(text))}
        placeholder="DD/MM/YYYY"
        keyboardType="numeric"
        maxLength={10}
        onFocus={() => handleFocus('birthDate')}
        onSubmitEditing={() => onSubmit?.('birthDate')}
        returnKeyType="next"
        error={errors.birthDate}
        editable={typeof editableBirthDate === 'boolean' ? editableBirthDate : editable}
      />
    </View>
  );
};

export default PatientBasicInfoFields;


