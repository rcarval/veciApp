import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import useNotifications from '../hooks/useNotifications';

/**
 * Componente que maneja las notificaciones push de la aplicación
 * Se monta dentro del NavigationContainer para tener acceso a navigation
 */
const NotificationHandler = ({ children }) => {
  const navigation = useNavigation();
  const { usuario } = useUser();

  // Inicializar notificaciones
  useNotifications(navigation, usuario);

  // Este componente solo maneja las notificaciones, no renderiza nada adicional
  return children || null;
};

export default NotificationHandler;

