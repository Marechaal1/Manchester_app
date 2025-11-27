import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, estilosComuns } from '../styles/designSystem';

const SAENavigationHeader = ({ 
  currentStep, 
  totalSteps, 
  navigation 
}) => {
  const steps = [
    { id: 1, title: 'Dados Clínicos', icon: 'medical', description: 'Sinais vitais e dados clínicos' },
    { id: 2, title: 'Diagnósticos', icon: 'clipboard', description: 'Diagnósticos de enfermagem' },
    { id: 3, title: 'Intervenções', icon: 'medkit', description: 'Intervenções de enfermagem' },
    { id: 4, title: 'Resultados', icon: 'ribbon', description: 'Resultados esperados' },
    { id: 5, title: 'Evolução', icon: 'trending-up', description: 'Evolução do paciente' }
  ];

  const stepsScrollRef = useRef(null);

  const scrollToCurrentStep = (stepId) => {
    if (stepsScrollRef.current) {
      const stepWidth = 100; // largura de cada etapa (80 + 20 margin)
      const scrollPosition = (stepId - 1) * stepWidth;
      stepsScrollRef.current.scrollTo({ x: scrollPosition, animated: true });
    }
  };

  useEffect(() => {
    scrollToCurrentStep(currentStep);
  }, [currentStep]);

  return (
    <View style={styles.container}>
      {/* Progress Steps - Design igual ao da triagem */}
      <View style={[styles.progressContainer, { paddingTop: 10 }]}>
        <View style={styles.progressHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack ? (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')) : navigation.goBack())}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.progressTitleContainer}>
            <Text style={styles.progressTitle}>SAE</Text>
          </View>
          <View style={styles.progressSpacer} />
        </View>
        
        <ScrollView
          ref={stepsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stepsScrollView}
          contentContainerStyle={styles.stepsScrollContent}
          decelerationRate="fast"
          snapToInterval={100}
          snapToAlignment="center"
        >
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step.id && styles.stepCircleActive,
                  currentStep === step.id && styles.stepCircleCurrent,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={20}
                  color={currentStep >= step.id ? '#2E86AB' : 'rgba(255, 255, 255, 0.7)'}
                />
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep >= step.id && styles.stepTitleActive,
                ]}
                numberOfLines={2}
              >
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step.id && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: cores.primaria,
    paddingTop: Platform.select({ ios: 50, android: (StatusBar.currentHeight || 24) + 10 }),
  },
  progressContainer: {
    backgroundColor: '#2E86AB',
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  progressSpacer: {
    width: 34,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepsScrollView: {
    height: 90,
    width: '100%',
  },
  stepsScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 500,
  },
  stepCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepCircleActive: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCircleCurrent: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  stepTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  stepTitleActive: {
    color: 'white',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 22.5,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: -1,
    borderRadius: 1.5,
  },
  stepLineActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default SAENavigationHeader;
