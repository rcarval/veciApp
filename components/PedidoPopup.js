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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PedidoPopup = ({ navigation, usuario }) => {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [position, setPosition] = useState({ 
    x: screenWidth * 0.80,  // 80% del ancho (esquina derecha)
    y: screenHeight * 0.78  // 78% de la altura (parte inferior)
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Detectar cuando estamos en Login y limpiar sesión
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('state', (e) => {
        const currentRouteName = e.data.state?.routes[e.data.state.index]?.name;
        console.log('🔍 Pantalla actual:', currentRouteName);
        
        if (currentRouteName === 'Login') {
          console.log('🧹 Detectado Login, limpiando sesión activa');
          AsyncStorage.removeItem('sesionActiva');
          setHasLoggedIn(false);
          setVisible(false);
        }
      });
      return unsubscribe;
    }, [navigation])
  );

  // Verificar si el usuario hizo login en esta sesión
  useEffect(() => {
    const verificarSesionActiva = async () => {
      try {
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        console.log('🔍 Sesión activa:', sesionActiva);
        
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
        const pedidosGuardados = await AsyncStorage.getItem('pedidosPendientes');
        console.log('📦 Pedidos guardados:', pedidosGuardados ? 'EXISTEN' : 'NO EXISTEN');
        
        if (pedidosGuardados) {
          const pedidos = JSON.parse(pedidosGuardados);
          console.log('📦 Cantidad de pedidos:', pedidos.length);
          setPedidosPendientes(pedidos);
          setVisible(pedidos.length > 0);
          console.log('👁️ Popup visible:', pedidos.length > 0);
        }
      } catch (error) {
        console.log('Error al cargar pedidos:', error);
      }
    };

    cargarPedidos();
  }, [usuario, hasLoggedIn]);

  // Escuchar cambios en pedidos solo si el usuario está logueado y ya hizo login en esta sesión
  useEffect(() => {
    if (!usuario || !hasLoggedIn) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const pedidosGuardados = await AsyncStorage.getItem('pedidosPendientes');
        if (pedidosGuardados) {
          const pedidos = JSON.parse(pedidosGuardados);
          setPedidosPendientes(pedidos);
          setVisible(pedidos.length > 0);
        }
      } catch (error) {
        console.log('Error al verificar pedidos:', error);
      }
    }, 2000); // Verificar cada 2 segundos

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
    navigation.navigate('HomeDrawer', { screen: 'MisPedidos' });
  };

  if (!visible) return null;

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
          style={styles.popupButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <FontAwesome name="truck" size={24} color="white" />
          {pedidosPendientes.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pedidosPendientes.length > 99 ? '99+' : pedidosPendientes.length}
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
