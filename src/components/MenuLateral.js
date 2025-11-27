import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MenuLateral = ({ estaAberto, aoFechar, aoNovoPaciente, aoGerenciarPacientes, aoLogout }) => {
  const slideAnim = useRef(new Animated.Value(-280)).current; // Começa fora da tela (esquerda)
  const [modalVisible, setModalVisible] = React.useState(false);

  useEffect(() => {
    if (estaAberto) {
      // Primeiro mostra o modal, depois anima
      setModalVisible(true);
      // Pequeno delay para garantir que o modal está visível antes de animar
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      // Primeiro anima para fora, depois esconde o modal
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Callback executado quando a animação termina
        setModalVisible(false);
      });
    }
  }, [estaAberto, slideAnim]);

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={aoFechar}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
            <TouchableOpacity onPress={aoFechar} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuItems}>
            {aoNovoPaciente ? (
              <TouchableOpacity style={styles.menuItem} onPress={aoNovoPaciente}>
                <Ionicons name="person-add" size={24} color="#2E86AB" />
                <Text style={styles.menuItemText}>Novo Paciente</Text>
              </TouchableOpacity>
            ) : null}
            
            {aoGerenciarPacientes ? (
              <TouchableOpacity style={styles.menuItem} onPress={aoGerenciarPacientes}>
                <Ionicons name="people" size={24} color="#2E86AB" />
                <Text style={styles.menuItemText}>Gerenciar Pacientes</Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity style={styles.menuItem} onPress={aoLogout}>
              <Ionicons name="log-out" size={24} color="#e74c3c" />
              <Text style={styles.menuItemText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menu: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default MenuLateral;
