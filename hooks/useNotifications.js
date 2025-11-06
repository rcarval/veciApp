import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';

/**
 * Hook personalizado para manejar notificaciones push
 * @param {object} navigation - Objeto de navegación de React Navigation
 * @param {object} usuario - Usuario actual del contexto
 */
export const useNotifications = (navigation, usuario) => {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Solo inicializar si hay un usuario autenticado
    if (!usuario) {
      console.log('⚠️ No hay usuario, no se inicializan notificaciones');
      return;
    }

    console.log('🔔 Inicializando notificaciones push...');

    // Registrar dispositivo y obtener token
    const registerDevice = async () => {
      try {
        const fcmToken = await notificationService.registerForPushNotifications();
        
        if (fcmToken) {
          console.log('✅ Token FCM obtenido:', fcmToken);
          
          // Enviar token al backend
          const success = await notificationService.enviarTokenAlBackend(fcmToken);
          
          if (success) {
            console.log('✅ Dispositivo registrado para notificaciones');
          } else {
            console.warn('⚠️ No se pudo registrar el dispositivo en el backend');
          }
        }
      } catch (error) {
        console.error('❌ Error registrando dispositivo:', error);
      }
    };

    registerDevice();

    // Configurar listeners de notificaciones
    const cleanup = notificationService.configurarListenersNotificaciones(navigation);

    // Limpiar al desmontar
    return () => {
      if (cleanup) cleanup();
    };
  }, [usuario, navigation]);

  return null;
};

export default useNotifications;

