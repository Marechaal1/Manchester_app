import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useSafeInsetsFallback from '../hooks/useSafeInsetsFallback';

const NavigationButtons = ({
  onPrevious,
  onNext,
  onFinish,
  onGoBack, // Nova prop para navegar para tela anterior
  currentStep,
  totalSteps,
  isLoading = false,
  isStepValid = true,
  previousText = 'Anterior',
  nextText = 'Próximo',
  finishText = 'Finalizar',
  showPrevious = true,
  showNext = true,
  previousDisabled = false,
  nextDisabled = false,
  onLayout,
}) => {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;
  const insets = useSafeInsetsFallback();

  // Função para lidar com o botão anterior
  const handlePrevious = () => {
    if (isFirstStep && onGoBack) {
      onGoBack(); // Navegar para tela anterior
    } else if (onPrevious) {
      onPrevious(); // Ir para etapa anterior
    }
  };

  console.log('🔍 NavigationButtons renderizando com currentStep:', currentStep, 'totalSteps:', totalSteps);
  
  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.buttonContainer}>
        {showPrevious && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              previousDisabled && styles.navButtonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={previousDisabled}
          >
            <Ionicons 
              name="arrow-back" 
              size={20} 
              color={previousDisabled ? '#ccc' : '#666'} 
            />
            <Text style={[
              styles.previousButtonText,
              previousDisabled && styles.buttonTextDisabled,
            ]}>
              {isFirstStep ? 'Voltar' : previousText}
            </Text>
          </TouchableOpacity>
        )}

        {showNext && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              (!isStepValid || isLoading || nextDisabled) && styles.nextButtonDisabled,
            ]}
            onPress={isLastStep ? onFinish : onNext}
            disabled={!isStepValid || isLoading || nextDisabled}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={[
                  styles.nextButtonText,
                  (!isStepValid || nextDisabled) && styles.buttonTextDisabled,
                ]}>
                  {isLastStep ? finishText : nextText}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Garantir que o container seja visível
    minHeight: 80,
    zIndex: 1000,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60, // Altura mínima reduzida
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 130,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previousButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nextButton: {
    backgroundColor: '#2E86AB',
  },
  nextButtonDisabled: {
    backgroundColor: '#dee2e6',
    shadowOpacity: 0,
    elevation: 0,
  },
  navButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    shadowOpacity: 0,
    elevation: 0,
  },
  previousButtonText: {
    color: '#6c757d',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButtonText: {
    color: 'white',
    marginRight: 5,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
});

export default NavigationButtons;
