import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NavigationButtons from './NavigationButtons';
import KeyboardOptimizedForm from './KeyboardOptimizedForm';

const StepScreenLayout = forwardRef(({
  children,
  onPrevious,
  onNext,
  onFinish,
  onGoBack,
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
  contentStyle,
  scrollViewProps = {},
}, ref) => {
  const formRef = useRef(null);
  const insets = useSafeAreaInsets();
  const footerHeightRef = useRef(80);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isOnLastRequiredField, setIsOnLastRequiredField] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToFocusedInput: (inputRef) => {
      console.log('🎯 StepScreenLayout: scrollToFocusedInput chamado');
      if (formRef.current?.scrollToFocusedInput) {
        formRef.current.scrollToFocusedInput(inputRef);
      }
    },
    scrollToEnd: () => {
      formRef.current?.scrollToEnd?.();
    },
    getScrollViewRef: () => {
      return formRef.current?.scrollViewRef;
    },
    scrollToTop: () => {
      try {
        const sv = formRef.current?.scrollViewRef?.current;
        sv?.scrollTo({ x: 0, y: 0, animated: false });
      } catch (e) {
        // ignore
      }
    },
    setIsOnLastRequiredField: (value) => {
      setIsOnLastRequiredField(!!value);
    },
  }));

  // Ao mudar de etapa, rolar para o topo automaticamente
  useEffect(() => {
    try {
      const sv = formRef.current?.scrollViewRef?.current;
      sv?.scrollTo({ x: 0, y: 0, animated: false });
    } catch (e) {
      // ignore
    }
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContentArea}>
        <KeyboardOptimizedForm
          ref={formRef}
          style={[styles.content, contentStyle]}
          contentContainerStyle={styles.contentNormal}
          bottomExtra={(keyboardVisible && !isOnLastRequiredField) ? 0 : footerHeightRef.current}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 100 : 0}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </KeyboardOptimizedForm>
      </View>
      
      <View style={[
        styles.fixedNavigationContainer,
        {
          position: 'absolute',
          left: 0,
          right: 0,
          // Android: colar no fundo absoluto (0) quando teclado fechado; quando aberto, usar altura do teclado
          // iOS: respeitar insets.bottom quando teclado fechado; quando aberto, usar altura do teclado
          bottom: Platform.OS === 'android'
            ? (keyboardVisible ? (keyboardHeight || 0) : 0)
            : Math.max(insets.bottom, keyboardVisible ? (keyboardHeight || 0) : insets.bottom),
          paddingBottom: 0,
          opacity: (keyboardVisible && !isOnLastRequiredField) ? 0 : 1,
          pointerEvents: (keyboardVisible && !isOnLastRequiredField) ? 'none' : 'auto',
        }
      ]}>
        <NavigationButtons
          onLayout={(e) => {
            footerHeightRef.current = e.nativeEvent.layout.height;
          }}
          onPrevious={onPrevious}
          onNext={onNext}
          onFinish={onFinish}
          onGoBack={onGoBack}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={isLoading}
          isStepValid={isStepValid}
          previousText={previousText}
          nextText={nextText}
          finishText={finishText}
          showPrevious={showPrevious}
          showNext={showNext}
          previousDisabled={previousDisabled}
          nextDisabled={nextDisabled}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContentArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentNormal: {
    padding: 20,
    paddingBottom: 20,
  },
  fixedNavigationContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
});

export default StepScreenLayout;