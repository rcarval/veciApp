import React, { useState, useEffect, useCallback } from "react";
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
  Linking,
  Platform,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import pedidoService from '../services/pedidoService';
import io from 'socket.io-client';
import env from '../config/env';
import LoadingVeciApp from '../components/LoadingVeciApp';

const PedidosRecibidosScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const { usuario: usuarioFromContext } = useUser();
  const usuario = route.params?.usuario || usuarioFromContext || {};
  
  const [pedidosRecibidos, setPedidosRecibidos] = useState([]);
  const [tabActivo, setTabActivo] = useState("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
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
  const [modalMapaFullVisible, setModalMapaFullVisible] = useState(false);
  const [direccionMapa, setDireccionMapa] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  // Función para reproducir sonido de notificación de nuevo pedido
  const reproducirSonidoNotificacion = async () => {
    try {
      console.log('🔔 Reproduciendo sonido de notificación...');
      
      // Configurar el modo de audio para que reproduzca incluso en modo silencioso
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 🎵 Sonido seleccionado: Clear Announce Tones
      const sonidoSeleccionado = 'https://assets.mixkit.co/active_storage/sfx/2861/2861.wav';

      // Crear y reproducir el sonido
      const { sound } = await Audio.Sound.createAsync(
        { uri: sonidoSeleccionado },
        { 
          shouldPlay: true, 
          volume: 1.0,
          isLooping: false
        }
      );
      
      // Limpiar el sonido después de reproducirlo
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('✅ Sonido de notificación completado');
          sound.unloadAsync();
        }
      });
      
    } catch (error) {
      console.error('❌ Error al reproducir sonido:', error);
      // No mostrar alerta para no interrumpir la experiencia del usuario
    }
  };

  // Función para cargar pedidos recibidos del backend
  const cargarPedidosRecibidos = useCallback(async () => {
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
            cancelacion_confirmada: pedido.cancelacion_confirmada || false,
            // ✅ Nuevos campos para desglose
            subtotal: pedido.subtotal ? parseFloat(pedido.subtotal) : null,
            costo_delivery: pedido.costo_delivery ? parseFloat(pedido.costo_delivery) : 0,
            cupon_codigo: pedido.cupon_codigo || null,
            descuento_cupon: pedido.descuento_cupon ? parseFloat(pedido.descuento_cupon) : 0,
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
  }, []);

  useEffect(() => {
    cargarPedidosRecibidos();
  }, [cargarPedidosRecibidos]);

  // Escuchar eventos WebSocket para nuevos pedidos
  useEffect(() => {
    if (!usuario?.id) return;

    console.log('🔌 Conectando WebSocket para PedidosRecibidos...');
    const socket = io(env.WS_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado en PedidosRecibidos');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado en PedidosRecibidos');
    });

    // Escuchar nuevos pedidos para el emprendedor
    socket.on(`pedido:nuevo:${usuario.id}`, async (data) => {
      console.log('📡 Nuevo pedido recibido via WebSocket:', data);
      
      // Reproducir sonido de notificación
      await reproducirSonidoNotificacion();
      
      // Recargar la lista de pedidos
      cargarPedidosRecibidos();
    });

    // También escuchar cambios de estado (si el emprendedor está viendo la pantalla)
    socket.on(`pedido:estado:${usuario.id}`, (data) => {
      console.log('📡 Cambio de estado recibido via WebSocket:', data);
      cargarPedidosRecibidos();
    });

    return () => {
      console.log('🔌 Desconectando WebSocket de PedidosRecibidos...');
      socket.disconnect();
    };
  }, [usuario?.id, cargarPedidosRecibidos]);

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

  // Función para abrir direcciones en la app de mapas del dispositivo
  const abrirDireccionesEnMapa = async () => {
    try {
      if (!coordenadasDireccion) {
        Alert.alert('Error', 'No se han cargado las coordenadas de destino');
        return;
      }

      const { latitude, longitude } = coordenadasDireccion;
      const label = encodeURIComponent(direccionMapa);

      let url = '';

      if (Platform.OS === 'ios') {
        // Apple Maps con direcciones desde ubicación actual
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      } else {
        // Google Maps con direcciones desde ubicación actual
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      }

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir la aplicación de mapas');
      }
    } catch (error) {
      console.error('Error al abrir direcciones:', error);
      Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
    }
  };

  // Función para llamar al cliente
  const llamarCliente = async (telefono) => {
    try {
      const url = `tel:${telefono}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede realizar la llamada');
      }
    } catch (error) {
      console.error('Error al llamar:', error);
      Alert.alert('Error', 'No se pudo realizar la llamada');
    }
  };

  // Función para abrir WhatsApp con el cliente
  const abrirWhatsApp = async (telefono) => {
    try {
      // Limpiar el teléfono de caracteres especiales y espacios
      const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
      
      // Construir la URL de WhatsApp
      const url = `https://wa.me/${telefonoLimpio}`;
      
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo');
      }
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
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
      console.log('📤 Confirmando cancelación del pedido:', pedido.id);
      
      // Llamar al backend para marcar la cancelación como confirmada
      await pedidoService.confirmarCancelacion(pedido.id);
      
      // Recargar pedidos desde el backend
      await cargarPedidosRecibidos();
      
      Alert.alert('Cancelación confirmada', 'El pedido cancelado ha sido movido al historial.');
    } catch (error) {
      console.log('❌ Error al confirmar cancelación:', error);
      Alert.alert('Error', error.message || 'No se pudo confirmar la cancelación.');
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

  // Función para formatear número de pedido
  const formatearNumeroPedido = (id) => {
    return `#P-${String(id).padStart(6, '0')}`;
  };

  // Función para filtrar pedidos por búsqueda
  const filtrarPedidosPorBusqueda = (pedidos) => {
    if (!busqueda.trim()) return pedidos;
    
    const busquedaLower = busqueda.toLowerCase().trim();
    return pedidos.filter(pedido => {
      const numeroPedido = formatearNumeroPedido(pedido.id).toLowerCase();
      return numeroPedido.includes(busquedaLower);
    });
  };

  const obtenerPedidosFiltrados = () => {
    let pedidosFiltrados = [];
    
    if (tabActivo === "pendientes") {
      pedidosFiltrados = pedidosRecibidos.filter(pedido => 
        ['pendiente', 'confirmado', 'preparando', 'listo'].includes(pedido.estado)
      );
    } else if (tabActivo === "cancelados") {
      // Filtrar solo pedidos cancelados NO confirmados (pendientes de confirmar)
      pedidosFiltrados = pedidosRecibidos.filter(pedido => 
        pedido.estado === 'cancelado' && pedido.motivoCancelacion && !pedido.cancelacion_confirmada
      );
    } else {
      // Historial: entregados, rechazados y cancelados CONFIRMADOS
      pedidosFiltrados = pedidosRecibidos.filter(pedido => {
        if (pedido.estado === 'entregado') return true;
        if (pedido.estado === 'rechazado') return true;
        if (pedido.estado === 'cancelado' && pedido.cancelacion_confirmada) return true;
        return false;
      });
    }
    
    // Aplicar filtro de búsqueda
    pedidosFiltrados = filtrarPedidosPorBusqueda(pedidosFiltrados);
    
    // Ordenar del más antiguo al más nuevo por fechaHoraReserva
    return pedidosFiltrados.sort((a, b) => {
      const fechaA = a.fechaHoraReserva ? new Date(a.fechaHoraReserva) : new Date(a.fecha);
      const fechaB = b.fechaHoraReserva ? new Date(b.fechaHoraReserva) : new Date(b.fecha);
      return fechaA - fechaB; // Más antiguo primero
    });
  };

  const renderPedido = (pedido) => {
    const fechaReserva = new Date(pedido.fechaHoraReserva);
    const tiempoTranscurrido = calcularTiempoTranscurrido(pedido.fechaHoraReserva);
    const estadoColor = getEstadoColor(pedido.estado);
    
    // Formatear fecha y hora usando el timestamp local
    const dia = fechaReserva.getDate();
    const mes = fechaReserva.getMonth() + 1;
    const año = fechaReserva.getFullYear();
    const horas = fechaReserva.getHours();
    const minutos = fechaReserva.getMinutes();
    
    const fechaFormateada = `${dia.toString().padStart(2, '0')}-${mes.toString().padStart(2, '0')}-${año}`;
    const horaFormateada = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    
    return (
      <View key={pedido.id} style={[styles.pedidoCardModerno, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        <LinearGradient
          colors={[estadoColor + '08', 'transparent']}
          style={styles.pedidoCardGradiente}
        >
          {/* Nombre del Emprendimiento + Número de Pedido */}
          <View style={styles.negocioContainerModerno}>
            <Ionicons name="storefront" size={16} color={currentTheme.primary} />
            <Text style={[styles.negocioNombreModerno, { color: currentTheme.primary }]}>
              {pedido.negocio}
            </Text>
            <View style={[styles.numeroPedidoBadge, { backgroundColor: currentTheme.primary + '15', marginLeft: 'auto' }]}>
              <Text style={[styles.numeroPedidoTexto, { color: currentTheme.primary }]}>{formatearNumeroPedido(pedido.id)}</Text>
            </View>
            </View>

          {/* Header con foto del cliente */}
          <View style={styles.pedidoHeaderModerno}>
            <View style={styles.clienteAvatarContainer}>
              {pedido.fotoPerfilCliente ? (
                <Image 
                  source={{ uri: pedido.fotoPerfilCliente }} 
                  style={styles.clienteAvatarPedido}
                />
              ) : (
                <View style={[styles.clienteAvatarPlaceholder, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Ionicons name="person" size={24} color={currentTheme.primary} />
          </View>
              )}
          </View>
            <View style={styles.pedidoInfoModerno}>
              <Text style={[styles.clienteNombreModerno, { color: currentTheme.text }]}>{pedido.cliente}</Text>
              <View style={styles.fechaHoraContainer}>
                <Ionicons name="calendar-outline" size={12} color={currentTheme.textSecondary} />
                <Text style={[styles.pedidoFechaModerno, { color: currentTheme.textSecondary }]}>
                  {fechaFormateada}
                </Text>
                <Ionicons name="time-outline" size={12} color={currentTheme.textSecondary} style={{ marginLeft: 8 }} />
                <Text style={[styles.pedidoFechaModerno, { color: currentTheme.textSecondary }]}>
                  {horaFormateada}
                </Text>
        </View>
              <View style={styles.tiempoContainerModerno}>
                <Ionicons name="hourglass-outline" size={12} color="#e74c3c" />
                <Text style={styles.tiempoTextoModerno}>Hace {tiempoTranscurrido}</Text>
              </View>
            </View>
            <View style={[styles.estadoBadgeModerno, { backgroundColor: estadoColor }]}>
              <Text style={styles.estadoTextoModerno}>{getEstadoTexto(pedido.estado)}</Text>
            </View>
        </View>
        
          {/* Detalles del Pedido */}
          <View style={styles.pedidoDetallesModerno}>
            <View style={styles.detalleItemModerno}>
              <Ionicons name="call-outline" size={16} color={currentTheme.primary} />
              <Text style={[styles.detalleTextoModerno, { color: currentTheme.text }]}>
                {pedido.telefonoCliente}
              </Text>
        </View>

            <View style={styles.detalleItemModerno}>
              <Ionicons name="location-outline" size={16} color={currentTheme.primary} />
              <Text style={[styles.detalleTextoModerno, { color: currentTheme.text }]} numberOfLines={2}>
                {pedido.direccion}
              </Text>
        </View>

        {pedido.modoEntrega && (
              <View style={[styles.modoEntregaBadge, { backgroundColor: currentTheme.primary + '15' }]}>
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

            {pedido.estado === 'confirmado' && pedido.tiempoEntregaMinutos && (
              <View style={[styles.tiempoEstimadoBadge, { backgroundColor: '#27ae6015' }]}>
                <Ionicons name="timer-outline" size={16} color="#27ae60" />
                <Text style={styles.tiempoEstimadoTexto}>
                  Entrega estimada: {pedido.tiempoEntregaMinutos} min
            </Text>
          </View>
        )}
      </View>

      {/* Mostrar motivo de cancelación si está en la pestaña cancelados */}
      {tabActivo === "cancelados" && pedido.motivoCancelacion && (
            <View style={styles.motivoCancelacionModerno}>
              <Ionicons name="alert-circle" size={16} color="#ffc107" />
              <View style={styles.motivoCancelacionTextoContainer}>
                <Text style={styles.motivoCancelacionLabelModerno}>Motivo de cancelación:</Text>
                <Text style={styles.motivoCancelacionTextoModerno}>{pedido.motivoCancelacion}</Text>
              </View>
        </View>
      )}

          {/* Lista de Productos */}
          <View style={[styles.productosContainerModerno, { backgroundColor: currentTheme.background }]}>
            <View style={styles.productosTituloContainer}>
              <Ionicons name="cart-outline" size={16} color={currentTheme.primary} />
              <Text style={[styles.productosTituloModerno, { color: currentTheme.text }]}>Productos</Text>
            </View>
        {pedido.productos.map((producto, index) => {
          // ✅ Usar precio_final si existe (precio que realmente se cobró), si no usar subtotal o precio
          const precioMostrar = producto.subtotal || (producto.precio_final ? producto.precio_final * producto.cantidad : (producto.precio_unitario * producto.cantidad));
          const tieneOferta = producto.precio_oferta && producto.precio_oferta > 0 && producto.precio_oferta < producto.precio_unitario;
          
          return (
              <View key={index} style={styles.productoItemModerno}>
                <View style={styles.productoDot} />
                <Text style={[styles.productoNombreModerno, { color: currentTheme.text }]}>
                  {producto.nombre}
                </Text>
                <Text style={[styles.productoCantidadModerno, { color: currentTheme.primary }]}>
                  x{producto.cantidad}
                </Text>
                {tieneOferta && (
                  <Text style={[styles.productoPrecioOriginal, { color: currentTheme.textSecondary }]}>
                    ${(producto.precio_unitario * producto.cantidad).toLocaleString()}
                  </Text>
                )}
                <Text style={[styles.productoPrecioModerno, { color: tieneOferta ? '#27ae60' : currentTheme.text }]}>
                  ${precioMostrar.toLocaleString()}
            </Text>
          </View>
          );
        })}
      </View>

      {/* Ruta de Estados */}
      {tabActivo === "pendientes" && renderRutaEstados(pedido)}

          {/* ✅ Desglose de Costos en la tarjeta */}
          <View style={[styles.desgloseContainerModerno, { backgroundColor: currentTheme.background }]}>
            <View style={styles.desgloseTituloContainer}>
              <Ionicons name="receipt-outline" size={14} color={currentTheme.primary} />
              <Text style={[styles.desgloseTitulo, { color: currentTheme.text }]}>Desglose</Text>
            </View>
            
            {pedido.subtotal && (
              <View style={styles.desgloseLineaModerno}>
                <Text style={[styles.desgloseLabel, { color: currentTheme.textSecondary }]}>Subtotal:</Text>
                <Text style={[styles.desgloseValor, { color: currentTheme.text }]}>
                  ${pedido.subtotal.toLocaleString('es-CL')}
                </Text>
              </View>
            )}
            
            {pedido.modoEntrega === 'delivery' && pedido.costo_delivery !== undefined && (
              <View style={styles.desgloseLineaModerno}>
                <Text style={[styles.desgloseLabel, { color: currentTheme.textSecondary }]}>Delivery:</Text>
                <Text style={[styles.desgloseValor, { color: pedido.costo_delivery === 0 ? '#27ae60' : currentTheme.text }]}>
                  {pedido.costo_delivery === 0 ? '¡Gratis!' : `$${pedido.costo_delivery.toLocaleString('es-CL')}`}
                </Text>
              </View>
            )}
            
            {pedido.cupon_codigo && pedido.descuento_cupon > 0 && (
              <View style={styles.desgloseLineaModerno}>
                <Text style={[styles.desgloseLabel, { color: '#27ae60' }]}>Cupón ({pedido.cupon_codigo}):</Text>
                <Text style={[styles.desgloseValor, { color: '#27ae60', fontWeight: '700' }]}>
                  -${pedido.descuento_cupon.toLocaleString('es-CL')}
                </Text>
              </View>
            )}
            
            <View style={[styles.desgloseLineaTotal, { borderTopColor: currentTheme.border }]}>
              <Text style={[styles.desgloseLabelTotal, { color: currentTheme.text }]}>Total:</Text>
              <Text style={[styles.desgloseValorTotal, { color: currentTheme.primary }]}>
                ${pedido.total.toLocaleString('es-CL')}
              </Text>
            </View>
          </View>

          {/* Footer con Botón de Ver Detalles */}
          <View style={styles.pedidoFooterModerno}>
            <TouchableOpacity
              style={[styles.detalleButtonModerno, { backgroundColor: currentTheme.primary + '15' }]}
              onPress={async () => {
                setPedidoSeleccionado(pedido);
                setModalVisible(true);
                // Cargar datos en paralelo
                cargarCalificacionCliente(pedido.clienteId);
                obtenerCoordenadasDireccion(pedido.direccion);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={18} color={currentTheme.primary} />
              <Text style={[styles.detalleButtonTexto, { color: currentTheme.primary }]}>Ver Detalles</Text>
            </TouchableOpacity>
          </View>

          {/* Botones de Acción Modernos */}
      {tabActivo === "pendientes" && (
            <View style={styles.accionesContainerModerno}>
          {getSiguienteEstado(pedido.estado) && (
            <TouchableOpacity
                  style={styles.accionButtonModerno}
              onPress={() => confirmarCambioEstado(pedido, getSiguienteEstado(pedido.estado))}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[getEstadoColor(getSiguienteEstado(pedido.estado)), getEstadoColor(getSiguienteEstado(pedido.estado)) + 'dd']}
                    style={styles.accionButtonGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons 
                      name={getSiguienteEstado(pedido.estado) === 'entregado' ? 'gift-outline' : 'arrow-forward'} 
                      size={18} 
                      color="white" 
                    />
                    <Text style={styles.accionTextoModerno}>
                {getSiguienteEstado(pedido.estado) === 'entregado' ? 'Marcar Entregado' : 'Siguiente Paso'}
              </Text>
                  </LinearGradient>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
                style={styles.accionButtonModerno}
            onPress={() => abrirModalRechazo(pedido)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  style={styles.accionButtonGradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="close-circle" size={18} color="white" />
                  <Text style={styles.accionTextoModerno}>Rechazar</Text>
                </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de confirmación para pedidos cancelados */}
      {tabActivo === "cancelados" && (
            <View style={styles.accionesContainerModerno}>
          <TouchableOpacity
                style={styles.accionButtonModerno}
            onPress={() => confirmarCancelacion(pedido)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#27ae60', '#229954']}
                  style={styles.accionButtonGradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.accionTextoModerno}>Confirmar Cancelación</Text>
                </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
        </LinearGradient>
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
        <View style={[styles.modalContentModerno, { backgroundColor: currentTheme.cardBackground }]}>
          {/* Header Moderno */}
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.modalHeaderModerno}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.modalHeaderIconWrapper}>
              <Ionicons name="person-circle" size={32} color="white" />
            </View>
            <View style={styles.modalHeaderTextContainer}>
              <Text style={styles.modalSubtitulo}>Información de</Text>
              <Text style={styles.modalTituloModerno}>Cliente</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButtonModerno}
              onPress={() => {
                setModalVisible(false);
                setCoordenadasDireccion(null);
                setCalificacionClienteReal(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          {pedidoSeleccionado && (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Card del Cliente */}
              <View style={[styles.clienteCardModerno, { backgroundColor: currentTheme.background }]}>
                <View style={styles.clienteHeaderModerno}>
                  <View style={styles.clienteAvatarWrapperModerno}>
                  {pedidoSeleccionado.fotoPerfilCliente ? (
                    <Image 
                      source={{ uri: pedidoSeleccionado.fotoPerfilCliente }} 
                        style={styles.clienteAvatarModalModerno}
                    />
                  ) : (
                      <View style={[styles.clienteAvatarPlaceholderModal, { backgroundColor: currentTheme.primary }]}>
                        <Ionicons name="person" size={40} color="white" />
                    </View>
                  )}
                    <View style={styles.clienteAvatarBorder} />
                      </View>
                  <View style={styles.clienteInfoModerno}>
                    <Text style={[styles.clienteNombreModal, { color: currentTheme.text }]}>
                      {pedidoSeleccionado.cliente}
                      </Text>
                    <View style={styles.calificacionContainerModerno}>
                      {calificacionClienteReal && calificacionClienteReal.calificacion_promedio > 0 ? (
                        <>
                          <View style={styles.estrellasContainerModerno}>
                            {renderEstrellas(calificacionClienteReal.calificacion_promedio)}
                    </View>
                          <Text style={[styles.calificacionTextoModerno, { color: currentTheme.text }]}>
                            {calificacionClienteReal.calificacion_promedio.toFixed(1)}/5
                          </Text>
                        </>
                      ) : (
                        <View style={[styles.sinCalificacionBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                          <Ionicons name="star-outline" size={14} color={currentTheme.primary} />
                          <Text style={[styles.sinCalificacionTexto, { color: currentTheme.primary }]}>
                            Sin calificaciones
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Stats del Cliente */}
                <View style={styles.clienteStatsModerno}>
                  <View style={[styles.statCardModerno, { backgroundColor: currentTheme.cardBackground }]}>
                    <View style={[styles.statIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="cart" size={20} color={currentTheme.primary} />
                  </View>
                    <Text style={[styles.statNumero, { color: currentTheme.text }]}>
                      {pedidoSeleccionado.pedidosRealizadosCliente}
                    </Text>
                    <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Pedidos</Text>
                  </View>
                  <View style={[styles.statCardModerno, { backgroundColor: currentTheme.cardBackground }]}>
                    <View style={[styles.statIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="calendar" size={20} color={currentTheme.primary} />
                    </View>
                    <Text style={[styles.statNumero, { color: currentTheme.text }]}>
                      {pedidoSeleccionado.clienteDesde}
                    </Text>
                    <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Cliente desde</Text>
                  </View>
                </View>
                
                {/* Botones de Contacto */}
                <View style={styles.contactoContainerModerno}>
                  <TouchableOpacity 
                    style={styles.contactoButtonModerno}
                    onPress={() => llamarCliente(pedidoSeleccionado.telefonoCliente)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[currentTheme.primary, currentTheme.secondary]}
                      style={styles.contactoButtonGradiente}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="call" size={18} color="white" />
                      <Text style={styles.contactoTextoModerno}>Llamar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.contactoButtonModerno}
                    onPress={() => abrirWhatsApp(pedidoSeleccionado.telefonoCliente)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#25D366', '#128C7E']}
                      style={styles.contactoButtonGradiente}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="white" />
                      <Text style={styles.contactoTextoModerno}>WhatsApp</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Detalles del Pedido Modernos */}
              <View style={[styles.pedidoDetallesCardModerno, { backgroundColor: currentTheme.background }]}>
                <View style={styles.sectionHeaderModerno}>
                  <Ionicons name="receipt-outline" size={20} color={currentTheme.primary} />
                  <Text style={[styles.sectionTituloModerno, { color: currentTheme.text }]}>Detalles del Pedido</Text>
                </View>
                
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
                      <View style={styles.detalleRowModerno}>
                        <Ionicons name="calendar-outline" size={18} color={currentTheme.primary} />
                        <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Fecha:</Text>
                        <Text style={[styles.detalleRowValue, { color: currentTheme.text }]}>{fechaFormateadaModal}</Text>
                      </View>
                      <View style={styles.detalleRowModerno}>
                        <Ionicons name="time-outline" size={18} color={currentTheme.primary} />
                        <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Hora:</Text>
                        <Text style={[styles.detalleRowValue, { color: currentTheme.text }]}>{horaFormateadaModal}</Text>
                      </View>
                    </>
                  );
                })()}
                
                <View style={styles.detalleRowModerno}>
                  <View style={[styles.estadoIconCircle, { backgroundColor: getEstadoColor(pedidoSeleccionado.estado) + '20' }]}>
                    <Ionicons name="radio-button-on" size={14} color={getEstadoColor(pedidoSeleccionado.estado)} />
                  </View>
                  <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Estado:</Text>
                  <Text style={[styles.detalleRowValue, { color: getEstadoColor(pedidoSeleccionado.estado), fontWeight: '700' }]}>
                    {getEstadoTexto(pedidoSeleccionado.estado)}
                  </Text>
                </View>
                
                <View style={styles.detalleRowModerno}>
                  <Ionicons 
                    name={pedidoSeleccionado.modoEntrega === "delivery" ? "bicycle" : "bag-handle"} 
                    size={18} 
                    color={currentTheme.primary} 
                  />
                  <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Modo:</Text>
                  <Text style={[styles.detalleRowValue, { color: currentTheme.text }]}>
                    {pedidoSeleccionado.modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}
                  </Text>
                </View>
                  </View>
                  
                  {/* ✅ Desglose de Costos */}
                  <View style={[styles.pedidoDetallesCardModerno, { backgroundColor: currentTheme.background }]}>
                <View style={styles.sectionHeaderModerno}>
                  <Ionicons name="cash-outline" size={20} color={currentTheme.primary} />
                  <Text style={[styles.sectionTituloModerno, { color: currentTheme.text }]}>Desglose de Costos</Text>
                </View>
                
                {pedidoSeleccionado.subtotal && (
                  <View style={styles.detalleRowModerno}>
                    <Ionicons name="cart-outline" size={18} color={currentTheme.primary} />
                    <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Subtotal:</Text>
                    <Text style={[styles.detalleRowValue, { color: currentTheme.text }]}>
                      ${pedidoSeleccionado.subtotal?.toLocaleString('es-CL') || pedidoSeleccionado.total?.toLocaleString('es-CL')}
                    </Text>
                  </View>
                )}
                
                {pedidoSeleccionado.costo_delivery !== undefined && pedidoSeleccionado.modoEntrega === 'delivery' && (
                  <View style={styles.detalleRowModerno}>
                    <Ionicons name="bicycle" size={18} color={currentTheme.primary} />
                    <Text style={[styles.detalleRowLabel, { color: currentTheme.textSecondary }]}>Delivery:</Text>
                    <Text style={[styles.detalleRowValue, { color: pedidoSeleccionado.costo_delivery === 0 ? '#27ae60' : currentTheme.text }]}>
                      {pedidoSeleccionado.costo_delivery === 0 ? '¡Gratis!' : `$${pedidoSeleccionado.costo_delivery?.toLocaleString('es-CL')}`}
                    </Text>
                  </View>
                )}
                
                {pedidoSeleccionado.cupon_codigo && pedidoSeleccionado.descuento_cupon > 0 && (
                  <View style={styles.detalleRowModerno}>
                    <Ionicons name="pricetag" size={18} color="#27ae60" />
                    <Text style={[styles.detalleRowLabel, { color: '#27ae60' }]}>
                      Cupón ({pedidoSeleccionado.cupon_codigo}):
                    </Text>
                    <Text style={[styles.detalleRowValue, { color: '#27ae60', fontWeight: '700' }]}>
                      -${pedidoSeleccionado.descuento_cupon?.toLocaleString('es-CL')}
                    </Text>
                  </View>
                )}
                
                <View style={[styles.detalleRowModerno, { marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: currentTheme.border }]}>
                  <Ionicons name="cash" size={20} color={currentTheme.primary} />
                  <Text style={[styles.detalleRowLabel, { color: currentTheme.text, fontWeight: '700', fontSize: 16 }]}>Total:</Text>
                  <Text style={[styles.detalleRowValue, { color: currentTheme.primary, fontWeight: '800', fontSize: 18 }]}>
                    ${pedidoSeleccionado.total?.toLocaleString('es-CL')}
                  </Text>
                </View>
              </View>

              {/* Botón para Abrir Mapa en Pantalla Completa */}
              <View style={[styles.mapaCardModerno, { backgroundColor: currentTheme.background }]}>
                <View style={styles.sectionHeaderModerno}>
                  <Ionicons name="map-outline" size={20} color={currentTheme.primary} />
                  <Text style={[styles.sectionTituloModerno, { color: currentTheme.text }]}>Ubicación de Entrega</Text>
                </View>
                
                <View style={[styles.direccionDisplayContainer, { backgroundColor: currentTheme.cardBackground }]}>
                  <Ionicons name="location" size={18} color={currentTheme.primary} />
                  <Text style={[styles.direccionDisplayTexto, { color: currentTheme.text }]} numberOfLines={2}>
                    {pedidoSeleccionado.direccion}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.abrirMapaButtonModerno}
                  onPress={() => {
                    setDireccionMapa(pedidoSeleccionado.direccion);
                    setModalMapaFullVisible(true);
                    // Cargar coordenadas si no están cargadas (no bloquea la apertura)
                    if (!coordenadasDireccion) {
                      obtenerCoordenadasDireccion(pedidoSeleccionado.direccion);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[currentTheme.primary, currentTheme.secondary]}
                    style={styles.abrirMapaButtonGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="map" size={20} color="white" />
                    <Text style={styles.abrirMapaButtonTexto}>Ver en Mapa Completo</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="basket" size={28} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Gestiona tus</Text>
            <Text style={styles.tituloPrincipal}>Pedidos Recibidos</Text>
          </View>
          <View style={styles.headerBadgeWrapper}>
            <View style={[styles.headerBadge, { backgroundColor: 'white' }]}>
              <Text style={[styles.headerBadgeText, { color: currentTheme.primary }]}>
                {pedidosRecibidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)).length}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Buscador por número de pedido */}
      <View style={[styles.buscadorContainer, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.buscadorInputContainer, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}>
          <Ionicons name="search-outline" size={20} color={currentTheme.textSecondary} />
          <TextInput
            style={[styles.buscadorInput, { color: currentTheme.text }]}
            placeholder="Buscar por número de pedido (ej: P-000001)"
            placeholderTextColor={currentTheme.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs Modernos */}
      <View style={[styles.tabsContainer, { backgroundColor: currentTheme.background }]}>
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo("pendientes")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === "pendientes" ? [currentTheme.primary, currentTheme.secondary] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={tabActivo === "pendientes" ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === "pendientes" ? "white" : currentTheme.textSecondary }
            ]}>
            Pendientes
          </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === "pendientes" ? "rgba(255,255,255,0.25)" : currentTheme.primary + '15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === "pendientes" ? "white" : currentTheme.primary }
              ]}>
              {pedidosRecibidos.filter(p => ['pendiente', 'confirmado', 'preparando', 'listo'].includes(p.estado)).length}
            </Text>
          </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo("cancelados")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === "cancelados" ? ['#e74c3c', '#c0392b'] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={20} 
              color={tabActivo === "cancelados" ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === "cancelados" ? "white" : currentTheme.textSecondary }
            ]}>
            Cancelados
          </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === "cancelados" ? "rgba(255,255,255,0.25)" : '#e74c3c15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === "cancelados" ? "white" : '#e74c3c' }
              ]}>
                {pedidosRecibidos.filter(p => p.estado === 'cancelado' && p.motivoCancelacion && !p.cancelacion_confirmada).length}
            </Text>
          </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tabModerno}
          onPress={() => setTabActivo("historial")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={tabActivo === "historial" ? [currentTheme.primary, currentTheme.secondary] : ['white', 'white']}
            style={styles.tabGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="checkmark-done-outline" 
              size={20} 
              color={tabActivo === "historial" ? "white" : currentTheme.textSecondary} 
            />
            <Text style={[
              styles.tabTextoModerno, 
              { color: tabActivo === "historial" ? "white" : currentTheme.textSecondary }
            ]}>
            Historial
          </Text>
            <View style={[
              styles.tabBadgeModerno, 
              { backgroundColor: tabActivo === "historial" ? "rgba(255,255,255,0.25)" : currentTheme.primary + '15' }
            ]}>
              <Text style={[
                styles.tabBadgeTextoModerno, 
                { color: tabActivo === "historial" ? "white" : currentTheme.primary }
              ]}>
                {pedidosRecibidos.filter(p => {
                  if (p.estado === 'entregado') return true;
                  if (p.estado === 'rechazado') return true;
                  if (p.estado === 'cancelado' && p.cancelacion_confirmada) return true;
                  return false;
                }).length}
            </Text>
          </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]} contentContainerStyle={styles.scrollContainer}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <LoadingVeciApp size={120} color={currentTheme.primary} />
            <Text style={[styles.loadingTexto, { marginTop: 30 }]}>Cargando pedidos...</Text>
          </View>
        ) : pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map(renderPedido)
        ) : (
          <View style={styles.emptyState}>
            {(() => {
              const iconName = busqueda ? "search" : (tabActivo === "pendientes" ? "shopping-cart" : (tabActivo === "cancelados" ? "check-circle" : "history"));
              const iconColor = tabActivo === "cancelados" ? currentTheme.primary : currentTheme.textSecondary;
              return <FontAwesome name={iconName} size={64} color={iconColor} />;
            })()}
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
              {busqueda ? "No se encontraron pedidos" : (tabActivo === "pendientes" 
                ? "No hay pedidos pendientes" 
                : tabActivo === "cancelados"
                ? "No hay pedidos cancelados"
                : "No hay pedidos en el historial")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
              {busqueda ? "No hay pedidos con ese número" : (tabActivo === "pendientes" 
                ? "Los pedidos de tus clientes aparecerán aquí" 
                : tabActivo === "cancelados"
                ? "Los pedidos cancelados por clientes aparecerán aquí"
                : "Los pedidos completados aparecerán aquí")}
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

      {/* Modal de Mapa en Pantalla Completa */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalMapaFullVisible}
        onRequestClose={() => setModalMapaFullVisible(false)}
      >
        <View style={styles.modalMapaFullContainer}>
          {/* Header del Modal de Mapa */}
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.modalMapaFullHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.modalMapaBackButton}
              onPress={() => setModalMapaFullVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.modalMapaHeaderContent}>
              <Ionicons name="map" size={24} color="white" />
              <Text style={styles.modalMapaTitulo}>Ubicación de Entrega</Text>
            </View>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {/* Mapa en Pantalla Completa */}
          {cargandoMapa ? (
            <View style={styles.mapaFullLoadingContainer}>
              <LoadingVeciApp size={100} color={currentTheme.primary} />
              <Text style={[styles.mapaFullLoadingTexto, { color: currentTheme.textSecondary, marginTop: 20 }]}>
                Cargando ubicación...
              </Text>
            </View>
          ) : coordenadasDireccion ? (
            <>
              <MapView
                style={styles.mapaFull}
                initialRegion={{
                  latitude: coordenadasDireccion.latitude,
                  longitude: coordenadasDireccion.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={coordenadasDireccion}
                  title="📍 Dirección de Entrega"
                  description={direccionMapa}
                  pinColor={currentTheme.primary}
                />
              </MapView>
              
              {/* Panel de Dirección Flotante */}
              <View style={styles.direccionFloatingPanel}>
                <View style={styles.direccionFloatingContent}>
                  <View style={[styles.direccionFloatingIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
                    <Ionicons name="location" size={24} color={currentTheme.primary} />
                  </View>
                  <View style={styles.direccionFloatingTextContainer}>
                    <Text style={[styles.direccionFloatingTexto, { color: currentTheme.text }]}>
                      {direccionMapa}
                    </Text>
                    <TouchableOpacity
                      style={styles.comoLlegarButton}
                      onPress={abrirDireccionesEnMapa}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[currentTheme.primary, currentTheme.secondary]}
                        style={styles.comoLlegarGradiente}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="navigate" size={16} color="white" />
                        <Text style={styles.comoLlegarTexto}>Cómo Llegar</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.mapaFullLoadingContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={currentTheme.textSecondary} />
              <Text style={[styles.mapaFullLoadingTexto, { color: currentTheme.textSecondary }]}>
                No se pudo cargar la ubicación
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
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
    fontSize: 20,
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
  buscadorContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  buscadorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  numeroPedidoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  numeroPedidoTexto: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    paddingVertical: 8,
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
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
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
  negocioContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f130',
  },
  negocioNombreModerno: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pedidoHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  clienteAvatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clienteAvatarPedido: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'white',
  },
  clienteAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  pedidoInfoModerno: {
    flex: 1,
    gap: 4,
  },
  clienteNombreModerno: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fechaHoraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pedidoFechaModerno: {
    fontSize: 13,
    fontWeight: '500',
  },
  tiempoContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tiempoTextoModerno: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  estadoBadgeModerno: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  estadoTextoModerno: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pedidoDetallesModerno: {
    gap: 10,
    marginBottom: 16,
  },
  detalleItemModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detalleTextoModerno: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  modoEntregaBadge: {
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
  tiempoEstimadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  tiempoEstimadoTexto: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  motivoCancelacionModerno: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    marginBottom: 16,
  },
  motivoCancelacionTextoContainer: {
    flex: 1,
  },
  motivoCancelacionLabelModerno: {
    fontSize: 13,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 2,
  },
  motivoCancelacionTextoModerno: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
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
  productoItemModerno: {
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
  productoNombreModerno: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  productoCantidadModerno: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#2A9D8F15',
  },
  productoPrecioOriginal: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  productoPrecioModerno: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  desgloseContainerModerno: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  desgloseTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  desgloseTitulo: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  desgloseLineaModerno: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  desgloseLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  desgloseValor: {
    fontSize: 13,
    fontWeight: '600',
  },
  desgloseLineaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 2,
  },
  desgloseLabelTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  desgloseValorTotal: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pedidoFooterModerno: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalTextoModerno: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  detalleButtonModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  detalleButtonTexto: {
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContentModerno: {
    borderRadius: 24,
    width: "92%",
    maxWidth: 420,
    maxHeight: "85%",
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  modalHeaderIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTextContainer: {
    flex: 1,
  },
  modalSubtitulo: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  modalTituloModerno: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  modalCloseButtonModerno: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clienteCardModerno: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  clienteHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  clienteAvatarWrapperModerno: {
    position: 'relative',
  },
  clienteAvatarModalModerno: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  clienteAvatarPlaceholderModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clienteAvatarBorder: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  clienteInfoModerno: {
    flex: 1,
    gap: 8,
  },
  clienteNombreModal: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  calificacionContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estrellasContainerModerno: {
    flexDirection: 'row',
    gap: 3,
  },
  calificacionTextoModerno: {
    fontSize: 14,
    fontWeight: '700',
  },
  sinCalificacionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  sinCalificacionTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  clienteStatsModerno: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCardModerno: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumero: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  contactoContainerModerno: {
    flexDirection: 'row',
    gap: 12,
  },
  contactoButtonModerno: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  contactoButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  contactoTextoModerno: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pedidoDetallesCardModerno: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f130',
  },
  sectionTituloModerno: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  detalleRowModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  detalleRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  detalleRowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  estadoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapaCardModerno: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapaHeaderModerno: {
    marginBottom: 14,
  },
  mapaLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  mapaLoadingTexto: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapaContainerModerno: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 14,
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  mapa: {
    flex: 1,
  },
  mapaInfoModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f130',
  },
  mapaDireccionTextoModerno: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  direccionDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  direccionDisplayTexto: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  abrirMapaButtonModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  abrirMapaButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  abrirMapaButtonTexto: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Estilos del Modal de Mapa Pantalla Completa
  modalMapaFullContainer: {
    flex: 1,
  },
  modalMapaFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalMapaBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMapaHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalMapaTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  mapaFull: {
    flex: 1,
  },
  mapaFullLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  mapaFullLoadingTexto: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  direccionFloatingPanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    borderRadius: 18,
    backgroundColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  direccionFloatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  direccionFloatingIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  direccionFloatingTextContainer: {
    flex: 1,
    gap: 10,
  },
  direccionFloatingTexto: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  comoLlegarButton: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  comoLlegarGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  comoLlegarTexto: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
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
