import { Platform } from 'react-native';

const useSafeInsetsFallback = () => {
  // Valores padrão baseados na plataforma
  return {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  };
};

export default useSafeInsetsFallback;
