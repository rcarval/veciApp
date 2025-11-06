import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import env from '../config/env';
import pedidoService from '../services/pedidoService';

const BottomTabBarEmprendedor = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const styles = BottomTabBarEmprendedorStyles(currentTheme);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [usuarioId, setUsuarioId] = useState(null);

  // Función para contar pedidos pendientes
  const contarPedidosPendientes = async () => {
    try {
      const response = await pedidoService.obtenerPedidosRecibidos();
      
      if (response.ok && response.pedidos) {
        // Contar solo pedidos en estados pendientes (pendiente, confirmado, preparando, listo)
        const pendientes = response.pedidos.filter(p => 
          ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)
        ).length;
        
        setPedidosPendientes(pendientes);
        console.log(`📊 Pedidos pendientes: ${pendientes}`);
      }
    } catch (error) {
      console.error('❌ Error al contar pedidos pendientes:', error);
    }
  };

  // Cargar usuario y contar pedidos al iniciar
  useEffect(() => {
    const cargarUsuarioYPedidos = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuarioData = JSON.parse(usuarioGuardado);
          setUsuarioId(usuarioData.id);
          
          // Contar pedidos inicialmente
          await contarPedidosPendientes();
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      }
    };

    cargarUsuarioYPedidos();
  }, []);

  // Escuchar eventos WebSocket para actualizar contador en tiempo real
  useEffect(() => {
    if (!usuarioId) return;

    console.log('🔌 Conectando WebSocket para contador de pedidos...');
    const socket = io(env.WS_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado para contador de pedidos');
    });

    // Escuchar nuevos pedidos
    socket.on(`pedido:nuevo:${usuarioId}`, async (data) => {
      console.log('📡 Nuevo pedido recibido, actualizando contador...');
      await contarPedidosPendientes();
    });

    // Escuchar cambios de estado
    socket.on(`pedido:estado:${usuarioId}`, async (data) => {
      console.log('📡 Estado de pedido actualizado, actualizando contador...');
      await contarPedidosPendientes();
    });

    return () => {
      console.log('🔌 Desconectando WebSocket del contador...');
      socket.disconnect();
    };
  }, [usuarioId]);

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
                {pedidosPendientes > 99 ? '99+' : pedidosPendientes}
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
