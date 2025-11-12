import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import io from 'socket.io-client';
import env from '../config/env';
import pedidoService from '../services/pedidoService';

const BottomTabBarEmprendedor = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { usuario } = useUser(); // ✅ Usar contexto en lugar de AsyncStorage
  
  // Validar que los contextos estén cargados
  if (!currentTheme) {
    console.log('⚠️ BottomTabBarEmprendedor: currentTheme no disponible');
    return null;
  }
  
  const styles = BottomTabBarEmprendedorStyles(currentTheme);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const socketRef = useRef(null);

  // ✅ Función para contar pedidos pendientes
  const contarPedidosPendientes = async () => {
    if (!usuario) {
      console.log('❌ No hay usuario, no se cuentan pedidos');
      setPedidosPendientes(0);
      return;
    }

    try {
      console.log('📊 Contando pedidos pendientes para emprendedor:', usuario.id);
      const response = await pedidoService.obtenerPedidosRecibidos();
      
      if (response.ok && response.pedidos) {
        // Contar solo pedidos en estados pendientes (pendiente, confirmado, preparando, listo)
        const pendientes = response.pedidos.filter(p => 
          ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)
        ).length;
        
        // Asegurar que siempre sea un número válido
        const contador = Number.isFinite(pendientes) ? pendientes : 0;
        setPedidosPendientes(contador);
        console.log(`✅ Badge actualizado - Pedidos pendientes: ${contador}`);
      } else {
        // Si no hay respuesta válida, resetear a 0
        setPedidosPendientes(0);
      }
    } catch (error) {
      console.error('❌ Error al contar pedidos pendientes:', error);
      // En caso de error, resetear a 0 para evitar valores inválidos
      setPedidosPendientes(0);
    }
  };

  // ✅ Limpiar contador cuando no hay usuario (cerró sesión)
  useEffect(() => {
    if (!usuario) {
      console.log('🧹 Usuario no existe, limpiando contador de pedidos');
      setPedidosPendientes(0);
      
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
      console.log('👤 Usuario emprendedor detectado, cargando pedidos iniciales');
      contarPedidosPendientes();
    }
  }, [usuario?.id]);

  // ✅ Recargar contador cada vez que la navegación cambie (para detectar cambios manuales)
  useFocusEffect(
    React.useCallback(() => {
      if (usuario) {
        console.log('🔄 BottomTabBar recibió foco, recargando contador de pedidos');
        contarPedidosPendientes();
      }
    }, [usuario])
  );

  // ✅ Conectar WebSocket y escuchar eventos en tiempo real
  useEffect(() => {
    if (!usuario) {
      console.log('❌ No hay usuario, WebSocket no se conecta');
      return;
    }

    console.log('🔌 Conectando WebSocket para contador de pedidos emprendedor:', usuario.id);
    
    const socket = io(env.WS_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado para contador de pedidos');
    });
    
    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado del contador');
    });

    // Escuchar NUEVOS pedidos (para el emprendedor)
    socket.on(`pedido:nuevo:${usuario.id}`, async (data) => {
      console.log('\n🔔 ===== NUEVO PEDIDO =====');
      console.log('📡 Evento recibido:', data);
      console.log('🔔 =========================\n');
      await contarPedidosPendientes();
    });

    // Escuchar CAMBIOS DE ESTADO (incluye rechazos, confirmaciones, etc.)
    socket.on(`pedido:estado:${usuario.id}`, async (data) => {
      console.log('\n🔔 ===== CAMBIO DE ESTADO =====');
      console.log('📡 Evento recibido:', data);
      console.log('📊 Estado anterior del contador:', pedidosPendientes);
      console.log('🔄 Recargando contador...');
      await contarPedidosPendientes();
      console.log('🔔 ==============================\n');
    });

    return () => {
      console.log('🔌 Limpieza: Desconectando WebSocket del contador');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [usuario?.id]);

  // Función para obtener el color del icono (todos blancos por ahora)
  const getIconColor = () => {
    return "white";
  };

  // Función para navegar limpiando el stack de memoria
  const navegarLimpiando = (nombrePantalla) => {
    console.log('🧹 Limpiando stack de navegación y navegando a:', nombrePantalla);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: nombrePantalla }],
      })
    );
  };

  return (
    <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={styles.tabBar}>
      {/* Pedidos Recibidos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navegarLimpiando('PedidosRecibidos')}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="cart" size={28} color={getIconColor()} />
          {pedidosPendientes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pedidosPendientes > 99 ? '99+' : String(pedidosPendientes || 0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.tabText}>Pedidos</Text>
      </TouchableOpacity>

      {/* Mis Emprendimientos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navegarLimpiando('Emprendimiento')}
      >
        <Ionicons name="briefcase" size={28} color={getIconColor()} />
        <Text style={styles.tabText}>Mi Negocio</Text>
      </TouchableOpacity>

      {/* Perfil */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navegarLimpiando('Perfil')}
      >
        <Ionicons name="person" size={28} color={getIconColor()} />
        <Text style={styles.tabText}>Perfil</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const BottomTabBarEmprendedorStyles = (theme) => StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "105%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: -10,
    borderTopColor: theme.border,
    backgroundColor: theme.primary,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default BottomTabBarEmprendedor;
