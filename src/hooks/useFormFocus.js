import { useRef, useCallback } from 'react';

const useFormFocus = () => {
  const fieldRefs = useRef({});

  const registerField = useCallback((fieldName, ref) => {
    fieldRefs.current[fieldName] = ref;
  }, []);

  const focusNextField = useCallback((currentFieldName) => {
    const fieldNames = Object.keys(fieldRefs.current);
    const currentIndex = fieldNames.indexOf(currentFieldName);
    
    if (currentIndex !== -1 && currentIndex < fieldNames.length - 1) {
      const nextFieldName = fieldNames[currentIndex + 1];
      const nextFieldRef = fieldRefs.current[nextFieldName];
      
      if (nextFieldRef?.current) {
        nextFieldRef.current.focus();
        return true;
      }
    }
    
    return false;
  }, []);

  const focusField = useCallback((fieldName) => {
    const fieldRef = fieldRefs.current[fieldName];
    if (fieldRef?.current) {
      fieldRef.current.focus();
      return true;
    }
    return false;
  }, []);

  const blurAllFields = useCallback(() => {
    Object.values(fieldRefs.current).forEach(ref => {
      if (ref?.current) {
        ref.current.blur();
      }
    });
  }, []);

  const getFocusedField = useCallback(() => {
    for (const [fieldName, ref] of Object.entries(fieldRefs.current)) {
      if (ref?.current?.isFocused?.()) {
        return fieldName;
      }
    }
    return null;
  }, []);

  return {
    registerField,
    focusNextField,
    focusField,
    blurAllFields,
    getFocusedField,
  };
};

export default useFormFocus;
