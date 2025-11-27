import Constants from 'expo-constants';

// Configuração da API
export const CONFIGURACAO_API = {
  // Timeout para requisições (em milissegundos)
  TIMEOUT: 30000,
  
  // Headers padrão
  HEADERS_PADRAO: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Fallback de URL (caso extra não esteja definido)
  URL_BASE: 'http://192.168.0.102:8000/api',
};

// Função para obter a URL base do ambiente
export const obterUrlBaseAPI = () => {
  const urlExtra = Constants?.expoConfig?.extra?.API_URL;
  return urlExtra || CONFIGURACAO_API.URL_BASE;
};
