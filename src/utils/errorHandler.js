/**
 * Utilitário centralizado para tratamento de erros
 * 
 * Padroniza mensagens de erro e feedback ao usuário
 */

/**
 * Extrai mensagem de erro de uma resposta de API ou erro genérico
 * @param {Error|Object} error - Objeto de erro
 * @returns {string} Mensagem de erro amigável
 */
export const extractErrorMessage = (error) => {
  if (!error) {
    return 'Erro desconhecido';
  }

  // Erro de validação do backend
  if (error.response?.data?.erros) {
    const erros = error.response.data.erros;
    if (Array.isArray(erros) && erros.length > 0) {
      return erros.join(', ');
    }
    if (typeof erros === 'string') {
      return erros;
    }
  }

  // Mensagem de erro do backend
  if (error.response?.data?.mensagem) {
    return error.response.data.mensagem;
  }

  // Mensagem de erro padrão
  if (error.message) {
    return error.message;
  }

  // Erro de rede
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  return 'Erro ao processar solicitação. Tente novamente.';
};

/**
 * Trata erro de API e retorna objeto padronizado
 * @param {Error|Object} error - Objeto de erro
 * @param {string} defaultMessage - Mensagem padrão caso não seja possível extrair
 * @returns {Object} { success: false, error: string }
 */
export const handleApiError = (error, defaultMessage = 'Erro ao processar solicitação') => {
  const message = extractErrorMessage(error);
  console.error('❌ Erro na API:', error);
  return {
    success: false,
    error: message || defaultMessage,
  };
};

