import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useCarrito } from "../context/CarritoContext";
import pedidoService from "../services/pedidoService";
import { API_ENDPOINTS } from "../config/api";

// Componente ItemGaleria completamente separado con imagen completa
const ItemGaleria = memo(({ item, index, categoria, onImagenPress, onAgregar, onQuitar, onEliminar, cantidadEnCarrito, theme, isPreview = false }) => {
  const themeStyles = theme ? {
    backgroundColor: theme.cardBackground,
    textColor: theme.text,
    textSecondaryColor: theme.textSecondary,
    primaryColor: theme.primary,
    borderColor: theme.border,
  } : {
    backgroundColor: "#FFF",
    textColor: "#333",
    textSecondaryColor: "#666",
    primaryColor: "#2A9D8F",
    borderColor: "#f0f0f0",
  };
  
  return (
    <View style={[
      styles.itemGaleriaModerno,
      !isPreview && styles.itemGaleriaConControles
    ]}>
      <TouchableOpacity
        onPress={() => onImagenPress(item)}
        activeOpacity={0.9}
        style={styles.itemGaleriaTouchable}
      >
        {/* Imagen de fondo completa */}
          <Image
            source={item.imagen}
          style={styles.imagenGaleriaCompleta}
            contentFit="cover"
            cache="force-cache"
          />
        
        {/* Gradiente sobre la imagen */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradienteProducto}
          locations={[0, 0.5, 1]}
        />
        
        {/* Etiqueta de categoría superior derecha */}
          <View
            style={[
            styles.etiquetaCategoriaModerna,
            item.categoria === "oferta" && styles.etiquetaOfertaModerna,
            item.categoria === "principal" && styles.etiquetaPrincipalModerna,
            item.categoria === "secundario" && styles.etiquetaSecundarioModerna,
          ]}
        >
          <Ionicons 
            name={
              item.categoria === "oferta" ? "pricetag" :
              item.categoria === "principal" ? "star" : "add-circle"
            }
            size={10}
            color="white"
          />
          <Text style={styles.etiquetaTextoModerna}>
              {item.categoria === "oferta"
                ? "OFERTA"
                : item.categoria === "principal"
                ? "DESTACADO"
                : "ADICIONAL"}
            </Text>
        </View>

        {/* Información sobre la imagen */}
        <View style={[
          styles.infoGaleriaOverlay,
          !isPreview && styles.infoGaleriaConEspacio
        ]}>
          <Text style={styles.nombreGaleriaModerno} numberOfLines={2}>
            {item.nombre}
          </Text>
          {item.descripcion && (
            <Text style={styles.descripcionGaleriaModerna} numberOfLines={1}>
            {item.descripcion}
          </Text>
          )}
          <View style={styles.precioContainerModerno}>
            {item.categoria === "oferta" && item.precioOferta ? (
              <View style={styles.precioOfertaContainerModerno}>
                <Text style={styles.precioOriginalModerno}>
                  ${Math.round(item.precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}
                </Text>
                <Text style={styles.precioOfertaModerno}>
                  ${Math.round(item.precioOferta).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}
                </Text>
              </View>
            ) : (
              <Text style={styles.precioNormalModerno}>
                {item.precio && item.precio > 0
                  ? `$${Math.round(item.precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}`
                  : "Precio a Cotizar"}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Controles del carrito - Solo mostrar si no es preview */}
      {!isPreview && (
        <View style={styles.carritoControlsModerno}>
          {cantidadEnCarrito > 0 ? (
            <View style={styles.cantidadContainerModerno}>
              <TouchableOpacity
                style={[styles.botonCantidadModerno, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                onPress={() => onQuitar(index, categoria)}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={16} color={themeStyles.primaryColor} />
              </TouchableOpacity>
              <View style={styles.cantidadBadgeModerno}>
                <Text style={styles.cantidadTextoModerno}>{cantidadEnCarrito}</Text>
              </View>
              <TouchableOpacity
                style={[styles.botonCantidadModerno, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                onPress={() => onAgregar(item, index, categoria)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={themeStyles.primaryColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonEliminarModerno, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                onPress={() => onEliminar(index, categoria)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={14} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.botonAgregarCarritoModerno}
              onPress={() => onAgregar(item, index, categoria)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[themeStyles.primaryColor, themeStyles.primaryColor + 'dd']}
                style={styles.agregarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle" size={16} color="white" />
                <Text style={styles.botonAgregarTextoModerno}>Agregar</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

const PedidoDetalleScreen = ({ route, navigation }) => {
  const { producto, isPreview = false } = route.params;
  const { currentTheme } = useTheme();
  const { usuario, direcciones, direccionSeleccionada, getTipoUsuarioEfectivo } = useUser();
  const { carritoActivo, activarCarrito, limpiarCarrito, navegacionPendiente: navPendienteContexto, ejecutarNavegacionPendiente, cancelarNavegacionPendiente } = useCarrito();
  
  // ✅ EXTRAER ID REAL DEL EMPRENDIMIENTO (puede ser compuesto "emprendimiento_id-producto_id")
  const emprendimientoIdReal = useMemo(() => {
    const id = String(producto.id);
    // Si el ID contiene guión, extraer solo la primera parte (emprendimiento_id)
    if (id.includes('-')) {
      const partes = id.split('-');
      console.log('🔍 ID compuesto detectado:', id, '→ Emprendimiento ID:', partes[0]);
      return parseInt(partes[0]);
    }
    return parseInt(id);
  }, [producto.id]);
  
  // Función helper para mapear estado del backend al frontend
  const mapearEstado = (prod) => {
    if (prod.estado_calculado === 'cierra_pronto') {
      return 'Cierra Pronto';
    } else if (prod.estado_calculado === 'abierto') {
      return 'Abierto';
    } else if (prod.estado_calculado === 'cerrado') {
      return 'Cerrado';
    }
    // Fallback al estado original si no hay estado_calculado
    return prod.estado === 'activo' || prod.estado === 'Abierto' ? 'Abierto' : 'Cerrado';
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [distancia, setDistancia] = useState(null);
  const [cargandoDistancia, setCargandoDistancia] = useState(false);
  const [direccionUsuario, setDireccionUsuario] = useState(null);
  const [modalImagenVisible, setModalImagenVisible] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [reporteDetalle, setReporteDetalle] = useState('');
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarConfirmacionEntrega, setMostrarConfirmacionEntrega] = useState(false);
  const [advertenciaVisible, setAdvertenciaVisible] = useState(false);
  const [navegacionPendiente, setNavegacionPendiente] = useState(null);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [calificacionesData, setCalificacionesData] = useState(null);
  const [productosApi, setProductosApi] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(false);
  const [advertenciaPropioNegocio, setAdvertenciaPropioNegocio] = useState(false);
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [descuentoCupon, setDescuentoCupon] = useState(0);
  const carritoRef = useRef([]);
  const [, forceUpdate] = useState({});

  // Verificar si el emprendimiento pertenece al usuario actual
  // Log para debugging
  useEffect(() => {
    console.log('🔍 VERIFICACIÓN DE PROPIO EMPRENDIMIENTO:');
    console.log('  - producto completo:', producto);
    console.log('  - producto.usuario_id:', producto.usuario_id);
    console.log('  - producto.usuarioId:', producto.usuarioId);
    console.log('  - usuario?.id:', usuario?.id);
    console.log('  - usuario completo:', usuario);
  }, [producto, usuario]);

  const esPropioEmprendimiento = producto.usuario_id === usuario?.id || producto.usuarioId === usuario?.id;

// Opciones de reporte mejoradas
const reportReasons = [
  { 
    id: 1, 
    categoria: 'contenido_inapropiado',
    title: "Contenido inapropiado", 
    description: "Imágenes, textos o contenido ofensivo, violento o explícito",
    icono: "alert-circle",
    color: "#e74c3c"
  },
  { 
    id: 2, 
    categoria: 'informacion_falsa',
    title: "Información falsa o engañosa", 
    description: "Datos incorrectos, precios engañosos o descripciones falsas",
    icono: "information-circle",
    color: "#f39c12"
  },
  { 
    id: 3, 
    categoria: 'productos_prohibidos',
    title: "Productos prohibidos", 
    description: "Venta de artículos ilegales, restringidos o peligrosos",
    icono: "ban",
    color: "#c0392b"
  },
  { 
    id: 4, 
    categoria: 'suplantacion_identidad',
    title: "Suplantación de identidad", 
    description: "Pretende ser otra persona, empresa o marca registrada",
    icono: "person-circle",
    color: "#8e44ad"
  },
  { 
    id: 5, 
    categoria: 'practicas_fraudulentas',
    title: "Prácticas fraudulentas", 
    description: "Intento de estafa, fraude o robo de información",
    icono: "warning",
    color: "#d35400"
  },
  { 
    id: 6, 
    categoria: 'spam',
    title: "Spam o publicidad engañosa", 
    description: "Publicaciones repetitivas, spam o publicidad no autorizada",
    icono: "megaphone",
    color: "#95a5a6"
  },
  { 
    id: 7, 
    categoria: 'problemas_vendedor',
    title: "Problemas con el emprendedor", 
    description: "Mal servicio, incumplimiento de acuerdos o mala conducta",
    icono: "chatbox-ellipses",
    color: "#34495e"
  },
  { 
    id: 8, 
    categoria: 'otro',
    title: "Otro motivo", 
    description: "Describe tu motivo en el campo de texto",
    icono: "ellipsis-horizontal-circle",
    color: "#7f8c8d"
  },
];

// Función para enviar reporte
const enviarReporte = async () => {
  if (!selectedReportReason) {
    Alert.alert('Error', 'Por favor selecciona un motivo de reporte');
    return;
  }

  const razonSeleccionada = reportReasons.find(r => r.id === selectedReportReason);
  
  // Si es "Otro", validar que haya descripción
  if (razonSeleccionada.categoria === 'otro' && !reporteDetalle.trim()) {
    Alert.alert('Error', 'Por favor describe el motivo del reporte');
    return;
  }

  try {
    setEnviandoReporte(true);
    
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Debes iniciar sesión para reportar');
      return;
    }

    console.log('📤 Enviando reporte...');
    
    const response = await fetch(API_ENDPOINTS.CREAR_REPORTE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emprendimiento_id: producto.id,
        categoria: razonSeleccionada.categoria,
        titulo: razonSeleccionada.title,
        descripcion: razonSeleccionada.description,
        descripcion_detallada: reporteDetalle.trim() || null
      })
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Reporte enviado exitosamente');
      Alert.alert(
        '¡Reporte Enviado!',
        'Gracias por tu reporte. Nuestro equipo lo revisará a la brevedad y tomará las medidas necesarias.',
        [{ text: 'Entendido' }]
      );
      setReportModalVisible(false);
      setSelectedReportReason(null);
      setReporteDetalle('');
    } else {
      throw new Error(data.error || 'Error al enviar reporte');
    }
  } catch (error) {
    console.error('❌ Error al enviar reporte:', error);
    Alert.alert('Error', error.message || 'No se pudo enviar el reporte. Inténtalo de nuevo.');
  } finally {
    setEnviandoReporte(false);
  }
};
  const [modoEntrega, setModoEntrega] = useState(
    producto.metodosEntrega.delivery ? "delivery" : "retiro"
  );
  const [comunaCliente, setComunaCliente] = useState(null);
  const [tieneCobertura, setTieneCobertura] = useState(true);

  const imagenesPorCategoria = useMemo(() => {
    // Si hay productos de la API, usarlos; si no, usar los mock del producto
    const productos = productosApi.length > 0 ? productosApi : (producto.galeria || []);
    
    // Mapear productos de la API al formato esperado por ItemGaleria
    const productosMapeados = productosApi.length > 0 ? productosApi.map(prod => ({
      id: prod.id,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio,
      precioOferta: prod.oferta ? prod.precio_oferta : null,
      categoria: prod.categoria,
      imagen: prod.imagen_url ? { uri: prod.imagen_url } : require('../assets/icon.png')
    })) : producto.galeria || [];
    
    return {
      principal: productosMapeados.filter((item) => item.categoria === "principal") || [],
      oferta: productosMapeados.filter((item) => item.categoria === "oferta") || [],
      secundario: productosMapeados.filter((item) => item.categoria === "secundario") || [],
    };
  }, [productosApi, producto.galeria]);

  const cambiarModoEntrega = useCallback((modo) => {
    setModoEntrega(modo);
  }, []);

  // Funciones del carrito que NO causan re-renders del componente padre
  const agregarAlCarrito = useCallback((item) => {
    // Validar si es propio emprendimiento
    const tipoEfectivo = getTipoUsuarioEfectivo ? getTipoUsuarioEfectivo() : usuario?.tipo_usuario;
    if (esPropioEmprendimiento && tipoEfectivo === 'cliente') {
      setAdvertenciaPropioNegocio(true);
      return;
    }
    
    const existe = carritoRef.current.find(carritoItem => carritoItem.id === item.id);
    if (existe) {
      carritoRef.current = carritoRef.current.map(carritoItem =>
        carritoItem.id === item.id
          ? { ...carritoItem, cantidad: carritoItem.cantidad + 1 }
          : carritoItem
      );
    } else {
      carritoRef.current = [...carritoRef.current, { ...item, cantidad: 1 }];
    }
    // Actualizar contexto global del carrito
    const totalItems = carritoRef.current.reduce((total, item) => total + item.cantidad, 0);
    activarCarrito(totalItems);
    // Forzar actualización solo de los componentes que necesitan saber del cambio
    forceUpdate({});
  }, [activarCarrito, esPropioEmprendimiento, getTipoUsuarioEfectivo, usuario]);

  const quitarDelCarrito = useCallback((itemId) => {
    const item = carritoRef.current.find(carritoItem => carritoItem.id === itemId);
    if (item && item.cantidad > 1) {
      carritoRef.current = carritoRef.current.map(carritoItem =>
        carritoItem.id === itemId
          ? { ...carritoItem, cantidad: carritoItem.cantidad - 1 }
          : carritoItem
      );
    } else {
      carritoRef.current = carritoRef.current.filter(carritoItem => carritoItem.id !== itemId);
    }
    // Actualizar contexto global del carrito
    const totalItems = carritoRef.current.reduce((total, item) => total + item.cantidad, 0);
    activarCarrito(totalItems);
    forceUpdate({});
  }, [activarCarrito]);

  const eliminarDelCarrito = useCallback((itemId) => {
    carritoRef.current = carritoRef.current.filter(carritoItem => carritoItem.id !== itemId);
    // Actualizar contexto global del carrito
    const totalItems = carritoRef.current.reduce((total, item) => total + item.cantidad, 0);
    activarCarrito(totalItems);
    forceUpdate({});
  }, [activarCarrito]);

  const obtenerCantidadEnCarrito = useCallback((itemId) => {
    const item = carritoRef.current.find(carritoItem => carritoItem.id === itemId);
    return item ? item.cantidad : 0;
  }, []);

  const obtenerTotalCarrito = useCallback(() => {
    return carritoRef.current.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }, []);

  const obtenerCantidadTotalItems = useCallback(() => {
    return carritoRef.current.reduce((total, item) => total + item.cantidad, 0);
  }, []);

  const obtenerCostoDelivery = useCallback(() => {
    if (modoEntrega !== 'delivery') return 0;
    
    // Si el emprendimiento tiene configuración avanzada de delivery
    if (producto.modalidadDelivery && producto.configDelivery) {
      const modalidad = producto.modalidadDelivery;
      const config = producto.configDelivery;
      const subtotal = obtenerTotalCarrito();
      
      // Extraer distancia en kilómetros del string (ej: "2.5 km" -> 2.5)
      let distanciaKm = 0;
      if (distancia && typeof distancia === 'string') {
        const match = distancia.match(/([\d.]+)\s*km/i);
        if (match) {
          distanciaKm = parseFloat(match[1]);
        }
      }
      
      console.log('💰 Calculando costo de delivery:');
      console.log('  - Modalidad:', modalidad);
      console.log('  - Distancia:', distanciaKm, 'km');
      console.log('  - Subtotal:', subtotal);
      
      // Calcular costo base según modalidad
      let costoBase = 0;
      
      switch (modalidad) {
        case 'gratis':
          costoBase = 0;
          break;
          
        case 'por_distancia':
          // Interpretar rangos dinámicos
          if (config.rangos && Array.isArray(config.rangos)) {
            const rangos = config.rangos;
            
            // Ordenar rangos por distancia (de menor a mayor)
            const rangosOrdenados = rangos.sort((a, b) => parseFloat(a.hastaKm) - parseFloat(b.hastaKm));
            
            // Buscar en qué rango cae la distancia
            let costoEncontrado = false;
            
            for (let i = 0; i < rangosOrdenados.length; i++) {
              const rango = rangosOrdenados[i];
              const hastaKm = parseFloat(rango.hastaKm) || 0;
              const costo = parseInt(rango.costo) || 0;
              const desdeKm = i > 0 ? parseFloat(rangosOrdenados[i - 1].hastaKm) : 0;
              
              // Si es el último rango o la distancia es menor o igual
              if (i === rangosOrdenados.length - 1 || distanciaKm <= hastaKm) {
                console.log(`  📍 Rango ${i + 1}: ${desdeKm} - ${i === rangosOrdenados.length - 1 ? '∞' : hastaKm} km = $${costo}`);
                costoBase = costo;
                costoEncontrado = true;
                break;
              }
            }
            
            if (!costoEncontrado) {
              costoBase = 0;
            }
          } else {
            // Fallback a estructura antigua (por compatibilidad)
            costoBase = 0;
          }
          break;
          
        case 'fijo':
          costoBase = parseInt(config.costoFijo) || 0;
          console.log('  💵 Costo fijo:', costoBase);
          break;
          
        default:
          costoBase = 0;
      }
      
      // Aplicar regla adicional: "Gratis desde monto mínimo" (override si se cumple)
      if (config.gratisDesde && config.montoMinimoGratis) {
        const montoMinimo = parseInt(config.montoMinimoGratis) || 0;
        if (subtotal >= montoMinimo) {
          console.log(`  🎁 Regla adicional aplicada: Delivery gratis (pedido ≥ $${montoMinimo})`);
          return 0;
        }
      }
      
      return costoBase;
    }
    
    // FALLBACK: Si no tiene configuración avanzada, usar el método legacy
    if (producto.metodosEntrega.deliveryCosto && producto.metodosEntrega.deliveryCosto !== "Costo variable") {
      // Extraer el número del string (ej: "$2.000" -> 2000)
      const costoStr = producto.metodosEntrega.deliveryCosto.replace(/[$.]/g, '');
      return parseInt(costoStr) || 0;
    }
    
    return 0; // Si no hay costo definido o es variable
  }, [modoEntrega, producto.modalidadDelivery, producto.configDelivery, producto.metodosEntrega.deliveryCosto, distancia, obtenerTotalCarrito]);

  const obtenerTotalConDelivery = useCallback(() => {
    const subtotal = obtenerTotalCarrito();
    const costoDelivery = obtenerCostoDelivery();
    const totalSinDescuento = subtotal + costoDelivery;
    const totalFinal = totalSinDescuento - descuentoCupon;
    return Math.max(0, totalFinal); // Nunca menor a 0
  }, [obtenerTotalCarrito, obtenerCostoDelivery, descuentoCupon]);

  // Calcular descuento del cupón
  const calcularDescuentoCupon = useCallback((cupon) => {
    if (!cupon) {
      setDescuentoCupon(0);
      return;
    }

    const subtotal = obtenerTotalCarrito();
    
    switch (cupon.tipo_beneficio) {
      case 'descuento_porcentaje':
        const descuentoPorcentaje = Math.round((subtotal * cupon.valor) / 100);
        setDescuentoCupon(descuentoPorcentaje);
        break;
      case 'descuento_monto':
        setDescuentoCupon(Math.min(cupon.valor, subtotal)); // No puede ser mayor al subtotal
        break;
      case 'envio_gratis':
        setDescuentoCupon(obtenerCostoDelivery()); // Descuento equivalente al costo de delivery
        break;
      default:
        setDescuentoCupon(0);
    }
  }, [obtenerTotalCarrito, obtenerCostoDelivery]);

  // Actualizar descuento cuando cambia el cupón o el carrito
  useEffect(() => {
    if (cuponAplicado) {
      calcularDescuentoCupon(cuponAplicado);
    }
  }, [cuponAplicado, carritoRef.current, calcularDescuentoCupon]);

  // Función para aplicar cupón seleccionado desde CuponesScreen
  const aplicarCupon = (cupon) => {
    console.log('🎫 Aplicando cupón:', cupon);
    setCuponAplicado(cupon);
    calcularDescuentoCupon(cupon);
  };

  // Función para remover cupón
  const removerCupon = () => {
    setCuponAplicado(null);
    setDescuentoCupon(0);
  };

  // Función para cargar calificaciones del emprendimiento
  const cargarCalificaciones = useCallback(async () => {
    try {
      console.log('📊 Cargando calificaciones para emprendimiento:', emprendimientoIdReal);
      const response = await pedidoService.obtenerCalificacionEmprendimiento(emprendimientoIdReal);
      if (response.ok && response.calificacion) {
        console.log('✅ Calificaciones encontradas:', response.calificacion);
        // Mapear datos del backend al formato esperado por el frontend
        const calificacionesData = {
          totalVotantes: parseInt(response.calificacion.total_calificaciones) || 0,
          calificacionGeneral: parseFloat(response.calificacion.calificacion_promedio) || 0,
          criterios: {
            precio: { 
              promedio: parseFloat(response.calificacion.precio_promedio) || 0, 
              votantes: parseInt(response.calificacion.total_calificaciones) || 0 
            },
            calidad: { 
              promedio: parseFloat(response.calificacion.calidad_promedio) || 0, 
              votantes: parseInt(response.calificacion.total_calificaciones) || 0 
            },
            servicio: { 
              promedio: parseFloat(response.calificacion.servicio_promedio) || 0, 
              votantes: parseInt(response.calificacion.total_calificaciones) || 0 
            },
            tiempoEntrega: { 
              promedio: parseFloat(response.calificacion.tiempo_entrega_promedio) || 0, 
              votantes: parseInt(response.calificacion.total_calificaciones) || 0 
            }
          }
        };
        setCalificacionesData(calificacionesData);
      } else {
        console.log('ℹ️ No hay calificaciones previas, mostrando valores por defecto');
        // Datos por defecto si no existen calificaciones
        const calificacionesDefault = {
          totalVotantes: 0,
          calificacionGeneral: 0,
          criterios: {
            precio: { promedio: 0, votantes: 0 },
            calidad: { promedio: 0, votantes: 0 },
            servicio: { promedio: 0, votantes: 0 },
            tiempoEntrega: { promedio: 0, votantes: 0 }
          }
        };
        setCalificacionesData(calificacionesDefault);
      }
    } catch (error) {
      console.log('❌ Error al cargar calificaciones:', error);
      // Si hay error, establecer valores por defecto
      setCalificacionesData({
        totalVotantes: 0,
        calificacionGeneral: 0,
        criterios: {
          precio: { promedio: 0, votantes: 0 },
          calidad: { promedio: 0, votantes: 0 },
          servicio: { promedio: 0, votantes: 0 },
          tiempoEntrega: { promedio: 0, votantes: 0 }
        }
      });
    }
  }, [emprendimientoIdReal]);

  // Función para cargar productos del emprendimiento desde la API
  const cargarProductosEmprendimiento = useCallback(async () => {
    try {
      setCargandoProductos(true);
      console.log('📦 Cargando productos del emprendimiento:', emprendimientoIdReal);
      
      const { API_ENDPOINTS } = require('../config/api');
      const response = await fetch(API_ENDPOINTS.PRODUCTOS(emprendimientoIdReal));
      
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }
      
      const data = await response.json();
      if (data.ok && data.productos) {
        console.log('✅ Productos cargados:', data.productos.length);
        setProductosApi(data.productos);
      }
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      // Si falla, mantener productos vacíos
      setProductosApi([]);
    } finally {
      setCargandoProductos(false);
    }
  }, [emprendimientoIdReal]);

  // Función para renderizar estrellas con número de votantes
  const renderEstrellasConVotantes = () => {
    if (!calificacionesData) {
      return (
        <View style={styles.estrellasContainer}>
          <View style={styles.estrellasWrapper}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name="star-o"
                size={20}
                color="#DDD"
              />
            ))}
          </View>
          <View style={styles.ratingInfo}>
            <Text style={styles.ratingText}>0.0</Text>
            <Text style={styles.votantesText}>(Sin calificaciones)</Text>
          </View>
        </View>
      );
    }

    const { calificacionGeneral = 0, totalVotantes = 0 } = calificacionesData;
    
    return (
      <View style={styles.estrellasContainer}>
        <View style={styles.estrellasWrapper}>
          {[1, 2, 3, 4, 5].map((star) => {
            // Redondeo especial: 4.2 → 4, 4.3 → 4.5
            let rating = calificacionGeneral || 0;
            const decimal = rating - Math.floor(rating);
            if (decimal >= 0.3 && decimal < 0.7) {
              rating = Math.floor(rating) + 0.5;
            } else if (decimal < 0.3) {
              rating = Math.floor(rating);
            } else {
              rating = Math.ceil(rating);
            }

            if (star <= Math.floor(rating)) {
              // Estrella completa
              return (
                <FontAwesome
                  key={star}
                  name="star"
                  size={20}
                  color="#FFD700"
                />
              );
            } else if (star - 0.5 <= rating && rating < star) {
              // Media estrella
              return (
                <FontAwesome
                  key={star}
                  name="star-half-o"
                  size={20}
                  color="#FFD700"
                />
              );
            } else {
              // Estrella vacía
              return (
                <FontAwesome
                  key={star}
                  name="star-o"
                  size={20}
                  color="#DDD"
                />
              );
            }
          })}
        </View>
        <View style={styles.ratingInfo}>
          <Text style={styles.ratingText}>{(calificacionGeneral || 0).toFixed(1)}</Text>
          <Text style={styles.votantesText}>({totalVotantes} votos)</Text>
        </View>
      </View>
    );
  };

  const animatedValue = useRef(new Animated.Value(0)).current;

  // Función para registrar visualización del emprendimiento
  const registrarVisualizacion = useCallback(async () => {
    try {
      if (!emprendimientoIdReal) return;
      
      // Solo NO registrar si está en modo preview (dueño revisando su propio emprendimiento)
      if (isPreview) {
        console.log('👁️ Modo preview activo (dueño revisando) - No se registra visualización');
        return;
      }
      
      // En todos los demás casos, registrar (incluye clientes viendo locales cerrados)
      console.log('👁️ Registrando visualización del emprendimiento:', emprendimientoIdReal);
      
      const url = API_ENDPOINTS.REGISTRAR_VISUALIZACION(emprendimientoIdReal);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Visualización registrada');
      }
    } catch (error) {
      console.error('❌ Error al registrar visualización:', error);
    }
  }, [emprendimientoIdReal, isPreview]);

  // Función para verificar si el emprendimiento está en favoritos
  const verificarFavorito = useCallback(async () => {
    try {
      if (!emprendimientoIdReal) return;
      
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      console.log('⭐ Verificando si emprendimiento está en favoritos:', emprendimientoIdReal);
      
      const response = await fetch(API_ENDPOINTS.VERIFICAR_FAVORITO(emprendimientoIdReal), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.ok) {
        setEsFavorito(data.esFavorito);
        console.log('✅ Estado favorito:', data.esFavorito);
      }
    } catch (error) {
      console.error('❌ Error al verificar favorito:', error);
    }
  }, [emprendimientoIdReal]);

  // Función para toggle favorito
  const toggleFavorito = async () => {
    try {
      setCargandoFavorito(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Debes iniciar sesión para agregar favoritos');
        return;
      }

      if (esFavorito) {
        // Eliminar de favoritos
        console.log('🗑️ Eliminando de favoritos:', emprendimientoIdReal);
        const response = await fetch(API_ENDPOINTS.ELIMINAR_FAVORITO(emprendimientoIdReal), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        if (data.ok) {
          setEsFavorito(false);
          console.log('✅ Eliminado de favoritos');
        }
      } else {
        // Agregar a favoritos
        console.log('⭐ Agregando a favoritos:', emprendimientoIdReal);
        const response = await fetch(API_ENDPOINTS.AGREGAR_FAVORITO, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emprendimiento_id: emprendimientoIdReal }),
        });
        
        const data = await response.json();
        if (data.ok) {
          setEsFavorito(true);
          console.log('✅ Agregado a favoritos');
        }
      }
    } catch (error) {
      console.error('❌ Error al toggle favorito:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    } finally {
      setCargandoFavorito(false);
    }
  };

  useEffect(() => {
    // Validar teléfono SOLO si es cliente (o emprendedor en modo cliente) y NO está en modo preview
    const tipoEfectivo = getTipoUsuarioEfectivo ? getTipoUsuarioEfectivo() : usuario?.tipo_usuario;
    const esCliente = tipoEfectivo === 'cliente';
    
    if (!isPreview && esCliente && !usuario?.telefono) {
      console.log('⚠️ Cliente (o emprendedor en modo cliente) sin teléfono detectado - redirigiendo a verificación');
      navigation.navigate('IngresarTelefono', {
        onComplete: () => {
          console.log('✅ Teléfono verificado, actualizando datos');
        }
      });
      return;
    }

    // Cargar dirección desde el contexto de usuario
    if (direcciones && direccionSeleccionada && direcciones.length > 0) {
      const dirSeleccionada = direcciones.find((dir) => dir.id === direccionSeleccionada);
      if (dirSeleccionada) {
        // Buscar nombre de comuna si está disponible
        const direccionCompleta = dirSeleccionada.comuna 
          ? `${dirSeleccionada.direccion}, ${dirSeleccionada.comuna}`
          : dirSeleccionada.direccion;
        setDireccionUsuario(direccionCompleta);
      }
    }
    
    cargarCalificaciones(); // Cargar calificaciones al iniciar
    cargarProductosEmprendimiento(); // Cargar productos del emprendimiento
    registrarVisualizacion(); // Registrar visualización
    verificarFavorito(); // Verificar si está en favoritos
  }, [direcciones, direccionSeleccionada, cargarCalificaciones, cargarProductosEmprendimiento, registrarVisualizacion, verificarFavorito, usuario, isPreview, getTipoUsuarioEfectivo]);

  useEffect(() => {
    if (direccionUsuario) {
      console.log("Calculando distancia con:", direccionUsuario);
      obtenerDistancia();
      
      // Extraer comuna de la dirección para validar cobertura
      extraerComunaDireccion(direccionUsuario);
    }
  }, [direccionUsuario]);

  // Validar cobertura cuando cambia la comuna del cliente
  useEffect(() => {
    if (!comunaCliente || !producto.comunasCobertura || !Array.isArray(producto.comunasCobertura)) {
      return;
    }
    
    const coberturaActual = producto.comunasCobertura.includes(comunaCliente);
    
    console.log('🗺️ Validando cobertura de delivery:');
    console.log('  - Comuna del cliente:', comunaCliente);
    console.log('  - Comunas de cobertura:', producto.comunasCobertura);
    console.log('  - ¿Tiene cobertura?:', coberturaActual ? 'SÍ' : 'NO');
    
    setTieneCobertura(coberturaActual);
  }, [comunaCliente, producto.comunasCobertura]);
  
  // Cambiar a retiro si no hay cobertura (efecto separado para evitar loops)
  useEffect(() => {
    if (!tieneCobertura && modoEntrega === 'delivery' && comunaCliente) {
      console.log('⚠️ Sin cobertura, cambiando automáticamente a retiro en local');
      setModoEntrega('retiro');
    }
  }, [tieneCobertura]);

  // Función para extraer comuna de la dirección
  const extraerComunaDireccion = (direccion) => {
    if (!direccion) return;
    
    // Formato esperado: "Calle 123, Comuna, Región" o "Calle 123, Comuna"
    const partes = direccion.split(',');
    
    if (partes.length >= 2) {
      const comunaExtraida = partes[1].trim(); // Segunda parte es la comuna
      setComunaCliente(comunaExtraida);
      console.log('📍 Comuna extraída de la dirección:', comunaExtraida);
    } else {
      // Si no tiene formato estándar, intentar extraer última palabra
      const palabras = direccion.split(' ');
      if (palabras.length > 0) {
        setComunaCliente(palabras[palabras.length - 1]);
      }
    }
  };

  const obtenerDistancia = async () => {
    if (!direccionUsuario) {
      console.log("No hay dirección del usuario");
      setDistancia("Configura tu dirección en perfil");
      return;
    }

    try {
      setCargandoDistancia(true);
      const destino = producto.direccion;
      const apiKey = "AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4";

      const url = `https://maps.googleapis.com/maps/api/directions/json?destination=${encodeURIComponent(
        destino
      )}&origin=${encodeURIComponent(
        direccionUsuario
      )}&key=${apiKey}&units=metric`;

      console.log("URL de la API:", url);
      const response = await fetch(url);
      const data = await response.json();
      console.log("Respuesta API:", JSON.stringify(data));

      if (data.routes?.length > 0 && data.routes[0].legs?.length > 0) {
        const distancia =
          data.routes[0].legs[0].distance?.text || "No disponible";
        setDistancia(distancia);
      } else {
        setDistancia("No disponible");
        console.warn("No se encontraron rutas:", data);
      }
    } catch (error) {
      console.error("Error al obtener distancia:", error);
      setDistancia("Error al calcular");
    } finally {
      setCargandoDistancia(false);
    }
  };

  const abrirMapa = () => {
    const url = `https://www.google.com/maps/place/${producto.direccion}`;
    Linking.openURL(url);
  };

  const mostrarConfirmacionPedido = () => {
    // Validar si es propio emprendimiento
    const tipoEfectivo = getTipoUsuarioEfectivo ? getTipoUsuarioEfectivo() : usuario?.tipo_usuario;
    if (esPropioEmprendimiento && tipoEfectivo === 'cliente') {
      setAdvertenciaPropioNegocio(true);
      return;
    }
    
    if (carritoRef.current.length === 0) {
      Alert.alert(
        "Carrito vacío",
        "Agrega productos al carrito antes de enviar el pedido.",
        [{ text: "OK" }]
      );
      return;
    }
    setConfirmacionVisible(true);
  };

  const confirmarEnvioPedido = async () => {
    console.log('✅ CONFIRMANDO ENVÍO DE PEDIDO');
    setConfirmacionVisible(false);
    
    try {
      // Guardar el pedido (WebSocket actualizará automáticamente al emprendedor)
      await guardarPedido();
      console.log('✅ Pedido enviado exitosamente al emprendedor');
      
      // Limpiar el carrito local y contexto global
      carritoRef.current = [];
      limpiarCarrito();
      forceUpdate({});
      
      // Mostrar confirmación al usuario
      Alert.alert(
        '¡Pedido Enviado!',
        'Tu pedido ha sido enviado al emprendedor. Recibirás una notificación cuando lo confirme.',
        [{ text: 'Entendido' }]
      );
      
      // Volver a la pantalla anterior
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al confirmar pedido:', error);
      Alert.alert('Error', 'No se pudo enviar el pedido. Inténtalo de nuevo.');
    }
  };

  const guardarPedido = async () => {
    try {
      console.log('📤 Creando pedido en el backend...');
      console.log('🔍 producto.id:', producto.id);
      console.log('🔍 producto.nombre:', producto.nombre);
      console.log('🔍 carritoRef.current:', carritoRef.current);
      console.log('🔍 modoEntrega:', modoEntrega);
      console.log('🔍 direccionUsuario:', direccionUsuario);
      console.log('🔍 direcciones disponibles:', direcciones);
      console.log('🔍 direccionSeleccionada:', direccionSeleccionada);
      console.log('🔍 usuario.telefono:', usuario?.telefono);
      console.log('🔍 usuario.tipo_usuario:', usuario?.tipo_usuario);
      console.log('🔍 getTipoUsuarioEfectivo():', getTipoUsuarioEfectivo ? getTipoUsuarioEfectivo() : 'N/A');
      
      // Validación de seguridad: asegurar que hay dirección si es delivery
      if (modoEntrega === 'delivery' && !direccionUsuario) {
        console.error('❌ ERROR: Se seleccionó delivery pero no hay dirección de usuario');
        Alert.alert(
          'Error de Dirección',
          'No se pudo obtener tu dirección de entrega. Por favor verifica que tengas una dirección registrada.',
          [{ text: 'Entendido' }]
        );
        throw new Error('No hay dirección de usuario para delivery');
      }
      
      // Preparar datos para el backend
      const pedidoData = {
        emprendimiento_id: emprendimientoIdReal, // ✅ Usar ID real del emprendimiento (sin parte de producto)
        productos: carritoRef.current.map(item => ({
          producto_id: item.id,
          nombre: item.nombre || item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        })),
        direccion_entrega: modoEntrega === 'delivery' ? direccionUsuario : null,
        telefono_cliente: usuario?.telefono || null,
        modo_entrega: modoEntrega
      };

      console.log('📤 Datos del pedido completos:', JSON.stringify(pedidoData, null, 2));

      // Crear pedido en el backend
      const response = await pedidoService.crearPedido(pedidoData);
      
      if (response.ok) {
        console.log('✅ Pedido creado exitosamente:', response.pedido);
        
        // También guardar en AsyncStorage para el popup
        const fechaCreacion = new Date();
        const pedidoLocal = {
          id: Date.now().toString(),
          negocio: producto.nombre,
          fecha: fechaCreacion.toLocaleDateString('es-CL'),
          fechaHoraReserva: fechaCreacion.toISOString(),
          estado: 'pendiente',
          total: obtenerTotalCarrito(),
          direccion: direccionUsuario || 'Retiro en local',
          productos: carritoRef.current.map(item => ({
            nombre: item.nombre || item.descripcion,
            cantidad: item.cantidad,
            precio: item.precio
          })),
          modoEntrega: modoEntrega
        };

        const pedidosExistentes = await AsyncStorage.getItem('pedidosPendientes');
        const pedidos = pedidosExistentes ? JSON.parse(pedidosExistentes) : [];
        pedidos.push(pedidoLocal);
        await AsyncStorage.setItem('pedidosPendientes', JSON.stringify(pedidos));
        console.log('✅ Pedido guardado en AsyncStorage para el popup');
      } else {
        throw new Error(response.error || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('❌ Error al guardar pedido:', error);
      Alert.alert('Error', error.message || 'No se pudo crear el pedido. Inténtalo de nuevo.');
      throw error; // Lanzar el error para que no se abra WhatsApp si falla
    }
  };

  const abrirWhatsApp = () => {
    console.log('📱 INICIANDO ENVÍO DE WHATSAPP');
    console.log('📱 Carrito actual:', carritoRef.current);
    console.log('📱 Usuario:', usuario ? 'EXISTE' : 'NULL');
    console.log('📱 Modo entrega:', modoEntrega);
    console.log('📱 Dirección:', direccionUsuario);
    
    const numero = "+56994908047"; // 🔥 Número de WhatsApp del negocio (con código país)
    
    let mensaje = `🛍️ *NUEVO PEDIDO*\n\n`;
    mensaje += `👋 Hola ${producto.nombre}!\n\n`;
    mensaje += `👤 Cliente: *${usuario?.nombre?.trim() || 'Usuario'}*\n`;
    mensaje += `🚚 Entrega: *${modoEntrega === "delivery" ? "Delivery" : "Retiro en local"}*\n`;
    
    if (modoEntrega === "delivery" && direccionUsuario) {
      mensaje += `📍 Dirección: *${direccionUsuario}*\n`;
    }
    
    // Agregar detalle del carrito si hay items
    if (carritoRef.current.length > 0) {
      mensaje += `\n🛒 *Productos solicitados:*\n`;
      carritoRef.current.forEach((item, index) => {
        const subtotal = item.precio ? item.precio * item.cantidad : 0;
        mensaje += `${index + 1}. ${item.nombre || item.descripcion} (x${item.cantidad}) - $${subtotal.toLocaleString("es-CL")}\n`;
      });
      
      const total = obtenerTotalCarrito();
      mensaje += `\n💰 *TOTAL: $${total.toLocaleString("es-CL")}*`;
    }
    
    console.log('📱 Mensaje construido:', mensaje);
    
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    console.log('📱 URL de WhatsApp:', url);
    
    // Limpiar el carrito después de enviar el pedido
    console.log('📱 Limpiando carrito...');
    carritoRef.current = [];
    forceUpdate({});
    console.log('📱 Carrito limpiado');
    
    console.log('📱 Abriendo WhatsApp...');
    Linking.openURL(url);
    console.log('📱 WhatsApp abierto - POPUP DEBERÍA APARECER AHORA');
  };

  const llamarTelefono = () => {
    Linking.openURL(`tel:${producto.telefono}`);
  };

  useEffect(() => {
    obtenerDistancia();
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Sincronizar con el contexto global: si se limpia desde afuera, limpiar también localmente
  useEffect(() => {
    // Si el contexto global dice que NO hay carrito activo, pero localmente sí hay productos
    if (!carritoActivo && carritoRef.current.length > 0) {
      console.log('🧹 Limpiando carrito local porque el contexto global se limpió desde otra pantalla');
      carritoRef.current = [];
      forceUpdate({});
    }
  }, [carritoActivo]);

  // Verificar y sincronizar el carrito cada vez que la pantalla vuelve a estar en foco
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ PedidoDetalleScreen en foco - verificando sincronización del carrito');
      console.log('   carritoActivo (contexto):', carritoActivo);
      console.log('   carritoRef.current.length:', carritoRef.current.length);
      
      // Si el contexto global dice que NO hay carrito, pero localmente sí hay productos
      if (!carritoActivo && carritoRef.current.length > 0) {
        console.log('🧹 LIMPIEZA EN FOCUS: Sincronizando carrito local con contexto global (limpiando)');
        carritoRef.current = [];
        forceUpdate({});
      }
    }, [carritoActivo])
  );

  // Interceptar navegación hacia atrás si hay items en el carrito
  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      if (carritoRef.current.length > 0) {
        e.preventDefault();
        setNavegacionPendiente({ tipo: 'back', evento: e });
        setAdvertenciaVisible(true);
      }
    });

    return unsubscribeBeforeRemove;
  }, [navigation]);

  // Interceptar cambios de tab (menú inferior) si hay items en el carrito
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    const unsubscribeTabPress = parent.addListener('tabPress', (e) => {
      if (carritoRef.current.length > 0) {
        e.preventDefault();
        setNavegacionPendiente({ tipo: 'tab', evento: e });
        setAdvertenciaVisible(true);
      }
    });

    return () => {
      if (unsubscribeTabPress) {
        unsubscribeTabPress();
      }
    };
  }, [navigation]);

  // ✅ Horarios estáticos si no existen
  const horarios = producto.horarios ?? [
    "Lunes a Viernes: 10:00 AM - 8:00 PM",
    "Sábado: 11:00 AM - 6:00 PM",
    "Domingo: Cerrado",
  ];
  const estadoMapeado = mapearEstado(producto);
  const isOpen = estadoMapeado;

  // Funciones callback para ItemGaleria
  const handleImagenPress = useCallback((item) => {
    setImagenSeleccionada(item);
    setModalImagenVisible(true);
  }, []);

  const handleAgregarItem = useCallback((item, index, categoria) => {
    const itemId = `${categoria}-${index}-${item.nombre || item.descripcion}`;
    agregarAlCarrito({...item, id: itemId});
  }, []);

  const handleQuitarItem = useCallback((index, categoria) => {
    const item = imagenesPorCategoria[categoria][index];
    const itemId = `${categoria}-${index}-${item.nombre || item.descripcion}`;
    quitarDelCarrito(itemId);
  }, [imagenesPorCategoria]);

  const handleEliminarItem = useCallback((index, categoria) => {
    const item = imagenesPorCategoria[categoria][index];
    const itemId = `${categoria}-${index}-${item.nombre || item.descripcion}`;
    eliminarDelCarrito(itemId);
  }, [imagenesPorCategoria]);

  const obtenerCantidadItem = useCallback((index, categoria) => {
    const item = imagenesPorCategoria[categoria][index];
    const itemId = `${categoria}-${index}-${item.nombre || item.descripcion}`;
    return obtenerCantidadEnCarrito(itemId);
  }, [imagenesPorCategoria]);

  const renderHorarios = () => {
    if (!producto.horarios) return <Text style={styles.textoNoInfo}>Horario no disponible</Text>;
    
    if (Array.isArray(producto.horarios)) {
      return producto.horarios.map((horario, index) => (
        <Text key={index} style={styles.horarioTexto}>
          {horario}
        </Text>
      ));
    }
    
    // Si es objeto (formato por días)
    return Object.entries(producto.horarios).map(([dia, horariosDia]) => {
      if (!horariosDia || horariosDia.length === 0) return null;
      
      return (
        <Text key={dia} style={styles.horarioTexto}>
          {dia}: {horariosDia.map(h => `${h.inicio} - ${h.fin}`).join(', ')}
        </Text>
      );
    });
  };

  const formatHorariosForDisplay = (horarios) => {
    // Si horarios es undefined o null, devolver array vacío
    if (!horarios) return [];
    
    // Si ya es un array (formato antiguo), devolverlo tal cual
    if (Array.isArray(horarios)) return horarios;
    
    // Si es objeto (nuevo formato), convertirlo a array de strings
    const formatted = [];
    Object.entries(horarios).forEach(([dia, horariosDia]) => {
      if (horariosDia && horariosDia.length > 0) {
        const horariosStr = horariosDia.map(h => `${h.inicio} - ${h.fin}`).join(', ');
        formatted.push(`${dia}: ${horariosStr}`);
      }
    });
    
    return formatted.length > 0 ? formatted : ["Horario no definido"];
  };

  return (
    <LinearGradient
      colors={[currentTheme.background, currentTheme.background, currentTheme.background, currentTheme.primary]}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      {/* Modal de Reporte Mejorado */}
<Modal
  animationType="slide"
  transparent={true}
  visible={reportModalVisible}
  onRequestClose={() => {
          setReportModalVisible(false);
    setSelectedReportReason(null);
          setReporteDetalle('');
  }}
>
  <View style={styles.reportModalContainer}>
          <View style={[styles.reportModalContent, { backgroundColor: currentTheme.cardBackground }]}>
            {/* Header Moderno */}
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.reportModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.reportIconWrapper}>
                <Ionicons name="shield-checkmark" size={32} color="white" />
              </View>
              <View style={styles.reportHeaderTexts}>
                <Text style={styles.reportModalTitle}>Reportar Emprendimiento</Text>
                <Text style={styles.reportModalSubtitle}>
                  Ayúdanos a mantener veciApp segura
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reportCloseButton}
                onPress={() => {
                  setReportModalVisible(false);
                  setSelectedReportReason(null);
                  setReporteDetalle('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color="white" />
              </TouchableOpacity>
            </LinearGradient>
      
            <ScrollView 
              style={styles.reportOptionsContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.reportInstrucciones, { color: currentTheme.textSecondary }]}>
                Selecciona el motivo que mejor describa el problema:
              </Text>
              
              {reportReasons.map((reason) => {
                const isSelected = selectedReportReason === reason.id;
                return (
          <TouchableOpacity
            key={reason.id}
            style={[
                      styles.reportOptionModerna,
                      { backgroundColor: currentTheme.background, borderColor: currentTheme.border },
                      isSelected && { borderColor: reason.color, borderWidth: 2 }
            ]}
            onPress={() => setSelectedReportReason(reason.id)}
                    activeOpacity={0.7}
          >
                    <View style={[styles.reportOptionIcono, { backgroundColor: reason.color }]}>
                      <Ionicons name={reason.icono} size={22} color="white" />
            </View>
            <View style={styles.reportOptionTextContainer}>
                      <Text style={[styles.reportOptionTitleModerno, { color: currentTheme.text }]}>
                        {reason.title}
                      </Text>
                      <Text style={[styles.reportOptionDescriptionModerno, { color: currentTheme.textSecondary }]}>
                        {reason.description}
                      </Text>
            </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={reason.color} />
                    )}
          </TouchableOpacity>
                );
              })}

              {/* Campo de texto para "Otro" */}
              {selectedReportReason === 8 && (
                <View style={[styles.reportDetalleContainer, { backgroundColor: currentTheme.background }]}>
                  <Text style={[styles.reportDetalleLabel, { color: currentTheme.text }]}>
                    Describe el motivo (obligatorio):
                  </Text>
                  <TextInput
                    style={[styles.reportDetalleInput, { 
                      backgroundColor: currentTheme.cardBackground,
                      color: currentTheme.text,
                      borderColor: currentTheme.border
                    }]}
                    placeholder="Explica detalladamente el problema..."
                    placeholderTextColor={currentTheme.textSecondary}
                    multiline
                    numberOfLines={4}
                    value={reporteDetalle}
                    onChangeText={setReporteDetalle}
                    textAlignVertical="top"
                  />
                </View>
              )}
      </ScrollView>

            <View style={[styles.reportModalButtons, { borderTopColor: currentTheme.border }]}>
        <TouchableOpacity
                style={[styles.reportModalCancelButton, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
          onPress={() => {
            setReportModalVisible(false);
            setSelectedReportReason(null);
                  setReporteDetalle('');
          }}
                activeOpacity={0.8}
        >
                <Ionicons name="close-circle-outline" size={20} color={currentTheme.textSecondary} />
                <Text style={[styles.reportModalCancelButtonText, { color: currentTheme.textSecondary }]}>
                  Cancelar
                </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportModalSubmitButton,
                  (!selectedReportReason || (selectedReportReason === 8 && !reporteDetalle.trim())) && styles.reportModalSubmitButtonDisabled
          ]}
                disabled={!selectedReportReason || (selectedReportReason === 8 && !reporteDetalle.trim()) || enviandoReporte}
                onPress={enviarReporte}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  style={styles.reportSubmitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {enviandoReporte ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" />
                      <Text style={styles.reportModalSubmitButtonText}>Enviar Reporte</Text>
                    </>
                  )}
                </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      {/* Modal de Advertencia de Carrito */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={advertenciaVisible}
        onRequestClose={() => setAdvertenciaVisible(false)}
      >
        <View style={styles.advertenciaModalContainer}>
          <View style={styles.advertenciaModalContent}>
            {/* Header con gradiente */}
            <LinearGradient
              colors={['#f39c12', '#e67e22']}
              style={styles.advertenciaHeaderModerno}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.advertenciaIconoWrapper}>
                <Ionicons name="cart" size={32} color="white" />
                <View style={styles.advertenciaBadge}>
                  <Text style={styles.advertenciaBadgeTexto}>{obtenerCantidadTotalItems()}</Text>
            </View>
              </View>
              <View style={styles.advertenciaHeaderTextos}>
                <Text style={styles.advertenciaTituloModerno}>¡Carrito Activo!</Text>
                <Text style={styles.advertenciaSubtituloModerno}>
                  {obtenerCantidadTotalItems()} {obtenerCantidadTotalItems() === 1 ? 'producto' : 'productos'} en tu carrito
                </Text>
              </View>
            </LinearGradient>
            
            {/* Cuerpo del modal */}
            <View style={styles.advertenciaBody}>
              <View style={styles.advertenciaInfoBox}>
                <Ionicons name="information-circle" size={20} color="#f39c12" />
                <Text style={styles.advertenciaMensajeModerno}>
                  Si sales de esta pantalla, perderás todos los productos seleccionados.
            </Text>
              </View>
            
              {/* Botones modernos */}
              <View style={styles.advertenciaButtonsModerno}>
              <TouchableOpacity
                  style={styles.advertenciaCancelarModerno}
                  onPress={() => {
                    setAdvertenciaVisible(false);
                    setNavegacionPendiente(null);
                    cancelarNavegacionPendiente();
                  }}
                  activeOpacity={0.8}
              >
                  <Ionicons name="arrow-back-circle" size={22} color={currentTheme.primary} />
                  <Text style={[styles.advertenciaCancelarTextoModerno, { color: currentTheme.primary }]}>
                    Volver
                  </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                  style={styles.advertenciaSalirModerno}
                onPress={() => {
                    // Limpiar el carrito local y contexto global
                  carritoRef.current = [];
                    limpiarCarrito();
                  forceUpdate({});
                  setAdvertenciaVisible(false);
                    
                    // Ejecutar la navegación pendiente del contexto global si existe
                    if (navPendienteContexto) {
                      ejecutarNavegacionPendiente();
                      setNavegacionPendiente(null);
                    }
                    // Si no, ejecutar la navegación local pendiente
                    else if (navegacionPendiente) {
                      if (navegacionPendiente.tipo === 'back') {
                        navigation.dispatch(navegacionPendiente.evento.data.action);
                      } else if (navegacionPendiente.tipo === 'tab') {
                        const targetRoute = navegacionPendiente.evento.target?.split('-')[0];
                        if (targetRoute) {
                          navigation.getParent()?.navigate(targetRoute);
                        }
                      }
                      setNavegacionPendiente(null);
                    } else {
                  navigation.goBack();
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#e74c3c', '#c0392b']}
                    style={styles.advertenciaSalirGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
              >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.advertenciaSalirTextoModerno}>Vaciar</Text>
                  </LinearGradient>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación de Pedido */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmacionVisible}
        onRequestClose={() => setConfirmacionVisible(false)}
      >
        <View style={styles.confirmacionModalContainer}>
          <View style={[styles.confirmacionModalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <LinearGradient
              colors={[currentTheme.primary, currentTheme.secondary]}
              style={styles.confirmacionHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.confirmacionIconWrapper}>
                <Ionicons name="send" size={32} color="white" />
            </View>
              <View>
                <Text style={styles.confirmacionTitulo}>Confirmar Pedido</Text>
                <Text style={styles.confirmacionSubtitulo}>
                  Se enviará directamente al emprendedor
            </Text>
              </View>
            </LinearGradient>
            
            <View style={styles.confirmacionBody}>
            <View style={[styles.confirmacionResumen, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.confirmacionResumenTitulo, { color: currentTheme.text }]}>
                  📦 Resumen del pedido
                </Text>
              {carritoRef.current.map((item, index) => (
                  <View key={index} style={styles.confirmacionItemRow}>
                    <Text style={[styles.confirmacionItem, { color: currentTheme.text }]}>
                      {item.nombre || item.descripcion}
                </Text>
                    <Text style={[styles.confirmacionItemCantidad, { color: currentTheme.textSecondary }]}>
                      x{item.cantidad}
                    </Text>
                  </View>
                ))}
                <View style={[styles.confirmacionTotalRow, { borderTopColor: currentTheme.border }]}>
                  <Text style={[styles.confirmacionTotalLabel, { color: currentTheme.textSecondary }]}>
                    Total:
                  </Text>
                  <Text style={[styles.confirmacionTotal, { color: currentTheme.primary }]}>
                    ${obtenerTotalCarrito().toLocaleString("es-CL")}
              </Text>
                </View>
              </View>

              <View style={[styles.confirmacionInfo, { backgroundColor: currentTheme.primary + '10', borderLeftColor: currentTheme.primary }]}>
                <Ionicons name="information-circle" size={18} color={currentTheme.primary} />
                <Text style={[styles.confirmacionInfoTexto, { color: currentTheme.primary }]}>
                  El emprendedor recibirá tu pedido al instante y te notificará cuando lo confirme
                </Text>
              </View>
            </View>
            
            <View style={styles.confirmacionButtons}>
              <TouchableOpacity
                style={[styles.confirmacionCancelar, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}
                onPress={() => setConfirmacionVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={20} color={currentTheme.textSecondary} />
                <Text style={[styles.confirmacionCancelarTexto, { color: currentTheme.textSecondary }]}>
                  Revisar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmacionEnviar}
                onPress={confirmarEnvioPedido}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.confirmacionEnviarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.confirmacionEnviarTexto}>Confirmar Pedido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Advertencia - Propio Negocio */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={advertenciaPropioNegocio}
        onRequestClose={() => setAdvertenciaPropioNegocio(false)}
      >
        <View style={styles.advertenciaModalContainer}>
          <View style={styles.advertenciaModalContent}>
            {/* Header con gradiente */}
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.advertenciaHeaderModerno}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.advertenciaIconoWrapper}>
                <Ionicons name="close-circle" size={48} color="white" />
              </View>
              <View style={styles.advertenciaHeaderTextos}>
                <Text style={styles.advertenciaTituloModerno}>¡No puedes comprar aquí!</Text>
                <Text style={styles.advertenciaSubtituloModerno}>
                  Este es tu propio emprendimiento
                </Text>
              </View>
            </LinearGradient>
            
            {/* Cuerpo del modal */}
            <View style={styles.advertenciaBody}>
              <View style={[styles.advertenciaInfoBox, { backgroundColor: '#fee', borderLeftColor: '#e74c3c' }]}>
                <Ionicons name="alert-circle" size={24} color="#e74c3c" />
                <Text style={[styles.advertenciaMensajeModerno, { color: '#c0392b' }]}>
                  No puedes realizar pedidos en tus propios emprendimientos mientras estás en modo cliente.
                </Text>
              </View>

              <View style={[styles.advertenciaInfoBox, { backgroundColor: '#e8f4f8', borderLeftColor: '#3498db' }]}>
                <Ionicons name="information-circle" size={20} color="#3498db" />
                <Text style={[styles.advertenciaMensajeModerno, { color: '#2c3e50', fontSize: 13 }]}>
                  💡 <Text style={{ fontWeight: '700' }}>Consejo:</Text> Vuelve a tu vista de emprendedor para gestionar este negocio o explora otros emprendimientos para comprar.
                </Text>
              </View>

              {/* Botón de cerrar */}
              <TouchableOpacity
                style={styles.advertenciaBotonEntendido}
                onPress={() => setAdvertenciaPropioNegocio(false)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.advertenciaBotonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.advertenciaBotonTexto}>Entendido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal del Carrito */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mostrarCarrito}
        onRequestClose={() => setMostrarCarrito(false)}
      >
        <View style={styles.carritoModalContainer}>
          <View style={[styles.carritoModalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={[styles.carritoHeader, { borderBottomColor: currentTheme.border }]}>
              <Text style={[styles.carritoTitulo, { color: currentTheme.text }]}>Mi Carrito</Text>
              <TouchableOpacity
                style={styles.carritoCerrar}
                onPress={() => setMostrarCarrito(false)}
              >
                <FontAwesome name="times" size={24} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.carritoLista} showsVerticalScrollIndicator={false}>
              {carritoRef.current.length === 0 ? (
                <View style={styles.carritoVacio}>
                  <Ionicons name="cart-outline" size={64} color={currentTheme.textSecondary} />
                  <Text style={[styles.carritoVacioTexto, { color: currentTheme.text }]}>Tu carrito está vacío</Text>
                  <Text style={[styles.carritoVacioSubtexto, { color: currentTheme.textSecondary }]}>Agrega productos para comenzar tu pedido</Text>
                </View>
              ) : (
                <>
                  {carritoRef.current.map((item) => (
                  <View key={item.id} style={[styles.carritoItem, { borderBottomColor: currentTheme.border }]}>
                    <View style={styles.carritoItemInfo}>
                      <Text style={[styles.carritoItemNombre, { color: currentTheme.text }]}>{item.nombre || item.descripcion}</Text>
                      <Text style={[styles.carritoItemPrecio, { color: currentTheme.textSecondary }]}>
                          ${item.precio ? Math.round(item.precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.') : "Consulte"} c/u
                      </Text>
                    </View>
                    
                    <View style={styles.carritoItemControls}>
                      <TouchableOpacity
                        style={[styles.carritoBotonCantidad, { borderColor: currentTheme.primary }]}
                        onPress={() => quitarDelCarrito(item.id)}
                      >
                          <Ionicons name="remove" size={16} color={currentTheme.primary} />
                      </TouchableOpacity>
                      <Text style={[styles.carritoCantidad, { color: currentTheme.text }]}>{item.cantidad}</Text>
                      <TouchableOpacity
                        style={[styles.carritoBotonCantidad, { borderColor: currentTheme.primary }]}
                        onPress={() => agregarAlCarrito(item)}
                      >
                          <Ionicons name="add" size={16} color={currentTheme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.carritoBotonEliminar}
                        onPress={() => eliminarDelCarrito(item.id)}
                      >
                          <Ionicons name="trash" size={14} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  ))}
                </>
              )}
            </ScrollView>

            {carritoRef.current.length > 0 && (
              <View style={[styles.carritoFooter, { borderTopColor: currentTheme.border }]}>
                <View style={styles.carritoTotalContainer}>
                  <View>
                    <Text style={[styles.carritoTotalLabel, { color: currentTheme.textSecondary }]}>
                      Total del pedido
                    </Text>
                  <Text style={[styles.carritoTotalTexto, { color: currentTheme.primary }]}>
                      ${obtenerTotalCarrito().toLocaleString("es-CL")}
                  </Text>
                </View>
                <TouchableOpacity
                    style={styles.carritoBotonPedidoModerno}
                  onPress={() => {
                    setMostrarCarrito(false);
                      setMostrarConfirmacionEntrega(true);
                  }}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                      colors={[currentTheme.primary, currentTheme.secondary]}
                      style={styles.botonPedidoGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="arrow-forward" size={20} color="white" />
                      <Text style={styles.carritoBotonPedidoTextoModerno}>Siguiente</Text>
                    </LinearGradient>
                </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Nuevo Modal de Confirmación de Entrega */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mostrarConfirmacionEntrega}
        onRequestClose={() => setMostrarConfirmacionEntrega(false)}
      >
        <View style={styles.carritoModalContainer}>
          <View style={[styles.carritoModalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={[styles.carritoHeader, { borderBottomColor: currentTheme.border }]}>
              <TouchableOpacity
                style={styles.botonVolverModal}
                onPress={() => {
                  setMostrarConfirmacionEntrega(false);
                  setMostrarCarrito(true);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
              </TouchableOpacity>
              <Text style={[styles.carritoTitulo, { color: currentTheme.text }]}>Confirmar Pedido</Text>
              <TouchableOpacity
                style={styles.carritoCerrar}
                onPress={() => setMostrarConfirmacionEntrega(false)}
              >
                <FontAwesome name="times" size={24} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.carritoLista} showsVerticalScrollIndicator={false}>
              {/* Opciones de Entrega */}
              <View style={[styles.entregaEnModal, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.modalSeccionTitulo, { color: currentTheme.text }]}>
                  🚚 Opciones de Entrega
                </Text>
                
                {/* Mensaje de advertencia si no hay cobertura */}
                {producto.metodosEntrega.delivery && !tieneCobertura && comunaCliente && (
                  <View style={[styles.advertenciaCobertura, { backgroundColor: '#fff3cd', borderLeftColor: '#f39c12' }]}>
                    <Ionicons name="alert-circle" size={20} color="#f39c12" />
                    <Text style={styles.advertenciaCoberturaTexto}>
                      No hay cobertura de delivery para <Text style={{ fontWeight: '700' }}>{comunaCliente}</Text>. 
                      Solo puedes hacer retiro en local.
                    </Text>
                  </View>
                )}
                
                <View style={styles.selectorContainerModal}>
                  {producto.metodosEntrega.delivery && (
                    <TouchableOpacity
                      style={styles.selectorBotonModal}
                      onPress={() => tieneCobertura && cambiarModoEntrega("delivery")}
                      activeOpacity={tieneCobertura ? 0.8 : 1}
                      disabled={!tieneCobertura}
                    >
                      {modoEntrega === "delivery" ? (
                        <LinearGradient
                          colors={[currentTheme.primary, currentTheme.secondary]}
                          style={styles.selectorGradientModal}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Ionicons name="bicycle" size={22} color="white" />
                          <View style={styles.selectorTextoContainerModal}>
                            <Text style={styles.selectorTextoSeleccionadoModal}>Delivery</Text>
                            <Text style={styles.selectorSubtextoSeleccionadoModal}>
                              {producto.metodosEntrega.deliveryCosto || "Costo variable"}
                            </Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                        </LinearGradient>
                      ) : (
                        <View style={[
                          styles.selectorNoSeleccionadoModal, 
                          { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border },
                          !tieneCobertura && styles.selectorDeshabilitado
                        ]}>
                          <Ionicons name="bicycle-outline" size={22} color={tieneCobertura ? currentTheme.textSecondary : '#bdc3c7'} />
                          <View style={styles.selectorTextoContainerModal}>
                            <Text style={[styles.selectorTextoNoSeleccionadoModal, { color: tieneCobertura ? currentTheme.text : '#bdc3c7' }]}>
                              Delivery {!tieneCobertura && '(Sin cobertura)'}
                            </Text>
                            <Text style={[styles.selectorSubtextoNoSeleccionadoModal, { color: tieneCobertura ? currentTheme.textSecondary : '#bdc3c7' }]}>
                              {!tieneCobertura ? 'No disponible en tu comuna' : (producto.metodosEntrega.deliveryCosto || "Costo variable")}
                            </Text>
                          </View>
                          {!tieneCobertura && (
                            <Ionicons name="close-circle" size={20} color="#e74c3c" />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {producto.metodosEntrega.retiro && (
                    <TouchableOpacity
                      style={styles.selectorBotonModal}
                      onPress={() => cambiarModoEntrega("retiro")}
                      activeOpacity={0.8}
                    >
                      {modoEntrega === "retiro" ? (
                        <LinearGradient
                          colors={[currentTheme.primary, currentTheme.secondary]}
                          style={styles.selectorGradientModal}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Ionicons name="bag-handle" size={22} color="white" />
                          <View style={styles.selectorTextoContainerModal}>
                            <Text style={styles.selectorTextoSeleccionadoModal}>Retiro en Local</Text>
                            <Text style={styles.selectorSubtextoSeleccionadoModal}>Sin costo adicional</Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                        </LinearGradient>
                      ) : (
                        <View style={[styles.selectorNoSeleccionadoModal, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}>
                          <Ionicons name="bag-handle-outline" size={22} color={currentTheme.textSecondary} />
                          <View style={styles.selectorTextoContainerModal}>
                            <Text style={[styles.selectorTextoNoSeleccionadoModal, { color: currentTheme.text }]}>Retiro en Local</Text>
                            <Text style={[styles.selectorSubtextoNoSeleccionadoModal, { color: currentTheme.textSecondary }]}>Sin costo adicional</Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Información de Dirección si es Delivery */}
                {modoEntrega === "delivery" && direccionUsuario && (
                  <View style={[styles.direccionInfoBox, { backgroundColor: currentTheme.primary + '10', borderLeftColor: currentTheme.primary }]}>
                    <Ionicons name="location" size={18} color={currentTheme.primary} />
                    <View style={styles.direccionInfoTextos}>
                      <Text style={[styles.direccionInfoLabel, { color: currentTheme.textSecondary }]}>
                        Dirección de entrega:
                      </Text>
                      <Text style={[styles.direccionInfoTexto, { color: currentTheme.text }]}>
                        {direccionUsuario}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Medios de Pago */}
              <View style={[styles.mediosPagoEnModal, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.modalSeccionTitulo, { color: currentTheme.text }]}>
                  💳 Aceptamos
                </Text>
                <View style={styles.metodosPagoListaModal}>
                  {producto.metodosPago.tarjeta && (
                    <View style={styles.metodoPagoItemModal}>
                      <Ionicons name="card" size={16} color="#3498db" />
                      <Text style={[styles.metodoPagoTextoModal, { color: currentTheme.textSecondary }]}>
                        Tarjeta de crédito/débito
                      </Text>
                    </View>
                  )}
                  {producto.metodosPago.efectivo && (
                    <View style={styles.metodoPagoItemModal}>
                      <Ionicons name="cash" size={16} color="#27ae60" />
                      <Text style={[styles.metodoPagoTextoModal, { color: currentTheme.textSecondary }]}>
                        Efectivo
                      </Text>
                    </View>
                  )}
                  {producto.metodosPago.transferencia && (
                    <View style={styles.metodoPagoItemModal}>
                      <Ionicons name="swap-horizontal" size={16} color="#9b59b6" />
                      <Text style={[styles.metodoPagoTextoModal, { color: currentTheme.textSecondary }]}>
                        Transferencia bancaria
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Cupón de Descuento */}
              <View style={[styles.cuponEnModal, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.modalSeccionTitulo, { color: currentTheme.text }]}>
                  🎫 Cupón de Descuento
                </Text>
                
                {cuponAplicado ? (
                  <View style={[styles.cuponAplicadoBox, { backgroundColor: currentTheme.cardBackground, borderColor: '#27ae60' }]}>
                    <View style={styles.cuponAplicadoHeader}>
                      <View style={styles.cuponAplicadoIcono}>
                        <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
                      </View>
                      <View style={styles.cuponAplicadoInfo}>
                        <Text style={[styles.cuponAplicadoCodigo, { color: currentTheme.text }]}>
                          {cuponAplicado.codigo || 'CUPÓN'}
                        </Text>
                        <Text style={[styles.cuponAplicadoDescripcion, { color: '#27ae60' }]}>
                          {cuponAplicado.descripcion}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cuponRemover}
                        onPress={removerCupon}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={24} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cuponBotonAgregar}
                    onPress={() => {
                      navigation.navigate('Cupones', {
                        modoSeleccion: true,
                        emprendimientoId: emprendimientoIdReal,
                        onCuponSeleccionado: aplicarCupon
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[currentTheme.primary + '20', currentTheme.secondary + '20']}
                      style={styles.cuponBotonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="add-circle" size={20} color={currentTheme.primary} />
                      <Text style={[styles.cuponBotonTexto, { color: currentTheme.primary }]}>
                        Aplicar Cupón
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={currentTheme.primary} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Resumen del Pedido */}
              <View style={[styles.resumenPedidoBox, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.modalSeccionTitulo, { color: currentTheme.text }]}>
                  📦 Resumen del Pedido
                </Text>
                
                <View style={styles.resumenLinea}>
                  <Text style={[styles.resumenLabel, { color: currentTheme.textSecondary }]}>
                    Subtotal ({obtenerCantidadTotalItems()} productos)
                  </Text>
                  <Text style={[styles.resumenValor, { color: currentTheme.text }]}>
                    ${obtenerTotalCarrito().toLocaleString("es-CL")}
                  </Text>
                </View>

                {modoEntrega === "delivery" && (
                  <View>
                    <View style={styles.resumenLinea}>
                      <Text style={[styles.resumenLabel, { color: currentTheme.textSecondary }]}>
                        Costo de Delivery
                        {distancia && ` (${distancia})`}
                      </Text>
                      <Text style={[styles.resumenValor, { color: obtenerCostoDelivery() === 0 ? '#27ae60' : currentTheme.text }]}>
                        {obtenerCostoDelivery() === 0 ? '¡Gratis!' : `$${obtenerCostoDelivery().toLocaleString("es-CL")}`}
                      </Text>
                    </View>
                    {producto.modalidadDelivery && obtenerCostoDelivery() === 0 && producto.modalidadDelivery === 'gratis_desde' && (
                      <Text style={[styles.deliveryInfo, { color: '#27ae60' }]}>
                        ✨ Delivery gratis alcanzado
                      </Text>
                    )}
                  </View>
                )}

                {cuponAplicado && descuentoCupon > 0 && (
                  <View style={styles.resumenLinea}>
                    <Text style={[styles.resumenLabel, { color: '#27ae60' }]}>
                      🎫 Descuento ({cuponAplicado.codigo || 'Cupón'})
                    </Text>
                    <Text style={[styles.resumenValor, { color: '#27ae60' }]}>
                      -${descuentoCupon.toLocaleString("es-CL")}
                    </Text>
                  </View>
                )}

                <View style={[styles.resumenLineaTotal, { borderTopColor: currentTheme.border }]}>
                  <Text style={[styles.resumenLabelTotal, { color: currentTheme.text }]}>
                    Total
                  </Text>
                  <Text style={[styles.resumenValorTotal, { color: currentTheme.primary }]}>
                    ${obtenerTotalConDelivery().toLocaleString("es-CL")}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.carritoFooter, { borderTopColor: currentTheme.border }]}>
              <TouchableOpacity
                style={styles.carritoBotonConfirmarModerno}
                onPress={() => {
                  setMostrarConfirmacionEntrega(false);
                  mostrarConfirmacionPedido();
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonPedidoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.carritoBotonPedidoTextoModerno}>Confirmar Pedido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalImagenVisible}
        onRequestClose={() => setModalImagenVisible(false)}
      >
        <View style={styles.modalImagenContainer}>
          <TouchableOpacity
            style={styles.modalImagenFondo}
            activeOpacity={1}
            onPress={() => setModalImagenVisible(false)}
          >
            <View style={styles.modalImagenContent}>
              {imagenSeleccionada && (
                <>
                  <Image
                    source={imagenSeleccionada.imagen}
                    style={styles.imagenExpandida}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    style={styles.botonCerrarImagen}
                    onPress={() => setModalImagenVisible(false)}
                  >
                    <FontAwesome name="times" size={24} color="white" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Título con ícono */}
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitulo, { color: currentTheme.primary }]}>⏰ Horarios de Atención</Text>
      </View>

      {/* Lista de horarios */}
        {formatHorariosForDisplay(horarios).map((horario, index) => (
        <Text key={index} style={[styles.horarioTexto, { color: currentTheme.text }]}>
          {horario}
        </Text>
      ))}

      {/* Botón de cierre */}
      <TouchableOpacity
        style={[styles.botonCerrar, { backgroundColor: currentTheme.primary }]}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.botonCerrarTexto}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* ✅ Imagen de fondo */}
      <View style={styles.imageContainer}>
        <Image
          source={
            producto.imagen
          }
          style={styles.imagenFondo}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.8)", "white"]}
          locations={[0.6, 0.8, 1]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Navbar Superior Moderna */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.botonNavModerno}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.5)']}
            style={styles.botonNavGradient}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {!isPreview && (
          <View style={styles.rightButtonsContainer}>
            <TouchableOpacity
              style={styles.botonNavModerno}
              onPress={() => setReportModalVisible(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,193,7,0.85)', 'rgba(255,152,0,0.85)']}
                style={styles.botonNavGradient}
            >
                <Ionicons name="flag" size={22} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.botonNavModerno, esFavorito && styles.botonFavoritoActivo]}
              onPress={toggleFavorito}
              disabled={cargandoFavorito}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={esFavorito ? ['rgba(231,76,60,1)', 'rgba(192,57,43,1)'] : ['rgba(231,76,60,0.85)', 'rgba(192,57,43,0.85)']}
                style={styles.botonNavGradient}
            >
              {cargandoFavorito ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                  <Ionicons 
                    name={esFavorito ? "heart" : "heart-outline"} 
                    size={22} 
                  color="white" 
                />
              )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ✅ Contenedor superpuesto */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.contenedorSuperpuesto, { backgroundColor: currentTheme.cardBackground }]}>
          {/* Header del Emprendimiento Moderno */}
          <View style={styles.emprendimientoHeaderModerno}>
            <View style={styles.logoWrapper}>
            <Image
                source={producto.logo}
                style={styles.logoModerno}
              />
              <View style={[
                styles.estadoBadgeFloat,
                {
                  backgroundColor: isOpen === "Abierto" 
                    ? "#27ae60" 
                    : isOpen === "Cierra Pronto"
                    ? "#f39c12"
                    : "#e74c3c"
                }
              ]}>
                <Animated.View
                  style={[
                    styles.puntitoPulso,
                    {
                      opacity: isOpen === "Abierto" || isOpen === "Cierra Pronto" ? animatedValue : 1,
                    },
                  ]}
                />
            </View>
          </View>

            <View style={styles.infoHeaderModerno}>
              <Text style={[styles.nombreModerno, { color: currentTheme.text }]} numberOfLines={2}>
                {producto.nombre}
              </Text>
          
              {renderEstrellasConVotantes()}
              
              <View style={styles.metasContainer}>
                <View style={[
                  styles.estadoBadgeModerno,
                {
                    backgroundColor: isOpen === "Abierto" 
                      ? "#27ae60" + '15' 
                      : isOpen === "Cierra Pronto"
                      ? "#f39c12" + '15'
                      : "#e74c3c" + '15'
                  }
                ]}>
                  <Ionicons 
                    name={isOpen === "Abierto" ? "checkmark-circle" : "time"} 
                    size={14} 
                    color={
                    isOpen === "Abierto"
                        ? "#27ae60" 
                      : isOpen === "Cierra Pronto"
                        ? "#f39c12"
                        : "#e74c3c"
                    } 
            />
                  <Text style={[
                    styles.estadoTextoModerno,
                  {
                      color: isOpen === "Abierto" 
                        ? "#27ae60" 
                        : isOpen === "Cierra Pronto"
                        ? "#f39c12"
                        : "#e74c3c"
                    }
                  ]}>
                {estadoMapeado}
              </Text>
            </View>
                
                {distancia && (
                  <View style={[styles.distanciaBadgeModerno, { backgroundColor: currentTheme.primary + '15' }]}>
                    <Ionicons name="location" size={14} color={currentTheme.primary} />
                    <Text style={[styles.distanciaTextoModerno, { color: currentTheme.primary }]}>
                      {cargandoDistancia ? "..." : distancia}
                    </Text>
          </View>
                )}
              </View>
            </View>
          </View>

          {/* Descripción */}
          {producto.descripcion && (
            <View style={[styles.descripcionCard, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.descripcionModerna, { color: currentTheme.textSecondary }]}>
                {producto.descripcion}
            </Text>
          </View>
          )}

          {/* Descripción Larga - Sobre el Negocio */}
          {producto.descripcionLarga && (
            <View style={[styles.descripcionLargaCard, { backgroundColor: currentTheme.background }]}>
              <View style={styles.seccionHeaderContent}>
                <View style={[styles.seccionIconWrapper, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Ionicons name="document-text" size={20} color={currentTheme.primary} />
                </View>
                <Text style={[styles.seccionTituloModerno, { color: currentTheme.text }]}>
                  Sobre el Negocio
                </Text>
              </View>
              <Text style={[styles.descripcionLargaTexto, { color: currentTheme.textSecondary }]}>
                {producto.descripcionLarga}
              </Text>
            </View>
          )}

          {/* Información de Contacto Moderna */}
          <TouchableOpacity
            style={[styles.seccionHeaderModerno, { backgroundColor: currentTheme.background }]}
            onPress={() => setContactoAbierto(!contactoAbierto)}
            activeOpacity={0.7}
          >
            <View style={styles.seccionHeaderContent}>
              <View style={[styles.seccionIconWrapper, { backgroundColor: currentTheme.primary + '20' }]}>
                <Ionicons name="information-circle" size={20} color={currentTheme.primary} />
              </View>
              <Text style={[styles.seccionTituloModerno, { color: currentTheme.text }]}>
              Información de Contacto
            </Text>
            </View>
            <Ionicons
              name={contactoAbierto ? "chevron-up" : "chevron-down"}
              size={24}
              color={currentTheme.primary}
            />
          </TouchableOpacity>

          {contactoAbierto && (
            <View style={[styles.contactoContainerModerno, { backgroundColor: currentTheme.background }]}>
              <TouchableOpacity
                style={[styles.contactoItemModerno, { borderBottomColor: currentTheme.border }]}
                onPress={llamarTelefono}
                activeOpacity={0.7}
              >
                <View style={[styles.contactoIconContainer, { backgroundColor: '#3498db' + '20' }]}>
                  <Ionicons name="call" size={20} color="#3498db" />
                </View>
                <View style={styles.contactoTextoContainer}>
                  <Text style={[styles.contactoLabelModerno, { color: currentTheme.textSecondary }]}>
                    Teléfono
                </Text>
                  <Text style={[styles.contactoValueModerno, { color: currentTheme.text }]}>
                    {producto.telefono}
                  </Text>
              </View>
                <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
              </TouchableOpacity>

                <TouchableOpacity
                style={[styles.contactoItemModerno, { borderBottomColor: currentTheme.border }]}
                onPress={abrirMapa}
                activeOpacity={0.7}
                >
                <View style={[styles.contactoIconContainer, { backgroundColor: '#e74c3c' + '20' }]}>
                  <Ionicons name="location" size={20} color="#e74c3c" />
                </View>
                <View style={styles.contactoTextoContainer}>
                  <Text style={[styles.contactoLabelModerno, { color: currentTheme.textSecondary }]}>
                    Dirección
                    </Text>
                  <Text style={[styles.contactoValueModerno, { color: currentTheme.text }]} numberOfLines={2}>
                    {producto.direccion}
                    </Text>
                  </View>
                <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.contactoItemModerno}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.contactoIconContainer, { backgroundColor: '#f39c12' + '20' }]}>
                  <Ionicons name="time" size={20} color="#f39c12" />
                </View>
                <View style={styles.contactoTextoContainer}>
                  <Text style={[styles.contactoLabelModerno, { color: currentTheme.textSecondary }]}>
                    Horarios
                    </Text>
                  <Text style={[styles.contactoValueModerno, { color: currentTheme.text }]}>
                    Ver horarios de atención
                    </Text>
                  </View>
                <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
                </TouchableOpacity>
            </View>
          )}

          {/* Sección de Productos/Servicios Moderna */}
          <View style={styles.seccionProductosModerna}>
              {/* Sección Principal */}
              {imagenesPorCategoria.principal.length > 0 && (
                <>
                  <View style={styles.headerSeccionModerna}>
                    <LinearGradient
                      colors={['#f39c12', '#e67e22']}
                      style={styles.headerSeccionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.iconoSeccionModerno}>
                        <Ionicons name="star" size={20} color="white" />
                    </View>
                      <Text style={styles.tituloSeccionModerna}>Productos Destacados</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{imagenesPorCategoria.principal.length}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galeriaScroll}
                  >
                    {imagenesPorCategoria.principal.map((item, index) => (
                      <ItemGaleria 
                        key={`principal-${index}`} 
                        item={item} 
                        index={index} 
                        categoria="principal"
                        onImagenPress={handleImagenPress}
                        onAgregar={handleAgregarItem}
                        onQuitar={handleQuitarItem}
                        onEliminar={handleEliminarItem}
                        cantidadEnCarrito={obtenerCantidadItem(index, "principal")}
                        theme={currentTheme}
                        isPreview={isPreview}
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Sección Ofertas */}
              {imagenesPorCategoria.oferta.length > 0 && (
                <>
                  <View style={styles.headerSeccionModerna}>
                    <LinearGradient
                      colors={['#e74c3c', '#c0392b']}
                      style={styles.headerSeccionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.iconoSeccionModerno}>
                        <Ionicons name="pricetag" size={20} color="white" />
                    </View>
                      <Text style={styles.tituloSeccionModerna}>Ofertas Imperdibles</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{imagenesPorCategoria.oferta.length}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galeriaScroll}
                  >
                    {imagenesPorCategoria.oferta.map((item, index) => (
                      <ItemGaleria 
                        key={`oferta-${index}`} 
                        item={item} 
                        index={index} 
                        categoria="oferta"
                        onImagenPress={handleImagenPress}
                        onAgregar={handleAgregarItem}
                        onQuitar={handleQuitarItem}
                        onEliminar={handleEliminarItem}
                        cantidadEnCarrito={obtenerCantidadItem(index, "oferta")}
                        theme={currentTheme}
                        isPreview={isPreview}
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Sección Complementos */}
              {imagenesPorCategoria.secundario.length > 0 && (
                <>
                  <View style={styles.headerSeccionModerna}>
                    <LinearGradient
                      colors={[currentTheme.primary, currentTheme.secondary]}
                      style={styles.headerSeccionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.iconoSeccionModerno}>
                        <Ionicons name="add-circle" size={20} color="white" />
                    </View>
                      <Text style={styles.tituloSeccionModerna}>Productos Adicionales</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{imagenesPorCategoria.secundario.length}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.galeriaGrid}>
                    {imagenesPorCategoria.secundario.map((item, index) => (
                      <ItemGaleria 
                        key={`secundario-${index}`} 
                        item={item} 
                        index={index} 
                        categoria="secundario"
                        onImagenPress={handleImagenPress}
                        onAgregar={handleAgregarItem}
                        onQuitar={handleQuitarItem}
                        onEliminar={handleEliminarItem}
                        cantidadEnCarrito={obtenerCantidadItem(index, "secundario")}
                        theme={currentTheme}
                        isPreview={isPreview}
                      />
                    ))}
                  </View>
                </>
              )}
          </View>
        </View>
      </ScrollView>

      {/* Botón FAB Carrito Flotante - Solo cuando hay productos */}
      {!isPreview && obtenerCantidadTotalItems() > 0 && (
        <TouchableOpacity
          style={styles.fabPedido}
          onPress={() => setMostrarCarrito(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="cart" size={32} color="white" />
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeTexto}>{obtenerCantidadTotalItems()}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 120,
    backgroundColor: "#FAFAF9",
  },
  imageContainer: {
    position: "absolute",
    width: "110%",
    height: "30%", // Ajusta según necesites
    top: -10,
    alignSelf: "center",
    overflow: "hidden", // Importante para que el gradiente no se salga
  },
  imagenFondo: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%", // Cubre toda la altura para el efecto
  },
  contenedorSuperpuesto: {
    flexGrow: 1, // 🔥 Se expande hacia abajo
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    borderRadius: 30,
    width: "90%",
    alignSelf: "center", // 🔥 Se mantiene centrado
  },
  imagenGrande: { width: "100%", height: 250, borderRadius: 10 },
  descripcion: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginVertical: 10,
  },
  precio: { fontSize: 20, fontWeight: "bold", color: "#2c7edb" },
  estado: { fontSize: 18, fontWeight: "bold" },
  direccion: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  botonesContainer: {
    flexDirection: "row", // 🔥 Coloca los botones en una fila
    justifyContent: "space-around", // 🔥 Espaciado uniforme
    alignItems: "center",
    width: "100%",
    marginVertical: 15,
  },

  botonUbicacion: {
    backgroundColor: "#FF5733",
    padding: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },

  botonHorarios: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },

  botonTexto: { fontSize: 16, color: "white", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    marginBottom: 15,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A9D8F',
    textAlign: 'center',
  },
  horarioTexto: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
    textAlign: 'center',
  },
  botonCerrar: {
    backgroundColor: '#2A9D8F',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
  },
  botonCerrarTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productoEstado: { fontSize: 16, fontWeight: "bold" },
  luzEstado: { width: 15, height: 15, borderRadius: 10, marginTop: 5 },
  productoEstadoContainer: { flexDirection: "row", justifyContent: "center" },
  navbar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    zIndex: 10,
  },
  rightButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botonNavWrapper: {
    position: 'relative',
  },
  botonNavModerno: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  botonNavGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCarritoModerno: {
    position: 'absolute',
    top: -6,
    right: -6,
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
    elevation: 4,
  },
  badgeTextoModerno: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  selectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginVertical: 15,
  },

  selectorBoton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 25,
    width: "45%",
    justifyContent: "center",
    elevation: 3,
  },

  selectorTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginLeft: 10,
  },

  seleccionado: {
    backgroundColor: "#2A9D8F",
  },

  textoSeleccionado: {
    color: "white",
  },
  telefonoTouchable: {
    marginTop: 10,
    fontSize: 16,
    color: "#2A9D8F", // 🔥 Color distintivo
    fontWeight: "bold", // 🔥 Resalta el número
  },
  productoHeader: {
    flexDirection: "row", // 🔥 Organiza el logo y el contenido en una fila
    alignItems: "center", // 🔥 Centra verticalmente los elementos
    paddingHorizontal: 10, // 🔥 Espaciado interno
  },

  productoLogo: {
    width: 60, // 🔥 Tamaño del logo
    height: 60,
    borderRadius: 20, // 🔥 Bordes redondeados si es necesario
    marginRight: 15, // 🔥 Espacio entre el logo y el texto
  },

  infoContainer: {
    flexDirection: "column", // 🔥 Organiza el nombre y las estrellas en columna
    width: "80%",
  },

  nombreEmpresa: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },

  estrellasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5, // 🔥 Espacio entre nombre y estrellas
  },
  estrellasWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  votantesText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },
  criteriosContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginVertical: 15,
  },
  criteriosTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  criterioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  criterioLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  criterioEstrellas: {
    flexDirection: "row",
    alignItems: "center",
  },
  criterioPromedio: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    fontWeight: "bold",
  },
  sinCalificaciones: {
    alignItems: "center",
    paddingVertical: 20,
  },
  sinCalificacionesTexto: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  metodosPagoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  metodoPago: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 7,
    borderRadius: 10,
    marginHorizontal: 4,
    elevation: 3,
  },

  metodoPagoTexto: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
    color: "#333",
  },
  // Agrega estos estilos a tu StyleSheet
  estadoTextoContainer: {
    marginLeft: 8,
  },
  estadoSubtexto: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 5,
  },
  seccionTituloAcordeon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
  },
  contactoContainer: {
    marginTop: 15,
  },
  contactoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    flexWrap: "wrap", // Permite que los elementos se ajusten a múltiples líneas
  },
  contactoTexto: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
    flex: 1, // Ocupa todo el espacio disponible
    flexWrap: "wrap", // Permite saltos de línea
    maxWidth: "55%", // Limita el ancho para forzar el salto de línea
  },
  contactoAccion: {
    fontSize: 14,
    color: "#2A9D8F",
    fontStyle: "italic",
  },
  seccionEntrega: {
    marginTop: 0,
  },
  selectorTextoContainer: {
    marginLeft: 10,
  },
  selectorSubtexto: {
    fontSize: 12,
    color: "#555",
  },
  textoSeleccionado: {
    color: "white",
  },
  entregaNota: {
    fontSize: 13,
    color: "#666",
    marginTop: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
  acordeonTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 15,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  acordeonContenido: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  scrollView: {
    width: "100%",
    alignSelf: "center",
  },
  scrollContent: {
    paddingBottom: 160, // Espacio para la barra inferior + margen extra
  },
  contenedorInferior: {
    flexGrow: 1, // 🔥 Se expande hacia abajo
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
    width: "100%",
    borderTopLeftRadius: 0, // Radio para esquina superior izquierda
    borderTopRightRadius: 0, // Radio para esquina superior derecha
    borderBottomLeftRadius: 30, // Sin radio en esquina inferior izquierda
    borderBottomRightRadius: 30, // Sin radio en esquina inferior derecha
  },
  distanciaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F5F9F8",
    borderRadius: 8,
  },
  distanciaTexto: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  descripcionLarga: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24, // Mayor espacio entre líneas para mejor legibilidad
    marginTop: 10,
    textAlign: "left", // Alineación izquierda para textos largos
  },
  galeriaContainer: {
    marginTop: 20,
  },
  tituloGaleria: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  galeriaScroll: {
    paddingHorizontal: 5,
  },
  itemGaleria: {
    width: 200,
    marginRight: 15,
    marginBottom: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imagenGaleria: {
    width: "100%",
    height: 120,
  },
  infoGaleria: {
    padding: 12,
  },
  precioGaleria: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  modalImagenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImagenFondo: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImagenContent: {
    width: "90%",
    maxHeight: "80%",
  },
  imagenExpandida: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
  modalInfoContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -5, // Para unirlo visualmente con la imagen
  },
  modalDescripcion: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  modalPrecio: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A9D8F",
    textAlign: "center",
  },
  botonCerrarImagen: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  tituloSeccionGaleria: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 5,
  },
  seccionProductos: {
    marginTop: 20,
    paddingHorizontal: 5,
  },
  headerSeccion: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 15,
    marginLeft: 5,
  },
  iconoSeccionContainer: {
    backgroundColor: "#FFF8E1",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  tituloSeccionGaleria: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  // Nuevo ItemGaleria Moderno con imagen completa
  itemGaleriaModerno: {
    width: 180,
    height: 200,
    marginRight: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  itemGaleriaConControles: {
    height: 250, // Altura extendida cuando tiene controles del carrito
  },
  itemGaleriaTouchable: {
    flex: 1,
    position: 'relative',
  },
  imagenGaleriaCompleta: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradienteProducto: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  etiquetaCategoriaModerna: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  etiquetaOfertaModerna: {
    backgroundColor: '#e74c3c',
  },
  etiquetaPrincipalModerna: {
    backgroundColor: '#f39c12',
  },
  etiquetaSecundarioModerna: {
    backgroundColor: '#2A9D8F',
  },
  etiquetaTextoModerna: {
    color: 'white',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  infoGaleriaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  infoGaleriaConEspacio: {
    paddingBottom: 56, // Espacio reservado para controles del carrito cuando NO es preview
  },
  nombreGaleriaModerno: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    marginBottom: 3,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  descripcionGaleriaModerna: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    fontWeight: '500',
  },
  precioContainerModerno: {
    marginTop: 2,
  },
  precioNormalModerno: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  precioOfertaContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  precioOriginalModerno: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
  },
  precioOfertaModerno: {
    fontSize: 16,
    fontWeight: '800',
    color: '#27ae60',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Controles modernos del carrito en tarjeta (reducidos)
  carritoControlsModerno: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  cantidadContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  botonCantidadModerno: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cantidadBadgeModerno: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
  },
  cantidadTextoModerno: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2c3e50',
  },
  botonEliminarModerno: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  botonAgregarCarritoModerno: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  agregarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  botonAgregarTextoModerno: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  galeriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  // Estilos para el botón de reporte
botonReporte: {
  backgroundColor: "rgba(255, 193, 7, 0.83)", // Amarillo/anaranjado
  padding: 8,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
  width: 50,
  height: 50,
},

// Modal de Reporte Moderno
reportModalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0,0,0,0.6)',
},
reportModalContent: {
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  maxHeight: '90%',
  minHeight: '75%',
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 15,
},
reportModalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 20,
  paddingHorizontal: 20,
  gap: 14,
},
reportIconWrapper: {
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.3)',
},
reportHeaderTexts: {
  flex: 1,
},
reportModalTitle: {
  fontSize: 20,
  fontWeight: '800',
  color: 'white',
  letterSpacing: 0.5,
  marginBottom: 2,
},
reportModalSubtitle: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '600',
},
reportCloseButton: {
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},
reportInstrucciones: {
  fontSize: 15,
  fontWeight: '600',
  marginVertical: 16,
  paddingHorizontal: 4,
  letterSpacing: 0.2,
},
reportOptionsContainer: {
  paddingHorizontal: 20,
  maxHeight: '65%',
},
reportOptionModerna: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderRadius: 14,
  marginBottom: 12,
  borderWidth: 1,
  gap: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
reportOptionIcono: {
  width: 48,
  height: 48,
  borderRadius: 24,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
reportOptionTextContainer: {
  flex: 1,
},
reportOptionTitleModerno: {
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 4,
  letterSpacing: 0.3,
},
reportOptionDescriptionModerno: {
  fontSize: 13,
  lineHeight: 18,
  fontWeight: '500',
},
reportDetalleContainer: {
  borderRadius: 14,
  padding: 16,
  marginTop: 16,
  marginBottom: 8,
},
reportDetalleLabel: {
  fontSize: 15,
  fontWeight: '700',
  marginBottom: 10,
  letterSpacing: 0.3,
},
reportDetalleInput: {
  borderRadius: 12,
  borderWidth: 1,
  padding: 14,
  fontSize: 15,
  minHeight: 100,
  lineHeight: 20,
},
reportModalButtons: {
  flexDirection: 'row',
  padding: 20,
  paddingTop: 16,
  gap: 12,
  borderTopWidth: 1,
},
reportModalCancelButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  borderRadius: 14,
  gap: 6,
  borderWidth: 2,
},
reportModalCancelButtonText: {
  fontWeight: '700',
  fontSize: 15,
  letterSpacing: 0.3,
},
reportModalSubmitButton: {
  flex: 1,
  borderRadius: 14,
  overflow: 'hidden',
  shadowColor: '#e74c3c',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 6,
},
reportModalSubmitButtonDisabled: {
  opacity: 0.4,
  shadowOpacity: 0,
  elevation: 0,
},
reportSubmitGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  gap: 8,
},
reportModalSubmitButtonText: {
  color: 'white',
  fontWeight: '800',
  fontSize: 15,
  letterSpacing: 0.3,
},
// Modal de advertencia modernos
advertenciaModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  padding: 20,
},
advertenciaModalContent: {
  backgroundColor: '#FFF',
  borderRadius: 20,
  width: '100%',
  maxWidth: 380,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 12,
},
advertenciaHeaderModerno: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 20,
  gap: 14,
},
advertenciaIconoWrapper: {
  position: 'relative',
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
},
advertenciaBadge: {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#e74c3c',
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 6,
  borderWidth: 2,
  borderColor: 'white',
},
advertenciaBadgeTexto: {
  color: 'white',
  fontSize: 11,
  fontWeight: '800',
},
advertenciaHeaderTextos: {
  flex: 1,
},
advertenciaTituloModerno: {
  fontSize: 18,
  fontWeight: '800',
  color: 'white',
  letterSpacing: 0.3,
},
advertenciaSubtituloModerno: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: '600',
  marginTop: 2,
},
advertenciaBody: {
  padding: 20,
},
advertenciaInfoBox: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#fff3cd',
  padding: 14,
  borderRadius: 12,
  gap: 10,
  marginBottom: 20,
  borderLeftWidth: 3,
  borderLeftColor: '#f39c12',
},
advertenciaMensajeModerno: {
  flex: 1,
  fontSize: 14,
  color: '#856404',
  lineHeight: 20,
  fontWeight: '500',
},
advertenciaButtonsModerno: {
  flexDirection: 'row',
  gap: 10,
},
advertenciaCancelarModerno: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 12,
  gap: 6,
  backgroundColor: '#f8f9fa',
  borderWidth: 2,
  borderColor: '#e9ecef',
},
advertenciaCancelarTextoModerno: {
  fontWeight: '700',
  fontSize: 15,
  letterSpacing: 0.3,
},
advertenciaSalirModerno: {
  flex: 1,
  borderRadius: 12,
  overflow: 'hidden',
},
advertenciaSalirGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 18,
  paddingHorizontal: 16,
  gap: 6,
},
advertenciaSalirTextoModerno: {
  color: 'white',
  fontWeight: '800',
  fontSize: 15,
  letterSpacing: 0.3,
},
// Estilos para modal de advertencia de propio negocio
advertenciaBotonEntendido: {
  borderRadius: 14,
  overflow: 'hidden',
  marginTop: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6,
},
advertenciaBotonGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 16,
  gap: 8,
},
advertenciaBotonTexto: {
  color: 'white',
  fontWeight: '800',
  fontSize: 16,
  letterSpacing: 0.5,
},
// Modal del carrito
carritoModalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
carritoModalContent: {
  backgroundColor: '#FFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  maxHeight: '90%',
  minHeight: '70%',
},
carritoHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  paddingBottom: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
carritoTitulo: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#333',
},
carritoCerrar: {
  padding: 5,
},
carritoLista: {
  maxHeight: '60%',
  marginBottom: 20,
},
carritoVacio: {
  alignItems: 'center',
  paddingVertical: 40,
},
carritoVacioTexto: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#666',
  marginTop: 15,
},
carritoVacioSubtexto: {
  fontSize: 14,
  color: '#999',
  marginTop: 5,
  textAlign: 'center',
},
carritoItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
carritoItemInfo: {
  flex: 1,
  marginRight: 15,
},
carritoItemNombre: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
  marginBottom: 5,
},
carritoItemPrecio: {
  fontSize: 14,
  color: '#666',
},
carritoItemControls: {
  flexDirection: 'row',
  alignItems: 'center',
},
carritoBotonCantidad: {
  backgroundColor: '#f8f9fa',
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#2A9D8F',
},
carritoCantidad: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginHorizontal: 15,
  minWidth: 20,
  textAlign: 'center',
},
carritoBotonEliminar: {
  backgroundColor: '#ffeaea',
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#e74c3c',
  marginLeft: 10,
},
carritoFooter: {
  borderTopWidth: 1,
  paddingTop: 20,
  paddingHorizontal: 4,
},
carritoTotalContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
},
carritoTotalLabel: {
  fontSize: 13,
  fontWeight: '600',
  marginBottom: 4,
},
carritoTotalTexto: {
  fontSize: 24,
  fontWeight: '900',
  letterSpacing: 0.5,
},
carritoBotonPedidoModerno: {
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6,
},
botonPedidoGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  paddingHorizontal: 24,
  gap: 8,
},
carritoBotonPedidoTextoModerno: {
  color: 'white',
  fontSize: 16,
  fontWeight: '800',
  letterSpacing: 0.5,
},
// Medios de Pago en Modal
mediosPagoEnModal: {
  borderRadius: 12,
  padding: 14,
  marginTop: 16,
  marginBottom: 12,
},
modalSeccionTitulo: {
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 12,
  letterSpacing: 0.3,
},
metodosPagoListaModal: {
  gap: 8,
},
metodoPagoItemModal: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingVertical: 6,
},
metodoPagoTextoModal: {
  fontSize: 14,
  fontWeight: '500',
},
// Entrega en Modal
entregaEnModal: {
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
},
selectorContainerModal: {
  gap: 10,
},
selectorBotonModal: {
  borderRadius: 12,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 3,
},
selectorGradientModal: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 14,
  gap: 10,
},
selectorNoSeleccionadoModal: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 14,
  gap: 10,
  borderWidth: 1.5,
  borderRadius: 12,
},
selectorTextoContainerModal: {
  flex: 1,
},
selectorTextoSeleccionadoModal: {
  fontSize: 15,
  fontWeight: '700',
  color: 'white',
  letterSpacing: 0.3,
},
selectorSubtextoSeleccionadoModal: {
  fontSize: 12,
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '500',
  marginTop: 2,
},
selectorTextoNoSeleccionadoModal: {
  fontSize: 15,
  fontWeight: '600',
  letterSpacing: 0.3,
},
selectorSubtextoNoSeleccionadoModal: {
  fontSize: 12,
  fontWeight: '500',
  marginTop: 2,
},
// Modal de confirmación moderno
confirmacionModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.6)',
  padding: 20,
},
confirmacionModalContent: {
  borderRadius: 24,
  width: '100%',
  maxWidth: 420,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 12,
},
confirmacionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 20,
  gap: 14,
},
confirmacionIconWrapper: {
  width: 52,
  height: 52,
  borderRadius: 26,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.3)',
},
confirmacionTitulo: {
  fontSize: 20,
  fontWeight: '800',
  color: 'white',
  letterSpacing: 0.5,
},
confirmacionSubtitulo: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)',
  fontWeight: '600',
  marginTop: 2,
},
confirmacionBody: {
  padding: 20,
},
confirmacionResumen: {
  borderRadius: 14,
  padding: 16,
  marginBottom: 16,
},
confirmacionResumenTitulo: {
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 14,
  letterSpacing: 0.3,
},
confirmacionItemRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
confirmacionItem: {
  fontSize: 15,
  fontWeight: '500',
  flex: 1,
},
confirmacionItemCantidad: {
  fontSize: 14,
  fontWeight: '700',
},
confirmacionTotalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: 2,
},
confirmacionTotalLabel: {
  fontSize: 16,
  fontWeight: '600',
},
confirmacionTotal: {
  fontSize: 22,
  fontWeight: '900',
  letterSpacing: 0.5,
},
confirmacionInfo: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  padding: 14,
  borderRadius: 12,
  gap: 10,
  borderLeftWidth: 3,
},
confirmacionInfoTexto: {
  flex: 1,
  fontSize: 13,
  lineHeight: 18,
  fontWeight: '500',
},
confirmacionButtons: {
  flexDirection: 'row',
  padding: 20,
  gap: 12,
},
confirmacionCancelar: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  borderRadius: 14,
  gap: 6,
  borderWidth: 2,
},
confirmacionCancelarTexto: {
  fontWeight: '700',
  fontSize: 15,
  letterSpacing: 0.3,
},
confirmacionEnviar: {
  flex: 1,
  borderRadius: 14,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6,
},
confirmacionEnviarGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  gap: 8,
},
confirmacionEnviarTexto: {
  color: 'white',
  fontWeight: '800',
  fontSize: 15,
  letterSpacing: 0.3,
},
  // Estilos Modernos del Header del Emprendimiento
  emprendimientoHeaderModerno: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  logoWrapper: {
    position: 'relative',
  },
  logoModerno: {
    width: 88,
    height: 88,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: 'white',
  },
  estadoBadgeFloat: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puntitoPulso: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  infoHeaderModerno: {
    flex: 1,
    gap: 8,
  },
  nombreModerno: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  metasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoBadgeModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  estadoTextoModerno: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  distanciaBadgeModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  distanciaTextoModerno: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  descripcionCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  descripcionModerna: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  // Estilos de Secciones Modernas
  seccionHeaderModerno: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seccionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seccionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seccionTituloModerno: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Contacto Moderno
  contactoContainerModerno: {
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  contactoItemModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  contactoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactoTextoContainer: {
    flex: 1,
  },
  contactoLabelModerno: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  contactoValueModerno: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // Medios de Pago Modernos - Solo Informativo
  mediosPagoSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  metodosPagoListaModerna: {
    marginTop: 12,
    gap: 10,
  },
  metodoPagoItemModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  metodoPagoTextoInfo: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // Entrega Moderna
  entregaSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  selectorContainerModerno: {
    gap: 12,
    marginTop: 16,
  },
  selectorBotonModerno: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  selectorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  selectorNoSeleccionado: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderRadius: 16,
  },
  selectorTextoSeleccionado: {
  fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  selectorSubtextoSeleccionado: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  selectorTextoNoSeleccionado: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  selectorSubtextoNoSeleccionado: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  notaEntregaModerna: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    gap: 10,
  },
  notaEntregaTexto: {
  flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // Descripción Larga Card
  descripcionLargaCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 10,
  },
  descripcionLargaTexto: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
    marginTop: 10,
  },
  // Headers de Secciones de Productos
  seccionProductosModerna: {
    marginTop: 12,
  },
  headerSeccionModerna: {
    marginBottom: 14,
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerSeccionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  iconoSeccionModerno: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloSeccionModerna: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  countBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  // Botón FAB Carrito Flotante - Solo cuando hay productos
  fabPedido: {
    position: 'absolute',
    bottom: 140, // Más padding para que no lo tape el menú inferior
    right: 20,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    width: 70,
    height: 70,
    justifyContent: 'center',
  alignItems: 'center',
    position: 'relative',
  },
  fabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e74c3c',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabBadgeTexto: {
  color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  // Estilos para el nuevo modal de confirmación de entrega
  botonVolverModal: {
    padding: 5,
    marginRight: 12,
  },
  direccionInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    gap: 10,
  },
  direccionInfoTextos: {
    flex: 1,
  },
  direccionInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  direccionInfoTexto: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  cuponEnModal: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
  },
  cuponAplicadoBox: {
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 2,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cuponAplicadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuponAplicadoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27ae60' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cuponAplicadoInfo: {
    flex: 1,
  },
  cuponAplicadoCodigo: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cuponAplicadoDescripcion: {
    fontSize: 13,
    fontWeight: '600',
  },
  cuponRemover: {
    padding: 4,
  },
  cuponBotonAgregar: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  cuponBotonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cuponBotonTexto: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resumenPedidoBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
  },
  resumenLinea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resumenLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  resumenValor: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumenLineaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 2,
  },
  resumenLabelTotal: {
  fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resumenValorTotal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deliveryInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  advertenciaCobertura: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
    borderLeftWidth: 3,
  },
  advertenciaCoberturaTexto: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
    fontWeight: '500',
  },
  selectorDeshabilitado: {
    opacity: 0.5,
  },
  carritoBotonConfirmarModerno: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    width: '100%',
},
});

export default PedidoDetalleScreen;
