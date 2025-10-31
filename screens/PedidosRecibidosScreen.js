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
  TextInput,
  Image,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import pedidoService from '../services/pedidoService';

const PedidosRecibidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const usuario = route.params?.usuario ?? {};
  
  const [pedidosRecibidos, setPedidosRecibidos] = useState([]);
  const [tabActivo, setTabActivo] = useState("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [coordenadasDireccion, setCoordenadasDireccion] = useState(null);
  const [cargandoMapa, setCargandoMapa] = useState(false);
  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [pedidoParaRechazar, setPedidoParaRechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [modalTiempoEntregaVisible, setModalTiempoEntregaVisible] = useState(false);
  const [pedidoParaConfirmar, setPedidoParaConfirmar] = useState(null);
  const [tiempoEntrega, setTiempoEntrega] = useState(30); // Valor por defecto: 30 minutos
  const [modalCalificacionClienteVisible, setModalCalificacionClienteVisible] = useState(false);
  const [pedidoParaCalificarCliente, setPedidoParaCalificarCliente] = useState(null);
  const [calificacionesCliente, setCalificacionesCliente] = useState({
    puntualidad: 0,
    comunicacion: 0,
    amabilidad: 0,
    cooperacion: 0
  });
  const [pedidosCanceladosPendientes, setPedidosCanceladosPendientes] = useState([]);
  const [modalCancelacionVisible, setModalCancelacionVisible] = useState(false);
  const [pedidoParaConfirmarCancelacion, setPedidoParaConfirmarCancelacion] = useState(null);
  const [calificacionClienteReal, setCalificacionClienteReal] = useState(null);

  // Opciones de tiempo de entrega
  const opcionesTiempo = [
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '1:00 hora', value: 60 },
    { label: '1:15 horas', value: 75 },
    { label: '1:30 horas', value: 90 },
    { label: '1:45 horas', value: 105 },
    { label: '2:00 horas', value: 120 },
  ];

  // Motivos predefinidos para rechazo
  const motivosRechazo = [
    'Producto agotado',
    'Fuera del área de cobertura',
    'Horario de atención cerrado',
    'Problema con el método de pago',
    'Cliente no responde',
    'Dirección incorrecta'
  ];

  // Criterios de calificación para el cliente
  const criteriosCliente = [
    { key: 'puntualidad', label: 'Puntualidad', icon: 'clock-o' },
    { key: 'comunicacion', label: 'Comunicación', icon: 'comment' },
    { key: 'amabilidad', label: 'Amabilidad', icon: 'heart' },
    { key: 'cooperacion', label: 'Cooperación', icon: 'users' }
  ];

  useEffect(() => {
    cargarPedidosRecibidos();
  }, []);

  // Función temporal para limpiar AsyncStorage (eliminar después de usar)
  const limpiarAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage limpiado completamente');
      Alert.alert('Éxito', 'Todos los datos han sido eliminados. La app se reiniciará.');
      // Recargar la pantalla
      cargarPedidosRecibidos();
    } catch (error) {
      console.log('❌ Error al limpiar AsyncStorage:', error);
      Alert.alert('Error', 'No se pudieron eliminar los datos');
    }
  };

  // Generar calificación aleatoria para el cliente
  const generarCalificacionCliente = () => {
    const calificaciones = [3.5, 4.0, 4.5, 5.0, 3.0, 4.5, 5.0, 4.0, 3.5, 4.5];
    return calificaciones[Math.floor(Math.random() * calificaciones.length)];
  };

  // Generar datos adicionales del cliente
  const generarDatosCliente = () => {
    const nombres = ['María González', 'Carlos Rodríguez', 'Ana Martínez', 'Luis Pérez', 'Carmen López'];
    const telefonos = ['+56912345678', '+56987654321', '+56911223344', '+56999887766', '+56955443322'];
    const fotosPerfil = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    ];
    const indices = Math.floor(Math.random() * nombres.length);
    
    return {
      nombre: nombres[indices],
      telefono: telefonos[indices],
      fotoPerfil: fotosPerfil[indices],
      calificacion: generarCalificacionCliente(),
      pedidosRealizados: Math.floor(Math.random() * 20) + 1,
      clienteDesde: '15-' + (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0') + '-2023'
    };
  };

  // Función para cargar calificación del cliente desde el backend
  const cargarCalificacionCliente = async (clienteId) => {
    try {
      console.log('📊 Cargando calificación del cliente:', clienteId);
      const response = await pedidoService.obtenerCalificacionCliente(clienteId);
      
      if (response.ok && response.calificacion) {
        console.log('✅ Calificación del cliente cargada:', response.calificacion);
        // Convertir calificación_promedio de string a number
        const calificacion = {
          ...response.calificacion,
          calificacion_promedio: parseFloat(response.calificacion.calificacion_promedio) || 0
        };
        setCalificacionClienteReal(calificacion);
      } else {
        console.log('⚠️ No se encontró calificación para el cliente');
        setCalificacionClienteReal(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar calificación del cliente:', error);
      setCalificacionClienteReal(null);
    }
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
      
      console.log('📥 Cargando pedidos recibidos desde el backend...');
      const response = await pedidoService.obtenerPedidosRecibidos();
      
      if (response.ok && response.pedidos) {
        console.log(`✅ Pedidos recibidos cargados: ${response.pedidos.length}`);
        
        // Mapear los datos del backend al formato esperado por el frontend
        const pedidosMapeados = response.pedidos.map(pedido => {
          // Generar datos adicionales del cliente solo si faltan datos del backend
          const datosCliente = generarDatosCliente();
          
          return {
            id: pedido.id,
            clienteId: pedido.usuario_id, // ID del cliente para cargar calificación
            negocio: pedido.emprendimiento_nombre || 'Mi Negocio',
            fecha: pedido.created_at,
            fechaHoraReserva: pedido.created_at,
            estado: pedido.estado,
            cliente: pedido.cliente_nombre || datosCliente.nombre,
            telefonoCliente: pedido.cliente_telefono || datosCliente.telefono,
            fotoPerfilCliente: pedido.cliente_avatar || datosCliente.fotoPerfil,
            pedidosRealizadosCliente: pedido.total_pedidos || 1, // Usar datos reales del backend
            clienteDesde: pedido.primera_compra ? new Date(pedido.primera_compra).toLocaleDateString('es-CL') : datosCliente.clienteDesde, // Usar fecha real del backend
            direccion: pedido.direccion_entrega,
            modoEntrega: pedido.modo_entrega,
            total: parseFloat(pedido.total),
            productos: pedido.detalle || [],
            tiempoEntregaMinutos: pedido.tiempo_entrega_minutos,
            motivoCancelacion: pedido.motivo_rechazo,
          };
        });
        
        setPedidosRecibidos(pedidosMapeados);
      } else {
        console.log('⚠️ No se pudieron cargar pedidos');
        setPedidosRecibidos([]);
      }
    } catch (error) {
      console.log('❌ Error al cargar pedidos recibidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos recibidos');
      setPedidosRecibidos([]);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      console.log(`📤 Actualizando estado del pedido ${pedidoId} a ${nuevoEstado}`);
      await pedidoService.cambiarEstadoPedido(pedidoId, nuevoEstado);
      
      // Recargar pedidos desde el backend
      await cargarPedidosRecibidos();
      
      Alert.alert(
        "Estado actualizado",
        `El pedido ha sido marcado como: ${getEstadoTexto(nuevoEstado)}`
      );
    } catch (error) {
      console.log('❌ Error al actualizar estado:', error);
      Alert.alert("Error", "No se pudo actualizar el estado del pedido");
    }
  };

  const confirmarCambioEstado = (pedido, nuevoEstado) => {
    if (nuevoEstado === 'confirmado') {
      // Abrir modal para ingresar tiempo de entrega
      setPedidoParaConfirmar(pedido);
      setModalTiempoEntregaVisible(true);
      return;
    }
    
    if (nuevoEstado === 'entregado') {
      // Abrir modal para calificar al cliente
      setPedidoParaCalificarCliente(pedido);
      setModalCalificacionClienteVisible(true);
      return;
    }
    
    const mensaje = `¿Cambiar el estado del pedido a "${getEstadoTexto(nuevoEstado)}"?`;
    
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

  const confirmarTiempoEntrega = async () => {
    if (!pedidoParaConfirmar) return;

    try {
      const tiempoEnMinutos = tiempoEntrega;
      const fechaActual = new Date();
      const horaEntregaEstimada = new Date(fechaActual.getTime() + (tiempoEnMinutos * 60000));
      
      console.log(`📤 Confirmando pedido ${pedidoParaConfirmar.id} con tiempo de entrega: ${tiempoEnMinutos} minutos`);
      await pedidoService.confirmarPedido(pedidoParaConfirmar.id, tiempoEnMinutos);
      
      setModalTiempoEntregaVisible(false);
      setPedidoParaConfirmar(null);
      setTiempoEntrega(30); // Resetear al valor por defecto
      
      // Recargar pedidos desde el backend
      await cargarPedidosRecibidos();
      
      const tiempoSeleccionado = opcionesTiempo.find(op => op.value === tiempoEnMinutos)?.label || `${tiempoEnMinutos} minutos`;
      
      Alert.alert(
        'Pedido confirmado', 
        `Pedido confirmado exitosamente.\nTiempo estimado: ${tiempoSeleccionado}\nHora estimada: ${horaEntregaEstimada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`
      );
    } catch (error) {
      console.log('❌ Error al confirmar tiempo de entrega:', error);
      Alert.alert('Error', 'No se pudo confirmar el pedido.');
    }
  };

  // Función para manejar calificación de criterio del cliente
  const manejarCalificacionCliente = (criterio, valor) => {
    setCalificacionesCliente(prev => ({
      ...prev,
      [criterio]: valor
    }));
  };

  // Función para renderizar estrellas de calificación del cliente
  const renderEstrellasCliente = (criterio, valor) => {
    return (
      <View style={styles.estrellasContainer}>
        {[1, 2, 3, 4, 5].map((estrella) => (
          <TouchableOpacity
            key={estrella}
            onPress={() => manejarCalificacionCliente(criterio, estrella)}
            style={styles.estrellaButton}
          >
            <FontAwesome
              name={estrella <= valor ? "star" : "star-o"}
              size={20}
              color={estrella <= valor ? "#FFD700" : "#ddd"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Función para guardar calificación del cliente
  const guardarCalificacionCliente = async () => {
    if (!pedidoParaCalificarCliente) return;

    const calificacionPromedio = Object.values(calificacionesCliente).reduce((sum, val) => sum + val, 0) / 4;
    
    try {
      // Primero marcar como entregado
      console.log(`📤 Marcando pedido ${pedidoParaCalificarCliente.id} como entregado`);
      await pedidoService.cambiarEstadoPedido(pedidoParaCalificarCliente.id, 'entregado');
      
      // Guardar calificación del cliente en el backend
      console.log(`📤 Guardando calificación del cliente para pedido ${pedidoParaCalificarCliente.id}`);
      await pedidoService.calificarCliente(pedidoParaCalificarCliente.id, calificacionesCliente);
      
      // Recargar pedidos desde el backend
      await cargarPedidosRecibidos();
      
      Alert.alert('Calificación Guardada', 'La calificación del cliente ha sido guardada exitosamente.');
      
      setModalCalificacionClienteVisible(false);
      setPedidoParaCalificarCliente(null);
      setCalificacionesCliente({
        puntualidad: 0,
        comunicacion: 0,
        amabilidad: 0,
        cooperacion: 0
      });
    } catch (error) {
      console.log('❌ Error al guardar calificación:', error);
      Alert.alert('Error', 'No se pudo guardar la calificación.');
    }
  };

  const getEstadoTexto = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'preparando': 'En Preparación',
      'listo': 'Listo para Entrega',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado'
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
      'cancelado': '#e74c3c',
      'rechazado': '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  };

  const abrirModalRechazo = (pedido) => {
    setPedidoParaRechazar(pedido);
    setMotivoSeleccionado('');
    setMotivoPersonalizado('');
    setModalRechazoVisible(true);
  };

  const confirmarRechazo = async () => {
    // Determinar el motivo final
    const motivoFinal = motivoSeleccionado === 'Otro' ? motivoPersonalizado : motivoSeleccionado;
    
    if (!motivoFinal.trim()) {
      Alert.alert('Motivo requerido', 'Por favor selecciona un motivo para rechazar el pedido.');
      return;
    }

    if (!pedidoParaRechazar) return;

    try {
      console.log(`📤 Rechazando pedido ${pedidoParaRechazar.id} con motivo: ${motivoFinal}`);
      await pedidoService.cambiarEstadoPedido(pedidoParaRechazar.id, 'rechazado', motivoFinal);
      
      setModalRechazoVisible(false);
      setPedidoParaRechazar(null);
      setMotivoRechazo('');
      
      // Recargar pedidos desde el backend
      await cargarPedidosRecibidos();
      
      Alert.alert('Pedido rechazado', 'El pedido ha sido rechazado exitosamente.');
    } catch (error) {
      console.log('❌ Error al rechazar pedido:', error);
      Alert.alert('Error', 'No se pudo rechazar el pedido.');
    }
  };

  const confirmarCancelacion = async (pedido) => {
    try {
      // Simplemente recargar datos desde el backend
      await cargarPedidosRecibidos();
      
      Alert.alert('Cancelación confirmada', 'La cancelación del pedido ha sido confirmada.');
    } catch (error) {
      console.log('❌ Error al confirmar cancelación:', error);
      Alert.alert('Error', 'No se pudo confirmar la cancelación.');
    }
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

  const obtenerPedidosFiltrados = () => {
    let pedidosFiltrados = [];
    
    if (tabActivo === "pendientes") {
      pedidosFiltrados = pedidosRecibidos.filter(pedido => 
        ['pendiente', 'confirmado', 'preparando', 'listo'].includes(pedido.estado)
      );
    } else if (tabActivo === "cancelados") {
      // Filtrar solo pedidos cancelados que tengan motivo de cancelación
      pedidosFiltrados = pedidosRecibidos.filter(pedido => 
        pedido.estado === 'cancelado' && pedido.motivoCancelacion
      );
    } else {
      // Historial: solo entregados y rechazados, excluyendo cancelados
      pedidosFiltrados = pedidosRecibidos.filter(pedido => 
        ['entregado', 'rechazado'].includes(pedido.estado) && pedido.estado !== 'cancelado'
      );
    }
    
    // Ordenar del más nuevo al más antiguo por fechaHoraReserva
    return pedidosFiltrados.sort((a, b) => {
      const fechaA = a.fechaHoraReserva ? new Date(a.fechaHoraReserva) : new Date(a.fecha);
      const fechaB = b.fechaHoraReserva ? new Date(b.fechaHoraReserva) : new Date(b.fecha);
      return fechaB - fechaA; // Más nuevo primero
    });
  };

  const renderPedido = (pedido) => {
    const fechaReserva = new Date(pedido.fechaHoraReserva);
    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fechaHoraReserva);
    
    // Formatear fecha y hora usando el timestamp local
    const dia = fechaReserva.getDate();
    const mes = fechaReserva.getMonth() + 1;
    const año = fechaReserva.getFullYear();
    const horas = fechaReserva.getHours();
    const minutos = fechaReserva.getMinutes();
    
    const fechaFormateada = `${dia.toString().padStart(2, '0')}-${mes.toString().padStart(2, '0')}-${año}`;
    const horaFormateada = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    
    return (
      <View key={pedido.id} style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoInfo}>
            <Text style={[styles.pedidoNegocio, { color: currentTheme.text }]}>{pedido.negocio}</Text>
            <Text style={[styles.pedidoFecha, { color: currentTheme.textSecondary }]}>
              {fechaFormateada} - {horaFormateada}
            </Text>
            <View style={styles.tiempoContainer}>
              <FontAwesome name="clock-o" size={12} color="#e74c3c" />
              <Text style={[styles.tiempoTexto, { color: "#e74c3c" }]}>Hace {tiempoTranscurrido}</Text>
            </View>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(pedido.estado) }]}>
            <Text style={styles.estadoTexto}>{getEstadoTexto(pedido.estado)}</Text>
          </View>
        </View>

      <View style={styles.pedidoDetalles}>
        <View style={styles.detalleItem}>
          <FontAwesome name="user" size={14} color={currentTheme.primary} />
          <Text style={[styles.detalleTexto, { color: currentTheme.text }]}>Cliente: {pedido.cliente}</Text>
        </View>
        
        <View style={styles.detalleItem}>
          <FontAwesome name="phone" size={14} color={currentTheme.primary} />
          <Text style={[styles.detalleTexto, { color: currentTheme.text }]}>{pedido.telefonoCliente}</Text>
        </View>

        <View style={styles.detalleItem}>
          <FontAwesome name="map-marker" size={14} color={currentTheme.primary} />
          <Text style={[styles.detalleTexto, { color: currentTheme.text }]}>{pedido.direccion}</Text>
        </View>

        {pedido.modoEntrega && (
          <View style={styles.detalleItem}>
            <FontAwesome 
              name={pedido.modoEntrega === "delivery" ? "truck" : "shopping-bag"} 
              size={14} 
              color={currentTheme.primary} 
            />
            <Text style={[styles.detalleTexto, { color: currentTheme.text }]}>
              {pedido.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
            </Text>
          </View>
        )}

        {pedido.estado === 'confirmado' && pedido.tiempoEntregaMinutos && (
          <View style={[styles.detalleItem, { backgroundColor: currentTheme.primary + '20' }]}>
            <FontAwesome name="clock-o" size={14} color={currentTheme.primary} />
            <Text style={[styles.detalleTexto, { color: currentTheme.primary }]}>
              Entrega estimada: {pedido.tiempoEntregaMinutos} minutos
            </Text>
          </View>
        )}
      </View>

      {/* Mostrar motivo de cancelación si está en la pestaña cancelados */}
      {tabActivo === "cancelados" && pedido.motivoCancelacion && (
        <View style={styles.motivoCancelacionContainer}>
          <Text style={styles.motivoCancelacionLabel}>Motivo de cancelación:</Text>
          <Text style={styles.motivoCancelacionTexto}>{pedido.motivoCancelacion}</Text>
        </View>
      )}

      <View style={styles.productosContainer}>
        <Text style={styles.productosTitulo}>Productos:</Text>
        {pedido.productos.map((producto, index) => (
          <View key={index} style={styles.productoItem}>
            <Text style={styles.productoTexto}>
              {producto.cantidad}x {producto.nombre} - ${producto.subtotal?.toLocaleString() || producto.precio?.toLocaleString() || 'N/A'}
            </Text>
          </View>
        ))}
      </View>

      {/* Ruta de Estados */}
      {tabActivo === "pendientes" && renderRutaEstados(pedido)}

      <View style={styles.pedidoFooter}>
        <Text style={styles.totalTexto}>Total: ${pedido.total.toLocaleString()}</Text>
        
        <TouchableOpacity
          style={styles.detalleButton}
          onPress={async () => {
            setPedidoSeleccionado(pedido);
            // Cargar calificación del cliente desde el backend
            await cargarCalificacionCliente(pedido.clienteId);
            await obtenerCoordenadasDireccion(pedido.direccion);
            setModalVisible(true);
          }}
        >
          <FontAwesome name="eye" size={16} color={currentTheme.primary} />
        </TouchableOpacity>
      </View>

      {/* Botones de Acción en nueva línea */}
      {tabActivo === "pendientes" && (
        <View style={styles.accionesContainerNuevaLinea}>
          {getSiguienteEstado(pedido.estado) && (
            <TouchableOpacity
              style={[styles.accionButtonNuevaLinea, { backgroundColor: getEstadoColor(getSiguienteEstado(pedido.estado)) }]}
              onPress={() => confirmarCambioEstado(pedido, getSiguienteEstado(pedido.estado))}
            >
              <FontAwesome name={getSiguienteEstado(pedido.estado) === 'entregado' ? 'gift' : 'arrow-right'} size={16} color="white" />
              <Text style={styles.accionTextoNuevaLinea}>
                {getSiguienteEstado(pedido.estado) === 'entregado' ? 'Marcar Entregado' : 'Siguiente Paso'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.accionButtonNuevaLinea, { backgroundColor: '#e74c3c' }]}
            onPress={() => abrirModalRechazo(pedido)}
          >
            <FontAwesome name="times" size={16} color="white" />
            <Text style={styles.accionTextoNuevaLinea}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de confirmación para pedidos cancelados */}
      {tabActivo === "cancelados" && (
        <View style={styles.accionesContainerNuevaLinea}>
          <TouchableOpacity
            style={[styles.accionButtonNuevaLinea, { backgroundColor: '#27ae60' }]}
            onPress={() => confirmarCancelacion(pedido)}
          >
            <FontAwesome name="check" size={16} color="white" />
            <Text style={styles.accionTextoNuevaLinea}>Confirmar Cancelación</Text>
          </TouchableOpacity>
        </View>
      )}
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
                setCalificacionClienteReal(null); // Limpiar calificación al cerrar
              }}
            >
              <FontAwesome name="times" size={20} color={currentTheme.primary} />
            </TouchableOpacity>
          </View>

          {pedidoSeleccionado && (
            <ScrollView style={styles.modalBody}>
              {/* Información del Cliente */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoTitulo}>Información del Cliente</Text>
                
                <View style={styles.clienteHeader}>
                  {pedidoSeleccionado.fotoPerfilCliente ? (
                    <Image 
                      source={{ uri: pedidoSeleccionado.fotoPerfilCliente }} 
                      style={styles.clienteAvatarImagen}
                    />
                  ) : (
                    <View style={styles.clienteAvatar}>
                      <FontAwesome name="user" size={24} color="white" />
                    </View>
                  )}
                  <View style={styles.clienteInfo}>
                    <Text style={styles.clienteNombre}>{pedidoSeleccionado.cliente}</Text>
                    <View style={styles.calificacionContainer}>
                      {calificacionClienteReal && calificacionClienteReal.calificacion_promedio > 0 ? (
                        <>
                          <View style={styles.estrellasContainer}>
                            {renderEstrellas(calificacionClienteReal.calificacion_promedio)}
                          </View>
                          <Text style={styles.calificacionTexto}>
                            {calificacionClienteReal.calificacion_promedio.toFixed(1)}/5
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.calificacionTexto}>
                          Sin calificaciones
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.clienteStats}>
                  <View style={styles.statItem}>
                    <FontAwesome name="shopping-bag" size={14} color={currentTheme.primary} />
                    <Text style={styles.statTexto}>{pedidoSeleccionado.pedidosRealizadosCliente} pedidos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FontAwesome name="calendar" size={14} color={currentTheme.primary} />
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
                {(() => {
                  const fechaModal = new Date(pedidoSeleccionado.fechaHoraReserva);
                  const diaModal = fechaModal.getDate();
                  const mesModal = fechaModal.getMonth() + 1;
                  const añoModal = fechaModal.getFullYear();
                  const horasModal = fechaModal.getHours();
                  const minutosModal = fechaModal.getMinutes();
                  const fechaFormateadaModal = `${diaModal.toString().padStart(2, '0')}-${mesModal.toString().padStart(2, '0')}-${añoModal}`;
                  const horaFormateadaModal = `${horasModal.toString().padStart(2, '0')}:${minutosModal.toString().padStart(2, '0')}`;
                  
                  return (
                    <>
                      <Text style={styles.modalInfoTexto}>Fecha: {fechaFormateadaModal}</Text>
                      <Text style={styles.modalInfoTexto}>Hora: {horaFormateadaModal}</Text>
                    </>
                  );
                })()}
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
                      <ActivityIndicator size="small" color={currentTheme.primary} />
                    ) : (
                      <FontAwesome name={mapaVisible ? "eye-slash" : "eye"} size={16} color={currentTheme.primary} />
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
                        pinColor={currentTheme.primary}
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
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
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

      {/* Tabs Optimizados */}
      <View style={[styles.tabsContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === "pendientes" && [styles.tabActivo, { backgroundColor: currentTheme.primary }]]}
          onPress={() => setTabActivo("pendientes")}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === "pendientes" ? "white" : currentTheme.textSecondary }, tabActivo === "pendientes" && styles.tabTextoActivo]}>
            Pendientes
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === "pendientes" ? "rgba(255,255,255,0.3)" : currentTheme.primary + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === "pendientes" ? "white" : currentTheme.primary }]}>
              {pedidosRecibidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)).length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === "cancelados" && [styles.tabActivo, { backgroundColor: '#e74c3c' }]]}
          onPress={() => setTabActivo("cancelados")}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === "cancelados" ? "white" : currentTheme.textSecondary }, tabActivo === "cancelados" && styles.tabTextoActivo]}>
            Cancelados
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === "cancelados" ? "rgba(255,255,255,0.3)" : '#e74c3c' + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === "cancelados" ? "white" : '#e74c3c' }]}>
              {pedidosRecibidos.filter(p => p.estado === 'cancelado' && p.motivoCancelacion).length}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tabActivo === "historial" && [styles.tabActivo, { backgroundColor: currentTheme.primary }]]}
          onPress={() => setTabActivo("historial")}
        >
          <Text style={[styles.tabTexto, { color: tabActivo === "historial" ? "white" : currentTheme.textSecondary }, tabActivo === "historial" && styles.tabTextoActivo]}>
            Historial
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: tabActivo === "historial" ? "rgba(255,255,255,0.3)" : currentTheme.primary + '20' }]}>
            <Text style={[styles.tabBadgeTexto, { color: tabActivo === "historial" ? "white" : currentTheme.primary }]}>
              {pedidosRecibidos.filter(p => ['entregado', 'rechazado'].includes(p.estado) && p.estado !== 'cancelado').length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]} contentContainerStyle={styles.scrollContainer}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={styles.loadingTexto}>Cargando pedidos...</Text>
          </View>
        ) : pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map(renderPedido)
        ) : (
          <View style={styles.emptyState}>
            {(() => {
              const iconName = tabActivo === "pendientes" ? "shopping-cart" : (tabActivo === "cancelados" ? "check-circle" : "history");
              const iconColor = tabActivo === "cancelados" ? currentTheme.primary : currentTheme.textSecondary;
              return <FontAwesome name={iconName} size={64} color={iconColor} />;
            })()}
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
              {tabActivo === "pendientes" 
                ? "No hay pedidos pendientes" 
                : tabActivo === "cancelados"
                ? "No hay pedidos cancelados"
                : "No hay pedidos en el historial"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
              {tabActivo === "pendientes" 
                ? "Los pedidos de tus clientes aparecerán aquí" 
                : tabActivo === "cancelados"
                ? "Los pedidos cancelados por clientes aparecerán aquí"
                : "Los pedidos completados aparecerán aquí"}
            </Text>
          </View>
        )}
      </ScrollView>

      {renderModalDetalle()}
      
      {/* Modal de Tiempo de Entrega */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalTiempoEntregaVisible}
        onRequestClose={() => setModalTiempoEntregaVisible(false)}
      >
        <View style={styles.modalTiempoEntregaContainer}>
          <View style={styles.modalTiempoEntregaContent}>
            <View style={styles.modalTiempoEntregaHeader}>
              <FontAwesome name="clock-o" size={32} color={currentTheme.primary} />
              <Text style={styles.modalTiempoEntregaTitulo}>Confirmar Pedido</Text>
              <Text style={styles.modalTiempoEntregaSubtitulo}>
                Ingresa el tiempo estimado de entrega en minutos
              </Text>
            </View>
            
            <View style={styles.modalTiempoEntregaBody}>
              <Text style={styles.tiempoLabel}>Tiempo de entrega:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tiempoEntrega}
                  onValueChange={(itemValue) => setTiempoEntrega(itemValue)}
                  style={styles.picker}
                >
                  {opcionesTiempo.map((opcion) => (
                    <Picker.Item 
                      key={opcion.value} 
                      label={opcion.label} 
                      value={opcion.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalTiempoEntregaFooter}>
              <TouchableOpacity
                style={styles.modalTiempoEntregaCancelar}
                onPress={() => {
                  setModalTiempoEntregaVisible(false);
                  setTiempoEntrega(30); // Resetear al valor por defecto
                  setPedidoParaConfirmar(null);
                }}
              >
                <Text style={styles.modalTiempoEntregaCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalTiempoEntregaConfirmar}
                onPress={confirmarTiempoEntrega}
              >
                <FontAwesome name="check" size={16} color="white" />
                <Text style={styles.modalTiempoEntregaConfirmarTexto}>Confirmar Pedido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal de Rechazo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalRechazoVisible}
        onRequestClose={() => setModalRechazoVisible(false)}
      >
        <View style={styles.modalRechazoContainer}>
          <View style={styles.modalRechazoContent}>
            <View style={styles.modalRechazoHeader}>
              <FontAwesome name="exclamation-triangle" size={32} color="#e74c3c" />
              <Text style={styles.modalRechazoTitulo}>Rechazar Pedido</Text>
              <Text style={styles.modalRechazoSubtitulo}>
                Selecciona el motivo del rechazo
              </Text>
            </View>
            
            <Text style={styles.motivoLabel}>Motivo del rechazo:</Text>
            
            <View style={styles.motivosContainer}>
              {motivosRechazo.map((motivo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.motivoOption,
                    motivoSeleccionado === motivo && styles.motivoOptionSelected
                  ]}
                  onPress={() => setMotivoSeleccionado(motivo)}
                >
                  <View style={styles.motivoOptionContent}>
                    <View style={[
                      styles.motivoRadio,
                      motivoSeleccionado === motivo && styles.motivoRadioSelected
                    ]}>
                      {motivoSeleccionado === motivo && (
                        <FontAwesome name="check" size={12} color="white" />
                      )}
                    </View>
                    <Text style={[
                      styles.motivoOptionText,
                      motivoSeleccionado === motivo && styles.motivoOptionTextSelected
                    ]}>
                      {motivo}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Input personalizado cuando se selecciona "Otro" */}
            {motivoSeleccionado === 'Otro' && (
              <View style={styles.motivoPersonalizadoContainer}>
                <Text style={styles.motivoPersonalizadoLabel}>Especifica el motivo:</Text>
                <TextInput
                  style={styles.motivoPersonalizadoInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe el motivo del rechazo..."
                  placeholderTextColor="#999"
                  onChangeText={setMotivoPersonalizado}
                  value={motivoPersonalizado}
                />
              </View>
            )}

            <View style={styles.modalRechazoFooter}>
              <TouchableOpacity
                style={styles.modalRechazoCancelar}
                onPress={() => {
                  setModalRechazoVisible(false);
                  setMotivoSeleccionado('');
                  setMotivoPersonalizado('');
                  setPedidoParaRechazar(null);
                }}
              >
                <Text style={styles.modalRechazoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalRechazoConfirmar,
                  (!motivoSeleccionado || (motivoSeleccionado === 'Otro' && !motivoPersonalizado.trim())) && styles.modalRechazoConfirmarDisabled
                ]}
                onPress={confirmarRechazo}
                disabled={!motivoSeleccionado || (motivoSeleccionado === 'Otro' && !motivoPersonalizado.trim())}
              >
                <FontAwesome name="times" size={16} color="white" />
                <Text style={styles.modalRechazoConfirmarTexto}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal de Calificación del Cliente */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCalificacionClienteVisible}
        onRequestClose={() => setModalCalificacionClienteVisible(false)}
      >
        <View style={styles.modalCalificacionContainer}>
          <View style={styles.modalCalificacionContent}>
            <View style={styles.modalCalificacionHeader}>
              <FontAwesome name="star" size={32} color="#FFD700" />
              <Text style={styles.modalCalificacionTitulo}>Califica al Cliente</Text>
              <Text style={styles.modalCalificacionSubtitulo}>
                Evalúa la experiencia con {pedidoParaCalificarCliente?.cliente}
              </Text>
            </View>
            
            <ScrollView style={styles.modalCalificacionBody}>
              {criteriosCliente.map((criterio) => (
                <View key={criterio.key} style={styles.criterioContainer}>
                  <View style={styles.criterioHeader}>
                    <FontAwesome name={criterio.icon} size={20} color={currentTheme.primary} />
                    <Text style={styles.criterioLabel}>{criterio.label}</Text>
                  </View>
                  {renderEstrellasCliente(criterio.key, calificacionesCliente[criterio.key])}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalCalificacionFooter}>
              <TouchableOpacity
                style={styles.modalCalificacionCancelar}
                onPress={() => {
                  setModalCalificacionClienteVisible(false);
                  setPedidoParaCalificarCliente(null);
                  setCalificacionesCliente({
                    puntualidad: 0,
                    comunicacion: 0,
                    amabilidad: 0,
                    cooperacion: 0
                  });
                }}
              >
                <Text style={styles.modalCalificacionCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalCalificacionGuardar,
                  Object.values(calificacionesCliente).some(val => val === 0) && styles.modalCalificacionGuardarDisabled
                ]}
                onPress={guardarCalificacionCliente}
                disabled={Object.values(calificacionesCliente).some(val => val === 0)}
              >
                <FontAwesome name="check" size={16} color="white" />
                <Text style={styles.modalCalificacionGuardarTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  tabActivo: {
    backgroundColor: "#2A9D8F",
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7f8c8d",
    flexShrink: 1,
    textAlign: "center",
  },
  tabTextoActivo: {
    color: "white",
    fontWeight: "700",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabBadgeTexto: {
    fontSize: 11,
    fontWeight: "bold",
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
  clienteAvatarImagen: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    flexDirection: "column",
    gap: 8,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statTexto: {
    marginLeft: 8,
    fontSize: 14,
    color: "#34495e",
    flexShrink: 1,
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
  // Estilos del Modal de Tiempo de Entrega
  modalTiempoEntregaContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalTiempoEntregaContent: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalTiempoEntregaHeader: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTiempoEntregaTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 5,
  },
  modalTiempoEntregaSubtitulo: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  modalTiempoEntregaBody: {
    padding: 20,
  },
  tiempoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  modalTiempoEntregaFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  modalTiempoEntregaCancelar: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalTiempoEntregaCancelarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7f8c8d",
  },
  modalTiempoEntregaConfirmar: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#2A9D8F",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalTiempoEntregaConfirmarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Estilos del Modal de Rechazo
  modalRechazoContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalRechazoContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  modalRechazoHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalRechazoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 5,
  },
  modalRechazoSubtitulo: {
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
  motivoInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#2c3e50",
    textAlignVertical: "top",
    minHeight: 100,
    backgroundColor: "#f8f9fa",
  },
  modalRechazoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalRechazoCancelar: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalRechazoCancelarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalRechazoConfirmar: {
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
  modalRechazoConfirmarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalRechazoConfirmarDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
  // Estilos para modal de calificación del cliente
  modalCalificacionContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCalificacionContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  modalCalificacionHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalCalificacionTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 5,
  },
  modalCalificacionSubtitulo: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  modalCalificacionBody: {
    height: 300,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e74c3c",
    padding: 10,
  },
  criterioContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  criterioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  criterioLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 10,
  },
  estrellasContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  estrellaButton: {
    padding: 4,
  },
  modalCalificacionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCalificacionCancelar: {
    flex: 1,
    backgroundColor: "#95a5a6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCalificacionCancelarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCalificacionGuardar: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalCalificacionGuardarTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalCalificacionGuardarDisabled: {
    backgroundColor: "#bdc3c7",
    opacity: 0.6,
  },
  // Estilos para botón temporal de limpiar datos
  limpiarContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  limpiarButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  limpiarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos para motivos predefinidos
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
  // Estilos para motivo personalizado
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
  // Estilos para motivo de cancelación
  motivoCancelacionContainer: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  motivoCancelacionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 4,
  },
  motivoCancelacionTexto: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
});

export default PedidosRecibidosScreen;
