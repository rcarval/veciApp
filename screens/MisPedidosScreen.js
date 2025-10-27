import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const MisPedidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [pedidos, setPedidos] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [pedidosCompletados, setPedidosCompletados] = useState([]);
  const [pedidosRechazadosPendientes, setPedidosRechazadosPendientes] = useState([]);
  const [tabActivo, setTabActivo] = useState(route.params?.tabInicial || 'pendientes');
  const [modalCalificacionVisible, setModalCalificacionVisible] = useState(false);
  const [pedidoParaCalificar, setPedidoParaCalificar] = useState(null);
  const [calificacionesUsuario, setCalificacionesUsuario] = useState({
    precio: 0,
    calidad: 0,
    servicio: 0,
    tiempoEntrega: 0
  });

  useEffect(() => {
    cargarPedidos();
  }, []);

  // Recargar datos cuando la pantalla reciba el foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 MisPedidosScreen recibió foco, recargando datos...');
      cargarPedidos();
    }, [])
  );

  const cargarPedidos = async () => {
    try {
      const pedidosGuardados = await AsyncStorage.getItem('pedidosPendientes');
      const historialGuardado = await AsyncStorage.getItem('historialPedidos');
      const pedidosRechazadosGuardados = await AsyncStorage.getItem('pedidosRechazadosPendientes');
      
      console.log('🔍 DEBUG - Cargando pedidos:');
      console.log('📦 Pedidos pendientes:', pedidosGuardados ? JSON.parse(pedidosGuardados).length : 0);
      console.log('📚 Historial:', historialGuardado ? JSON.parse(historialGuardado).length : 0);
      console.log('❌ Rechazados pendientes:', pedidosRechazadosGuardados ? JSON.parse(pedidosRechazadosGuardados).length : 0);
      
      if (pedidosGuardados) {
        const pedidosPend = JSON.parse(pedidosGuardados);
        setPedidosPendientes(pedidosPend);
      }
      
      if (historialGuardado) {
        const pedidosHist = JSON.parse(historialGuardado);
        setPedidosCompletados(pedidosHist);
      }
      
      if (pedidosRechazadosGuardados) {
        const pedidosRechazados = JSON.parse(pedidosRechazadosGuardados);
        console.log('❌ DEBUG - Pedidos rechazados pendientes:', pedidosRechazados);
        setPedidosRechazadosPendientes(pedidosRechazados);
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
      case 'cerrado': return '#607D8B';
      case 'cancelado': return '#F44336';
      default: return '#757575';
    }
  };

  const obtenerEstadoIcono = (estado) => {
    switch (estado) {
      case 'pendiente': return 'clock-o';
      case 'confirmado': return 'check-circle';
      case 'en_camino': return 'truck';
      case 'entregado': return 'gift';
      case 'cerrado': return 'check-circle';
      case 'cancelado': return 'times-circle';
      default: return 'question-circle';
    }
  };

  const marcarRecibido = async (pedidoId) => {
    try {
      const pedidosActualizados = pedidosPendientes.map(pedido => 
        pedido.id === pedidoId ? { ...pedido, estado: 'cerrado' } : pedido
      );
      
      // Buscar el pedido a calificar (estado entregado)
      const pedidoParaCalificarObj = pedidosPendientes.find(p => p.id === pedidoId);
      if (pedidoParaCalificarObj && pedidoParaCalificarObj.estado === 'entregado') {
        setPedidoParaCalificar(pedidoParaCalificarObj);
        setModalCalificacionVisible(true);
      }
    } catch (error) {
      console.log('Error al marcar recibido:', error);
    }
  };

  // Función para manejar calificación de criterio
  const manejarCalificacionCriterio = (criterio, valor) => {
    setCalificacionesUsuario(prev => ({
      ...prev,
      [criterio]: valor
    }));
  };

  // Función para renderizar estrellas interactivas
  const renderEstrellasInteractivas = (criterio, valorActual) => {
    return (
      <View style={styles.estrellasInteractivas}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => manejarCalificacionCriterio(criterio, star)}
            style={styles.estrellaInteractiva}
          >
            <FontAwesome
              name={star <= valorActual ? "star" : "star-o"}
              size={24}
              color={star <= valorActual ? "#FFD700" : "#DDD"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Función para enviar calificación
  const enviarCalificacion = async () => {
    try {
      // Verificar que todos los criterios estén calificados
      const criteriosCalificados = Object.values(calificacionesUsuario).every(valor => valor > 0);
      
      if (!criteriosCalificados) {
        Alert.alert(
          "Calificación incompleta",
          "Por favor califica todos los criterios antes de enviar.",
          [{ text: "OK" }]
        );
        return;
      }

      // Calcular promedio general
      const promedioGeneral = Object.values(calificacionesUsuario).reduce((sum, valor) => sum + valor, 0) / 4;

      // Obtener calificaciones existentes o crear nuevas
      const calificacionesExistentes = await AsyncStorage.getItem(`calificaciones_${pedidoParaCalificar.negocioId || '1'}`);
      let calificacionesData;
      
      if (calificacionesExistentes) {
        calificacionesData = JSON.parse(calificacionesExistentes);
      } else {
        calificacionesData = {
          totalVotantes: 0,
          calificacionGeneral: 0,
          criterios: {
            precio: { promedio: 0, votantes: 0 },
            calidad: { promedio: 0, votantes: 0 },
            servicio: { promedio: 0, votantes: 0 },
            tiempoEntrega: { promedio: 0, votantes: 0 }
          }
        };
      }

      // Actualizar calificaciones
      const nuevasCalificaciones = {
        ...calificacionesData,
        totalVotantes: calificacionesData.totalVotantes + 1,
        calificacionGeneral: ((calificacionesData.calificacionGeneral * calificacionesData.totalVotantes) + promedioGeneral) / (calificacionesData.totalVotantes + 1),
        criterios: {
          precio: {
            promedio: ((calificacionesData.criterios.precio.promedio * calificacionesData.criterios.precio.votantes) + calificacionesUsuario.precio) / (calificacionesData.criterios.precio.votantes + 1),
            votantes: calificacionesData.criterios.precio.votantes + 1
          },
          calidad: {
            promedio: ((calificacionesData.criterios.calidad.promedio * calificacionesData.criterios.calidad.votantes) + calificacionesUsuario.calidad) / (calificacionesData.criterios.calidad.votantes + 1),
            votantes: calificacionesData.criterios.calidad.votantes + 1
          },
          servicio: {
            promedio: ((calificacionesData.criterios.servicio.promedio * calificacionesData.criterios.servicio.votantes) + calificacionesUsuario.servicio) / (calificacionesData.criterios.servicio.votantes + 1),
            votantes: calificacionesData.criterios.servicio.votantes + 1
          },
          tiempoEntrega: {
            promedio: ((calificacionesData.criterios.tiempoEntrega.promedio * calificacionesData.criterios.tiempoEntrega.votantes) + calificacionesUsuario.tiempoEntrega) / (calificacionesData.criterios.tiempoEntrega.votantes + 1),
            votantes: calificacionesData.criterios.tiempoEntrega.votantes + 1
          }
        }
      };

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(`calificaciones_${pedidoParaCalificar.negocioId || '1'}`, JSON.stringify(nuevasCalificaciones));
      
      // Mover el pedido a historial (pedido cerrado)
      const pedidoCerrado = {
        ...pedidoParaCalificar,
        estado: 'cerrado',
        fechaCalificacion: new Date().toISOString()
      };
      
      // Agregar a completados
      const historialActualizado = [...pedidosCompletados, pedidoCerrado];
      setPedidosCompletados(historialActualizado);
      await AsyncStorage.setItem('historialPedidos', JSON.stringify(historialActualizado));
      
      // Remover de pendientes
      const pendientesActualizados = pedidosPendientes.filter(p => p.id !== pedidoParaCalificar.id);
      setPedidosPendientes(pendientesActualizados);
      await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pendientesActualizados));
      
      // Cerrar modal y resetear estados
      setModalCalificacionVisible(false);
      setPedidoParaCalificar(null);
      setCalificacionesUsuario({
        precio: 0,
        calidad: 0,
        servicio: 0,
        tiempoEntrega: 0
      });

      Alert.alert(
        "¡Gracias!",
        "Tu calificación ha sido registrada exitosamente.",
        [{ text: "OK" }]
      );

    } catch (error) {
      console.log('Error al guardar calificación:', error);
      Alert.alert(
        "Error",
        "No se pudo guardar tu calificación. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    }
  };

  const confirmarRechazo = async (pedidoRechazado) => {
    try {
      // Mover pedido rechazado al historial del cliente
      const pedidoConRechazo = { 
        ...pedidoRechazado, 
        estado: 'rechazado', 
        fechaConfirmacionRechazo: new Date().toISOString() 
      };
      
      // Remover de pedidos rechazados pendientes
      const nuevosRechazadosPendientes = pedidosRechazadosPendientes.filter(p => p.id !== pedidoRechazado.id);
      setPedidosRechazadosPendientes(nuevosRechazadosPendientes);
      await AsyncStorage.setItem('pedidosRechazadosPendientes', JSON.stringify(nuevosRechazadosPendientes));
      
      // Agregar al historial del cliente (evitar duplicados)
      const historialExistente = await AsyncStorage.getItem('historialPedidos');
      const historial = historialExistente ? JSON.parse(historialExistente) : [];
      
      // Verificar que no esté ya en el historial
      const yaExiste = historial.some(p => p.id === pedidoRechazado.id);
      if (!yaExiste) {
        historial.push(pedidoConRechazo);
        await AsyncStorage.setItem('historialPedidos', JSON.stringify(historial));
        setPedidosCompletados(historial);
      }
      
      Alert.alert('Confirmado', 'Has confirmado el rechazo del pedido.');
    } catch (error) {
      console.log('Error al confirmar rechazo:', error);
      Alert.alert('Error', 'No se pudo confirmar el rechazo.');
    }
  };

  const renderPedidoRechazado = (pedido) => (
    <View key={pedido.id} style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNegocio}>{pedido.negocio}</Text>
          <Text style={styles.pedidoFecha}>
            {pedido.fechaHoraReserva 
              ? new Date(pedido.fechaHoraReserva).toLocaleDateString('es-CL') + ' ' + new Date(pedido.fechaHoraReserva).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              : pedido.fecha
            }
          </Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: '#e74c3c' }]}>
          <Text style={styles.estadoTexto}>Rechazado</Text>
        </View>
      </View>
      
      <View style={styles.pedidoDetalles}>
        <Text style={styles.pedidoTotal}>Total: ${pedido.total.toLocaleString()}</Text>
        <Text style={styles.motivoRechazo}>
          <Text style={styles.motivoLabel}>Motivo: </Text>
          {pedido.motivoRechazo}
        </Text>
        
        {pedido.horaEntregaEstimada && (
          <View style={styles.horaEntregaContainer}>
            <FontAwesome name="clock-o" size={14} color="#27ae60" />
            <Text style={styles.horaEntregaTexto}>
              Entrega estimada: {new Date(pedido.horaEntregaEstimada).toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} ({pedido.tiempoEntregaMinutos} min)
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.confirmarRechazoButton}
        onPress={() => confirmarRechazo(pedido)}
      >
        <FontAwesome name="check" size={16} color="white" />
        <Text style={styles.confirmarRechazoTexto}>Confirmar Rechazo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPedido = (pedido) => (
    <View key={pedido.id} style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoNegocio}>{pedido.negocio}</Text>
          <Text style={styles.pedidoFecha}>
            {pedido.fechaHoraReserva 
              ? new Date(pedido.fechaHoraReserva).toLocaleDateString('es-CL') + ' ' + new Date(pedido.fechaHoraReserva).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              : pedido.fecha
            }
          </Text>
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

        {pedido.estado === 'confirmado' && pedido.horaEntregaEstimada && (
          <View style={styles.horaEntregaContainer}>
            <FontAwesome name="clock-o" size={14} color="#27ae60" />
            <Text style={styles.horaEntregaTexto}>
              Entrega estimada: {new Date(pedido.horaEntregaEstimada).toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} ({pedido.tiempoEntregaMinutos} min)
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
      
      {tabActivo === 'pendientes' && pedido.estado === 'entregado' && (
        <View style={styles.accionesContainer}>
          <TouchableOpacity
            style={[styles.botonAccion, { backgroundColor: '#4CAF50' }]}
            onPress={() => marcarRecibido(pedido.id)}
          >
            <FontAwesome name="check" size={16} color="white" />
            <Text style={styles.botonAccionTexto}>Marcar Recibido</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <>
      {/* Modal de Calificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCalificacionVisible}
        onRequestClose={() => setModalCalificacionVisible(false)}
      >
        <View style={styles.modalCalificacionContainer}>
          <View style={styles.modalCalificacionContent}>
            <View style={styles.modalCalificacionHeader}>
              <FontAwesome name="star" size={32} color="#FFD700" />
              <Text style={styles.modalCalificacionTitulo}>Califica tu experiencia</Text>
              <Text style={styles.modalCalificacionSubtitulo}>
                Ayúdanos a mejorar evaluando {pedidoParaCalificar?.negocio}
              </Text>
            </View>

            <ScrollView style={styles.modalCalificacionBody}>
              <View style={styles.criterioCalificacion}>
                <Text style={styles.criterioCalificacionLabel}>💰 Precio</Text>
                <Text style={styles.criterioCalificacionDescripcion}>
                  ¿Qué tan justo consideras el precio?
                </Text>
                {renderEstrellasInteractivas('precio', calificacionesUsuario.precio)}
              </View>

              <View style={styles.criterioCalificacion}>
                <Text style={styles.criterioCalificacionLabel}>⭐ Calidad</Text>
                <Text style={styles.criterioCalificacionDescripcion}>
                  ¿Cómo calificarías la calidad del producto/servicio?
                </Text>
                {renderEstrellasInteractivas('calidad', calificacionesUsuario.calidad)}
              </View>

              <View style={styles.criterioCalificacion}>
                <Text style={styles.criterioCalificacionLabel}>👥 Servicio al Cliente</Text>
                <Text style={styles.criterioCalificacionDescripcion}>
                  ¿Cómo fue la atención y comunicación?
                </Text>
                {renderEstrellasInteractivas('servicio', calificacionesUsuario.servicio)}
              </View>

              <View style={styles.criterioCalificacion}>
                <Text style={styles.criterioCalificacionLabel}>⏰ Tiempo de Entrega</Text>
                <Text style={styles.criterioCalificacionDescripcion}>
                  ¿Qué tan rápido fue el servicio?
                </Text>
                {renderEstrellasInteractivas('tiempoEntrega', calificacionesUsuario.tiempoEntrega)}
              </View>
            </ScrollView>

            <View style={styles.modalCalificacionFooter}>
              <TouchableOpacity
                style={styles.modalCalificacionEnviar}
                onPress={enviarCalificacion}
              >
                <FontAwesome name="check" size={16} color="white" />
                <Text style={styles.modalCalificacionEnviarTexto}>Enviar Calificación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          style={[styles.tab, tabActivo === 'rechazados' && styles.tabActivo]}
          onPress={() => setTabActivo('rechazados')}
        >
          <FontAwesome name="exclamation-triangle" size={16} color={tabActivo === 'rechazados' ? '#e74c3c' : '#666'} />
          <Text style={[styles.tabTexto, tabActivo === 'rechazados' && styles.tabTextoActivo]}>
            Rechazados ({pedidosRechazadosPendientes.length})
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
        {(() => {
          console.log('🔍 DEBUG - Tab activo:', tabActivo);
          console.log('🔍 DEBUG - pedidosRechazadosPendientes.length:', pedidosRechazadosPendientes.length);
          console.log('🔍 DEBUG - pedidosCompletados.length:', pedidosCompletados.length);
          return null;
        })()}
        
        {tabActivo === 'pendientes' ? (
          pedidosPendientes.length > 0 ? (
            pedidosPendientes.map(renderPedido)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="shopping-cart" size={48} color="#ccc" />
              <Text style={styles.emptyStateTexto}>No tienes pedidos pendientes</Text>
            </View>
          )
        ) : tabActivo === 'rechazados' ? (
          pedidosRechazadosPendientes.length > 0 ? (
            (() => {
              console.log('🔍 DEBUG - Renderizando tab rechazados:', pedidosRechazadosPendientes.length, 'pedidos');
              console.log('❌ DEBUG - Datos:', pedidosRechazadosPendientes);
              return pedidosRechazadosPendientes.map(renderPedidoRechazado);
            })()
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="check-circle" size={48} color="#27ae60" />
              <Text style={styles.emptyStateTexto}>No tienes pedidos rechazados pendientes</Text>
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
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    paddingBottom: 130, // Espacio para la barra inferior
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
  horaEntregaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  horaEntregaTexto: {
    fontSize: 12,
    color: '#27ae60',
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
  // Estilos del modal de calificación
  modalCalificacionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalCalificacionContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalCalificacionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCalificacionTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  modalCalificacionSubtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  modalCalificacionBody: {
    marginBottom: 24,
  },
  modalCalificacionDescripcion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalCalificacionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCalificacionCancelar: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCalificacionCancelarTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCalificacionEnviar: {
    flex: 1,
    backgroundColor: '#2A9D8F',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalCalificacionEnviarTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Estilos adicionales para el modal de calificación
  criterioCalificacion: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  criterioCalificacionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  criterioCalificacionDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  estrellasInteractivas: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  estrellaInteractiva: {
    marginHorizontal: 4,
    padding: 4,
  },
  // Estilos para pedidos rechazados
  motivoRechazo: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 8,
    lineHeight: 20,
  },
  motivoLabel: {
    fontWeight: 'bold',
    color: '#c0392b',
  },
  confirmarRechazoButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  confirmarRechazoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MisPedidosScreen;
