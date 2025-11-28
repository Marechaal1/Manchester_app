import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NavegadorApp from './src/navigation/NavegadorApp.js';
import { ProvedorPaciente } from './src/context/ContextoPaciente';
import { ProvedorConfiguracaoReavaliacao } from './src/context/ContextoConfiguracaoReavaliacao';
import { ProvedorAutenticacao, usarAutenticacao } from './src/context/ContextoAutenticacao';

const TelaCarregamento = () => (
  <View style={estilos.containerCarregamento}>
    <ActivityIndicator size="large" color="#2E86AB" />
    <Text style={estilos.textoCarregamento}>Carregando...</Text>
  </View>
);

const ConteudoApp = () => {
  const { carregando } = usarAutenticacao();
  
  if (carregando) {
    return <TelaCarregamento />;
  }
  
  return <NavegadorApp />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ProvedorAutenticacao>
        <ProvedorConfiguracaoReavaliacao>
          <ProvedorPaciente>
            <StatusBar style="auto" />
            <ConteudoApp />
          </ProvedorPaciente>
        </ProvedorConfiguracaoReavaliacao>
      </ProvedorAutenticacao>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  containerCarregamento: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  textoCarregamento: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

