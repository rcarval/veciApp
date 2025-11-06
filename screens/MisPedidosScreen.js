import React, { useState, useEffect, useCallback } from 'react';
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
import { useUser } from '../context/UserContext';
import pedidoService from '../services/pedidoService';
import io from 'socket.io-client';
import env from '../config/env';

const MisPedidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const { usuario } = useUser();
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

  // Función para cargar pedidos del backend
  const cargarPedidos = useCallback(async () => {
    try {
      console.log('🔍 DEBUG - Cargando pedidos desde el backend...');
      
      const response = await pedidoService.obtenerPedidos();
      
      if (response.ok && response.pedidos) {
        console.log(`✅ Pedidos cargados: ${response.pedidos.length}`);
        
        // Mapear los datos del backend al formato esperado por el frontend
        const pedidosMapeados = response.pedidos.map(pedido => ({
          id: pedido.id,
          negocio: pedido.emprendimiento_nombre || pedido.emprendimiento_id?.toString() || 'Mi Negocio',
          negocioId: pedido.emprendimiento_id, // Para guardar calificaciones
          fecha: pedido.created_at,
          fechaHoraReserva: pedido.created_at,
          estado: pedido.estado,
          total: parseFloat(pedido.total),
          productos: pedido.detalle || [],
          direccion: pedido.direccion_entrega,
          modoEntrega: pedido.modo_entrega,
          tiempoEntregaMinutos: pedido.tiempo_entrega_minutos,
          motivoCancelacion: pedido.motivo_rechazo,
          rechazo_confirmado: pedido.rechazo_confirmado || false,
          entrega_confirmada: pedido.entrega_confirmada || false,
          cancelacion_confirmada: pedido.cancelacion_confirmada || false, // Nuevo campo
        }));
        
        // Separar pedidos por estado
        // Pendientes: estados activos + entregados SIN confirmar
        const pendientes = pedidosMapeados.filter(p => 
          ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'].includes(p.estado) || 
          (p.estado === 'entregado' && !p.entrega_confirmada)
        );
        const rechazados = pedidosMapeados.filter(p => p.estado === 'rechazado');
        
        // Los rechazados/cancelados confirmados van al historial junto con entregados confirmados/cerrados
        const completados = pedidosMapeados.filter(p => 
          (p.estado === 'entregado' && p.entrega_confirmada) || 
          p.estado === 'cerrado' || 
          (p.estado === 'rechazado' && p.rechazo_confirmado) ||
          (p.estado === 'cancelado' && p.cancelacion_confirmada)
        );
        
        // Solo mostrar rechazados/cancelados NO confirmados en la pestaña rechazados
        const rechazadosPendientes = pedidosMapeados.filter(p => 
          (p.estado === 'rechazado' && !p.rechazo_confirmado) ||
          (p.estado === 'cancelado' && !p.cancelacion_confirmada)
        );
        
        console.log(`📦 Pendientes: ${pendientes.length}, Completados: ${completados.length}, Rechazados pendientes: ${rechazadosPendientes.length}`);
        
        setPedidosPendientes(pendientes);
        setPedidosCompletados(completados);
        setPedidosRechazadosPendientes(rechazadosPendientes);
      } else {
        console.log('⚠️ No se pudieron cargar pedidos');
        setPedidosPendientes([]);
        setPedidosCompletados([]);
        setPedidosRechazadosPendientes([]);
      }
    } catch (error) {
      console.log('❌ Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
      setPedidosPendientes([]);
      setPedidosCompletados([]);
      setPedidosRechazadosPendientes([]);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // Recargar datos cuando la pantalla reciba el foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 MisPedidosScreen recibió foco, recargando datos...');
      cargarPedidos();
    }, [cargarPedidos])
  );

  // Escuchar eventos WebSocket para cambios de estado
  useEffect(() => {
    if (!usuario?.id) return;

    console.log('🔌 Conectando WebSocket para MisPedidos...');
    const socket = io(env.WS_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado en MisPedidos');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado en MisPedidos');
    });

    // Escuchar cambios de estado de pedidos para el cliente
    socket.on(`pedido:estado:${usuario.id}`, (data) => {
      console.log('📡 Cambio de estado recibido via WebSocket en MisPedidos:', data);
      // Recargar la lista de pedidos
      cargarPedidos();
    });

    return () => {
      console.log('🔌 Desconectando WebSocket de MisPedidos...');
      socket.disconnect();
    };
  }, [usuario?.id, cargarPedidos]);

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
      console.log('✅ Marcando pedido como recibido:', pedidoId);
      
      // Buscar el pedido a calificar (estado entregado)
      const pedidoParaCalificarObj = pedidosPendientes.find(p => p.id === pedidoId);
      if (pedidoParaCalificarObj && pedidoParaCalificarObj.estado === 'entregado') {
        // Primero confirmar la entrega en el backend
        await pedidoService.confirmarEntrega(pedidoId);
        
        // Luego abrir el modal de calificación
        setPedidoParaCalificar(pedidoParaCalificarObj);
        setModalCalificacionVisible(true);
      }
    } catch (error) {
      console.log('❌ Error al marcar recibido:', error);
      Alert.alert('Error', 'No se pudo confirmar la entrega. Inténtalo de nuevo.');
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
      console.log('📤 Cancelando pedido:', pedidoParaCancelar.id, 'con motivo:', motivoFinal);
      
      // Llamar al backend para cambiar el estado a cancelado
      await pedidoService.cambiarEstadoPedido(pedidoParaCancelar.id, 'cancelado', motivoFinal);
      
      setModalCancelacionVisible(false);
      setPedidoParaCancelar(null);
      setMotivoSeleccionado('');
      setMotivoPersonalizado('');
      
      // Recargar pedidos desde el backend
      await cargarPedidos();
      
      Alert.alert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente.');
    } catch (error) {
      console.log('❌ Error al cancelar pedido:', error);
      Alert.alert('Error', error.message || 'No se pudo cancelar el pedido.');
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

      console.log('📤 Guardando calificación del emprendimiento en el backend...');
      
      // Guardar calificación en el backend
      await pedidoService.calificarEmprendimiento(pedidoParaCalificar.id, {
        precio: calificacionesUsuario.precio,
        calidad: calificacionesUsuario.calidad,
        servicio: calificacionesUsuario.servicio,
        tiempo_entrega: calificacionesUsuario.tiempoEntrega
      });
      
      // Cerrar modal y resetear estados
      setModalCalificacionVisible(false);
      setPedidoParaCalificar(null);
      setCalificacionesUsuario({
        precio: 0,
        calidad: 0,
        servicio: 0,
        tiempoEntrega: 0
      });
      
      // Recargar pedidos desde el backend
      await cargarPedidos();

      Alert.alert(
        "¡Gracias!",
        "Tu calificación ha sido registrada exitosamente.",
        [{ text: "OK" }]
      );

    } catch (error) {
      console.log('❌ Error al guardar calificación:', error);
      Alert.alert(
        "Error",
        error.message || "No se pudo guardar tu calificación. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    }
  };

  const confirmarRechazo = async (pedidoRechazado) => {
    try {
      console.log('✅ Confirmando rechazo del pedido:', pedidoRechazado.id);
      
      // Llamar al backend para marcar el rechazo como confirmado
      await pedidoService.confirmarRechazo(pedidoRechazado.id);
      
      // Recargar pedidos desde el backend
      await cargarPedidos();
      
      Alert.alert('Confirmado', 'El pedido rechazado ha sido movido al historial.');
    } catch (error) {
      console.log('❌ Error al confirmar rechazo:', error);
      Alert.alert('Error', error.message || 'No se pudo confirmar el rechazo.');
    }
  };

  const renderPedidoRechazado = (pedido) => {
    const logoEmpresa = obtenerLogoEmpresa(pedido.negocio);
    
    return (
      <View key={pedido.id} style={[styles.pedidoCardModerno, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <LinearGradient
          colors={['#e74c3c10', 'transparent']}
          style={styles.pedidoCardGradiente}
        >
          <View style={styles.pedidoHeaderModerno}>
            <View style={styles.logoNegocioModerno}>
              {logoEmpresa ? (
                <Image source={logoEmpresa} style={styles.logoEmpresaModerno} />
              ) : (
                <View style={[styles.logoEmpresaPlaceholderModerno, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Ionicons name="storefront" size={24} color={currentTheme.primary} />
                </View>
              )}
            </View>
            <View style={styles.pedidoInfoModerno}>
              <Text style={[styles.pedidoNegocioModerno, { color: currentTheme.text }]}>{pedido.negocio}</Text>
              <View style={styles.fechaContainer}>
                <Ionicons name="calendar-outline" size={12} color={currentTheme.textSecondary} />
                <Text style={[styles.pedidoFechaModerno, { color: currentTheme.textSecondary }]}>
                  {pedido.fechaHoraReserva 
                    ? new Date(pedido.fechaHoraReserva).toLocaleDateString('es-CL') + ' ' + new Date(pedido.fechaHoraReserva).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                    : pedido.fecha
                  }
                </Text>
              </View>
            </View>
            <View style={[styles.estadoBadgeModerno, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="close-circle" size={12} color="white" />
              <Text style={styles.estadoTextoModerno}>{pedido.estado === 'cancelado' ? 'Cancelado' : 'Rechazado'}</Text>
            </View>
          </View>
      
          <View style={styles.pedidoDetallesModerno}>
            <View style={styles.totalContainer}>
              <Ionicons name="cash-outline" size={18} color={currentTheme.primary} />
              <Text style={[styles.pedidoTotalModerno, { color: currentTheme.primary }]}>
                ${pedido.total.toLocaleString('es-CL')}
              </Text>
            </View>
            
            <View style={styles.motivoRechazoContainer}>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={[styles.motivoRechazoTexto, { color: currentTheme.text }]}>
                <Text style={styles.motivoLabelModerno}>Motivo: </Text>
                {pedido.motivoCancelacion}
              </Text>
            </View>
            
            {/* Mostrar botón de confirmar solo si no está confirmado */}
            {!pedido.cancelacion_confirmada && !pedido.rechazo_confirmado && (
              <TouchableOpacity 
                style={styles.confirmarRechazoButtonModerno}
                onPress={() => {
                  if (pedido.estado === 'cancelado') {
                    Alert.alert('Info', 'El emprendedor debe confirmar tu cancelación primero.');
                  } else {
                    confirmarRechazo(pedido);
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.confirmarRechazoGradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.confirmarRechazoTextoModerno}>
                    {pedido.estado === 'cancelado' ? 'Esperando confirmación' : 'Confirmar Rechazo'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPedido = (pedido) => {
    const logoEmpresa = obtenerLogoEmpresa(pedido.negocio);
    const estadoColor = obtenerEstadoColor(pedido.estado);
    
    return (
      <View key={pedido.id} style={[styles.pedidoCardModerno, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <LinearGradient
          colors={[estadoColor + '08', 'transparent']}
          style={styles.pedidoCardGradiente}
        >
          <View style={styles.pedidoHeaderModerno}>
            <View style={styles.logoNegocioModerno}>
              {logoEmpresa ? (
                <Image source={logoEmpresa} style={styles.logoEmpresaModerno} />
              ) : (
                <View style={[styles.logoEmpresaPlaceholderModerno, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Ionicons name="storefront" size={24} color={currentTheme.primary} />
                </View>
              )}
            </View>
            <View style={styles.pedidoInfoModerno}>
              <Text style={[styles.pedidoNegocioModerno, { color: currentTheme.text }]}>{pedido.negocio}</Text>
              <View style={styles.fechaContainer}>
                <Ionicons name="calendar-outline" size={12} color={currentTheme.textSecondary} />
                <Text style={[styles.pedidoFechaModerno, { color: currentTheme.textSecondary }]}>
                  {pedido.fechaHoraReserva 
                    ? new Date(pedido.fechaHoraReserva).toLocaleDateString('es-CL') + ' ' + new Date(pedido.fechaHoraReserva).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                    : pedido.fecha
                  }
                </Text>
              </View>
            </View>
            <View style={[styles.estadoBadgeModerno, { backgroundColor: estadoColor }]}>
              <FontAwesome name={obtenerEstadoIcono(pedido.estado)} size={12} color="white" />
              <Text style={styles.estadoTextoModerno}>{pedido.estado.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
      
          <View style={styles.pedidoDetallesModerno}>
            <View style={styles.totalContainer}>
              <Ionicons name="cash-outline" size={18} color={currentTheme.primary} />
              <Text style={[styles.pedidoTotalModerno, { color: currentTheme.primary }]}>
                ${pedido.total.toLocaleString('es-CL')}
              </Text>
            </View>
            
            <View style={styles.direccionContainer}>
              <Ionicons name="location-outline" size={14} color={currentTheme.textSecondary} />
              <Text style={[styles.pedidoDireccionModerno, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                {pedido.direccion}
              </Text>
            </View>
            
            {pedido.modoEntrega && (
              <View style={[styles.modoEntregaContainerModerno, { backgroundColor: currentTheme.primary + '15' }]}>
                <Ionicons 
                  name={pedido.modoEntrega === "delivery" ? "bicycle" : "bag-handle"} 
                  size={16} 
                  color={currentTheme.primary} 
                />
                <Text style={[styles.modoEntregaTextoModerno, { color: currentTheme.primary }]}>
                  {pedido.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
                </Text>
              </View>
            )}

            {pedido.estado === 'confirmado' && pedido.horaEntregaEstimada && (
              <View style={[styles.horaEntregaContainerModerno, { backgroundColor: '#27ae6015' }]}>
                <Ionicons name="timer-outline" size={16} color="#27ae60" />
                <Text style={styles.horaEntregaTextoModerno}>
                  Entrega: {new Date(pedido.horaEntregaEstimada).toLocaleTimeString('es-CL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} ({pedido.tiempoEntregaMinutos} min)
                </Text>
              </View>
            )}
          </View>
          
          {pedido.productos && (
            <View style={[styles.productosContainerModerno, { backgroundColor: currentTheme.background }]}>
              <View style={styles.productosTituloContainer}>
                <Ionicons name="cart-outline" size={16} color={currentTheme.primary} />
                <Text style={[styles.productosTituloModerno, { color: currentTheme.text }]}>Productos</Text>
              </View>
              {pedido.productos.map((producto, index) => (
                <View key={index} style={styles.productoItemContainer}>
                  <View style={styles.productoDot} />
                  <Text style={[styles.productoItemModerno, { color: currentTheme.text }]}>
                    {producto.nombre}
                  </Text>
                  <Text style={[styles.productoCantidad, { color: currentTheme.primary }]}>
                    x{producto.cantidad}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ruta de Estados */}
          {tabActivo === 'pendientes' && renderRutaEstados(pedido)}
          
          {/* Botones de Acción */}
          {tabActivo === 'pendientes' && (
            <View style={styles.accionesContainerModerno}>
              {/* Botón Cancelar - Solo para estados Pendiente y Confirmado */}
              {(pedido.estado === 'pendiente' || pedido.estado === 'confirmado') && (
                <TouchableOpacity
                  style={styles.accionButtonModerno}
                  onPress={() => cancelarPedido(pedido.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#e74c3c', '#c0392b']}
                    style={styles.accionButtonGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="close-circle" size={18} color="white" />
                    <Text style={styles.accionTextoModerno}>Cancelar Pedido</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {/* Botón Marcar Recibido - Solo para estado Entregado */}
              {pedido.estado === 'entregado' && (
                <TouchableOpacity
                  style={styles.accionButtonModerno}
                  onPress={() => marcarRecibido(pedido.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#27ae60']}
                    style={styles.accionButtonGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text style={styles.accionTextoModerno}>Marcar Recibido</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </LinearGradient>
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="receipt" size={28} color="white" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerSubtitle}>Historial de</Text>
              <Text style={styles.tituloPrincipal}>Mis Pedidos</Text>
            </View>
            <View style={styles.headerBadgeWrapper}>
              <View style={[styles.headerBadge, { backgroundColor: 'white' }]}>
                <Text style={[styles.headerBadgeText, { color: currentTheme.primary }]}>
                  {pedidosPendientes.length}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

      <View style={[styles.tabsContainer, { backgroundColor: currentTheme.background }]}>
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo('pendientes')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === 'pendientes' ? [currentTheme.primary, currentTheme.secondary] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={tabActivo === 'pendientes' ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === 'pendientes' ? "white" : currentTheme.textSecondary }
            ]}>
              Pendientes
            </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === 'pendientes' ? "rgba(255,255,255,0.25)" : currentTheme.primary + '15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === 'pendientes' ? "white" : currentTheme.primary }
              ]}>
                {pedidosPendientes.length}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo('rechazados')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === 'rechazados' ? ['#e74c3c', '#c0392b'] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={20} 
              color={tabActivo === 'rechazados' ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === 'rechazados' ? "white" : currentTheme.textSecondary }
            ]}>
              Rechazados
            </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === 'rechazados' ? "rgba(255,255,255,0.25)" : '#e74c3c15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === 'rechazados' ? "white" : '#e74c3c' }
              ]}>
                {pedidosRechazadosPendientes.length}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo('historial')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === 'historial' ? [currentTheme.primary, currentTheme.secondary] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="checkmark-done-outline" 
              size={20} 
              color={tabActivo === 'historial' ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === 'historial' ? "white" : currentTheme.textSecondary }
            ]}>
              Historial
            </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === 'historial' ? "rgba(255,255,255,0.25)" : currentTheme.primary + '15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === 'historial' ? "white" : currentTheme.primary }
              ]}>
                {pedidosCompletados.length}
              </Text>
            </View>
          </LinearGradient>
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
    paddingBottom: 130,
  },
  headerGradient: {
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadgeWrapper: {
    alignItems: 'center',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  tabModerno: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabGradiente: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 6,
    borderRadius: 16,
  },
  tabTextoModerno: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tabBadgeModerno: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabBadgeTextoModerno: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pedidoCardModerno: {
    borderRadius: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  pedidoCardGradiente: {
    padding: 18,
  },
  pedidoHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  logoNegocioModerno: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmpresaModerno: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  logoEmpresaPlaceholderModerno: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedidoInfoModerno: {
    flex: 1,
    gap: 6,
  },
  pedidoNegocioModerno: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pedidoFechaModerno: {
    fontSize: 13,
    fontWeight: '500',
  },
  estadoBadgeModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  estadoTextoModerno: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pedidoDetallesModerno: {
    gap: 12,
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedidoTotalModerno: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  direccionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pedidoDireccionModerno: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modoEntregaContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  modoEntregaTextoModerno: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  horaEntregaContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  horaEntregaTextoModerno: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productosContainerModerno: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  productosTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  productosTituloModerno: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  productoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A9D8F',
  },
  productoItemModerno: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  productoCantidad: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#2A9D8F15',
  },
  motivoRechazoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#e74c3c10',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  motivoRechazoTexto: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  motivoLabelModerno: {
    fontWeight: '700',
    color: '#e74c3c',
  },
  confirmarRechazoButtonModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmarRechazoGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmarRechazoTextoModerno: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  accionesContainerModerno: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  accionButtonModerno: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  accionButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  accionTextoModerno: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
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
