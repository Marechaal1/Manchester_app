import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import { navegar } from '../navigation/NavegacaoRaiz';

const TelaLogin = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { fazerLogin } = usarAutenticacao();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setCarregando(true);
    try {
      const resultado = await fazerLogin(email, senha);
      if (resultado.sucesso) {
        navegar('Dashboard');
      } else {
        Alert.alert('Erro', resultado.mensagem || 'Credenciais inválidas');
      }
    } catch (erro) {
      console.error('Erro no login:', erro);
      let mensagemErro = 'Erro ao fazer login.';
      
      if (erro.message) {
        mensagemErro = erro.message;
      } else if (erro.response) {
        // Erro de resposta HTTP
        if (erro.response.status === 401) {
          mensagemErro = 'Credenciais inválidas. Verifique seu email e senha.';
        } else if (erro.response.status === 0 || erro.code === 'NETWORK_ERROR' || erro.code === 'ECONNREFUSED') {
          mensagemErro = 'Erro de conexão. Verifique se o backend está rodando e se você está na mesma rede Wi-Fi.';
        } else if (erro.response.data?.mensagem) {
          mensagemErro = erro.response.data.mensagem;
        } else {
          mensagemErro = `Erro ${erro.response.status}: ${erro.response.statusText || 'Erro desconhecido'}`;
        }
      } else if (erro.request) {
        // Requisição foi feita mas não houve resposta
        mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão de rede e se o backend está rodando.';
      } else if (erro.code === 'NETWORK_ERROR' || erro.message?.includes('Network')) {
        mensagemErro = 'Erro de rede. Verifique sua conexão Wi-Fi e se o backend está acessível em http://192.168.0.102:8000';
      }
      
      Alert.alert('Erro no Login', mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
      <View style={[estilos.container]}>
      <View style={estilos.formulario}>
        <Text style={estilos.titulo}>Sistema de Triagem Manchester</Text>
        
        <TextInput
          style={estilos.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={estilos.input}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity
          style={[estilos.botao, carregando && estilos.botaoDesabilitado]}
          onPress={handleLogin}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.textoBotao}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  formulario: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#2E86AB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  botao: {
    backgroundColor: '#2E86AB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TelaLogin;
