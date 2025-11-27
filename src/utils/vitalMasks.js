export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

export const maskInteger = (value = '', maxDigits = 3) => {
  return onlyDigits(value).slice(0, maxDigits);
};

// Limita um número (em string) a um valor máximo
const clampNumber = (numStr, maxValue) => {
  if (numStr === '') return '';
  const n = parseInt(numStr, 10);
  if (Number.isNaN(n)) return '';
  const max = typeof maxValue === 'number' ? maxValue : Number.MAX_SAFE_INTEGER;
  return String(Math.min(n, max));
};

// Inteiro com limite de dígitos e valor máximo
export const maskIntegerMax = (value = '', maxDigits = 3, maxValue = undefined) => {
  const digits = onlyDigits(value).slice(0, maxDigits);
  if (maxValue === undefined) return digits;
  return clampNumber(digits, maxValue);
};

// Decimal com 1 casa, aceita vírgula e ponto, limita inteiros e valor máximo
export const maskDecimalOne = (value = '', maxIntDigits = 2, maxValue = undefined) => {
  const raw = String(value).replace(',', '.'); // aceitar vírgula
  // Se o usuário digitar apenas números (teclado numérico), inferir decimal automaticamente
  const only = onlyDigits(raw);
  let result = '';
  if (!raw.includes('.')) {
    // Não há ponto explícito: se exceder os dígitos inteiros, insere ponto automaticamente
    if (only.length <= maxIntDigits) {
      result = only;
    } else {
      const intPart = only.slice(0, maxIntDigits);
      const decPart = only.slice(maxIntDigits, maxIntDigits + 1);
      result = decPart ? `${intPart}.${decPart}` : intPart;
    }
  } else {
    // Há ponto: seguir fluxo tradicional
    const cleaned = raw.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    const intPart = onlyDigits(parts[0]).slice(0, maxIntDigits);
    const decPart = parts.length > 1 ? onlyDigits(parts[1]).slice(0, 1) : '';
    result = decPart ? `${intPart}.${decPart}` : intPart;
  }
  if (result === '') return '';
  if (maxValue !== undefined) {
    const n = parseFloat(result);
    if (!Number.isNaN(n)) {
      result = String(Math.min(n, maxValue));
    }
  }
  return result;
};

export const applyBloodPressureMask = (value = '') => {
  // Aceita no máximo 3 dígitos para sistólica e diastólica, com clamp leve
  const d = onlyDigits(value).slice(0, 6);
  let sys = d.slice(0, 3);
  let dia = d.slice(3, 6);
  if (!dia) return sys;
  // Clamps (valores plausíveis básicos)
  if (sys) sys = clampNumber(sys, 300);
  if (dia) dia = clampNumber(dia, 200);
  return `${sys}/${dia}`;
};









