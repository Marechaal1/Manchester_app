import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth.service';
import { STORAGE_KEYS } from '../config/storageKeys';
import events from '../services/events';
import { resetarParaLogin } from '../navigation/NavegacaoRaiz';

// Tipos de usuário
export const TiposUsuario = {
  ENFERMEIRO: 'enfermeiro',
  MEDICO: 'medico'
};

// Context
const ContextoAutenticacao = createContext();

// Provider
export const ProvedorAutenticacao = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Verificar se há sessão válida ao iniciar o app
  useEffect(() => {
    const inicializar = async () => {
      try {
        setCarregando(true);
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const dadosUsuario = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (token && dadosUsuario) {
          try {
            const usuario = JSON.parse(dadosUsuario);
            
            // Mapear tipo_usuario para tipo se necessário
            if (usuario.tipo_usuario && !usuario.tipo) {
              usuario.tipo = usuario.tipo_usuario === 'ENFERMEIRO' ? TiposUsuario.ENFERMEIRO : 
                            usuario.tipo_usuario === 'MEDICO' ? TiposUsuario.MEDICO :
                            usuario.tipo_usuario === 'TECNICO_ENFERMAGEM' ? TiposUsuario.ENFERMEIRO :
                            usuario.tipo_usuario === 'ADMINISTRADOR' ? TiposUsuario.ENFERMEIRO :
                            TiposUsuario.MEDICO;
            }
            
            setUsuario(usuario);
            setEstaAutenticado(true);
          } catch (erro) {
            // Se houver erro ao parsear, limpar dados
            await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            setUsuario(null);
            setEstaAutenticado(false);
          }
        } else {
          setUsuario(null);
          setEstaAutenticado(false);
        }
      } catch (erro) {
        console.error('Erro ao inicializar autenticação:', erro);
        setUsuario(null);
        setEstaAutenticado(false);
      } finally {
        setCarregando(false);
      }
    };
    inicializar();
  }, []);

  // Ouvir 401 dos serviços e forçar logout (sem loop)
  useEffect(() => {
    let handling = false;
    const unsubscribe = events.on('auth:unauthorized', async () => {
      if (handling) return;
      handling = true;
      try {
        // Limpa sessão local primeiro para evitar chamadas com token inválido
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        setUsuario(null);
        setEstaAutenticado(false);
        // Tenta chamar logout na API, mas ignore falhas 401
        try {
          await authService.fazerLogout();
        } catch (_e) {
          // Ignora erro de logout quando não autenticado
        }
      } finally {
        resetarParaLogin();
        handling = false;
      }
    });
    return unsubscribe;
  }, []);

  const verificarStatusAutenticacao = async () => {
    // Mantido para compatibilidade, mas inicia sempre deslogado
    setUsuario(null);
    setEstaAutenticado(false);
  };

  const fazerLogin = async (email, senha) => {
    try {
      setCarregando(true);
      console.log('🔐 Iniciando processo de login...');
      console.log('📧 Email:', email);
      
      const resposta = await authService.fazerLogin(email, senha);
      console.log('📡 Resposta da API recebida');
      
      if (resposta.sucesso) {
        const dadosUsuario = resposta.dados.usuario;
        const token = resposta.dados.token;
        console.log('👤 Dados do usuário recebidos:', dadosUsuario);
        
        // Mapear tipo_usuario para tipo
        const usuarioMapeado = {
          ...dadosUsuario,
          tipo: dadosUsuario.tipo_usuario === 'ENFERMEIRO' ? TiposUsuario.ENFERMEIRO : 
                dadosUsuario.tipo_usuario === 'MEDICO' ? TiposUsuario.MEDICO :
                dadosUsuario.tipo_usuario === 'TECNICO_ENFERMAGEM' ? TiposUsuario.ENFERMEIRO : // Técnicos têm permissões de enfermeiro
                dadosUsuario.tipo_usuario === 'ADMINISTRADOR' ? TiposUsuario.ENFERMEIRO : // Admin tem permissões de enfermeiro
                TiposUsuario.MEDICO // Default
        };
        
        setUsuario(usuarioMapeado);
        setEstaAutenticado(true);
        // Persistência do token e do usuário
        try {
          if (token) {
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, String(token));
          }
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuarioMapeado));
        } catch (_e) {
          // silencioso
        }
        
        console.log('✅ Login realizado com sucesso');
        console.log('🔄 Estado atualizado - estaAutenticado: true');
        
        return { 
          sucesso: true, 
          usuario: usuarioMapeado,
          mensagem: 'Login realizado com sucesso'
        };
      } else {
        console.log('❌ Login falhou:', resposta.mensagem);
        return { 
          sucesso: false, 
          mensagem: resposta.mensagem || 'Erro ao fazer login'
        };
      }
    } catch (erro) {
      console.log('💥 Erro no processo de login:', erro.message);
      return { 
        sucesso: false, 
        mensagem: erro.message || 'Erro de conexão'
      };
    } finally {
      setCarregando(false);
    }
  };

  const fazerLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await authService.fazerLogout();
    } catch (erro) {
      console.error('💥 Erro ao fazer logout:', erro);
    } finally {
      setUsuario(null);
      setEstaAutenticado(false);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      console.log('✅ Logout realizado');
    }
  };

  const ehEnfermeiro = () => {
    return usuario?.tipo === TiposUsuario.ENFERMEIRO;
  };

  const ehMedico = () => {
    return usuario?.tipo === TiposUsuario.MEDICO;
  };

  const podeRealizarTriagem = () => {
    return ehEnfermeiro();
  };

  const podeRealizarReavaliacao = () => {
    return ehEnfermeiro();
  };

  const podeRealizarSAE = () => {
    return ehEnfermeiro();
  };

  const podeIniciarAtendimento = () => {
    return ehMedico();
  };

  const podeVerPacientesTriados = () => {
    return ehMedico();
  };

  const podeVerPacientesEmAtendimento = () => {
    return ehMedico();
  };

  const valor = {
    usuario,
    estaAutenticado,
    carregando,
    fazerLogin,
    fazerLogout,
    ehEnfermeiro,
    ehMedico,
    podeRealizarTriagem,
    podeRealizarReavaliacao,
    podeRealizarSAE,
    podeIniciarAtendimento,
    podeVerPacientesTriados,
    podeVerPacientesEmAtendimento,
  };

  return (
    <ContextoAutenticacao.Provider value={valor}>
      {children}
    </ContextoAutenticacao.Provider>
  );
};

// Hook para usar o contexto
export const usarAutenticacao = () => {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error('usarAutenticacao deve ser usado dentro de um ProvedorAutenticacao');
  }
  return contexto;
};

export default ContextoAutenticacao;
