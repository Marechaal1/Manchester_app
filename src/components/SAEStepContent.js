import React from 'react';
import { View, StyleSheet } from 'react-native';
import OptimizedClinicalDataStep from './OptimizedClinicalDataStep';
import NursingDiagnosisStep from './NursingDiagnosisStep';
import NursingInterventionsStep from './NursingInterventionsStep';
import NursingOutcomesStep from './NursingOutcomesStep';
import NursingEvolutionStep from './NursingEvolutionStep';

const SAEStepContent = ({ 
  currentStep, 
  saeData, 
  onUpdate, 
  patient,
  onInputFocus
}) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OptimizedClinicalDataStep
            data={saeData}
            onUpdate={onUpdate}
            isSAE={true}
            patient={patient}
            onInputFocus={onInputFocus}
          />
        );
      case 2:
        return (
          <NursingDiagnosisStep
            data={saeData}
            onUpdate={onUpdate}
          />
        );
      case 3:
        return (
          <NursingInterventionsStep
            data={saeData}
            onUpdate={onUpdate}
          />
        );
      case 4:
        return (
          <NursingOutcomesStep
            data={saeData}
            onUpdate={onUpdate}
          />
        );
      case 5:
        return (
          <NursingEvolutionStep
            data={saeData}
            onUpdate={onUpdate}
            patient={patient}
            onInputFocus={onInputFocus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStepContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Alinhar o layout com Triagem/Reavaliação: padding vem do StepScreenLayout
    padding: 0,
  },
});

export default SAEStepContent;




