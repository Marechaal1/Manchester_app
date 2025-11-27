import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EnhancedFormField = forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  required = false,
  error = null,
  unit = null,
  maxLength = null,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  editable = true,
  style,
  containerStyle,
  onFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType = 'next',
  blurOnSubmit = true,
  ...props
}, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
    isFocused: () => {
      return inputRef.current?.isFocused() || false;
    },
    clear: () => {
      inputRef.current?.clear();
    },
    measureLayout: (relativeToNativeNode, onSuccess, onFail) => {
      if (inputRef.current) {
        inputRef.current.measureLayout(relativeToNativeNode, onSuccess, onFail);
      }
    },
    getInnerViewNode: () => {
      return inputRef.current;
    },
  }));

  const handleFocus = (event) => {
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    onBlur?.(event);
  };

  const getKeyboardType = () => {
    if (keyboardType === 'numeric' && Platform.OS === 'ios') {
      return 'number-pad';
    }
    return keyboardType;
  };

  const getReturnKeyType = () => {
    if (multiline) {
      return 'default';
    }
    return returnKeyType;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {unit && (
          <Text style={styles.unit}>({unit})</Text>
        )}
      </View>

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled,
      ]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            error && styles.inputError,
            !editable && styles.inputDisabled,
            style
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={getKeyboardType()}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry}
          editable={editable}
          returnKeyType={getReturnKeyType()}
          blurOnSubmit={blurOnSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        
        {/* Clear Button */}
        {value && editable && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              onChangeText?.('');
              inputRef.current?.focus();
            }}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  required: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOpacity: 0.2,
  },
  inputContainerDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    lineHeight: 20,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 14,
    paddingBottom: 14,
  },
  inputError: {
    color: '#e74c3c',
  },
  inputDisabled: {
    color: '#6c757d',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 6,
    flex: 1,
  },
});

export default EnhancedFormField;
