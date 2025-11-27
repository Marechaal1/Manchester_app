import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Importação condicional para evitar erros em desenvolvimento
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications não disponível:', error);
}

// Importação condicional de Constants para detectar Expo Go
let Constants = null;
try {
  Constants = require('expo-constants').default;
} catch (error) {
  console.warn('expo-constants não disponível:', error);
}

export const useNotifications = () => {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!Notifications) return;

    try {
      // Configurar como as notificações são tratadas quando o app está em primeiro plano
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Solicitar permissões (com detecção de Expo Go dentro da função)
      registerForPushNotificationsAsync();

      // Listener para notificações recebidas
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notificação recebida:', notification);
      });

      // Listener para quando o usuário toca na notificação
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Usuário tocou na notificação:', response);
      });
    } catch (error) {
      console.warn('Erro ao configurar notificações:', error);
    }

    return () => {
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          console.warn('Erro ao remover listener de notificação:', error);
        }
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          console.warn('Erro ao remover listener de resposta:', error);
        }
      }
    };
  }, []);

  const sendReevaluationNotification = async (patientName, patientTagId, timeMessage) => {
    if (!Notifications) {
      console.warn('Notificações não disponíveis');
      return;
    }
    
    // Garantir que os parâmetros sejam strings válidas
    const safePatientName = String(patientName || 'Paciente');
    const safePatientTagId = String(patientTagId || 'N/A');
    const safeTimeMessage = String(timeMessage || 'Reavaliação necessária');
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reavaliação Próxima',
          body: `${safePatientName} (ID: ${safePatientTagId}) - ${safeTimeMessage}`,
          data: { 
            type: 'reevaluation',
            patientName: safePatientName,
            patientTagId: safePatientTagId,
            timeMessage: safeTimeMessage 
          },
        },
        trigger: null, // Enviar imediatamente
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const sendCriticalReevaluationNotification = async (patientName, patientTagId, timeMessage) => {
    console.log('🔔 sendCriticalReevaluationNotification - Iniciando...');
    
    if (!Notifications) {
      console.warn('❌ Notificações não disponíveis - Notifications é null');
      return;
    }
    
    console.log('✅ Notifications disponível, verificando permissões...');
    
    // Verificar permissões
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔔 Status atual das permissões:', existingStatus);
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        console.log('🔔 Solicitando permissões...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔔 Status após solicitação:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.warn('❌ Permissões de notificação não concedidas');
        return;
      }
      
      console.log('✅ Permissões de notificação concedidas');
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return;
    }
    
    // Debug: verificar os parâmetros recebidos
    console.log('🔔 Enviando notificação crítica:');
    console.log('  - patientName:', patientName, typeof patientName);
    console.log('  - patientTagId:', patientTagId, typeof patientTagId);
    console.log('  - timeMessage:', timeMessage, typeof timeMessage);
    
    // Garantir que os parâmetros sejam strings válidas
    const safePatientName = String(patientName || 'Paciente');
    const safePatientTagId = String(patientTagId || 'N/A');
    const safeTimeMessage = String(timeMessage || 'Reavaliação vencida');
    
    console.log('🔔 Parâmetros seguros:');
    console.log('  - safePatientName:', safePatientName);
    console.log('  - safePatientTagId:', safePatientTagId);
    console.log('  - safeTimeMessage:', safeTimeMessage);
    
    try {
      console.log('🔔 Agendando notificação...');
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reavaliação Vencida',
          body: `${safePatientName} (ID: ${safePatientTagId}) - ${safeTimeMessage}`,
          data: { 
            type: 'critical_reevaluation',
            patientName: safePatientName,
            patientTagId: safePatientTagId,
            timeMessage: safeTimeMessage 
          },
        },
        trigger: null, // Enviar imediatamente
      });
      console.log('✅ Notificação crítica enviada com sucesso. ID:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação crítica:', error);
    }
  };

  return {
    sendReevaluationNotification,
    sendCriticalReevaluationNotification,
  };
};

async function registerForPushNotificationsAsync() {
  if (!Notifications) {
    console.warn('Notificações não disponíveis');
    return;
  }

  let token;

  try {
    // No Expo Go (appOwnership === 'expo'), push remoto não é suportado (SDK 53+)
    const isRunningInExpoGo = Constants && Constants.appOwnership === 'expo';
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações negada');
      return;
    }

    // Se estiver no Expo Go, não tentar obter token de push remoto
    if (isRunningInExpoGo) {
      console.warn('Executando no Expo Go: push remoto indisponível. Usando apenas notificações locais.');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Token de notificação:', token);
  } catch (error) {
    console.error('Erro ao configurar notificações:', error);
  }

  return token;
}

