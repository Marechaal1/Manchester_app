import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { referenciaNavegacao, resetarParaLogin } from './NavegacaoRaiz';
import { createStackNavigator } from '@react-navigation/stack';
import { usarAutenticacao } from '../context/ContextoAutenticacao';
import TelaLogin from '../screens/TelaLogin';
import TelaDashboard from '../screens/TelaDashboard';
import TelaNovoPaciente from '../screens/TelaNovoPaciente';
import TelaSAE from '../screens/TelaSAE';
import TelaVisualizarSAE from '../screens/TelaVisualizarSAE';
import TelaReavaliacao from '../screens/TelaReavaliacao';
import TelaProcedimentosInternos from '../screens/TelaProcedimentosInternos';
import TelaAtendimentoMedico from '../screens/TelaAtendimentoMedico';
import TelaGerenciarPacientes from '../screens/TelaGerenciarPacientes';
import TelaLiberarPaciente from '../screens/TelaLiberarPaciente';

const Pilha = createStackNavigator();

const NavegadorApp = () => {
  const { estaAutenticado } = usarAutenticacao();
  
  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    if (!estaAutenticado) {
      console.log('🔄 Usuário não autenticado, redirecionando para login...');
      resetarParaLogin();
    }
  }, [estaAutenticado]);
  
  return (
    <NavigationContainer ref={referenciaNavegacao}>
      <Pilha.Navigator
        initialRouteName={estaAutenticado ? "Dashboard" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Pilha.Screen name="Login" component={TelaLogin} />
        <Pilha.Screen name="Dashboard" component={TelaDashboard} />
        <Pilha.Screen name="NovoPaciente" component={TelaNovoPaciente} />
        <Pilha.Screen name="SAE" component={TelaSAE} />
        <Pilha.Screen name="VisualizarSAE" component={TelaVisualizarSAE} />
        <Pilha.Screen name="Reavaliacao" component={TelaReavaliacao} />
        <Pilha.Screen name="ProcedimentosInternos" component={TelaProcedimentosInternos} />
        <Pilha.Screen name="AtendimentoMedico" component={TelaAtendimentoMedico} />
        <Pilha.Screen name="GerenciarPacientes" component={TelaGerenciarPacientes} />
        <Pilha.Screen name="LiberarPaciente" component={TelaLiberarPaciente} />
      </Pilha.Navigator>
    </NavigationContainer>
  );
};

export default NavegadorApp;

