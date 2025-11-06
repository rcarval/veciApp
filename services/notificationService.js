import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registrar el dispositivo para notificaciones push
 */
export const registerForPushNotifications = async () => {
  try {
    console.log('📱 Registrando dispositivo para notificaciones push...');

    // Verificar si es un dispositivo físico
    if (!Device.isDevice) {
      console.warn('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
      return null;
    }

    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permisos de notificaciones denegados');
      return null;
    }

    console.log('✅ Permisos de notificaciones otorgados');

    // Obtener el token de Expo Push Notifications
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Expo Push Token obtenido:', token.data);

    // Configurar canal de notificaciones para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('veciapp-notifications', {
        name: 'VeciApp Notificaciones',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2A9D8F',
        sound: 'default',
      });
      console.log('✅ Canal de notificaciones Android configurado');
    }

    return token.data;
  } catch (error) {
    console.error('❌ Error al registrar para notificaciones:', error);
    return null;
  }
};

/**
 * Enviar el FCM token al backend
 */
export const enviarTokenAlBackend = async (fcmToken) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No hay sesión activa, no se puede registrar FCM token');
      return false;
    }

    console.log('📤 Enviando FCM token al backend...');

    const response = await fetch(API_ENDPOINTS.REGISTRAR_FCM_TOKEN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcmToken }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ FCM token registrado en el backend');
      // Guardar token localmente para evitar registros duplicados
      await AsyncStorage.setItem('fcmToken', fcmToken);
      return true;
    } else {
      console.error('❌ Error al registrar FCM token en backend:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al enviar FCM token al backend:', error);
    return false;
  }
};

/**
 * Eliminar el FCM token del backend (al cerrar sesión)
 */
export const eliminarTokenDelBackend = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return true;

    console.log('📤 Eliminando FCM token del backend...');

    const response = await fetch(API_ENDPOINTS.ELIMINAR_FCM_TOKEN, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ FCM token eliminado del backend');
      await AsyncStorage.removeItem('fcmToken');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error al eliminar FCM token del backend:', error);
    return false;
  }
};

/**
 * Configurar listeners de notificaciones
 */
export const configurarListenersNotificaciones = (navigation) => {
  // Listener para notificaciones recibidas mientras la app está en primer plano
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notificación recibida en primer plano:', notification);
  });

  // Listener para cuando el usuario toca una notificación
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Usuario tocó la notificación:', response);
    
    const data = response.notification.request.content.data;
    
    // Navegar según el tipo de notificación
    if (data.screen) {
      navigation.navigate(data.screen, {
        pedidoId: data.pedido_id,
        emprendimientoId: data.emprendimiento_id,
      });
    }
  });

  // Retornar función para limpiar listeners
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * Obtener badge count (notificaciones no leídas)
 */
export const obtenerBadgeCount = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return 0;

    const response = await fetch(API_ENDPOINTS.MIS_NOTIFICACIONES + '?limite=1&offset=0', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.ok) {
      const noLeidas = data.noLeidas || 0;
      
      // Actualizar badge del ícono de la app
      await Notifications.setBadgeCountAsync(noLeidas);
      
      return noLeidas;
    }

    return 0;
  } catch (error) {
    console.error('❌ Error al obtener badge count:', error);
    return 0;
  }
};

/**
 * Marcar notificación como leída
 */
export const marcarComoLeida = async (notificacionId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(
      API_ENDPOINTS.MARCAR_NOTIFICACION_LEIDA(notificacionId),
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('❌ Error al marcar notificación como leída:', error);
    return false;
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const marcarTodasComoLeidas = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(API_ENDPOINTS.MARCAR_TODAS_LEIDAS, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (data.ok) {
      // Actualizar badge del ícono de la app
      await Notifications.setBadgeCountAsync(0);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error al marcar todas como leídas:', error);
    return false;
  }
};

export default {
  registerForPushNotifications,
  enviarTokenAlBackend,
  eliminarTokenDelBackend,
  configurarListenersNotificaciones,
  obtenerBadgeCount,
  marcarComoLeida,
  marcarTodasComoLeidas,
};

