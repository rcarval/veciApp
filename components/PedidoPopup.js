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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import pedidoService from '../services/pedidoService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PedidoPopup = ({ navigation }) => {
  const { currentTheme } = useTheme();
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [pedidosRechazadosPendientes, setPedidosRechazadosPendientes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [position, setPosition] = useState({ 
    x: screenWidth * 0.02,  // 80% del ancho (esquina derecha)
    y: screenHeight * 0.78  // 78% de la altura (parte inferior)
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Cargar usuario desde AsyncStorage
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuarioData = JSON.parse(usuarioGuardado);
          console.log('👤 Usuario cargado desde AsyncStorage:', usuarioData.nombre);
          setUsuario(usuarioData);
        } else {
          console.log('👤 No hay usuario guardado en AsyncStorage');
          setUsuario(null);
        }
      } catch (error) {
        console.log('Error al cargar usuario:', error);
        setUsuario(null);
      }
    };

    cargarUsuario();
  }, []);

  // Detectar cuando la app vuelve del background
  useEffect(() => {
    const { AppState } = require('react-native');
    
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App volvió a estar activa, verificando popup...');
        
        // Recargar usuario desde AsyncStorage cada vez que la app vuelva a estar activa
        try {
          const usuarioGuardado = await AsyncStorage.getItem('usuario');
          if (usuarioGuardado) {
            const usuarioData = JSON.parse(usuarioGuardado);
            console.log('📱 Usuario recargado al volver:', usuarioData.nombre);
            setUsuario(usuarioData);
            
            // Verificar pedidos pendientes desde el backend
            try {
              console.log('📱 Cargando pedidos desde el backend al volver...');
              const response = await pedidoService.obtenerPedidos();
              
              if (response.ok && response.pedidos) {
                const pendientes = response.pedidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado));
                const rechazados = response.pedidos.filter(p => p.estado === 'rechazado' && !p.rechazo_confirmado);
                
                console.log(`📱 Pedidos encontrados al volver: ${pendientes.length} pendientes, ${rechazados.length} rechazados sin confirmar`);
                
                setPedidosPendientes(pendientes);
                setPedidosRechazadosPendientes(rechazados);
                
                const totalPendientes = pendientes.length + rechazados.length;
                console.log('📱 Total pendientes al volver:', totalPendientes);
                setVisible(totalPendientes > 0);
              }
            } catch (error) {
              console.log('Error al cargar pedidos al volver:', error);
            }
          } else {
            console.log('📱 No hay usuario guardado, ocultando popup');
            setUsuario(null);
            setVisible(false);
          }
        } catch (error) {
          console.log('Error al recargar usuario al volver:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [usuario]);

  // Limpiar sesión solo al iniciar la app (no durante la navegación)
  useEffect(() => {
    const limpiarSesionAlInicio = async () => {
      try {
        // Solo limpiar si no hay usuario logueado
        if (!usuario) {
          console.log('🧹 No hay usuario, limpiando sesión activa');
          await AsyncStorage.removeItem('sesionActiva');
          setHasLoggedIn(false);
          setVisible(false);
        }
      } catch (error) {
        console.log('Error al limpiar sesión:', error);
      }
    };

    limpiarSesionAlInicio();
  }, [usuario]);

  // Verificar si el usuario hizo login en esta sesión
  useEffect(() => {
    const verificarSesionActiva = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        console.log('🔍 Sesión activa:', sesionActiva);
        console.log('👤 Usuario:', usuario ? 'EXISTE' : 'NULL');
        
        if (sesionActiva === 'true' && usuario) {
          console.log('✅ Sesión activa detectada, marcando hasLoggedIn = true');
          setHasLoggedIn(true);
        } else {
          console.log('❌ No hay sesión activa, marcando hasLoggedIn = false');
          setHasLoggedIn(false);
          setVisible(false);
        }
      } catch (error) {
        console.log('Error al verificar sesión:', error);
        setHasLoggedIn(false);
        setVisible(false);
      }
    };

    verificarSesionActiva();
  }, [usuario]);

  // Monitorear cambios en sesionActiva
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        if (sesionActiva === 'true' && usuario && !hasLoggedIn) {
          console.log('🔄 Sesión activa detectada en monitoreo, marcando hasLoggedIn = true');
          setHasLoggedIn(true);
        }
      } catch (error) {
        console.log('Error al monitorear sesión:', error);
      }
    }, 1000); // Verificar cada segundo

    return () => clearInterval(interval);
  }, [usuario, hasLoggedIn]);

  // Cargar pedidos pendientes solo si el usuario está logueado y ya hizo login en esta sesión
  useEffect(() => {
    console.log('📦 Cargando pedidos - Usuario:', usuario ? 'EXISTE' : 'NULL', 'hasLoggedIn:', hasLoggedIn);
    
    if (!usuario || !hasLoggedIn) {
      console.log('❌ No cargando pedidos - condiciones no cumplidas');
      setVisible(false);
      return;
    }

    const cargarPedidos = async () => {
      try {
        console.log('📦 Cargando pedidos desde el backend...');
        const response = await pedidoService.obtenerPedidos();
        
        console.log('📦 Response:', JSON.stringify(response, null, 2));
        
        if (response.ok && response.pedidos) {
          console.log(`✅ Pedidos cargados: ${response.pedidos.length}`);
          console.log('📦 Todos los pedidos:', JSON.stringify(response.pedidos, null, 2));
          
          // Filtrar solo pedidos pendientes
          const pendientes = response.pedidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado));
          const rechazados = response.pedidos.filter(p => p.estado === 'rechazado' && !p.rechazo_confirmado);
          
          console.log(`📦 Pendientes: ${pendientes.length}, Rechazados sin confirmar: ${rechazados.length}`);
          
          setPedidosPendientes(pendientes);
          setPedidosRechazadosPendientes(rechazados);
          
          const totalPendientes = pendientes.length + rechazados.length;
          console.log('📊 Total pendientes:', totalPendientes);
          console.log('👁️ Popup visible:', totalPendientes > 0);
          setVisible(totalPendientes > 0);
        } else {
          console.log('⚠️ No se pudieron cargar pedidos. Response:', response);
          setVisible(false);
        }
      } catch (error) {
        console.log('❌ Error al cargar pedidos:', error);
        console.log('❌ Error details:', error.message);
        setVisible(false);
      }
    };

    cargarPedidos();
  }, [usuario, hasLoggedIn]);

  // Monitorear trigger de popup usando AsyncStorage
  useEffect(() => {
    if (!usuario || !hasLoggedIn) {
      return;
    }

    let lastTrigger = null;
    
    const verificarTrigger = async () => {
      try {
        const trigger = await AsyncStorage.getItem('popupTrigger');
        if (trigger && trigger !== lastTrigger) {
          console.log('🎯 TRIGGER DE POPUP DETECTADO');
          lastTrigger = trigger;
          
          // Cargar pedidos desde el backend inmediatamente
          console.log('🎯 Cargando pedidos tras trigger...');
          const response = await pedidoService.obtenerPedidos();
          
          if (response.ok && response.pedidos) {
            const pendientes = response.pedidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado));
            const rechazados = response.pedidos.filter(p => p.estado === 'rechazado' && !p.rechazo_confirmado);
            
            console.log(`📦 Pendientes: ${pendientes.length}, Rechazados sin confirmar: ${rechazados.length}`);
            
            setPedidosPendientes(pendientes);
            setPedidosRechazadosPendientes(rechazados);
            
            const totalPendientes = pendientes.length + rechazados.length;
            console.log('🎯 Total pendientes tras trigger:', totalPendientes);
            console.log('🎯 Marcando popup visible:', totalPendientes > 0);
            setVisible(totalPendientes > 0);
          }
        }
      } catch (error) {
        console.log('Error al verificar trigger:', error);
      }
    };

    // Verificar trigger cada 500ms para reducir logs
    const interval = setInterval(verificarTrigger, 500);
    
    return () => clearInterval(interval);
  }, [usuario, hasLoggedIn]);

  // Escuchar cambios en pedidos solo si el usuario está logueado y ya hizo login en esta sesión
  useEffect(() => {
    if (!usuario || !hasLoggedIn) {
      return;
    }
    
    // Función para verificar pedidos
    const verificarPedidos = async () => {
      try {
        console.log('🔄 Verificando pedidos periódicamente...');
        const response = await pedidoService.obtenerPedidos();
        
        if (response.ok && response.pedidos) {
          const pendientes = response.pedidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado));
          const rechazados = response.pedidos.filter(p => p.estado === 'rechazado' && !p.rechazo_confirmado);
          
          setPedidosPendientes(pendientes);
          setPedidosRechazadosPendientes(rechazados);
          
          const totalPendientes = pendientes.length + rechazados.length;
          setVisible(totalPendientes > 0);
        }
      } catch (error) {
        console.log('Error al verificar pedidos:', error);
      }
    };

    // Verificar inmediatamente
    verificarPedidos();
    
    // Luego verificar cada 5 segundos para reducir logs
    const interval = setInterval(verificarPedidos, 5000);

    return () => clearInterval(interval);
  }, [usuario, hasLoggedIn]);

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
