import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import pedidoService from '../services/pedidoService';
import io from 'socket.io-client';
import env from '../config/env';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PedidoPopup = ({ navigation }) => {
  const { currentTheme } = useTheme();
  const { usuario } = useUser(); // ✅ Usar contexto en lugar de AsyncStorage
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [pedidosRechazadosPendientes, setPedidosRechazadosPendientes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ 
    x: screenWidth * 0.02,
    y: screenHeight * 0.78
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const socketRef = useRef(null);

  // ✅ Función para cargar pedidos desde el backend
  const cargarPedidos = async () => {
    if (!usuario) {
      console.log('❌ No hay usuario, no se cargan pedidos');
      return;
    }

    try {
      console.log('📦 Cargando pedidos para usuario:', usuario.id);
      const response = await pedidoService.obtenerPedidos();
      
      if (response.ok && response.pedidos) {
        const pendientes = response.pedidos.filter(p => 
          ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado)
        );
        const rechazados = response.pedidos.filter(p => 
          p.estado === 'rechazado' && !p.rechazo_confirmado
        );
        
        console.log(`✅ Pedidos cargados: ${pendientes.length} pendientes, ${rechazados.length} rechazados`);
        
        setPedidosPendientes(pendientes);
        setPedidosRechazadosPendientes(rechazados);
        
        const totalPendientes = pendientes.length + rechazados.length;
        setVisible(totalPendientes > 0);
      }
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
    }
  };

  // ✅ Limpiar estado cuando no hay usuario (cerró sesión o cambió de cuenta)
  useEffect(() => {
    if (!usuario) {
      console.log('🧹 Usuario no existe, limpiando estado del popup');
      setPedidosPendientes([]);
      setPedidosRechazadosPendientes([]);
      setVisible(false);
      
      // Desconectar WebSocket si existe
      if (socketRef.current) {
        console.log('🔌 Desconectando WebSocket por falta de usuario');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [usuario]);

  // ✅ Cargar pedidos iniciales cuando hay usuario
  useEffect(() => {
    if (usuario) {
      console.log('👤 Usuario detectado, cargando pedidos iniciales');
      cargarPedidos();
    }
  }, [usuario?.id]); // Solo cuando cambia el ID del usuario

  // ✅ Conectar WebSocket y escuchar eventos en tiempo real
  useEffect(() => {
    if (!usuario) {
      console.log('❌ No hay usuario, WebSocket no se conecta');
      return;
    }
    
    console.log('🔌 Conectando WebSocket para usuario:', usuario.id);
    
    const socket = io(env.WS_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;
    
    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado - ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });
    
    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    // ✅ Escuchar TODOS los cambios de estado (incluye confirmado, preparando, rechazado, etc.)
    socket.on(`pedido:estado:${usuario.id}`, (data) => {
      console.log('📡 Evento pedido:estado recibido:', data);
      cargarPedidos();
    });
    
    return () => {
      console.log('🔌 Limpieza: Desconectando WebSocket');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [usuario?.id]); // Reconectar si cambia el usuario

  // ✅ Detectar cuando la app vuelve del background
  useEffect(() => {
    const { AppState } = require('react-native');
    
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && usuario) {
        console.log('📱 App activa, recargando pedidos');
        cargarPedidos();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [usuario?.id]);

  // Animación de entrada cuando se vuelve visible
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) { // END
      const { translationX, translationY } = event.nativeEvent;
      
      // Límites responsivos basados en porcentajes
      const marginX = screenWidth * 0.02;  // 2% de margen horizontal
      const marginY = screenHeight * 0.05; // 5% de margen vertical
      
      const newX = Math.max(marginX, Math.min(screenWidth - 80 - marginX, position.x + translationX));
      const newY = Math.max(marginY, Math.min(screenHeight - 100 - marginY, position.y + translationY));
      
      setPosition({ x: newX, y: newY });
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const handlePress = () => {
    // Si hay pedidos rechazados pendientes, ir al tab rechazados
    if (pedidosRechazadosPendientes.length > 0) {
      navigation.navigate('MisPedidos', { tabInicial: 'rechazados' });
    } else {
      navigation.navigate('MisPedidos');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.popupContainer,
          {
            left: position.x,
            top: position.y,
            transform: [
              { translateX: translateX },
              { translateY: translateY },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.popupButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.shadow }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <FontAwesome name="truck" size={24} color="white" />
          {(pedidosPendientes.length + pedidosRechazadosPendientes.length) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {(pedidosPendientes.length + pedidosRechazadosPendientes.length) > 99 ? '99+' : (pedidosPendientes.length + pedidosRechazadosPendientes.length)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  popupButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: 'white',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5252',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default PedidoPopup;
