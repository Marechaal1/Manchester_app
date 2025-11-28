import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit } from './events';
import { STORAGE_KEYS } from '../config/storageKeys';
import { CONFIGURACAO_API, obterUrlBaseAPI } from '../config/ConfiguracaoAPI';

const baseURL = obterUrlBaseAPI();

// Helper para unir baseURL e path com exatamente uma barra
const joinUrl = (base, path) => {
  const safeBase = String(base || '').replace(/\/+$/, '');
  const safePath = String(path || '').replace(/^\/+/, '');
  if (!safeBase) return `/${safePath}`;
  if (!safePath) return safeBase;
  return `${safeBase}/${safePath}`;
};

// Log da URL base para debug
console.log('🔗 URL Base da API:', baseURL);
console.log('🔗 URL Fallback:', CONFIGURACAO_API.URL_BASE);

const httpClient = axios.create({
  baseURL,
  timeout: CONFIGURACAO_API.TIMEOUT,
  headers: CONFIGURACAO_API.HEADERS_PADRAO,
  // Configurações adicionais para conexões HTTP
  validateStatus: function (status) {
    return status >= 200 && status < 600; // Aceitar todos os status codes para melhor debug
  },
});

httpClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Normalizar URL: se não for absoluta, remove barras iniciais para permitir join correto
      const isAbsoluteUrl = typeof config.url === 'string' && /^https?:\/\//i.test(config.url);
      if (!isAbsoluteUrl && typeof config.url === 'string') {
        config.url = config.url.replace(/^\/+/, '');
      }
      // Log da requisição para debug
      console.log('📤 Requisição:', config.method?.toUpperCase(), joinUrl(config.baseURL, config.url));
    } catch (_e) {
      // silencioso
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Evitar loop de 401 (login/logout) e múltiplos disparos
let isHandlingUnauthorized = false;
httpClient.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const fullUrl = error?.config?.baseURL + url;
    
    // Log detalhado do erro
    if (error.response) {
      console.error('❌ Erro HTTP:', status, fullUrl, error.response.data);
    } else if (error.request) {
      console.error('❌ Sem resposta do servidor:', fullUrl, error.message);
    } else {
      console.error('❌ Erro na configuração da requisição:', error.message);
    }
    
    if (status === 401) {
      // Ignorar 401 de login/logout e quando já estamos tratando
      const isAuthEndpoint =
        url.includes('/login') ||
        url.includes('/logout');
      if (!isAuthEndpoint && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        emit('auth:unauthorized', { reason: 'token_invalid_or_expired' });
        // pequena janela para evitar múltiplos eventos
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;





