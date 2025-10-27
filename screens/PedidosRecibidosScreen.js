import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const PedidosRecibidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const usuario = route.params?.usuario ?? {};
  
  const [pedidosRecibidos, setPedidosRecibidos] = useState([]);
  const [tabActivo, setTabActivo] = useState("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [coordenadasDireccion, setCoordenadasDireccion] = useState(null);
  const [cargandoMapa, setCargandoMapa] = useState(false);

  useEffect(() => {
    cargarPedidosRecibidos();
  }, []);

  // Generar calificación aleatoria para el cliente
  const generarCalificacionCliente = () => {
    const calificaciones = [3.5, 4.0, 4.5, 5.0, 3.0, 4.5, 5.0, 4.0, 3.5, 4.5];
    return calificaciones[Math.floor(Math.random() * calificaciones.length)];
  };

  // Generar datos adicionales del cliente
  const generarDatosCliente = () => {
    const nombres = ['María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Pérez', 'Carmen López'];
    const telefonos = ['+56912345678', '+56987654321', '+56911223344', '+56999887766', '+56955443322'];
    const indices = Math.floor(Math.random() * nombres.length);
    
    return {
      nombre: nombres[indices],
      telefono: telefonos[indices],
      calificacion: generarCalificacionCliente(),
      pedidosRealizados: Math.floor(Math.random() * 20) + 1,
      clienteDesde: '2023-' + (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0') + '-15'
    };
  };

  // Calcular tiempo transcurrido desde la reserva
  const calcularTiempoTranscurrido = (fechaReserva) => {
    const ahora = new Date();
    const fechaPedido = new Date(fechaReserva);
    const diferencia = ahora - fechaPedido;
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
      return `${dias}d ${horas % 24}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else {
      return `${minutos}m`;
    }
  };

  // Obtener coordenadas de una dirección usando Google Geocoding
  const obtenerCoordenadasDireccion = async (direccion) => {
    try {
      setCargandoMapa(true);
      const API_KEY = 'AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4'; // API key de Google Maps
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const coordenadas = {
          latitude: location.lat,
          longitude: location.lng,
        };
        setCoordenadasDireccion(coordenadas);
        return coordenadas;
      } else {
        console.log('No se encontraron coordenadas para:', direccion);
        // Fallback: coordenadas del centro de Santiago
        const coordenadasFallback = {
          latitude: -33.4489,
          longitude: -70.6693,
        };
        setCoordenadasDireccion(coordenadasFallback);
        return coordenadasFallback;
      }
    } catch (error) {
      console.log('Error al obtener coordenadas:', error);
      // Fallback en caso de error
      const coordenadasFallback = {
        latitude: -33.4489,
        longitude: -70.6693,
      };
      setCoordenadasDireccion(coordenadasFallback);
      return coordenadasFallback;
    } finally {
      setCargandoMapa(false);
    }
  };

  const cargarPedidosRecibidos = async () => {
    try {
      setCargando(true);
      // Por ahora cargamos los mismos pedidos que hace el usuario como cliente
      // En una implementación real, esto vendría de una API específica para emprendedores
      const pedidosGuardados = await AsyncStorage.getItem('pedidosPendientes');
      if (pedidosGuardados) {
        const pedidos = JSON.parse(pedidosGuardados);
        // Simulamos que estos son pedidos recibidos por el emprendedor
        const pedidosConEstados = pedidos.map(pedido => {
          const datosCliente = generarDatosCliente();
          const fechaHoraReserva = new Date();
          fechaHoraReserva.setHours(fechaHoraReserva.getHours() - Math.floor(Math.random() * 48)); // Últimas 48 horas
          
          return {
            ...pedido,
            estado: pedido.estado || 'pendiente',
            fechaRecepcion: pedido.fechaRecepcion || pedido.fecha,
            fechaHoraReserva: fechaHoraReserva.toISOString(),
            cliente: datosCliente.nombre,
            telefonoCliente: datosCliente.telefono,
            calificacionCliente: datosCliente.calificacion,
            pedidosRealizadosCliente: datosCliente.pedidosRealizados,
            clienteDesde: datosCliente.clienteDesde
          };
        });
        setPedidosRecibidos(pedidosConEstados);
      }
    } catch (error) {
      console.log('Error al cargar pedidos recibidos:', error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const pedidosActualizados = pedidosRecibidos.map(pedido => {
        if (pedido.id === pedidoId) {
          return {
            ...pedido,
            estado: nuevoEstado,
            fechaActualizacion: new Date().toLocaleDateString('es-CL')
          };
        }
        return pedido;
      });
      
      setPedidosRecibidos(pedidosActualizados);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pedidosActualizados));
      
      Alert.alert(
        "Estado actualizado",
        `El pedido ha sido marcado como: ${getEstadoTexto(nuevoEstado)}`
      );
    } catch (error) {
      console.log('Error al actualizar estado:', error);
      Alert.alert("Error", "No se pudo actualizar el estado del pedido");
    }
  };

  const confirmarCambioEstado = (pedido, nuevoEstado) => {
    const mensaje = nuevoEstado === 'entregado' 
      ? "¿Confirmas que el pedido ha sido entregado al cliente?"
      : `¿Cambiar el estado del pedido a "${getEstadoTexto(nuevoEstado)}"?`;
    
    Alert.alert(
      "Confirmar cambio",
      mensaje,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => actualizarEstadoPedido(pedido.id, nuevoEstado)
        }
      ]
    );
  };

  const getEstadoTexto = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'preparando': 'En Preparación',
      'listo': 'Listo para Entrega',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': '#f39c12',
      'confirmado': '#3498db',
      'preparando': '#9b59b6',
      'listo': '#2ecc71',
      'entregado': '#27ae60',
      'cancelado': '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  };

  const getSiguienteEstado = (estadoActual) => {
    const flujoEstados = {
      'pendiente': 'confirmado',
      'confirmado': 'preparando',
      'preparando': 'listo',
      'listo': 'entregado'
    };
    return flujoEstados[estadoActual];
  };

  const obtenerPedidosFiltrados = () => {
    if (tabActivo === "pendientes") {
      return pedidosRecibidos.filter(pedido => 
        ['pendiente', 'confirmado', 'preparando', 'listo'].includes(pedido.estado)
      );
    } else {
      return pedidosRecibidos.filter(pedido => 
        ['entregado', 'cancelado'].includes(pedido.estado)
      );
    }
  };

  const renderPedido = (pedido) => {
    const fechaReserva = new Date(pedido.fechaHoraReserva);
    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fechaHoraReserva);
    
    return (
      <View key={pedido.id} style={styles.pedidoCard}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <Text style={styles.pedidoNegocio}>{pedido.negocio}</Text>
            <Text style={styles.pedidoFecha}>
              {fechaReserva.toLocaleDateString('es-CL')} - {fechaReserva.toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <View style={styles.tiempoContainer}>
              <FontAwesome name="clock-o" size={12} color="#e74c3c" />
              <Text style={styles.tiempoTexto}>Hace {tiempoTranscurrido}</Text>
            </View>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(pedido.estado) }]}>
            <Text style={styles.estadoTexto}>{getEstadoTexto(pedido.estado)}</Text>
          </View>
        </View>

      <View style={styles.pedidoDetalles}>
        <View style={styles.detalleItem}>
          <FontAwesome name="user" size={14} color="#2A9D8F" />
          <Text style={styles.detalleTexto}>Cliente: {pedido.cliente}</Text>
        </View>
        
        <View style={styles.detalleItem}>
          <FontAwesome name="phone" size={14} color="#2A9D8F" />
          <Text style={styles.detalleTexto}>{pedido.telefonoCliente}</Text>
        </View>

        <View style={styles.detalleItem}>
          <FontAwesome name="map-marker" size={14} color="#2A9D8F" />
          <Text style={styles.detalleTexto}>{pedido.direccion}</Text>
        </View>

        {pedido.modoEntrega && (
          <View style={styles.detalleItem}>
            <FontAwesome 
              name={pedido.modoEntrega === "delivery" ? "truck" : "shopping-bag"} 
              size={14} 
              color="#2A9D8F" 
            />
            <Text style={styles.detalleTexto}>
              {pedido.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.productosContainer}>
        <Text style={styles.productosTitulo}>Productos:</Text>
        {pedido.productos.map((producto, index) => (
          <View key={index} style={styles.productoItem}>
            <Text style={styles.productoTexto}>
              {producto.cantidad}x {producto.nombre} - ${producto.precio.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.pedidoFooter}>
        <Text style={styles.totalTexto}>Total: ${pedido.total.toLocaleString()}</Text>
        
        {tabActivo === "pendientes" && (
          <View style={styles.accionesContainer}>
            {getSiguienteEstado(pedido.estado) && (
              <TouchableOpacity
                style={[styles.accionButton, { backgroundColor: getEstadoColor(getSiguienteEstado(pedido.estado)) }]}
                onPress={() => confirmarCambioEstado(pedido, getSiguienteEstado(pedido.estado))}
              >
                <Text style={styles.accionTexto}>
                  {getSiguienteEstado(pedido.estado) === 'entregado' ? 'Marcar Entregado' : 'Siguiente Paso'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.detalleButton}
              onPress={async () => {
                setPedidoSeleccionado(pedido);
                await obtenerCoordenadasDireccion(pedido.direccion);
                setModalVisible(true);
              }}
            >
              <FontAwesome name="eye" size={16} color="#2A9D8F" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
    );
  };

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const estrellasCompletas = Math.floor(calificacion);
    const tieneMediaEstrella = calificacion % 1 !== 0;
    
    for (let i = 0; i < estrellasCompletas; i++) {
      estrellas.push(
        <FontAwesome key={i} name="star" size={16} color="#FFD700" />
      );
    }
    
    if (tieneMediaEstrella) {
      estrellas.push(
        <FontAwesome key="media" name="star-half-full" size={16} color="#FFD700" />
      );
    }
    
    const estrellasVacias = 5 - Math.ceil(calificacion);
    for (let i = 0; i < estrellasVacias; i++) {
      estrellas.push(
        <FontAwesome key={`vacia-${i}`} name="star-o" size={16} color="#DDD" />
      );
    }
    
    return estrellas;
  };

  const renderModalDetalle = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Detalle del Cliente</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setModalVisible(false);
                setMapaVisible(false);
              }}
            >
              <FontAwesome name="times" size={20} color="#2A9D8F" />
            </TouchableOpacity>
          </View>

          {pedidoSeleccionado && (
            <ScrollView style={styles.modalBody}>
              {/* Información del Cliente */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoTitulo}>Información del Cliente</Text>
                
                <View style={styles.clienteHeader}>
                  <View style={styles.clienteAvatar}>
                    <FontAwesome name="user" size={24} color="white" />
                  </View>
                  <View style={styles.clienteInfo}>
                    <Text style={styles.clienteNombre}>{pedidoSeleccionado.cliente}</Text>
                    <View style={styles.calificacionContainer}>
                      <View style={styles.estrellasContainer}>
                        {renderEstrellas(pedidoSeleccionado.calificacionCliente)}
                      </View>
                      <Text style={styles.calificacionTexto}>
                        {pedidoSeleccionado.calificacionCliente}/5
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.clienteStats}>
                  <View style={styles.statItem}>
                    <FontAwesome name="shopping-bag" size={14} color="#2A9D8F" />
                    <Text style={styles.statTexto}>{pedidoSeleccionado.pedidosRealizadosCliente} pedidos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FontAwesome name="calendar" size={14} color="#2A9D8F" />
                    <Text style={styles.statTexto}>Cliente desde {pedidoSeleccionado.clienteDesde}</Text>
                  </View>
                </View>
                
                <View style={styles.contactoContainer}>
                  <TouchableOpacity style={styles.contactoButton}>
                    <FontAwesome name="phone" size={16} color="white" />
                    <Text style={styles.contactoTexto}>Llamar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactoButton}>
                    <FontAwesome name="whatsapp" size={16} color="white" />
                    <Text style={styles.contactoTexto}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Información del Pedido */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoTitulo}>Detalles del Pedido</Text>
                <Text style={styles.modalInfoTexto}>Fecha: {new Date(pedidoSeleccionado.fechaHoraReserva).toLocaleDateString('es-CL')}</Text>
                <Text style={styles.modalInfoTexto}>Hora: {new Date(pedidoSeleccionado.fechaHoraReserva).toLocaleTimeString('es-CL')}</Text>
                <Text style={styles.modalInfoTexto}>Estado: {getEstadoTexto(pedidoSeleccionado.estado)}</Text>
                <Text style={styles.modalInfoTexto}>Dirección: {pedidoSeleccionado.direccion}</Text>
                <Text style={styles.modalInfoTexto}>Modo: {pedidoSeleccionado.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}</Text>
              </View>

              {/* Mapa */}
              <View style={styles.modalInfo}>
                <View style={styles.mapaHeader}>
                  <Text style={styles.modalInfoTitulo}>Ubicación de Entrega</Text>
                  <TouchableOpacity
                    style={styles.mapaToggleButton}
                    onPress={async () => {
                      if (!mapaVisible) {
                        await obtenerCoordenadasDireccion(pedidoSeleccionado.direccion);
                      }
                      setMapaVisible(!mapaVisible);
                    }}
                    disabled={cargandoMapa}
                  >
                    {cargandoMapa ? (
                      <ActivityIndicator size="small" color="#2A9D8F" />
                    ) : (
                      <FontAwesome name={mapaVisible ? "eye-slash" : "eye"} size={16} color="#2A9D8F" />
                    )}
                    <Text style={styles.mapaToggleTexto}>
                      {cargandoMapa ? "Cargando..." : mapaVisible ? "Ocultar" : "Ver"} Mapa
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {mapaVisible && coordenadasDireccion && (
                  <View style={styles.mapaContainer}>
                    <MapView
                      style={styles.mapa}
                      initialRegion={{
                        latitude: coordenadasDireccion.latitude,
                        longitude: coordenadasDireccion.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      }}
                      showsUserLocation={false}
                      showsMyLocationButton={false}
                    >
                      <Marker
                        coordinate={coordenadasDireccion}
                        title="📍 Dirección de Entrega"
                        description={pedidoSeleccionado.direccion}
                        pinColor="#2A9D8F"
                      />
                    </MapView>
                    <View style={styles.mapaInfo}>
                      <Text style={styles.mapaDireccionTexto}>
                        📍 {pedidoSeleccionado.direccion}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const pedidosFiltrados = obtenerPedidosFiltrados();

  return (
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <FontAwesome name="shopping-cart" size={24} color="white" />
            <Text style={styles.tituloPrincipal}>Pedidos Recibidos</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === "pendientes" && styles.tabActivo]}
          onPress={() => setTabActivo("pendientes")}
        >
          <Text style={[styles.tabTexto, tabActivo === "pendientes" && styles.tabTextoActivo]}>
            Pendientes ({pedidosRecibidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === "historial" && styles.tabActivo]}
          onPress={() => setTabActivo("historial")}
        >
          <Text style={[styles.tabTexto, tabActivo === "historial" && styles.tabTextoActivo]}>
            Historial ({pedidosRecibidos.filter(p => ['entregado', 'cancelado'].includes(p.estado)).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A9D8F" />
            <Text style={styles.loadingTexto}>Cargando pedidos...</Text>
          </View>
        ) : pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map(renderPedido)
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome name="shopping-cart" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>
              {tabActivo === "pendientes" ? "No hay pedidos pendientes" : "No hay pedidos en el historial"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tabActivo === "pendientes" 
                ? "Los pedidos de tus clientes aparecerán aquí" 
                : "Los pedidos completados aparecerán aquí"
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {renderModalDetalle()}
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 130, // Espacio para la barra inferior
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActivo: {
    backgroundColor: "#2A9D8F",
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  tabTextoActivo: {
    color: "white",
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingTexto: {
    marginTop: 15,
    fontSize: 16,
    color: "#7f8c8d",
  },
  pedidoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoNegocio: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  pedidoFecha: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  tiempoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tiempoTexto: {
    fontSize: 12,
    color: "#e74c3c",
    marginLeft: 4,
    fontWeight: "500",
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoTexto: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  pedidoDetalles: {
    marginBottom: 12,
  },
  detalleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detalleTexto: {
    marginLeft: 8,
    fontSize: 14,
    color: "#34495e",
  },
  productosContainer: {
    marginBottom: 12,
  },
  productosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  productoItem: {
    marginBottom: 4,
  },
  productoTexto: {
    fontSize: 14,
    color: "#34495e",
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 12,
  },
  totalTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  accionesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  accionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  accionTexto: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  detalleButton: {
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 22,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalInfo: {
    marginBottom: 20,
  },
  modalInfoTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A9D8F",
    marginBottom: 10,
  },
  modalInfoTexto: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 5,
  },
  modalProductoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  modalProductoTexto: {
    fontSize: 14,
    color: "#34495e",
    flex: 1,
  },
  modalProductoPrecio: {
    fontSize: 14,
    color: "#2A9D8F",
    fontWeight: "600",
  },
  modalTotalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 10,
    marginTop: 10,
  },
  modalTotalTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
    textAlign: "right",
  },
  // Nuevos estilos para el modal mejorado
  clienteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  clienteAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2A9D8F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  calificacionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  estrellasContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  calificacionTexto: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  clienteStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statTexto: {
    marginLeft: 6,
    fontSize: 14,
    color: "#34495e",
  },
  contactoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A9D8F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  contactoTexto: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  mapaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mapaToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
  },
  mapaToggleTexto: {
    marginLeft: 6,
    fontSize: 14,
    color: "#2A9D8F",
    fontWeight: "500",
  },
  mapaContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapa: {
    flex: 1,
  },
  mapaInfo: {
    backgroundColor: "white",
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  mapaDireccionTexto: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default PedidosRecibidosScreen;
