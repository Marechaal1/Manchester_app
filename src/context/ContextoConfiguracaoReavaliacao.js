import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { parametrosSistemaService } from '../services/parametrosSistema.service';

// Configurações padrão de reavaliação (em minutos)
const temposReavaliacaoPadrao = {
  red: 15,      // Emergência: 15 minutos
  orange: 30,   // Muito Urgente: 30 minutos
  yellow: 60,   // Urgente: 60 minutos
  green: 120,   // Pouco Urgente: 120 minutos
  blue: 240,    // Não Urgente: 240 minutos
};

// Estado inicial
const estadoInicial = {
  temposReavaliacao: temposReavaliacaoPadrao,
  configurado: false,
  ultimaAtualizacao: null,
  carregando: false,
  erro: null,
  parametrosBackend: null,
};

// Tipos de ações
const AcoesReavaliacao = {
  ATUALIZAR_TEMPOS_REAVALIACAO: 'ATUALIZAR_TEMPOS_REAVALIACAO',
  RESETAR_PADRAO: 'RESETAR_PADRAO',
  DEFINIR_CONFIGURADO: 'DEFINIR_CONFIGURADO',
  CARREGAR_PARAMETROS_BACKEND: 'CARREGAR_PARAMETROS_BACKEND',
  DEFINIR_CARREGANDO: 'DEFINIR_CARREGANDO',
  DEFINIR_ERRO: 'DEFINIR_ERRO',
};

// Reducer para gerenciar o estado
const reducerConfiguracaoReavaliacao = (estado, acao) => {
  switch (acao.tipo) {
    case AcoesReavaliacao.ATUALIZAR_TEMPOS_REAVALIACAO:
      return {
        ...estado,
        temposReavaliacao: acao.payload,
        configurado: true,
        ultimaAtualizacao: new Date().toISOString(),
      };

    case AcoesReavaliacao.RESETAR_PADRAO:
      return {
        ...estado,
        temposReavaliacao: temposReavaliacaoPadrao,
        configurado: false,
        ultimaAtualizacao: new Date().toISOString(),
      };

    case AcoesReavaliacao.DEFINIR_CONFIGURADO:
      return {
        ...estado,
        configurado: acao.payload,
      };

    case AcoesReavaliacao.CARREGAR_PARAMETROS_BACKEND:
      return {
        ...estado,
        parametrosBackend: acao.payload,
        temposReavaliacao: acao.payload.temposReavaliacao || estado.temposReavaliacao,
        configurado: true,
        ultimaAtualizacao: new Date().toISOString(),
        carregando: false,
        erro: null,
      };

    case AcoesReavaliacao.DEFINIR_CARREGANDO:
      return {
        ...estado,
        carregando: acao.payload,
        erro: acao.payload ? null : estado.erro,
      };

    case AcoesReavaliacao.DEFINIR_ERRO:
      return {
        ...estado,
        erro: acao.payload,
        carregando: false,
      };

    default:
      return estado;
  }
};

// Context
const ContextoConfiguracaoReavaliacao = createContext();

// Provider
export const ProvedorConfiguracaoReavaliacao = ({ children }) => {
  const [estado, dispatch] = useReducer(reducerConfiguracaoReavaliacao, estadoInicial);

  const carregarParametrosDoBackend = async () => {
    try {
      console.log('🔄 ContextoConfiguracaoReavaliacao - Carregando parâmetros do backend...');
      dispatch({ tipo: AcoesReavaliacao.DEFINIR_CARREGANDO, payload: true });
      
      const resposta = await parametrosSistemaService.obterParametros();
      console.log('✅ ContextoConfiguracaoReavaliacao - Parâmetros carregados:', resposta);
      
      if (resposta.sucesso && resposta.dados) {
        // Converter os dados do backend para o formato esperado
        const temposReavaliacao = {};
        const mapCategoriaKey = (key) => {
          const k = String(key || '').trim().toUpperCase();
          if (k === 'VERMELHO' || k === 'RED') return { en: 'red', pt: 'vermelho' };
          if (k === 'LARANJA' || k === 'ORANGE') return { en: 'orange', pt: 'laranja' };
          if (k === 'AMARELO' || k === 'YELLOW') return { en: 'yellow', pt: 'amarelo' };
          if (k === 'VERDE' || k === 'GREEN') return { en: 'green', pt: 'verde' };
          if (k === 'AZUL' || k === 'BLUE') return { en: 'blue', pt: 'azul' };
          // fallback genérico: manter chave original em minúsculas
          const lower = String(key || '').trim().toLowerCase();
          return { en: lower, pt: lower };
        };
        Object.keys(resposta.dados).forEach(categoria => {
          const parametro = resposta.dados[categoria];
          if (parametro.ativo) {
            const mapped = mapCategoriaKey(categoria);
            // Duplicar em ambas as chaves para evitar inconsistências em diferentes pontos do app
            temposReavaliacao[mapped.en] = parametro.tempo_minutos;
            temposReavaliacao[mapped.pt] = parametro.tempo_minutos;
          }
        });
        
        const parametrosProcessados = {
          temposReavaliacao,
          dadosOriginais: resposta.dados,
          carregadoDoBackend: true
        };
        
        dispatch({ 
          tipo: AcoesReavaliacao.CARREGAR_PARAMETROS_BACKEND, 
          payload: parametrosProcessados 
        });
        
        console.log('✅ ContextoConfiguracaoReavaliacao - Parâmetros processados:', parametrosProcessados);
      } else {
        throw new Error('Resposta inválida do backend');
      }
    } catch (erro) {
      console.error('❌ ContextoConfiguracaoReavaliacao - Erro ao carregar parâmetros:', erro);
      dispatch({ 
        tipo: AcoesReavaliacao.DEFINIR_ERRO, 
        payload: erro.message || 'Erro ao carregar parâmetros do sistema' 
      });
    }
  };

  // Carregar parâmetros do backend quando o provider for montado
  useEffect(() => {
    console.log('🔄 ProvedorConfiguracaoReavaliacao - Iniciando carregamento automático...');
    carregarParametrosDoBackend();
  }, []);

  const atualizarTemposReavaliacao = (novosTempos) => {
    dispatch({
      tipo: AcoesReavaliacao.ATUALIZAR_TEMPOS_REAVALIACAO,
      payload: novosTempos,
    });
  };

  const resetarParaPadrao = () => {
    dispatch({
      tipo: AcoesReavaliacao.RESETAR_PADRAO,
    });
  };

  const definirConfigurado = (configurado) => {
    dispatch({
      tipo: AcoesReavaliacao.DEFINIR_CONFIGURADO,
      payload: configurado,
    });
  };

  const obterTempoReavaliacao = (categoriaRisco) => {
    return estado.temposReavaliacao[categoriaRisco] || 10;
  };

  const obterTemposReavaliacao = () => {
    return estado.temposReavaliacao;
  };

  const estaConfigurado = () => {
    return estado.configurado;
  };

  const obterUltimaAtualizacao = () => {
    return estado.ultimaAtualizacao;
  };

  const valor = {
    ...estado,
    atualizarTemposReavaliacao,
    resetarParaPadrao,
    definirConfigurado,
    obterTempoReavaliacao,
    obterTemposReavaliacao,
    estaConfigurado,
    obterUltimaAtualizacao,
    carregarParametrosDoBackend,
  };

  return (
    <ContextoConfiguracaoReavaliacao.Provider value={valor}>
      {children}
    </ContextoConfiguracaoReavaliacao.Provider>
  );
};

// Hook para usar o contexto
export const usarConfiguracaoReavaliacao = () => {
  const contexto = useContext(ContextoConfiguracaoReavaliacao);
  if (!contexto) {
    throw new Error('usarConfiguracaoReavaliacao deve ser usado dentro de um ProvedorConfiguracaoReavaliacao');
  }
  return contexto;
};

export default ContextoConfiguracaoReavaliacao;