import { createNavigationContainerRef } from '@react-navigation/native';

export const referenciaNavegacao = createNavigationContainerRef();

export function navegar(nome, parametros) {
  if (referenciaNavegacao.isReady()) {
    referenciaNavegacao.navigate(nome, parametros);
  }
}

export function resetarParaLogin() {
  if (referenciaNavegacao.isReady()) {
    referenciaNavegacao.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
}



