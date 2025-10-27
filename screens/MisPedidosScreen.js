import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MisPedidosScreen = ({ navigation }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [pedidosCompletados, setPedidosCompletados] = useState([]);
  const [tabActivo, setTabActivo] = useState('pendientes');

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      const pedidosGuardados = await AsyncStorage.getItem('pedidosPendientes');
      const historialGuardado = await AsyncStorage.getItem('historialPedidos');
      
      if (pedidosGuardados) {
        const pedidosPend = JSON.parse(pedidosGuardados);
        setPedidosPendientes(pedidosPend);
      }
      
      if (historialGuardado) {
        const pedidosHist = JSON.parse(historialGuardado);
        setPedidosCompletados(pedidosHist);
      }
    } catch (error) {
      console.log('Error al cargar pedidos:', error);
    }
  };

  const obtenerEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#FFA000';
      case 'confirmado': return '#2196F3';
      case 'en_camino': return '#9C27B0';
      case 'entregado': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#757575';
    }
  };

  const obtenerEstadoIcono = (estado) => {
    switch (estado) {
      case 'pendiente': return 'clock-o';
      case 'confirmado': return 'check-circle';
      case 'en_camino': return 'truck';
      case 'entregado': return 'check-circle';
      case 'cancelado': return 'times-circle';
      default: return 'question-circle';
    }
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const pedidosActualizados = pedidosPendientes.map(pedido => 
        pedido.id === pedidoId ? { ...pedido, estado: nuevoEstado } : pedido
      );
      
      setPedidosPendientes(pedidosActualizados);
      await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pedidosActualizados));
      
      // Si se marca como entregado, mover a historial
      if (nuevoEstado === 'entregado') {
        const pedidoCompletado = pedidosActualizados.find(p => p.id === pedidoId);
        if (pedidoCompletado) {
          const historialActualizado = [...pedidosCompletados, pedidoCompletado];
          setPedidosCompletados(historialActualizado);
          await AsyncStorage.setItem('historialPedidos', JSON.stringify(historialActualizado));
          
          // Remover de pendientes
          const pendientesActualizados = pedidosActualizados.filter(p => p.id !== pedidoId);
          setPedidosPendientes(pendientesActualizados);
          await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pendientesActualizados));
        }
      }
    } catch (error) {
      console.log('Error al cambiar estado:', error);
    }
  };

  const renderPedido = (pedido) => (
    <View key={pedido.id} style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNegocio}>{pedido.negocio}</Text>
          <Text style={styles.pedidoFecha}>{pedido.fecha}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: obtenerEstadoColor(pedido.estado) }]}>
          <FontAwesome name={obtenerEstadoIcono(pedido.estado)} size={12} color="white" />
          <Text style={styles.estadoTexto}>{pedido.estado.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.pedidoDetalles}>
        <Text style={styles.pedidoTotal}>Total: ${pedido.total.toLocaleString('es-CL')}</Text>
        <Text style={styles.pedidoDireccion}>{pedido.direccion}</Text>
        {pedido.modoEntrega && (
          <View style={styles.modoEntregaContainer}>
            <FontAwesome 
              name={pedido.modoEntrega === "delivery" ? "truck" : "shopping-bag"} 
              size={14} 
              color="#2A9D8F" 
            />
            <Text style={styles.modoEntregaTexto}>
              {pedido.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
            </Text>
          </View>
        )}
      </View>
      
      {pedido.productos && (
        <View style={styles.productosContainer}>
          <Text style={styles.productosTitulo}>Productos:</Text>
          {pedido.productos.map((producto, index) => (
            <Text key={index} style={styles.productoItem}>
              • {producto.nombre} (x{producto.cantidad})
            </Text>
          ))}
        </View>
      )}
      
      {tabActivo === 'pendientes' && pedido.estado !== 'entregado' && (
        <View style={styles.accionesContainer}>
          <TouchableOpacity
            style={[styles.botonAccion, { backgroundColor: '#4CAF50' }]}
            onPress={() => cambiarEstadoPedido(pedido.id, 'entregado')}
          >
            <FontAwesome name="check" size={16} color="white" />
            <Text style={styles.botonAccionTexto}>Marcar Recibido</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.botonAccion, { backgroundColor: '#F44336' }]}
            onPress={() => cambiarEstadoPedido(pedido.id, 'cancelado')}
          >
            <FontAwesome name="times" size={16} color="white" />
            <Text style={styles.botonAccionTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={['#2A9D8F', '#1D7874']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Mis Pedidos</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'pendientes' && styles.tabActivo]}
          onPress={() => setTabActivo('pendientes')}
        >
          <FontAwesome name="clock-o" size={16} color={tabActivo === 'pendientes' ? '#2A9D8F' : '#666'} />
          <Text style={[styles.tabTexto, tabActivo === 'pendientes' && styles.tabTextoActivo]}>
            Pendientes ({pedidosPendientes.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'historial' && styles.tabActivo]}
          onPress={() => setTabActivo('historial')}
        >
          <FontAwesome name="history" size={16} color={tabActivo === 'historial' ? '#2A9D8F' : '#666'} />
          <Text style={[styles.tabTexto, tabActivo === 'historial' && styles.tabTextoActivo]}>
            Historial ({pedidosCompletados.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {tabActivo === 'pendientes' ? (
          pedidosPendientes.length > 0 ? (
            pedidosPendientes.map(renderPedido)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="shopping-cart" size={48} color="#ccc" />
              <Text style={styles.emptyStateTexto}>No tienes pedidos pendientes</Text>
            </View>
          )
        ) : (
          pedidosCompletados.length > 0 ? (
            pedidosCompletados.map(renderPedido)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="history" size={48} color="#ccc" />
              <Text style={styles.emptyStateTexto}>No tienes pedidos en el historial</Text>
            </View>
          )
        )}
      </ScrollView>

      <LinearGradient colors={['#2A9D8F', '#1D7874']} style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Home')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Ofertas')}
        >
          <Ionicons name="pricetag" size={24} color="white" />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Favoritos')}
        >
          <Ionicons name="heart" size={24} color="white" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Perfil')}
        >
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginLeft: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActivo: {
    backgroundColor: '#E8F4F3',
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  tabTextoActivo: {
    color: '#2A9D8F',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pedidoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoNegocio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoFecha: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  pedidoDetalles: {
    marginBottom: 12,
  },
  pedidoTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A9D8F',
  },
  pedidoDireccion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modoEntregaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F8F7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modoEntregaTexto: {
    fontSize: 12,
    color: '#2A9D8F',
    fontWeight: '600',
    marginLeft: 6,
  },
  productosContainer: {
    marginBottom: 12,
  },
  productosTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  productoItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  accionesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  botonAccionTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTexto: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: 120,
    width: '100%',
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#2A9D8F',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: 'white',
  },
});

export default MisPedidosScreen;
