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
  Alert
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Componente ItemGaleria completamente separado
const ItemGaleria = memo(({ item, index, categoria, onImagenPress, onAgregar, onQuitar, onEliminar, cantidadEnCarrito }) => {
  return (
    <View style={styles.itemGaleria}>
      <TouchableOpacity
        onPress={() => onImagenPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imagenContainer}>
          <Image
            source={item.imagen}
            style={styles.imagenGaleria}
            resizeMode="cover"
            cache="force-cache"
          />
          {/* Etiqueta de categoría */}
          <View
            style={[
              styles.etiquetaCategoria,
              item.categoria === "oferta" && styles.etiquetaOferta,
              item.categoria === "principal" && styles.etiquetaPrincipal,
              item.categoria === "secundario" && styles.etiquetaSecundario,
            ]}
          >
            <Text style={styles.etiquetaTexto}>
              {item.categoria === "oferta"
                ? "OFERTA"
                : item.categoria === "principal"
                ? "DESTACADO"
                : "ADICIONAL"}
            </Text>
          </View>
        </View>

        <View style={styles.infoGaleria}>
          <Text style={styles.nombreGaleria} numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text style={styles.descripcionGaleria} numberOfLines={2}>
            {item.descripcion}
          </Text>
          <View style={styles.precioContainer}>
            {item.categoria === "oferta" ? (
              <View style={styles.precioOfertaContainer}>
                <Text style={styles.precioOferta}>
                  {item.precio
                    ? `$${item.precio.toLocaleString("es-CL")}`
                    : "Consulte"}
                </Text>
              </View>
            ) : (
              <Text style={styles.precioNormal}>
                {item.precio
                  ? `$${item.precio.toLocaleString("es-CL")}`
                  : "Consulte"}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Controles del carrito */}
      <View style={styles.carritoControls}>
        {cantidadEnCarrito > 0 ? (
          <View style={styles.cantidadContainer}>
            <TouchableOpacity
              style={styles.botonCantidad}
              onPress={() => onQuitar(index, categoria)}
            >
              <FontAwesome name="minus" size={12} color="#2A9D8F" />
            </TouchableOpacity>
            <Text style={styles.cantidadTexto}>{cantidadEnCarrito}</Text>
            <TouchableOpacity
              style={styles.botonCantidad}
              onPress={() => onAgregar(item, index, categoria)}
            >
              <FontAwesome name="plus" size={12} color="#2A9D8F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => onEliminar(index, categoria)}
            >
              <FontAwesome name="trash" size={12} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.botonAgregarCarrito}
            onPress={() => onAgregar(item, index, categoria)}
          >
            <FontAwesome name="plus" size={14} color="white" />
            <Text style={styles.botonAgregarTexto}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const PedidoDetalleScreen = ({ route, navigation }) => {
  const { producto } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [distancia, setDistancia] = useState(null);
  const [cargandoDistancia, setCargandoDistancia] = useState(false);
  const [direccionUsuario, setDireccionUsuario] = useState(null);
  const [modalImagenVisible, setModalImagenVisible] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [advertenciaVisible, setAdvertenciaVisible] = useState(false);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const carritoRef = useRef([]);
  const [, forceUpdate] = useState({});

// Opciones de reporte
const reportReasons = [
  { id: 1, title: "Contenido inapropiado", description: "Contenido ofensivo, violento o explícito" },
  { id: 2, title: "Información falsa", description: "El anuncio contiene información engañosa o falsa" },
  { id: 3, title: "Productos prohibidos", description: "Venta de artículos ilegales o restringidos" },
  { id: 4, title: "Suplantación de identidad", description: "El vendedor está suplantando a otra persona o negocio" },
  { id: 5, title: "Prácticas fraudulentas", description: "Intento de estafa o fraude" },
  { id: 6, title: "Spam o publicidad no deseada", description: "Publicación repetitiva o no autorizada" },
  { id: 7, title: "Problemas con el vendedor", description: "Mal comportamiento o incumplimiento de acuerdos" },
  { id: 8, title: "Otro", description: "Otra razón no listada aquí" },
];
  const [modoEntrega, setModoEntrega] = useState(
    producto.metodosEntrega.delivery ? "delivery" : "retiro"
  );

  const imagenesPorCategoria = useMemo(() => ({
    principal:
      producto.galeria?.filter((item) => item.categoria === "principal") || [],
    oferta:
      producto.galeria?.filter((item) => item.categoria === "oferta") || [],
    secundario:
      producto.galeria?.filter((item) => item.categoria === "secundario") || [],
  }), [producto.galeria]);

  const cambiarModoEntrega = useCallback((modo) => {
    setModoEntrega(modo);
  }, []);

  // Funciones del carrito que NO causan re-renders del componente padre
  const agregarAlCarrito = useCallback((item) => {
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
    // Forzar actualización solo de los componentes que necesitan saber del cambio
    forceUpdate({});
  }, []);

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
    forceUpdate({});
  }, []);

  const eliminarDelCarrito = useCallback((itemId) => {
    carritoRef.current = carritoRef.current.filter(carritoItem => carritoItem.id !== itemId);
    forceUpdate({});
  }, []);

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

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cargarDireccionUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem("usuario");
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado);
          setUsuario(usuario);
          const direccionSeleccionada = usuario.direcciones.find(
            (dir) => dir.id === usuario.direccionSeleccionada
          );
          if (direccionSeleccionada) {
            setDireccionUsuario(
              `${direccionSeleccionada.direccion}, ${direccionSeleccionada.comuna}`
            );
          }
        }
      } catch (error) {
        console.error("Error al cargar dirección del usuario:", error);
      }
    };

    cargarDireccionUsuario();
  }, []);

  useEffect(() => {
    if (direccionUsuario) {
      console.log("Calculando distancia con:", direccionUsuario);
      obtenerDistancia();
    }
  }, [direccionUsuario]);

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

  const confirmarEnvioPedido = () => {
    setConfirmacionVisible(false);
    abrirWhatsApp();
  };

  const abrirWhatsApp = () => {
    const numero = "+56994908047"; // 🔥 Número de WhatsApp del negocio (con código país)
    
    let mensaje = `🛍️ *NUEVO PEDIDO*\n\n`;
    mensaje += `👋 Hola ${producto.nombre}!\n\n`;
    mensaje += `👤 Cliente: *${usuario.nombre.trim()}*\n`;
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
    
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    
    // Limpiar el carrito después de enviar el pedido
    carritoRef.current = [];
    forceUpdate({});
    
    Linking.openURL(url);
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

  // Interceptar navegación hacia atrás si hay items en el carrito
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (carritoRef.current.length > 0) {
        e.preventDefault();
        setAdvertenciaVisible(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // ✅ Horarios estáticos si no existen
  const horarios = producto.horarios ?? [
    "Lunes a Viernes: 10:00 AM - 8:00 PM",
    "Sábado: 11:00 AM - 6:00 PM",
    "Domingo: Cerrado",
  ];
  const isOpen = producto.estado;

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
      colors={["#ffffff", "#ffffff", "#ffffff", "#2A9D8F"]}
      style={styles.container}
    >
      {/* Modal de Reporte */}
<Modal
  animationType="slide"
  transparent={true}
  visible={reportModalVisible}
  onRequestClose={() => {
    setReportModalVisible(!reportModalVisible);
    setSelectedReportReason(null);
  }}
>
  <View style={styles.reportModalContainer}>
    <View style={styles.reportModalContent}>
      <Text style={styles.reportModalTitle}>Reportar Emprendimiento</Text>
      <Text style={styles.reportModalSubtitle}>Selecciona el motivo del reporte</Text>
      
      <ScrollView style={styles.reportOptionsContainer}>
        {reportReasons.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.reportOption,
              selectedReportReason === reason.id && styles.reportOptionSelected
            ]}
            onPress={() => setSelectedReportReason(reason.id)}
          >
            <View style={styles.reportOptionRadio}>
              {selectedReportReason === reason.id && (
                <View style={styles.reportOptionRadioSelected} />
              )}
            </View>
            <View style={styles.reportOptionTextContainer}>
              <Text style={styles.reportOptionTitle}>{reason.title}</Text>
              <Text style={styles.reportOptionDescription}>{reason.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.reportModalButtons}>
        <TouchableOpacity
          style={styles.reportModalCancelButton}
          onPress={() => {
            setReportModalVisible(false);
            setSelectedReportReason(null);
          }}
        >
          <Text style={styles.reportModalCancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportModalSubmitButton,
            !selectedReportReason && styles.reportModalSubmitButtonDisabled
          ]}
          disabled={!selectedReportReason}
          onPress={() => {
            // Aquí iría la lógica para enviar el reporte
            Alert.alert(
              "Reporte enviado", // ✅ Este es el título
              `Motivo: ${reportReasons.find(r => r.id === selectedReportReason).title}`, // ✅ Este es el mensaje
              [
                { text: "OK" }
              ]
            );
            setReportModalVisible(false);
            setSelectedReportReason(null);
          }}
        >
          <Text style={styles.reportModalSubmitButtonText}>Enviar reporte</Text>
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
            <View style={styles.advertenciaHeader}>
              <FontAwesome name="exclamation-triangle" size={32} color="#f39c12" />
              <Text style={styles.advertenciaTitulo}>¡Carrito con productos!</Text>
            </View>
            
            <Text style={styles.advertenciaMensaje}>
              Tienes {obtenerCantidadTotalItems()} producto(s) en tu carrito. Si sales de esta pantalla, perderás todos los productos seleccionados.
            </Text>
            
            <View style={styles.advertenciaButtons}>
              <TouchableOpacity
                style={styles.advertenciaCancelar}
                onPress={() => setAdvertenciaVisible(false)}
              >
                <Text style={styles.advertenciaCancelarTexto}>Continuar comprando</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.advertenciaSalir}
                onPress={() => {
                  carritoRef.current = [];
                  forceUpdate({});
                  setAdvertenciaVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.advertenciaSalirTexto}>Salir sin guardar</Text>
              </TouchableOpacity>
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
          <View style={styles.confirmacionModalContent}>
            <View style={styles.confirmacionHeader}>
              <FontAwesome name="check-circle" size={32} color="#2A9D8F" />
              <Text style={styles.confirmacionTitulo}>Confirmar Pedido</Text>
            </View>
            
            <Text style={styles.confirmacionMensaje}>
              ¿Está seguro que su pedido está completo?
            </Text>
            
            <View style={styles.confirmacionResumen}>
              <Text style={styles.confirmacionResumenTitulo}>Resumen del pedido:</Text>
              {carritoRef.current.map((item, index) => (
                <Text key={index} style={styles.confirmacionItem}>
                  • {item.nombre || item.descripcion} (x{item.cantidad})
                </Text>
              ))}
              <Text style={styles.confirmacionTotal}>
                Total: ${obtenerTotalCarrito().toLocaleString("es-CL")}
              </Text>
            </View>
            
            <View style={styles.confirmacionButtons}>
              <TouchableOpacity
                style={styles.confirmacionCancelar}
                onPress={() => setConfirmacionVisible(false)}
              >
                <Text style={styles.confirmacionCancelarTexto}>Revisar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmacionEnviar}
                onPress={confirmarEnvioPedido}
              >
                <Text style={styles.confirmacionEnviarTexto}>Enviar Pedido</Text>
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
          <View style={styles.carritoModalContent}>
            <View style={styles.carritoHeader}>
              <Text style={styles.carritoTitulo}>Mi Carrito</Text>
              <TouchableOpacity
                style={styles.carritoCerrar}
                onPress={() => setMostrarCarrito(false)}
              >
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.carritoLista}>
              {carritoRef.current.length === 0 ? (
                <View style={styles.carritoVacio}>
                  <FontAwesome name="shopping-cart" size={48} color="#ccc" />
                  <Text style={styles.carritoVacioTexto}>Tu carrito está vacío</Text>
                  <Text style={styles.carritoVacioSubtexto}>Agrega productos para comenzar tu pedido</Text>
                </View>
              ) : (
                carritoRef.current.map((item) => (
                  <View key={item.id} style={styles.carritoItem}>
                    <View style={styles.carritoItemInfo}>
                      <Text style={styles.carritoItemNombre}>{item.nombre || item.descripcion}</Text>
                      <Text style={styles.carritoItemPrecio}>
                        ${item.precio ? item.precio.toLocaleString("es-CL") : "Consulte"} c/u
                      </Text>
                    </View>
                    
                    <View style={styles.carritoItemControls}>
                      <TouchableOpacity
                        style={styles.carritoBotonCantidad}
                        onPress={() => quitarDelCarrito(item.id)}
                      >
                        <FontAwesome name="minus" size={14} color="#2A9D8F" />
                      </TouchableOpacity>
                      <Text style={styles.carritoCantidad}>{item.cantidad}</Text>
                      <TouchableOpacity
                        style={styles.carritoBotonCantidad}
                        onPress={() => agregarAlCarrito(item)}
                      >
                        <FontAwesome name="plus" size={14} color="#2A9D8F" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.carritoBotonEliminar}
                        onPress={() => eliminarDelCarrito(item.id)}
                      >
                        <FontAwesome name="trash" size={14} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {carritoRef.current.length > 0 && (
              <View style={styles.carritoFooter}>
                <View style={styles.carritoTotal}>
                  <Text style={styles.carritoTotalTexto}>
                    Total: ${obtenerTotalCarrito().toLocaleString("es-CL")}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.carritoBotonPedido}
                  onPress={() => {
                    setMostrarCarrito(false);
                    mostrarConfirmacionPedido();
                  }}
                >
                  <FontAwesome name="whatsapp" size={20} color="white" />
                  <Text style={styles.carritoBotonPedidoTexto}>Enviar Pedido</Text>
                </TouchableOpacity>
              </View>
            )}
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
                    resizeMode="contain"
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
        <Text style={styles.modalTitulo}>⏰ Horarios de Atención</Text>
      </View>

      {/* Lista de horarios */}
      {formatHorariosForDisplay(horarios).map((horario, index) => (
        <Text key={index} style={styles.horarioTexto}>
          {horario}
        </Text>
      ))}

      {/* Botón de cierre */}
      <TouchableOpacity
        style={styles.botonCerrar}
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
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.8)", "white"]}
          locations={[0.6, 0.8, 1]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <View style={styles.navbar}>
        {/* 🔥 Botón de volver atrás */}
        <TouchableOpacity
          style={styles.botonAtras}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        {/* 🔥 Botón de marcar favorito */}
        <View style={styles.rightButtonsContainer}>
            {/* Botón de Reporte */}
          <TouchableOpacity
            style={styles.botonReporte}
            onPress={() => setReportModalVisible(true)}
          >
            <FontAwesome name="exclamation-triangle" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Botón del Carrito */}
          <TouchableOpacity
            style={styles.botonCarrito}
            onPress={() => setMostrarCarrito(true)}
          >
            <FontAwesome name="shopping-cart" size={24} color="white" />
            {obtenerCantidadTotalItems() > 0 && (
              <View style={styles.badgeCarrito}>
                <Text style={styles.badgeTexto}>{obtenerCantidadTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Botón de WhatsApp */}
          <TouchableOpacity
            style={styles.botonContacto}
            onPress={abrirWhatsApp}
          >
            <FontAwesome name="whatsapp" size={29} color="white" />
          </TouchableOpacity>

          {/* Botón de Favorito */}
          <TouchableOpacity
            style={styles.botonFavorito}
            onPress={() => console.log("Marcado como favorito!")}
          >
            <FontAwesome name="heart" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Contenedor superpuesto */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contenedorSuperpuesto}>
          <View style={styles.productoHeader}>
            {/* 🔥 Logo a la izquierda */}
            <Image
              source={
                producto.logo
              }
              style={styles.productoLogo}
            />

            {/* 🔥 Contenedor del nombre y las estrellas */}
            <View style={styles.infoContainer}>
              <Text style={styles.nombreEmpresa}>{producto.nombre}</Text>

              {/* ✅ Evaluación con estrellas */}
              <View style={styles.estrellasContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  // Redondeo especial: 4.2 → 4, 4.3 → 4.5
                  let rating = producto.rating;
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
                        color="#FFD700"
                      />
                    );
                  }
                })}
                <Text style={styles.ratingText}>{producto.rating}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.descripcion}>{producto.descripcion}</Text>
          {/* ✅ Precio y estado */}
          <View style={styles.productoEstadoContainer}>
            <Animated.View
              style={[
                styles.luzEstado,
                {
                  backgroundColor:
                    isOpen === "Abierto"
                      ? "#4CAF50" // Verde más profesional
                      : isOpen === "Cierra Pronto"
                      ? "#FF9800" // Naranja más profesional
                      : "#F44336", // Rojo más profesional
                  opacity:
                    isOpen === "Abierto" || isOpen === "Cierra Pronto"
                      ? animatedValue
                      : 1,
                },
              ]}
            />
            <View style={styles.estadoTextoContainer}>
              <Text
                style={[
                  styles.productoEstado,
                  {
                    color:
                      isOpen === "Abierto"
                        ? "#4CAF50"
                        : isOpen === "Cierra Pronto"
                        ? "#FF9800"
                        : "#F44336",
                  },
                ]}
              >
                {producto.estado}
              </Text>
            </View>
          </View>
          <View style={styles.distanciaContainer}>
            <FontAwesome name="map-marker" size={16} color="#2A9D8F" />
            <Text style={styles.distanciaTexto}>
              {cargandoDistancia
                ? "Calculando distancia..."
                : "A " + distancia + " de tu ubicación" ||
                  "Distancia no disponible"}
            </Text>
          </View>
          {/* ✅ Dirección y botones */}
          {/* ✅ Sección de Contacto con Acordeón */}
          <TouchableOpacity
            style={styles.acordeonTitulo}
            onPress={() => setContactoAbierto(!contactoAbierto)}
          >
            <Text style={styles.seccionTituloAcordeon}>
              Información de Contacto
            </Text>
            <FontAwesome
              name={contactoAbierto ? "chevron-up" : "chevron-down"}
              size={18}
              color="#2A9D8F"
            />
          </TouchableOpacity>

          {contactoAbierto && (
            <View style={styles.acordeonContenido}>
              <TouchableOpacity
                style={styles.contactoItem}
                onPress={llamarTelefono}
              >
                <FontAwesome name="phone" size={18} color="#2A9D8F" />
                <Text style={styles.contactoTexto}>{producto.telefono}</Text>
                <Text style={styles.contactoAccion}> (Tocar para llamar)</Text>
              </TouchableOpacity>

              <View style={styles.contactoItem}>
                <FontAwesome name="map-marker" size={18} color="#2A9D8F" />
                <Text
                  style={styles.contactoTexto}
                  numberOfLines={2} // Permite hasta 2 líneas
                  ellipsizeMode="tail"
                >
                  {producto.direccion}
                </Text>
                <TouchableOpacity onPress={abrirMapa}>
                  <Text style={styles.contactoAccion}> (Ver en mapa)</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.contactoItem}
                onPress={() => setModalVisible(true)}
              >
                <FontAwesome name="clock-o" size={18} color="#2A9D8F" />
                <Text style={styles.contactoTexto}>Horarios de atención</Text>
                <Text style={styles.contactoAccion}> (Ver horarios)</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.seccionEntrega}>
            <Text style={styles.seccionTitulo}>Opciones de Entrega</Text>
            {/* 🔥 Métodos de pago disponibles */}
            <Text style={styles.contactoTexto}>Medios de Pago:</Text>
            <View style={styles.metodosPagoContainer}>
              {producto.metodosPago.tarjeta && (
                <View style={styles.metodoPago}>
                  <FontAwesome name="credit-card" size={20} color="#2A9D8F" />
                  <Text style={styles.metodoPagoTexto}>Tarjeta</Text>
                </View>
              )}
              {producto.metodosPago.efectivo && (
                <View style={styles.metodoPago}>
                  <FontAwesome name="money" size={20} color="#FFD700" />
                  <Text style={styles.metodoPagoTexto}>Efectivo</Text>
                </View>
              )}
              {producto.metodosPago.transferencia && (
                <View style={styles.metodoPago}>
                  <FontAwesome name="exchange" size={20} color="#FFD700" />
                  <Text style={styles.metodoPagoTexto}>Transferencia</Text>
                </View>
              )}
            </View>
            <View style={styles.selectorContainer}>
              {producto.metodosEntrega.delivery && (
                <TouchableOpacity
                  style={[
                    styles.selectorBoton,
                    modoEntrega === "delivery" && styles.seleccionado,
                  ]}
                  onPress={() => cambiarModoEntrega("delivery")}
                >
                  <FontAwesome
                    name="truck"
                    size={24}
                    color={modoEntrega === "delivery" ? "white" : "#555"}
                  />
                  <View style={styles.selectorTextoContainer}>
                    <Text
                      style={[
                        styles.selectorTexto,
                        modoEntrega === "delivery" && styles.textoSeleccionado,
                      ]}
                    >
                      Delivery
                    </Text>
                    <Text
                      style={[
                        styles.selectorSubtexto,
                        modoEntrega === "delivery" && styles.textoSeleccionado,
                      ]}
                    >
                      {producto.metodosEntrega.deliveryCosto ||
                        "Costo variable"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {producto.metodosEntrega.retiro && (
                <TouchableOpacity
                  style={[
                    styles.selectorBoton,
                    modoEntrega === "retiro" && styles.seleccionado,
                  ]}
                  onPress={() => cambiarModoEntrega("retiro")}
                >
                  <FontAwesome
                    name="shopping-bag"
                    size={24}
                    color={modoEntrega === "retiro" ? "white" : "#555"}
                  />
                  <View style={styles.selectorTextoContainer}>
                    <Text
                      style={[
                        styles.selectorTexto,
                        modoEntrega === "retiro" && styles.textoSeleccionado,
                      ]}
                    >
                      Retiro
                    </Text>
                    <Text
                      style={[
                        styles.selectorSubtexto,
                        modoEntrega === "retiro" && styles.textoSeleccionado,
                      ]}
                    >
                      Sin costo adicional
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.entregaNota}>
              {modoEntrega === "delivery"
                ? "El tiempo de entrega es responsabilidad de cada establecimiento"
                : "Puedes retirar tu pedido en nuestro local durante horario de atención"}
            </Text>
          </View>
          <View style={styles.seccionEntrega}>
            <Text style={styles.seccionTitulo}>Productos o Servicios</Text>
            <Text style={styles.descripcionLarga}>
              {producto.descripcionLarga ||
                "Descripción detallada no disponible"}
            </Text>
            {/* Sección de Productos/Servicios */}
            <View style={styles.seccionProductos}>
              {/* Sección Principal */}
              {imagenesPorCategoria.principal.length > 0 && (
                <>
                  <View style={styles.headerSeccion}>
                    <View style={styles.iconoSeccionContainer}>
                      <FontAwesome name="star" size={16} color="#FFD700" />
                    </View>
                    <Text style={styles.tituloSeccionGaleria}>Destacados</Text>
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
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Sección Ofertas */}
              {imagenesPorCategoria.oferta.length > 0 && (
                <>
                  <View style={styles.headerSeccion}>
                    <View
                      style={[
                        styles.iconoSeccionContainer,
                        { backgroundColor: "#FFEBEE" },
                      ]}
                    >
                      <FontAwesome name="tag" size={16} color="#FF5252" />
                    </View>
                    <Text
                      style={[
                        styles.tituloSeccionGaleria,
                        { color: "#FF5252" },
                      ]}
                    >
                      Ofertas Imperdibles
                    </Text>
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
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Sección Complementos */}
              {imagenesPorCategoria.secundario.length > 0 && (
                <>
                  <View style={styles.headerSeccion}>
                    <View
                      style={[
                        styles.iconoSeccionContainer,
                        { backgroundColor: "#E8F5E9" },
                      ]}
                    >
                      <FontAwesome
                        name="plus-circle"
                        size={16}
                        color="#2A9D8F"
                      />
                    </View>
                    <Text
                      style={[
                        styles.tituloSeccionGaleria,
                        { color: "#2A9D8F" },
                      ]}
                    >
                      Adicionales
                    </Text>
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
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: "space-between", // Esto separa los elementos a los extremos
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
    zIndex: 10, // Asegura que esté por encima de otros elementos
  },

  rightButtonsContainer: {
    flexDirection: "row", // Coloca los botones en fila
    alignItems: "center",
    gap: 10, // Espacio entre los botones (si usas React Native 0.71+)
  },

  botonAtras: {
    backgroundColor: "rgba(10, 10, 10, 0.55)",
    padding: 8,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },

  botonContacto: {
    backgroundColor: "rgba(37, 211, 102, 0.83)", // Verde de WhatsApp
    padding: 8,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },

  botonFavorito: {
    backgroundColor: "rgba(183, 32, 32, 0.83)",
    padding: 8,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
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

  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#555",
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
    borderBottomColor: "#EEE",
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
    paddingBottom: 30,
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
  itemGaleria: {
    width: 220,
    marginRight: 15,
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  imagenContainer: {
    position: "relative",
    height: 150,
  },
  imagenGaleria: {
    width: "100%",
    height: "100%",
  },
  etiquetaCategoria: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#2A9D8F",
  },
  etiquetaOferta: {
    backgroundColor: "#FF5252",
  },
  etiquetaPrincipal: {
    backgroundColor: "#FFA000",
  },
  etiquetaSecundario: {
    backgroundColor: "#2A9D8F",
  },
  etiquetaTexto: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  infoGaleria: {
    padding: 15,
  },
  nombreGaleria: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  descripcionGaleria: {
    fontSize: 14,
    color: "#333",
    height: 40,
  },
  precioContainer: {
    marginBottom: 12,
  },
  precioNormal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  precioOfertaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  precioOriginal: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  precioOferta: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  botonAgregar: {
    backgroundColor: "#2A9D8F",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  botonAgregarTexto: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  iconoAgregar: {
    marginLeft: 8,
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

// Estilos para el modal de reporte
reportModalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
reportModalContent: {
  backgroundColor: '#FFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  maxHeight: '80%',
},
reportModalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 5,
  textAlign: 'center',
},
reportModalSubtitle: {
  fontSize: 14,
  color: '#666',
  marginBottom: 20,
  textAlign: 'center',
},
reportOptionsContainer: {
  maxHeight: '70%',
  marginBottom: 20,
},
reportOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#EEE',
},
reportOptionSelected: {
  backgroundColor: '#F5F9F8',
},
reportOptionRadio: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#2A9D8F',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 15,
},
reportOptionRadioSelected: {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: '#2A9D8F',
},
reportOptionTextContainer: {
  flex: 1,
},
reportOptionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
  marginBottom: 3,
},
reportOptionDescription: {
  fontSize: 13,
  color: '#666',
},
reportModalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
reportModalCancelButton: {
  flex: 1,
  backgroundColor: '#EEE',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  marginRight: 10,
},
reportModalCancelButtonText: {
  color: '#333',
  fontWeight: 'bold',
  fontSize: 16,
},
reportModalSubmitButton: {
  flex: 1,
  backgroundColor: '#2A9D8F',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
},
reportModalSubmitButtonDisabled: {
  backgroundColor: '#CCC',
},
reportModalSubmitButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
// Estilos del carrito
botonCarrito: {
  backgroundColor: "rgba(52, 152, 219, 0.83)",
  padding: 8,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
  width: 50,
  height: 50,
  position: "relative",
},
badgeCarrito: {
  position: "absolute",
  top: -5,
  right: -5,
  backgroundColor: "#e74c3c",
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  alignItems: "center",
  justifyContent: "center",
},
badgeTexto: {
  color: "white",
  fontSize: 12,
  fontWeight: "bold",
},
carritoControls: {
  padding: 10,
  borderTopWidth: 1,
  borderTopColor: "#f0f0f0",
},
cantidadContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
botonCantidad: {
  backgroundColor: "#f8f9fa",
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#2A9D8F",
},
cantidadTexto: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#333",
  marginHorizontal: 10,
},
botonEliminar: {
  backgroundColor: "#ffeaea",
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#e74c3c",
  marginLeft: 10,
},
botonAgregarCarrito: {
  backgroundColor: "#2A9D8F",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
},
botonAgregarTexto: {
  color: "white",
  fontWeight: "bold",
  fontSize: 14,
  marginLeft: 5,
},
// Modal de advertencia
advertenciaModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 20,
},
advertenciaModalContent: {
  backgroundColor: '#FFF',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 400,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 8,
},
advertenciaHeader: {
  alignItems: 'center',
  marginBottom: 20,
},
advertenciaTitulo: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#2c3e50',
  marginTop: 12,
  textAlign: 'center',
},
advertenciaMensaje: {
  fontSize: 16,
  color: '#7f8c8d',
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 24,
},
advertenciaButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},
advertenciaCancelar: {
  flex: 1,
  backgroundColor: '#2A9D8F',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
},
advertenciaCancelarTexto: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
advertenciaSalir: {
  flex: 1,
  backgroundColor: '#e74c3c',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
},
advertenciaSalirTexto: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
// Modal del carrito
carritoModalContainer: {
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
carritoModalContent: {
  backgroundColor: '#FFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 20,
  maxHeight: '80%',
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
  borderTopColor: '#f0f0f0',
  paddingTop: 20,
},
carritoTotal: {
  alignItems: 'center',
  marginBottom: 15,
},
carritoTotalTexto: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#2A9D8F',
},
carritoBotonPedido: {
  backgroundColor: '#25D366',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 15,
  borderRadius: 12,
  shadowColor: '#25D366',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},
carritoBotonPedidoTexto: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8,
},
// Estilos del modal de confirmación
confirmacionModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 20,
},
confirmacionModalContent: {
  backgroundColor: '#FFF',
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 400,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 8,
},
confirmacionHeader: {
  alignItems: 'center',
  marginBottom: 20,
},
confirmacionTitulo: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#2c3e50',
  marginTop: 12,
  textAlign: 'center',
},
confirmacionMensaje: {
  fontSize: 16,
  color: '#7f8c8d',
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 20,
},
confirmacionResumen: {
  backgroundColor: '#f8f9fa',
  padding: 15,
  borderRadius: 10,
  marginBottom: 20,
},
confirmacionResumenTitulo: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 10,
},
confirmacionItem: {
  fontSize: 14,
  color: '#666',
  marginBottom: 5,
},
confirmacionTotal: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2A9D8F',
  marginTop: 10,
  borderTopWidth: 1,
  borderTopColor: '#ddd',
  paddingTop: 10,
},
confirmacionButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},
confirmacionCancelar: {
  flex: 1,
  backgroundColor: '#6c757d',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
},
confirmacionCancelarTexto: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
confirmacionEnviar: {
  flex: 1,
  backgroundColor: '#25D366',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
},
confirmacionEnviarTexto: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
});

export default PedidoDetalleScreen;
