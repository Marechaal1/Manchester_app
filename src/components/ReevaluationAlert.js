import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReevaluationAlert = ({ 
  patient, 
  reevaluationStatus, 
  onReevaluate, 
  onDismiss 
}) => {
  const [pulseAnim] = React.useState(new Animated.Value(1));

  const isCritical = reevaluationStatus?.categoria === 'critica';
  const amplitude = isCritical ? 1.15 : 1.1;

  React.useEffect(() => {
    pulseAnim.setValue(1);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: amplitude,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [amplitude]);

  const getAlertIcon = () => {
    switch (reevaluationStatus?.categoria) {
      case 'critica':
        return 'warning';
      case 'normal':
        return 'time';
      default:
        return 'refresh';
    }
  };

  const getAlertStyle = () => {
    switch (reevaluationStatus?.categoria) {
      case 'critica':
        return styles.criticalAlert;
      case 'normal':
        return styles.highAlert;
      default:
        return styles.normalAlert;
    }
  };

  return (
    <View
      style={[
        styles.alertContainer,
        getAlertStyle(),
      ]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.left}>
          <Animated.View style={[
            styles.iconPill,
            isCritical ? styles.iconPillCritical : styles.iconPillWarning,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Ionicons
              name={getAlertIcon()}
              size={14}
              color={reevaluationStatus?.categoria === 'critica' ? '#e74c3c' : '#f39c12'}
            />
          </Animated.View>
        </View>

        <View style={styles.center}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, reevaluationStatus?.categoria === 'critica' ? styles.badgeCritical : styles.badgeWarning]}>
              <Text style={styles.badgeText}>
                {reevaluationStatus?.categoria === 'critica' ? 'Vencida' : 'Reavaliação'}
              </Text>
            </View>
          </View>
          <Text style={styles.patientLine} numberOfLines={1}>
            {patient.nome} · {patient.idEtiqueta}
          </Text>
        </View>

        <View style={styles.right}>
          <TouchableOpacity style={styles.smallAction} onPress={() => onReevaluate(patient)}>
            <Ionicons name="refresh" size={16} color="#2E86AB" />
            <Text style={styles.smallActionText}>Reavaliar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Sutil aura pulsante atrás do conteúdo para manter sensação de atenção sem deslocar o layout */}
      {(
        <Animated.View
          style={[
            styles.pulseOverlay,
            {
              backgroundColor: isCritical
                ? 'rgba(231, 76, 60, 0.10)'
                : 'rgba(243, 156, 18, 0.08)',
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, amplitude],
                outputRange: [0.0, isCritical ? 0.3 : 0.22],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      )}
    </View>
  );
};

// Largura responsiva do card: ocupar a largura útil da lista (tela - paddings)
const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_SPACING = 40; // ~ padding horizontal da lista (20 + 20)
const MIN_WIDTH = 240;
const MAX_WIDTH = 420;
const ALERT_WIDTH = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, SCREEN_WIDTH - SIDE_SPACING));

const styles = StyleSheet.create({
  alertContainer: {
    width: ALERT_WIDTH,
    marginRight: 8,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  criticalAlert: {
    backgroundColor: '#ffe6e6',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  highAlert: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  mediumAlert: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f1c40f',
  },
  normalAlert: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  left: {
    paddingTop: 2,
  },
  center: {
    flex: 1,
    paddingHorizontal: 8,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconPillCritical: {
    borderColor: '#e74c3c',
  },
  iconPillWarning: {
    borderColor: '#f39c12',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCritical: {
    backgroundColor: '#ffe6e6',
  },
  badgeWarning: {
    backgroundColor: '#fff3cd',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientLine: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    lineHeight: 14,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2E86AB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallActionText: {
    color: '#2E86AB',
    fontSize: 11,
    fontWeight: '700',
  },
  pulseOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
    pointerEvents: 'none',
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 11,
    color: '#666',
  },
  dismissButton: {
    padding: 4,
    marginTop: -2,
  },
  alertActions: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2E86AB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    color: 'white',
  },
});

export default ReevaluationAlert;
