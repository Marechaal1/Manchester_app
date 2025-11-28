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
  URL_BASE: 'http://172.16.49.67:8080/api',
};

// Constrói baseURL a partir de variáveis simples em app.json (preferencial)
const construirUrlPorHost = () => {
  const extra = Constants?.expoConfig?.extra || {};
  const hostRaw = extra?.API_HOST; // ex.: "172.16.49.67"
  if (!hostRaw) return null;
  const esquema = (extra?.API_SCHEME || 'http').replace(/:$/, '');
  const portaDefault = '8080';
  const caminhoDefault = '/api';
  
  // remover http(s):// do host, se o usuário pôs por engano
  const hostSemEsquema = String(hostRaw).replace(/^https?:\/\//i, '');
  const temPorta = hostSemEsquema.includes(':');
  const autoridade = temPorta ? hostSemEsquema : `${hostSemEsquema}:${extra?.API_PORT || portaDefault}`;
  
  const caminho = String(extra?.API_PATH || caminhoDefault).replace(/\/+$/, '');
  return `${esquema}://${autoridade}${caminho}`;
};

// Função para obter a URL base do ambiente, priorizando API_HOST
export const obterUrlBaseAPI = () => {
  // Preferir composição por host simples
  const urlPorHost = construirUrlPorHost();
  if (urlPorHost) return urlPorHost;
  // Compatibilidade com configuração antiga usando API_URL completo
  const urlExtra = Constants?.expoConfig?.extra?.API_URL;
  return urlExtra || CONFIGURACAO_API.URL_BASE;
};
