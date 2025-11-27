import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KeyboardOptimizedForm = forwardRef(({ 
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  bottomExtra = 0,
  ...props
}, ref) => {
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const contentRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        console.log('⌨️ Teclado aberto, altura:', event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        console.log('⌨️ Teclado fechado');
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const scrollToFocusedInput = (inputRef) => {
    console.log('🎯 scrollToFocusedInput chamado');
    if (!scrollViewRef.current || !inputRef?.current) return;

    const delayMs = Platform.OS === 'android' ? 400 : 250; // aguarda animação do teclado
    setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          inputRef.current.measureLayout(
            contentRef.current,
            (x, y, width, height) => {
              console.log('📏 Posição do input:', { x, y, width, height });
              // margem menor para movimento mais suave
              const targetY = Math.max(0, y - 100);
              scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
            },
            (error) => {
              console.log('❌ Erro ao medir input:', error);
              scrollViewRef.current?.scrollTo({ y: 200, animated: true });
            }
          );
        } catch (error) {
          console.log('❌ Erro ao tentar medir input:', error);
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        }
      });
    }, delayMs);
  };

  const scrollToEnd = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToFocusedInput,
    // Alias para compatibilidade com SimpleScreenLayout
    scrollToInput: scrollToFocusedInput,
    scrollToEnd,
    scrollViewRef,
  }));

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
          // Padding inferior dinâmico: teclado + insets + altura do rodapé
          { paddingBottom: 28 + (keyboardHeight || 0) + insets.bottom + (bottomExtra || 0) }
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="always"
        {...props}
      >
        <View ref={contentRef}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
});

export default KeyboardOptimizedForm;