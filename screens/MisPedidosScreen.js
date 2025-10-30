import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const MisPedidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
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
  const [modalCancelacionVisible, setModalCancelacionVisible] = useState(false);
  const [pedidoParaCancelar, setPedidoParaCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');

  // Motivos predefinidos para cancelación
  const motivosCancelacion = [
    'Cambié de opinión',
    'Encontré mejor precio',
    'Problema con el horario',
    'Dirección incorrecta',
    'Problema con el método de pago',
    'Demora excesiva'
  ];

  // Función para obtener el logo de la empresa basado en el nombre del negocio
  const obtenerLogoEmpresa = (nombreNegocio) => {
    const logosEmpresas = {
      'Pizzeria Donatelo': require('../assets/donatelo.png'),
      'Grill Burger': require('../assets/grillburger_logo.jpg'),
      'Los Chinitos': require('../assets/loschinitos_logo.jpg'),
      'Maestro José': require('../assets/maestrojose_logo.jpeg'),
      'Pelucan': require('../assets/pelucan_logo.png'),
      'Gasfiter': require('../assets/gasfiter_logo.jpeg'),
    };
    
    return logosEmpresas[nombreNegocio] || null;
  };

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
      case 'preparando': return 'cutlery';
      case 'listo': return 'check';
      case 'en_camino': return 'truck';
      case 'entregado': return 'gift';
      case 'cerrado': return 'check-circle';
      case 'cancelado': return 'times-circle';
      default: return 'question-circle';
    }
  };

  // Renderizar ruta de estados tipo Salesforce
  const renderRutaEstados = (pedido) => {
    const estados = [
      { key: 'pendiente', label: 'Pendiente', icon: 'clock-o' },
      { key: 'confirmado', label: 'Confirmado', icon: 'check-circle' },
      { key: 'preparando', label: 'Preparando', icon: 'cutlery' },
      { key: 'listo', label: 'Listo', icon: 'check' },
      { key: 'entregado', label: 'Entregado', icon: 'gift' }
    ];

    const estadoActualIndex = estados.findIndex(estado => estado.key === pedido.estado);
    
    return (
      <View style={styles.rutaEstadosContainer}>
        {estados.map((estado, index) => {
          const isCompleted = index <= estadoActualIndex;
          const isCurrent = index === estadoActualIndex;
          
          return (
            <View key={estado.key} style={styles.estadoItem}>
              <View style={[
                styles.estadoIcono,
                isCompleted ? styles.estadoIconoCompletado : styles.estadoIconoPendiente,
                isCurrent && styles.estadoIconoActual
              ]}>
                <FontAwesome 
                  name={estado.icon} 
                  size={12} 
                  color={isCompleted ? "white" : "#bdc3c7"} 
                />
              </View>
              <Text style={[
                styles.estadoLabel,
                isCompleted ? styles.estadoLabelCompletado : styles.estadoLabelPendiente
              ]}>
                {estado.label}
              </Text>
              {index < estados.length - 1 && (
                <View style={[
                  styles.estadoLinea,
                  isCompleted ? styles.estadoLineaCompletada : styles.estadoLineaPendiente
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
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

  const cancelarPedido = (pedidoId) => {
    const pedido = pedidosPendientes.find(p => p.id === pedidoId);
    if (pedido) {
      setPedidoParaCancelar(pedido);
      setMotivoSeleccionado('');
      setMotivoPersonalizado('');
      setModalCancelacionVisible(true);
    }
  };

  const confirmarCancelacion = async () => {
    // Determinar el motivo final
    const motivoFinal = motivoSeleccionado === 'Otro' ? motivoPersonalizado : motivoSeleccionado;
    
    if (!motivoFinal.trim()) {
      Alert.alert('Motivo requerido', 'Por favor selecciona un motivo para cancelar el pedido.');
      return;
    }

    if (!pedidoParaCancelar) return;

    try {
      const pedidoCancelado = { 
        ...pedidoParaCancelar, 
        estado: 'cancelado', 
        motivoCancelacion: motivoFinal, 
        fechaCancelacion: new Date().toISOString() 
      };

      const pedidosActualizados = pedidosPendientes.map(p => 
        p.id === pedidoParaCancelar.id ? pedidoCancelado : p
      );
      
      setPedidosPendientes(pedidosActualizados);
      
      // Guardar pedidos pendientes (sin los cancelados)
      await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pedidosActualizados.filter(p => p.estado !== 'cancelado')));
      
      // Guardar pedido cancelado en historial del cliente
      const historialExistente = await AsyncStorage.getItem('historialPedidos');
      const historial = historialExistente ? JSON.parse(historialExistente) : [];
      historial.push(pedidoCancelado);
      await AsyncStorage.setItem('historialPedidos', JSON.stringify(historial));
      
      // Notificar al emprendedor: guardar en pedidos cancelados pendientes de confirmación
      const pedidosCanceladosPendientes = await AsyncStorage.getItem('pedidosCanceladosPendientes');
      const canceladosPendientes = pedidosCanceladosPendientes ? JSON.parse(pedidosCanceladosPendientes) : [];
      canceladosPendientes.push(pedidoCancelado);
      await AsyncStorage.setItem('pedidosCanceladosPendientes', JSON.stringify(canceladosPendientes));
      
      setModalCancelacionVisible(false);
      setPedidoParaCancelar(null);
      setMotivoSeleccionado('');
      setMotivoPersonalizado('');
      
      Alert.alert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente.');
    } catch (error) {
      console.log('Error al cancelar pedido:', error);
      Alert.alert('Error', 'No se pudo cancelar el pedido.');
    }
  };

  // Función para ordenar pedidos del más nuevo al más antiguo
  const ordenarPedidosPorFecha = (pedidos) => {
    return pedidos.sort((a, b) => {
      const fechaA = a.fechaHoraReserva ? new Date(a.fechaHoraReserva) : new Date(a.fecha);
      const fechaB = b.fechaHoraReserva ? new Date(b.fechaHoraReserva) : new Date(b.fecha);
      return fechaB - fechaA; // Más nuevo primero
    });
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

  const renderPedidoRechazado = (pedido) => {
    const logoEmpresa = obtenerLogoEmpresa(pedido.negocio);
    
    return (
      <View key={pedido.id} style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <View style={styles.negocioContainer}>
              {logoEmpresa ? (
                <Image source={logoEmpresa} style={styles.logoEmpresa} />
              ) : (
                <View style={styles.logoEmpresaPlaceholder}>
                  <FontAwesome name="store" size={16} color={currentTheme.primary} />
                </View>
              )}
              <Text style={[styles.pedidoNegocio, { color: currentTheme.text }]}>{pedido.negocio}</Text>
            </View>
            <Text style={[styles.pedidoFecha, { color: currentTheme.textSecondary }]}>
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
        <Text style={[styles.pedidoTotal, { color: currentTheme.primary }]}>Total: ${pedido.total.toLocaleString()}</Text>
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
  };

  const renderPedido = (pedido) => {
    const logoEmpresa = obtenerLogoEmpresa(pedido.negocio);
    
    return (
      <View key={pedido.id} style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <View style={styles.negocioContainer}>
              {logoEmpresa ? (
                <Image source={logoEmpresa} style={styles.logoEmpresa} />
              ) : (
                <View style={styles.logoEmpresaPlaceholder}>
                  <FontAwesome name="store" size={16} color={currentTheme.primary} />
                </View>
              )}
              <Text style={[styles.pedidoNegocio, { color: currentTheme.text }]}>{pedido.negocio}</Text>
            </View>
            <Text style={[styles.pedidoFecha, { color: currentTheme.textSecondary }]}>
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
        <Text style={[styles.pedidoTotal, { color: currentTheme.primary }]}>Total: ${pedido.total.toLocaleString('es-CL')}</Text>
        <Text style={[styles.pedidoDireccion, { color: currentTheme.textSecondary }]}>{pedido.direccion}</Text>
        {pedido.modoEntrega && (
          <View style={styles.modoEntregaContainer}>
            <FontAwesome 
              name={pedido.modoEntrega === "delivery" ? "truck" : "shopping-bag"} 
              size={14} 
              color={currentTheme.primary} 
            />
            <Text style={[styles.modoEntregaTexto, { color: currentTheme.primary }]}>
              {pedido.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
            </Text>
          </View>
        )}

        {pedido.estado === 'confirmado' && pedido.horaEntregaEstimada && (
          <View style={[styles.horaEntregaContainer, { backgroundColor: currentTheme.primary + '20' }]}>
            <FontAwesome name="clock-o" size={14} color={currentTheme.primary} />
            <Text style={[styles.horaEntregaTexto, { color: currentTheme.primary }]}>
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
          <Text style={[styles.productosTitulo, { color: currentTheme.text }]}>Productos:</Text>
          {pedido.productos.map((producto, index) => (
            <Text key={index} style={[styles.productoItem, { color: currentTheme.textSecondary }]}>
              • {producto.nombre} (x{producto.cantidad})
            </Text>
          ))}
        </View>
      )}

      {/* Ruta de Estados */}
      {tabActivo === 'pendientes' && renderRutaEstados(pedido)}
      
      {/* Botones de Acción */}
      {tabActivo === 'pendientes' && (
        <View style={styles.accionesContainerNuevaLinea}>
          {/* Botón Cancelar - Solo para estados Pendiente y Confirmado */}
          {(pedido.estado === 'pendiente' || pedido.estado === 'confirmado') && (
            <TouchableOpacity
              style={[styles.accionButtonNuevaLinea, { backgroundColor: '#e74c3c' }]}
              onPress={() => cancelarPedido(pedido.id)}
            >
              <FontAwesome name="times" size={16} color="white" />
              <Text style={styles.accionTextoNuevaLinea}>Cancelar Pedido</Text>
            </TouchableOpacity>
          )}
          
          {/* Botón Marcar Recibido - Solo para estado Entregado */}
          {pedido.estado === 'entregado' && (
            <TouchableOpacity
              style={[styles.accionButtonNuevaLinea, { backgroundColor: '#4CAF50' }]}
              onPress={() => marcarRecibido(pedido.id)}
            >
              <FontAwesome name="check" size={16} color="white" />
              <Text style={styles.accionTextoNuevaLinea}>Marcar Recibido</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      </View>
    );
  };

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
          <View style={[styles.modalCalificacionContent, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.modalCalificacionHeader}>
              <FontAwesome name="star" size={32} color="#FFD700" />
              <Text style={[styles.modalCalificacionTitulo, { color: currentTheme.text }]}>Califica tu experiencia</Text>
              <Text style={[styles.modalCalificacionSubtitulo, { color: currentTheme.textSecondary }]}>
                Ayúdanos a mejorar evaluando {pedidoParaCalificar?.negocio}
              </Text>
            </View>

            <ScrollView style={styles.modalCalificacionBody}>
              <View style={[styles.criterioCalificacion, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.criterioCalificacionLabel, { color: currentTheme.text }]}>💰 Precio</Text>
                <Text style={[styles.criterioCalificacionDescripcion, { color: currentTheme.textSecondary }]}>
                  ¿Qué tan justo consideras el precio?
                </Text>
                {renderEstrellasInteractivas('precio', calificacionesUsuario.precio)}
              </View>

              <View style={[styles.criterioCalificacion, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.criterioCalificacionLabel, { color: currentTheme.text }]}>⭐ Calidad</Text>
                <Text style={[styles.criterioCalificacionDescripcion, { color: currentTheme.textSecondary }]}>
                  ¿Cómo calificarías la calidad del producto/servicio?
                </Text>
                {renderEstrellasInteractivas('calidad', calificacionesUsuario.calidad)}
              </View>

              <View style={[styles.criterioCalificacion, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.criterioCalificacionLabel, { color: currentTheme.text }]}>👥 Servicio al Cliente</Text>
                <Text style={[styles.criterioCalificacionDescripcion, { color: currentTheme.textSecondary }]}>
                  ¿Cómo fue la atención y comunicación?
                </Text>
                {renderEstrellasInteractivas('servicio', calificacionesUsuario.servicio)}
              </View>

              <View style={[styles.criterioCalificacion, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.criterioCalificacionLabel, { color: currentTheme.text }]}>⏰ Tiempo de Entrega</Text>
                <Text style={[styles.criterioCalificacionDescripcion, { color: currentTheme.textSecondary }]}>
                  ¿Qué tan rápido fue el servicio?
                </Text>
                {renderEstrellasInteractivas('tiempoEntrega', calificacionesUsuario.tiempoEntrega)}
              </View>
            </ScrollView>

            <View style={styles.modalCalificacionFooter}>
              <TouchableOpacity
                style={[styles.modalCalificacionEnviar, { backgroundColor: currentTheme.primary }]}
                onPress={enviarCalificacion}
              >
                <FontAwesome name="check" size={16} color="white" />
                <Text style={styles.modalCalificacionEnviarTexto}>Enviar Calificación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cancelación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCancelacionVisible}
        onRequestClose={() => setModalCancelacionVisible(false)}
      >
        <View style={styles.modalCancelacionContainer}>
          <View style={[styles.modalCancelacionContent, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.modalCancelacionHeader}>
              <FontAwesome name="exclamation-triangle" size={32} color="#e74c3c" />
              <Text style={[styles.modalCancelacionTitulo, { color: currentTheme.text }]}>Cancelar Pedido</Text>
              <Text style={[styles.modalCancelacionSubtitulo, { color: currentTheme.textSecondary }]}>
                Selecciona el motivo de cancelación
              </Text>
            </View>
            
            <Text style={[styles.motivoLabel, { color: currentTheme.text }]}>Motivo de cancelación:</Text>
            
            <View style={styles.motivosContainer}>
              {motivosCancelacion.map((motivo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.motivoOption,
                    { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
                    motivoSeleccionado === motivo && [styles.motivoOptionSelected, { backgroundColor: currentTheme.primary + '20', borderColor: currentTheme.primary }]
                  ]}
                  onPress={() => setMotivoSeleccionado(motivo)}
                >
                  <View style={styles.motivoOptionContent}>
                    <View style={[
                      styles.motivoRadio,
                      { borderColor: currentTheme.border },
                      motivoSeleccionado === motivo && [styles.motivoRadioSelected, { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]
                    ]}>
                      {motivoSeleccionado === motivo && (
                        <FontAwesome name="check" size={12} color="white" />
                      )}
                    </View>
                    <Text style={[
                      styles.motivoOptionText,
                      { color: currentTheme.text },
                      motivoSeleccionado === motivo && [styles.motivoOptionTextSelected, { color: currentTheme.primary }]
                    ]}>
                      {motivo}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Input personalizado cuando se selecciona "Otro" */}
            {motivoSeleccionado === 'Otro' && (
              <View style={[styles.motivoPersonalizadoContainer, { borderTopColor: currentTheme.border }]}>
                <Text style={[styles.motivoPersonalizadoLabel, { color: currentTheme.text }]}>Especifica el motivo:</Text>
                <TextInput
                  style={[styles.motivoPersonalizadoInput, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe el motivo de cancelación..."
                  placeholderTextColor={currentTheme.textSecondary}
                  onChangeText={setMotivoPersonalizado}
                  value={motivoPersonalizado}
                />
              </View>
            )}

            <View style={styles.modalCancelacionFooter}>
              <TouchableOpacity
                style={styles.modalCancelacionCancelar}
                onPress={() => {
                  setModalCancelacionVisible(false);
                  setMotivoSeleccionado('');
                  setMotivoPersonalizado('');
                  setPedidoParaCancelar(null);
                }}
              >
                <Text style={styles.modalCancelacionCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalCancelacionConfirmar,
                  { backgroundColor: '#e74c3c' },
                  (!motivoSeleccionado || (motivoSeleccionado === 'Otro' && !motivoPersonalizado.trim())) && styles.modalCancelacionConfirmarDisabled
                ]}
                onPress={confirmarCancelacion}
                disabled={!motivoSeleccionado || (motivoSeleccionado === 'Otro' && !motivoPersonalizado.trim())}
              >
                <FontAwesome name="times" size={16} color="white" />
                <Text style={styles.modalCancelacionConfirmarTexto}>Confirmar Cancelación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
        <LinearGradient
          colors={[currentTheme.primary, currentTheme.secondary]}
          style={styles.headerGradient}
        >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Mis Pedidos</Text>
        </View>
      </LinearGradient>

      <View style={[styles.tabsContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'pendientes' && [styles.tabActivo, { backgroundColor: currentTheme.primary }]]}
          onPress={() => setTabActivo('pendientes')}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === 'pendientes' ? "white" : currentTheme.textSecondary }, tabActivo === 'pendientes' && styles.tabTextoActivo]}>
            Pendientes
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === 'pendientes' ? "rgba(255,255,255,0.3)" : currentTheme.primary + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === 'pendientes' ? "white" : currentTheme.primary }]}>
              {pedidosPendientes.length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'rechazados' && [styles.tabActivo, { backgroundColor: '#e74c3c' }]]}
          onPress={() => setTabActivo('rechazados')}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === 'rechazados' ? "white" : currentTheme.textSecondary }, tabActivo === 'rechazados' && styles.tabTextoActivo]}>
            Rechazados
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === 'rechazados' ? "rgba(255,255,255,0.3)" : '#e74c3c' + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === 'rechazados' ? "white" : '#e74c3c' }]}>
              {pedidosRechazadosPendientes.length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'historial' && [styles.tabActivo, { backgroundColor: currentTheme.primary }]]}
          onPress={() => setTabActivo('historial')}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === 'historial' ? "white" : currentTheme.textSecondary }, tabActivo === 'historial' && styles.tabTextoActivo]}>
            Historial
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === 'historial' ? "rgba(255,255,255,0.3)" : currentTheme.primary + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === 'historial' ? "white" : currentTheme.primary }]}>
              {pedidosCompletados.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollContainer, { backgroundColor: currentTheme.background }]} contentContainerStyle={styles.scrollContent}>
        {(() => {
          console.log('🔍 DEBUG - Tab activo:', tabActivo);
          console.log('🔍 DEBUG - pedidosRechazadosPendientes.length:', pedidosRechazadosPendientes.length);
          console.log('🔍 DEBUG - pedidosCompletados.length:', pedidosCompletados.length);
          return null;
        })()}
        
        {tabActivo === 'pendientes' ? (
          pedidosPendientes.length > 0 ? (
            ordenarPedidosPorFecha([...pedidosPendientes]).map(renderPedido)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="shopping-cart" size={48} color={currentTheme.textSecondary} />
              <Text style={[styles.emptyStateTexto, { color: currentTheme.textSecondary }]}>No tienes pedidos pendientes</Text>
            </View>
          )
        ) : tabActivo === 'rechazados' ? (
          pedidosRechazadosPendientes.length > 0 ? (
            (() => {
              console.log('🔍 DEBUG - Renderizando tab rechazados:', pedidosRechazadosPendientes.length, 'pedidos');
              console.log('❌ DEBUG - Datos:', pedidosRechazadosPendientes);
              return ordenarPedidosPorFecha([...pedidosRechazadosPendientes]).map(renderPedidoRechazado);
            })()
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="check-circle" size={48} color={currentTheme.primary} />
              <Text style={[styles.emptyStateTexto, { color: currentTheme.textSecondary }]}>No tienes pedidos rechazados pendientes</Text>
            </View>
          )
        ) : (
          pedidosCompletados.length > 0 ? (
            ordenarPedidosPorFecha([...pedidosCompletados]).map(renderPedido)
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="history" size={48} color={currentTheme.textSecondary} />
              <Text style={[styles.emptyStateTexto, { color: currentTheme.textSecondary }]}>No tienes pedidos en el historial</Text>
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
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  tabActivo: {
    backgroundColor: '#2A9D8F',
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    flexShrink: 1,
    textAlign: 'center',
  },
  tabTextoActivo: {
    color: 'white',
    fontWeight: '700',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeTexto: {
    fontSize: 11,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  negocioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoEmpresa: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  logoEmpresaPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pedidoNegocio: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pedidoFecha: {
    fontSize: 14,
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
    marginTop: 12,
    textAlign: 'center',
  },
  modalCalificacionSubtitulo: {
    fontSize: 16,
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
    borderRadius: 12,
  },
  criterioCalificacionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  criterioCalificacionDescripcion: {
    fontSize: 14,
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
  // Estilos para la ruta de estados
  rutaEstadosContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  estadoItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  estadoIcono: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  estadoIconoCompletado: {
    backgroundColor: "#27ae60",
  },
  estadoIconoPendiente: {
    backgroundColor: "#ecf0f1",
    borderWidth: 2,
    borderColor: "#bdc3c7",
  },
  estadoIconoActual: {
    backgroundColor: "#2A9D8F",
    borderWidth: 2,
    borderColor: "#2A9D8F",
  },
  estadoLabel: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  estadoLabelCompletado: {
    color: "#27ae60",
  },
  estadoLabelPendiente: {
    color: "#bdc3c7",
  },
  estadoLinea: {
    position: "absolute",
    top: 12,
    left: "50%",
    width: "100%",
    height: 2,
    zIndex: -1,
  },
  estadoLineaCompletada: {
    backgroundColor: "#27ae60",
  },
  estadoLineaPendiente: {
    backgroundColor: "#ecf0f1",
  },
  // Estilos para botones en nueva línea
  accionesContainerNuevaLinea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  accionButtonNuevaLinea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  accionTextoNuevaLinea: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Estilos para modal de cancelación
  modalCancelacionContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCancelacionContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  modalCancelacionHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalCancelacionTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 5,
  },
  modalCancelacionSubtitulo: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  motivoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  motivosContainer: {
    marginBottom: 20,
  },
  motivoOption: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  motivoOptionSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2A9D8F",
    borderWidth: 2,
  },
  motivoOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  motivoRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#bdc3c7",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  motivoRadioSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
  },
  motivoOptionText: {
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
  },
  motivoOptionTextSelected: {
    color: "#2A9D8F",
    fontWeight: "600",
  },
  motivoPersonalizadoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  motivoPersonalizadoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  motivoPersonalizadoInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 12,
    fontSize: 16,
    color: "#2c3e50",
    textAlignVertical: "top",
    minHeight: 80,
  },
  modalCancelacionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalCancelacionCancelar: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelacionCancelarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelacionConfirmar: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalCancelacionConfirmarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalCancelacionConfirmarDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
});

export default MisPedidosScreen;
