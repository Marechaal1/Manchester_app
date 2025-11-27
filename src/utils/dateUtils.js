/**
 * Utilitários para formatação e manipulação de datas
 */

/**
 * Formata uma data para o padrão DD/MM/YYYY
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada no padrão DD/MM/YYYY
 */
export const formatDateToDDMMYYYY = (date) => {
  if (!date) return 'N/I';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'N/I';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'N/I';
  }
};

/**
 * Formata uma data para o padrão YYYY-MM-DD (ISO)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada no padrão YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erro ao formatar data para ISO:', error);
    return '';
  }
};

/**
 * Aplica máscara DD/MM/YYYY em um input de data
 * @param {string} value - Valor do input
 * @returns {string} Valor com máscara aplicada
 */
export const applyDateMask = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara DD/MM/YYYY
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

/**
 * Valida se uma data está no formato DD/MM/YYYY e é válida
 * @param {string} dateString - String da data no formato DD/MM/YYYY
 * @returns {boolean} True se a data for válida
 */
export const isValidDate = (dateString) => {
  if (!dateString || dateString.length !== 10) return false;
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Verificar se os valores são válidos
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
    return false;
  }
  
  // Criar objeto Date e verificar se é válido
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

/**
 * Converte data do formato DD/MM/YYYY para Date object
 * @param {string} dateString - String da data no formato DD/MM/YYYY
 * @returns {Date|null} Objeto Date ou null se inválida
 */
export const parseDateFromDDMMYYYY = (dateString) => {
  if (!isValidDate(dateString)) return null;
  
  const parts = dateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month - 1, day);
};

/**
 * Calcula a idade baseada na data de nascimento
 * @param {string|Date} birthDate - Data de nascimento
 * @returns {number|null} Idade em anos ou null se inválida
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  } catch (error) {
    console.error('Erro ao calcular idade:', error);
    return null;
  }
};

