// Evento simples para desacoplar serviços (dados) da UI (navegação/alerts)
const listeners = {};

export function on(eventName, handler) {
  if (!listeners[eventName]) {
    listeners[eventName] = new Set();
  }
  listeners[eventName].add(handler);
  return () => off(eventName, handler);
}

export function off(eventName, handler) {
  listeners[eventName]?.delete(handler);
}

export function emit(eventName, payload) {
  if (!listeners[eventName]) return;
  for (const handler of listeners[eventName]) {
    try {
      handler(payload);
    } catch (_e) {
      // evitar quebra por erro de handler
    }
  }
}

export default { on, off, emit };













