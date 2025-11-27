import React from 'react';
import { View } from 'react-native';
import EnhancedFormField from '../EnhancedFormField';
import { applyBloodPressureMask, maskIntegerMax, maskDecimalOne } from '../../utils/vitalMasks';

const VitalSignsFields = ({
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
        ref={fieldRefs.bloodPressure}
        label="Pressão Arterial"
        value={values.bloodPressure}
        onChangeText={(value) => onChange('bloodPressure', applyBloodPressureMask(value))}
        placeholder="120/80"
        keyboardType="numeric"
        unit="mmHg"
        required
        onFocus={() => handleFocus('bloodPressure')}
        onSubmitEditing={() => onSubmit?.('bloodPressure')}
        returnKeyType="next"
        error={errors.bloodPressure}
      />

      <EnhancedFormField
        ref={fieldRefs.heartRate}
        label="Frequência Cardíaca"
        value={values.heartRate}
        onChangeText={(value) => onChange('heartRate', maskIntegerMax(value, 3, 250))}
        placeholder="80"
        keyboardType="numeric"
        unit="bpm"
        required={false}
        onFocus={() => handleFocus('heartRate')}
        onSubmitEditing={() => onSubmit?.('heartRate')}
        returnKeyType="next"
        error={errors.heartRate}
      />

      <EnhancedFormField
        ref={fieldRefs.temperature}
        label="Temperatura"
        value={values.temperature}
        onChangeText={(value) => onChange('temperature', maskDecimalOne(value, 2, 45))}
        placeholder="36.5"
        keyboardType="decimal-pad"
        unit="°C"
        required={false}
        onFocus={() => handleFocus('temperature')}
        onSubmitEditing={() => onSubmit?.('temperature')}
        returnKeyType="next"
        error={errors.temperature}
      />

      <EnhancedFormField
        ref={fieldRefs.respiratoryRate}
        label="Frequência Respiratória"
        value={values.respiratoryRate}
        onChangeText={(value) => onChange('respiratoryRate', maskIntegerMax(value, 2, 60))}
        placeholder="16"
        keyboardType="numeric"
        unit="irpm"
        required={false}
        onFocus={() => handleFocus('respiratoryRate')}
        onSubmitEditing={() => onSubmit?.('respiratoryRate')}
        returnKeyType="next"
        error={errors.respiratoryRate}
      />

      <EnhancedFormField
        ref={fieldRefs.oxygenSaturation}
        label="Saturação de Oxigênio"
        value={values.oxygenSaturation}
        onChangeText={(value) => onChange('oxygenSaturation', maskIntegerMax(value, 3, 100))}
        placeholder="98"
        keyboardType="numeric"
        unit="%"
        required={false}
        onFocus={() => handleFocus('oxygenSaturation')}
        onSubmitEditing={() => onSubmit?.('oxygenSaturation')}
        returnKeyType="next"
        error={errors.oxygenSaturation}
      />

      {/* Campo de Peso removido conforme solicitado */}

      {/* Campo de Altura removido conforme solicitado */}
    </View>
  );
};

export default VitalSignsFields;


