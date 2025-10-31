import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  //BackHandler,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Swiper from "react-native-swiper";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import pedidoService from "../services/pedidoService";

const HomeScreen = ({ navigation }) => {
  const userContext = useUser();
  const { usuario, direcciones, direccionSeleccionada, loading, cargarUsuario, cargarDirecciones, establecerDireccionSeleccionada } = userContext;
  const { currentTheme } = useTheme();
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalObligatorioVisible, setModalObligatorioVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const intentosCargaRef = useRef(0);
  const [emprendimientosDestacados, setEmprendimientosDestacados] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [productosOferta, setProductosOferta] = useState([]);
  const [emprendimientosPorCategoria, setEmprendimientosPorCategoria] = useState({});
  const [cargandoEmprendimientos, setCargandoEmprendimientos] = useState(false);


  // Helper para obtener el nombre de la comuna
  const obtenerNombreComuna = (comunaId) => {
    const comunas = [
      { id: "1", nombre: "Isla de Maipo" },
      { id: "2", nombre: "Talagante" },
      { id: "3", nombre: "El Monte" },
      { id: "4", nombre: "Peñaflor" },
      { id: "5", nombre: "Melipilla" },
    ];
    const comunaEncontrada = comunas.find(c => c.id === comunaId);
    return comunaEncontrada ? comunaEncontrada.nombre : comunaId;
  };

  // Helper para formatear la dirección mostrada
  const formatearDireccionMostrada = (direccionCompleta) => {
    if (!direccionCompleta) return 'Selecciona una dirección';
    
    // Dividir por comas para obtener las partes
    const partes = direccionCompleta.split(',').map(parte => parte.trim());
    
    if (partes.length >= 2) {
      // Tomar solo la primera parte (calle + número) y la segunda parte (comuna)
      return `${partes[0]}, ${partes[1]}`;
    }
    
    // Si no tiene el formato esperado, mostrar la dirección completa truncada
    return direccionCompleta.length > 50 
      ? `${direccionCompleta.substring(0, 50)}...` 
      : direccionCompleta;
  };
  const verificarToken = async (navigation) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha caducado, inicia sesión nuevamente."
        );
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }], // 🔥 Redirige al login sin poder volver atrás
        });
      } else {
        console.log("token vigente");
      }
    } catch (error) {
      console.log("Error al verificar el token:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => verificarToken(navigation), 60000); // Cada 1 minuto

    return () => clearInterval(interval); // Evita fugas de memoria
  }, []);

  useEffect(() => {
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

  // Cargar usuario y direcciones al iniciar (usando contexto con cache)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoUsuario(true);
        console.log('🏠 HomeScreen: Iniciando carga de datos. Usuario en contexto:', usuario ? 'EXISTE' : 'NULL');
        
        // Verificar si hay token antes de intentar cargar
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log('🏠 HomeScreen: No hay token, redirigiendo al login');
          navigation.navigate("Login");
          setCargandoUsuario(false);
          return;
        }

        // Si no hay usuario en el contexto, esperar un momento y luego cargar
        if (!usuario) {
          console.log('🏠 HomeScreen: No hay usuario, esperando 1 segundo y cargando desde backend...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
          
          console.log('🏠 HomeScreen: Llamando a cargarUsuario(true)...');
          const usuarioCargado = await cargarUsuario(true); // Forzar recarga para obtener datos frescos
          console.log('🏠 HomeScreen: Usuario cargado:', usuarioCargado ? `EXISTE (ID: ${usuarioCargado.id})` : 'NULL');
          
          // Si después de cargar todavía es null, hay un error
          if (!usuarioCargado) {
            console.error('🏠 HomeScreen: No se pudo cargar el usuario después del intento');
            setCargandoUsuario(false);
            return;
          }
        } else {
          console.log('🏠 HomeScreen: Usuario existe, usando cache');
          await cargarUsuario(false); // Usar cache si es válido
        }
        
        console.log('🏠 HomeScreen: Cargando direcciones...');
        await cargarDirecciones(false); // Usar cache si es válido
        
        console.log('🏠 HomeScreen: Datos cargados correctamente');
      } catch (error) {
        console.error('🏠 HomeScreen: Error al cargar datos:', error);
        // Si hay error de autenticación, redirigir al login
        if (error.message && error.message.includes('sesión')) {
          navigation.navigate("Login");
        }
        setCargandoUsuario(false);
      }
    };
    
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo al montar

  // Actualizar cargandoUsuario cuando el usuario se carga o cuando loading cambia
  useEffect(() => {
    // Si hay usuario y no está cargando, desactivar loading
    if (usuario && !loading) {
      console.log('🏠 HomeScreen: Usuario disponible, desactivando loading');
      setCargandoUsuario(false);
    }
  }, [usuario, loading]);

  // Efecto adicional para manejar el caso donde el usuario se carga después del montaje
  useEffect(() => {
    if (usuario && cargandoUsuario) {
      console.log('🏠 HomeScreen: Usuario cargado después del montaje, desactivando loading');
      setCargandoUsuario(false);
    }
  }, [usuario, cargandoUsuario]);

  // Recargar cuando se regrese a la pantalla (solo si es necesario)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        // Si no hay usuario, forzar recarga
        if (!usuario) {
          setCargandoUsuario(true);
          await cargarUsuario(true);
        } else {
          await cargarUsuario(false);
        }
        await cargarDirecciones(false); // Solo recargará si el cache expiró (5 min)
      } catch (error) {
        console.error('Error al recargar datos:', error);
        setCargandoUsuario(false);
      }
    });

    return unsubscribe;
  }, [navigation, usuario]);

  // Verificar constantemente si hay direcciones y mostrar/ocultar modal
  useEffect(() => {
    if (direcciones && direcciones.length === 0) {
      setModalObligatorioVisible(true);
    } else if (direcciones && direcciones.length > 0) {
      setModalObligatorioVisible(false);
      // Seleccionar dirección principal por defecto si no hay selección
      if (!direccionSeleccionada && establecerDireccionSeleccionada) {
        const direccionPrincipal = direcciones.find(dir => dir.esPrincipal);
        if (direccionPrincipal) {
          establecerDireccionSeleccionada(direccionPrincipal.id);
        } else {
          establecerDireccionSeleccionada(direcciones[0].id);
        }
      }
    }
  }, [direcciones, direccionSeleccionada, establecerDireccionSeleccionada]);

  // ✅ Interceptar botón "Atrás"
  /*useEffect(() => {
    const handleBackPress = () => {
      Alert.alert("Salir de la Aplicación", "¿Realmente desea salir?", [
        { text: "Salir", onPress: () => BackHandler.exitApp() }, // 🔥 Cierra la app
        { text: "Cancelar", style: "cancel" },
      ]);
      return true; // 🔥 Evita que vuelva atrás al Login
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
  }, []);*/

  // Función para mezclar array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Función para seleccionar aleatoriamente priorizando premium (90% premium, 10% básico)
  const seleccionarAleatoriosConPrioridad = (premiumList, basicoList, cantidad) => {
    const seleccionados = [];
    
    // Calcular cuántos de cada tipo necesitamos
    const cantidadPremium = Math.ceil(cantidad * 0.9);
    const cantidadBasico = cantidad - cantidadPremium;
    
    // Mezclar ambas listas
    const premiumShuffled = shuffleArray(premiumList);
    const basicoShuffled = shuffleArray(basicoList);
    
    // Seleccionar de premium
    for (let i = 0; i < Math.min(cantidadPremium, premiumShuffled.length); i++) {
      seleccionados.push(premiumShuffled[i]);
    }
    
    // Si aún necesitamos más, agregar de básico
    const restantes = cantidad - seleccionados.length;
    for (let i = 0; i < Math.min(restantes, basicoShuffled.length); i++) {
      seleccionados.push(basicoShuffled[i]);
    }
    
    // Mezclar el resultado final para que no esté todo junto
    return shuffleArray(seleccionados);
  };

  // Función helper para mapear estado del backend al frontend
  const mapearEstado = (emp) => {
    if (emp.estado_calculado === 'cierra_pronto') {
      return 'Cierra Pronto';
    } else if (emp.estado_calculado === 'abierto') {
      return 'Abierto';
    } else if (emp.estado_calculado === 'cerrado') {
      return 'Cerrado';
    }
    // Fallback al estado original si no hay estado_calculado
    return emp.estado === 'activo' ? 'Abierto' : 'Cerrado';
  };

  // Función helper para cargar calificación de un emprendimiento
  const cargarCalificacionEmprendimiento = async (empId) => {
    try {
      const response = await pedidoService.obtenerCalificacionEmprendimiento(empId);
      if (response.ok && response.calificacion) {
        return parseFloat(response.calificacion.calificacion_promedio) || 0;
      }
      return 0;
    } catch (error) {
      console.error(`Error cargando calificación para emprendimiento ${empId}:`, error);
      return 0;
    }
  };

  // Función para agrupar emprendimientos por categoría de negocio
  const agruparEmprendimientosPorCategoria = async (emprendimientos) => {
    const agrupados = {};
    
    for (const emp of emprendimientos) {
      const categoria = emp.categoria_principal || 'otros';
      
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      
      // Cargar calificación del emprendimiento
      const rating = await cargarCalificacionEmprendimiento(emp.id);
      
      agrupados[categoria].push({
        id: emp.id,
        nombre: emp.nombre,
        descripcion: emp.descripcion_corta || emp.descripcion,
        descripcionLarga: emp.descripcion_larga || emp.descripcion_corta || '',
        imagen: emp.background_url || require('../assets/icon.png'),
        logo: emp.logo_url || require('../assets/icon.png'),
        estado: mapearEstado(emp),
        telefono: emp.telefono,
        direccion: emp.direccion,
        metodosEntrega: emp.tipos_entrega || { delivery: true, retiro: true },
        metodosPago: emp.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
        rating: rating,
        horarios: emp.horarios,
        galeria: [] // Se cargará cuando sea necesario
      });
    }
    
    console.log('📂 Emprendimientos agrupados por categoría:', Object.keys(agrupados));
    setEmprendimientosPorCategoria(agrupados);
  };

  // Función para cargar emprendimientos desde el backend
  const cargarEmprendimientosHome = async () => {
    try {
      setCargandoEmprendimientos(true);
      console.log('🏠 Cargando emprendimientos para Home...');
      
      const { API_ENDPOINTS } = require('../config/api');
      const response = await fetch(API_ENDPOINTS.EMPRENDIMIENTOS);
      
      if (!response.ok) {
        throw new Error('Error al cargar emprendimientos');
      }
      
      const data = await response.json();
      if (data.ok && data.emprendimientos) {
        console.log('✅ Emprendimientos cargados:', data.emprendimientos.length);
        
        // Separar premium y básico
        const premiumEmprendimientos = data.emprendimientos.filter(emp => {
          // Buscar el usuario del emprendimiento para verificar su plan
          return emp.usuario_plan_id === 2 || emp.usuario_plan_id === 'premium';
        });
        
        const basicoEmprendimientos = data.emprendimientos.filter(emp => {
          return emp.usuario_plan_id !== 2 && emp.usuario_plan_id !== 'premium';
        });
        
        console.log(`Premium: ${premiumEmprendimientos.length}, Básico: ${basicoEmprendimientos.length}`);
        
        // Seleccionar emprendimientos aleatorios para destacados (max 5)
        const destacadosSeleccionados = seleccionarAleatoriosConPrioridad(
          premiumEmprendimientos,
          basicoEmprendimientos,
          5
        );
        
        // Mapear emprendimientos a formato esperado por el Swiper con calificaciones
        const emprendimientosMapeadosPromises = destacadosSeleccionados.map(async emp => {
          // Cargar calificación del emprendimiento
          const rating = await cargarCalificacionEmprendimiento(emp.id);
          
          return {
            id: emp.id,
            nombre: emp.nombre,
            descripcion: emp.descripcion_corta || emp.descripcion,
            descripcionLarga: emp.descripcion_larga || emp.descripcion_corta || '',
            imagen: emp.background_url || require('../assets/icon.png'),
            logo: emp.logo_url || require('../assets/icon.png'),
            estado: mapearEstado(emp),
            telefono: emp.telefono,
            direccion: emp.direccion,
            metodosEntrega: emp.tipos_entrega || { delivery: true, retiro: true },
            metodosPago: emp.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
            rating: rating,
            horarios: emp.horarios,
            galeria: [] // Se cargará cuando sea necesario
          };
        });
        
        const emprendimientosMapeados = await Promise.all(emprendimientosMapeadosPromises);
        
        // Agregar banner premium al principio si el usuario es emprendedor
        const conBannerPremium = usuario?.tipo_usuario === "emprendedor" 
          ? [{
              id: -1,
              imagen: require("../assets/premium.png"),
            }, ...emprendimientosMapeados]
          : emprendimientosMapeados;
        
        setEmprendimientosDestacados(conBannerPremium);
        
        // Agrupar emprendimientos por categoría de negocio
        agruparEmprendimientosPorCategoria(data.emprendimientos);
        
        // Ahora cargar productos categorizados
        await cargarProductosCategorizados(premiumEmprendimientos, basicoEmprendimientos);
      }
    } catch (error) {
      console.error('❌ Error al cargar emprendimientos:', error);
      // Si falla, mantener array vacío
      setEmprendimientosDestacados([]);
    } finally {
      setCargandoEmprendimientos(false);
    }
  };

  // Función para cargar productos categorizados
  const cargarProductosCategorizados = async (premiumList, basicoList) => {
    try {
      console.log('🏠 Cargando productos categorizados...');
      
      const { API_ENDPOINTS } = require('../config/api');
      
      // Función helper para cargar productos de un emprendimiento
      const cargarProductosDeEmprendimiento = async (empId) => {
        try {
          const response = await fetch(API_ENDPOINTS.PRODUCTOS(empId));
          if (!response.ok) return [];
          const data = await response.json();
          return data.ok && data.productos ? data.productos : [];
        } catch (error) {
          console.error(`Error cargando productos de emprendimiento ${empId}:`, error);
          return [];
        }
      };
      
      // Seleccionar emprendimientos aleatorios para cada categoría
      const productosSeleccionados = seleccionarAleatoriosConPrioridad(
        premiumList,
        basicoList,
        10
      );
      
      // Cargar productos de cada emprendimiento seleccionado
      const promesasProductos = productosSeleccionados.map(async (emp) => {
        const productos = await cargarProductosDeEmprendimiento(emp.id);
        return {
          emprendimiento: emp,
          productos: productos
        };
      });
      
      const resultadosProductos = await Promise.all(promesasProductos);
      
      // Agrupar productos por categoría
      const productosPorCategoria = {
        principal: [],
        oferta: [],
        secundario: [],
        emprendimientos: [] // Para guardar emprendimientos completos con productos
      };
      
      resultadosProductos.forEach(({ emprendimiento, productos }) => {
        // Guardar el emprendimiento con sus productos
        const emprendimientoConProductos = {
          id: emprendimiento.id,
          nombre: emprendimiento.nombre,
          descripcion: emprendimiento.descripcion_corta || emprendimiento.descripcion,
          descripcionLarga: emprendimiento.descripcion_larga || emprendimiento.descripcion_corta || '',
          imagen: emprendimiento.background_url || require('../assets/icon.png'),
          logo: emprendimiento.logo_url || require('../assets/icon.png'),
          estado: mapearEstado(emprendimiento),
          telefono: emprendimiento.telefono,
          direccion: emprendimiento.direccion,
          metodosEntrega: emprendimiento.tipos_entrega || { delivery: true, retiro: true },
          metodosPago: emprendimiento.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
          rating: 4.5,
          horarios: emprendimiento.horarios,
          galeria: productos.map(prod => ({
            id: prod.id,
            imagen: prod.imagen_url ? { uri: prod.imagen_url } : require('../assets/icon.png'),
            nombre: prod.nombre,
            descripcion: prod.descripcion || prod.nombre,
            precio: prod.precio,
            categoria: prod.categoria || 'secundario'
          }))
        };
        
        productosPorCategoria.emprendimientos.push(emprendimientoConProductos);
        
        // Mapear cada producto con su emprendimiento completo (para las secciones de productos)
        productos.forEach(producto => {
          const categoria = producto.categoria || 'secundario';
          
          productosPorCategoria[categoria].push({
            // Incluir toda la info del emprendimiento completo
            ...emprendimientoConProductos,
            // Agregar la categoría al objeto
            categoria: categoria,
            // Sobrescribir solo lo específico del producto
            productoSeleccionado: {
              id: producto.id,
              imagen: producto.imagen_url ? { uri: producto.imagen_url } : require('../assets/icon.png'),
              nombre: producto.nombre,
              descripcion: producto.descripcion || producto.nombre,
              precio: producto.precio,
              categoria: categoria
            }
          });
        });
      });
      
      console.log('✅ Productos categorizados cargados:', {
        principal: productosPorCategoria.principal.length,
        oferta: productosPorCategoria.oferta.length,
        secundario: productosPorCategoria.secundario.length,
        emprendimientos: productosPorCategoria.emprendimientos.length
      });
      
      // Setear los productos
      setProductosOferta(productosPorCategoria.oferta);
      setProductosDestacados(productosPorCategoria.principal);
      
      // Los secundarios se mostrarán en las categorías
      // Por ahora dejamos esto así, después veremos cómo organizarlos por categorías de negocio
      
    } catch (error) {
      console.error('❌ Error al cargar productos categorizados:', error);
    }
  };

  // useEffect para cargar emprendimientos cuando el componente se monta
  useEffect(() => {
    if (usuario && !loading) {
      cargarEmprendimientosHome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, loading]);

  // Mostrar loading si está cargando o si no hay usuario aún
  // El componente se re-renderizará automáticamente cuando el contexto se actualice
  if (cargandoUsuario || loading || !usuario) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={{ marginTop: 10 }}>
          {loading || cargandoUsuario ? 'Cargando...' : 'Cargando usuario...'}
        </Text>
      </View>
    );
  }

  const handleSeleccionDireccion = (id) => {
    if (establecerDireccionSeleccionada) {
      establecerDireccionSeleccionada(id);
    }
  };

  const direccionActual = direcciones && direcciones.length > 0 
    ? direcciones.find((dir) => dir.id === direccionSeleccionada)
    : null;

  const toggleSection = (index) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const categorias = [
    {
      nombre: "🔥 Ofertas del Día",
      subcategorias: [
        "Nuevas promociones",
        "Descuentos exclusivos",
        "Paquetes especiales",
      ],
    },
    {
      nombre: "🛍 Productos y Tiendas",
      subcategorias: ["Almacén", "Carnicería", "Panadería", "Pizzerías"],
    },
    {
      nombre: "🛠 Servicios Profesionales",
      subcategorias: [
        "Reparación",
        "Construcción",
        "Mantenimiento",
        "Transporte",
      ],
    },
    {
      nombre: "💇‍♂️ Estilo y Cuidado Personal",
      subcategorias: ["Peluquería", "Mascotas", "Salud"],
    },
    {
      nombre: "🎨 Creatividad y Oficios",
      subcategorias: ["Artesanía", "Publicidad", "Música y Eventos"],
    },
  ];
// Función para obtener icono según categoría
const getIconForCategory = (categoria) => {
  if (!categoria) return "tag"; // Si la categoría es undefined, usar tag por defecto
  const icons = {
    "comida": "cutlery",
    "belleza": "scissors",
    "servicio": "wrench",
    "servicios": "wrench",
    "negocios": "shopping-bag",
    "principal": "star",
    "oferta": "tag",
    "secundario": "plus-circle",
    "otros": "tag"
  };
  return icons[categoria.toLowerCase()] || "tag";
};

  // ✅ **Menú lateral con el menú colapsable dentro**
  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <View
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        <LinearGradient  colors={[currentTheme.primary, currentTheme.secondary]} style={styles.direccionContainer}>
          <View style={styles.direccionSuperior}>
            <TouchableOpacity
              style={styles.selectorDireccion}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="location-on" size={20} color="white" />
              <View style={styles.direccionTextContainer}>
                <Text style={styles.direccionTexto} numberOfLines={1}>
                  {direccionActual ? formatearDireccionMostrada(direccionActual.direccion) : 'Selecciona una dirección'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {/* Nuevo campo de búsqueda */}
          <View style={styles.searchContainer}>
  <TextInput
    style={styles.searchInput}
    placeholder="¿Qué estás buscando?"
    placeholderTextColor="#999"
    onPress={() => navigation.navigate('Busqueda')} // Navega al presionar
    pointerEvents="none" // Permite que el TouchableOpacity funcione
  />
  <View 
    style={styles.searchIcon}
    onPress={() => navigation.navigate('Busqueda')} // También navega al presionar el ícono
  >
    <FontAwesome name="search" size={18} color="#666" />
  </View>
</View>
        </LinearGradient>

        {/* Modal de selección de dirección */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar dirección</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView>
                {(direcciones || []).map((direccion) => (
                  <TouchableOpacity
                    key={direccion.id}
                    style={[
                      styles.direccionOption,
                      direccion.id === direccionSeleccionada &&
                        styles.direccionSelected,
                    ]}
                    onPress={() => {
                      handleSeleccionDireccion(direccion.id);
                      setModalVisible(false);
                    }}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color={
                        direccion.id === usuario.direccionSeleccionada
                          ? "#0b8e0d"
                          : "#666"
                      }
                    />
                    <View style={styles.direccionOptionText}>
                      <Text style={styles.direccionOptionNombre}>
                        {direccion.nombre}
                      </Text>
                      <Text style={styles.direccionOptionDireccion}>
                        {formatearDireccionMostrada(direccion.direccion)}
                      </Text>
                      <Text style={styles.direccionOptionDetalles}>
                        {direccion.referencia ? `Ref: ${direccion.referencia}` : ''}
                      </Text>
                    </View>
                    {direccion.id === direccionSeleccionada && (
                      <MaterialIcons name="check" size={24} color="#0b8e0d" />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.agregarDireccion}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate("MisDirecciones");
                  }}
                >
                  <MaterialIcons name="add" size={24} color="#0b8e0d" />
                  <Text style={styles.agregarDireccionText}>
                    Agregar nueva dirección
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* ✅ Sección de productos destacados */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.destacados}>
            <View style={styles.iconosContainer}>
              {/* Icono 1 - Comida */}
              <View style={styles.iconoItem}>
                <TouchableOpacity
                  style={styles.iconoWrapper}
                  onPress={() => navigation.navigate('Comida')}
                >
                  <Image
                    source={require("../assets/food.webp")}
                    style={styles.iconoImagen}
                  />
                </TouchableOpacity>
                <Text style={styles.iconoTexto}>Comida Preparada</Text>
              </View>

              {/* Icono 2 - Servicios */}
              <View style={styles.iconoItem}>
                <TouchableOpacity
                  style={styles.iconoWrapper}
                  onPress={() => navigation.navigate('Servicios')}
                >
                  <Image
                    source={require("../assets/services.webp")}
                    style={styles.iconoImagen}
                  />
                </TouchableOpacity>
                <Text style={styles.iconoTexto}>Servicios Locales</Text>
              </View>

              {/* Icono 3 - Negocios */}
              <View style={styles.iconoItem}>
                <TouchableOpacity
                  style={styles.iconoWrapper}
                  onPress={() => navigation.navigate('Negocios')}
                >
                  <Image
                    source={require("../assets/store.png")}
                    style={styles.iconoImagen}
                  />
                </TouchableOpacity>
                <Text style={styles.iconoTexto}>Tiendas & Negocios</Text>
              </View>

              {/* Icono 4 - Belleza */}
              <View style={styles.iconoItem}>
                <TouchableOpacity
                  style={styles.iconoWrapper}
                  onPress={() => navigation.navigate('Belleza')}
                >
                  <Image
                    source={require("../assets/beauty.webp")}
                    style={styles.iconoImagen}
                  />
                </TouchableOpacity>
                <Text style={styles.iconoTexto}>Belleza & Bienestar</Text>
              </View>
            </View>

            <Swiper
              autoplay={true}
              autoplayTimeout={3}
              showsPagination={true}
              style={styles.swiper}
            >
              {emprendimientosDestacados.map((producto) => {
                const isOpen = producto.estado;
                const isVip = !producto.nombre; // Asume que los VIP no tienen nombre

                return (
                  <TouchableOpacity
                    key={producto.id}
                    style={styles.productoContainer}
                    onPress={() =>
                      isVip
                        ? navigation.navigate("PlanScreen")
                        : navigation.navigate("PedidoDetalle", { producto })
                    }
                  >
                    {/* Solo mostrar header y footer si NO es VIP */}
                    {!isVip ? (
                      <>
                        <View style={styles.productoHeader}>
                          <Image
                            source={producto.logo}
                            style={styles.productoLogo}
                          />
                          <Text style={styles.productoNombre}>
                            {producto.nombre}
                          </Text>
                        </View>
                        <Image
                          source={producto.imagen}
                          style={styles.productoImagenPrincipal}
                        />
                        <View style={styles.productoDetalles}>
                          <Text style={styles.productoDescripcion}>
                            {producto.descripcion}
                          </Text>

                          <View style={styles.productoFooter}>
                            <View style={styles.productoEstadoContainer}>
                              <Animated.View
                                style={[
                                  styles.luzEstado,
                                  {
                                    backgroundColor:
                                      isOpen === "Abierto"
                                        ? "green"
                                        : isOpen === "Cierra Pronto"
                                        ? "orange"
                                        : "red",
                                    opacity:
                                      isOpen === "Abierto" ||
                                      isOpen === "Cierra Pronto"
                                        ? animatedValue
                                        : 1,
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.productoEstado,
                                  {
                                    color:
                                      isOpen === "Abierto"
                                        ? "green"
                                        : isOpen === "Cierra Pronto"
                                        ? "orange"
                                        : "red",
                                  },
                                ]}
                              >
                                {producto.estado}
                              </Text>
                            </View>

                            <View style={styles.estrellas}>
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
                                      size={16}
                                      color="#FFD700"
                                    />
                                  );
                                } else if (
                                  star - 0.5 <= rating &&
                                  rating < star
                                ) {
                                  // Media estrella
                                  return (
                                    <FontAwesome
                                      key={star}
                                      name="star-half-o"
                                      size={16}
                                      color="#FFD700"
                                    />
                                  );
                                } else {
                                  // Estrella vacía
                                  return (
                                    <FontAwesome
                                      key={star}
                                      name="star-o"
                                      size={16}
                                      color="#FFD700"
                                    />
                                  );
                                }
                              })}
                            </View>
                          </View>
                        </View>
                      </>
                    ) : (
                      // Solo mostrar la imagen para VIP
                      <Image
                        source={producto.imagen}
                        style={styles.productoImagenPrincipalVip}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Swiper>
          </View>
          {/* Sección de Ofertas Destacadas */}
{productosOferta && productosOferta.length > 0 && (
  <View style={styles.seccionOfertas}>
    <View style={styles.headerSeccion}>
      <View style={[styles.iconoSeccionContainer]}>
        <FontAwesome name="tag" size={16}/>
      </View>
      <Text style={[styles.tituloSeccionGaleria]}>
        OFERTAS DESTACADAS
      </Text>
    </View>
    
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.galeriaScroll}
    >
      {productosOferta.map(producto => (
        <TouchableOpacity 
          key={producto.id}
          style={styles.itemGaleria}
          onPress={() => navigation.navigate("PedidoDetalle", { producto })}
        >
          {/* Imagen del producto */}
          <View style={styles.imagenContainer}>
            <Image 
              source={producto.productoSeleccionado && producto.productoSeleccionado.imagen ? producto.productoSeleccionado.imagen : (producto.galeria && producto.galeria[0] ? producto.galeria[0].imagen : producto.imagen || require('../assets/icon.png'))} 
              style={styles.imagenGaleria}
              contentFit="cover"
            />
            <View style={[styles.etiquetaCategoria, {backgroundColor: '#FF5252'}]}>
              <Text style={styles.etiquetaTextoOferta}>
                OFERTA
              </Text>
            </View>
          </View>
          
          {/* Información del producto */}
          <View style={styles.infoGaleria}>
            {/* Descripción */}
            <Text style={styles.descripcionGaleria} numberOfLines={2}>
              {producto.productoSeleccionado && producto.productoSeleccionado.descripcion ? producto.productoSeleccionado.descripcion : (producto.galeria && producto.galeria[0] ? producto.galeria[0].descripcion : producto.descripcion)}
            </Text>
            
            {/* Precio */}
            <Text style={styles.precioProducto}>
              {producto.productoSeleccionado && producto.productoSeleccionado.precio ? 
                `$${producto.productoSeleccionado.precio.toLocaleString("es-CL")}` : 
                (producto.galeria && producto.galeria[0] && producto.galeria[0].precio ? 
                  `$${producto.galeria[0].precio.toLocaleString("es-CL")}` : 
                  "Consulte")}
            </Text>
            
            {/* Recuadro con logo y nombre de empresa */}
            <View style={styles.empresaContainer}>
              <Image 
                source={producto.logo || require('../assets/icon.png')} 
                style={styles.logoEmpresa}
                contentFit="contain"
              />
              <Text style={styles.nombreEmpresa} numberOfLines={1}>
                {producto.nombre}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
{productosDestacados && productosDestacados.length > 0 && (
  <View style={styles.seccionProductos}>
    {/* Filtramos las categorías únicas */}
    {Array.from(new Set(productosDestacados.map(p => p.categoria).filter(cat => cat))).map(categoria => (
      <View key={categoria} style={styles.categoriaContainer}>
        <View style={styles.headerSeccion}>
          <View style={[
            styles.iconoSeccionContainer,           
          ]}>
            <FontAwesome 
              name={getIconForCategory(categoria)} 
              size={16} 
            />
          </View>
          <Text style={[styles.tituloSeccionGaleria]}>
            {categoria ? categoria.toUpperCase() : 'DESTACADOS'}
          </Text>
        </View>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galeriaScroll}
        >
          {productosDestacados
            .filter(producto => producto.categoria === categoria)
            .map(producto => (
              <TouchableOpacity 
                key={producto.id}
                style={styles.itemGaleria}
                onPress={() => navigation.navigate("PedidoDetalle", { producto })}
              >
                {/* Imagen del producto */}
                <View style={styles.imagenContainer}>
                  <Image 
                    source={producto.productoSeleccionado && producto.productoSeleccionado.imagen ? producto.productoSeleccionado.imagen : (producto.galeria && producto.galeria[0] ? producto.galeria[0].imagen : producto.imagen || require('../assets/icon.png'))} 
                    style={styles.imagenGaleria}
                    contentFit="cover"
                  />
                   <View style={styles.etiquetaCategoria}>
                   <Text style={styles.etiquetaTexto}>
                              DESTACADO
                            </Text>
                   </View>
                </View>
                
                {/* Información del producto */}
                <View style={styles.infoGaleria}>
                  {/* Descripción */}
                  <Text style={styles.descripcionGaleria} numberOfLines={2}>
                    {producto.productoSeleccionado && producto.productoSeleccionado.descripcion ? producto.productoSeleccionado.descripcion : (producto.galeria && producto.galeria[0] ? producto.galeria[0].descripcion : producto.descripcion)}
                  </Text>
                  
                  {/* Precio */}
                  <Text style={styles.precioProducto}>
                    {producto.productoSeleccionado && producto.productoSeleccionado.precio ? 
                      `$${producto.productoSeleccionado.precio.toLocaleString("es-CL")}` : 
                      (producto.galeria && producto.galeria[0] && producto.galeria[0].precio ? 
                        `$${producto.galeria[0].precio.toLocaleString("es-CL")}` : 
                        "Consulte")}
                  </Text>
                  
                  {/* Recuadro con logo y nombre de empresa */}
                  <View style={styles.empresaContainer}>
                    <Image 
                      source={producto.logo || require('../assets/icon.png')} 
                      style={styles.logoEmpresa}
                      contentFit="contain"
                    />
                    <Text style={styles.nombreEmpresa} numberOfLines={1}>
                      {producto.nombre}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </View>
    ))}
  </View>
)}
          {/* Sección de Emprendimientos por Categoría de Negocio */}
          {Object.keys(emprendimientosPorCategoria).length > 0 && (
            <View style={styles.seccionProductos}>
              {Object.entries(emprendimientosPorCategoria).map(([categoria, emprendimientos]) => {
                // Seleccionar aleatoriamente hasta 5 emprendimientos de esta categoría
                const emprendimientosMostrar = shuffleArray(emprendimientos).slice(0, 5);
                
                if (emprendimientosMostrar.length === 0) return null;
                
                return (
                  <View key={categoria} style={styles.categoriaContainer}>
                    <View style={styles.headerSeccion}>
                      <View style={styles.iconoSeccionContainer}>
                        <FontAwesome 
                          name={getIconForCategory(categoria)} 
                          size={16} 
                        />
                      </View>
                      <Text style={[styles.tituloSeccionGaleria]}>
                        {categoria.toUpperCase()}
                      </Text>
                    </View>
                    
                    <ScrollView 
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.galeriaScroll}
                    >
                      {emprendimientosMostrar.map(emp => (
                        <TouchableOpacity 
                          key={emp.id}
                          style={styles.itemGaleria}
                          onPress={() => navigation.navigate("PedidoDetalle", { producto: emp })}
                        >
                          {/* Imagen del emprendimiento */}
                          <View style={styles.imagenContainer}>
                            <Image 
                              source={emp.imagen} 
                              style={styles.imagenGaleria}
                              contentFit="cover"
                            />
                          </View>
                          
                          {/* Información del emprendimiento */}
                          <View style={styles.infoGaleria}>
                            {/* Nombre */}
                            <Text style={styles.descripcionGaleria} numberOfLines={2}>
                              {emp.descripcion}
                            </Text>
                            
                            {/* Estado */}
                            <Text style={styles.precioProducto}>
                              {emp.estado}
                            </Text>
                            
                            {/* Recuadro con logo y nombre */}
                            <View style={styles.empresaContainer}>
                              <Image 
                                source={emp.logo || require('../assets/icon.png')} 
                                style={styles.logoEmpresa}
                                contentFit="contain"
                              />
                              <Text style={styles.nombreEmpresa} numberOfLines={1}>
                                {emp.nombre}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal obligatorio para agregar dirección */}
      <Modal
        visible={modalObligatorioVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          // No permitir cerrar el modal hasta tener al menos una dirección
          // No hacer nada si no hay direcciones
        }}
      >
        <View style={styles.modalObligatorioOverlay}>
          <View style={styles.modalObligatorioContainer}>
            <View style={styles.modalObligatorioHeader}>
              <Ionicons name="location" size={32} color={currentTheme.primary} />
              <Text style={styles.modalObligatorioTitle}>
                ¡Necesitas una dirección!
              </Text>
            </View>
            
            <Text style={styles.modalObligatorioMessage}>
              Para poder recibir pedidos y servicios, necesitas agregar al menos una dirección de entrega.
            </Text>
            
            <View style={styles.modalObligatorioActions}>
              <TouchableOpacity
                style={[styles.modalObligatorioButton, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]}
                onPress={() => {
                  setModalObligatorioVisible(false);
                  navigation.navigate('MisDirecciones');
                }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.modalObligatorioButtonText}>
                  Agregar mi primera dirección
                </Text>
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
    backgroundColor: "#FAFAF9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 130, // Espacio para la barra inferior
  },

  // ✅ Botón de menú lateral (3 rayas)
  menuButton: {
    position: "absolute",
    top: 55,
    left: 25,
    borderColor: "black",
    padding: 5,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },

  usuarioContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0)",
    padding: 15,
    marginTop: 0,
    borderRadius: 10,
    justifyContent: "flex-end",
  },
  usuarioInfo: { marginLeft: 10, alignItems: "right" },
  usuarioNombre: { fontSize: 14, color: "#333" },
  usuarioPlan: { fontSize: 16, fontWeight: "bold", color: "#555" },
  usuarioTipo: { fontSize: 16, fontWeight: "bold", color: "#555" },

  // ✅ Menú lateral tipo cortina
  drawerMenu: { flex: 1, backgroundColor: "#FFF", padding: 20 },
  drawerTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  drawerText: { fontSize: 18, marginLeft: 10, color: "#333" },

  menuMaster: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
  },

  categoria: { marginBottom: 10, backgroundColor: "#2A9D8F", borderRadius: 8 },
  categoriaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  categoriaNombre: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subcategoria: {
    padding: 10,
    backgroundColor: "#F18F01",
    borderRadius: 1,
    marginVertical: 2,
    alignItems: "center",
  },
  subcategoriaTexto: { color: "white", fontSize: 16 },

  // ✅ Sección de productos destacados
  scrollContainer: { flexGrow: 1, paddingBottom: 30, marginTop: 10 },
  destacados: {
    paddingHorizontal: 40,
    backgroundColor: "rgba(255, 255, 255, 0)",
    width: "100%",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  bannerContainer: {
    width: "100%",
    borderRadius: 20,
    marginBottom: 0,
    overflow: "hidden", // Esto asegura que la imagen no sobresalga del borde redondeado
  },
  banner: {
    width: "100%",
    height: 120, // Altura fija en lugar de porcentaje
    resizeMode: "hidden", // Asegura que la imagen cubra todo el espacio sin deformarse
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#2c7edb",
  },

  productoContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  productoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  productoLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  productoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },

  productoImagenPrincipal: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  productoImagenPrincipalVip: {
    width: "100%",
    height: 320, // Ajusta esta altura según necesites
    resizeMode: "cover",
  },
  productoDetalles: {
    padding: 15,
  },

  productoDescripcion: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },

  productoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productoEstadoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  luzEstado: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },

  productoEstado: {
    fontSize: 14,
    fontWeight: "bold",
  },

  estrellas: {
    flexDirection: "row",
  },

  swiper: {
    paddingTop: 10,
    height: 380, // Ajusta según necesites
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  direccionContainer: {
    alignItems: "center",
    backgroundColor: "#2A9D8F",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: -20,
    marginHorizontal: -20,
    marginBottom: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  direccionSuperior: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Espacio entre la dirección y el buscador
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 5,
    // Añade esto si quieres que ocupe todo el espacio disponible:
    width: '100%', 
  },
  searchIcon: {
    padding: 5,
    // Esto asegura que el ícono esté alineado correctamente:
    marginLeft: -30, 
    zIndex: 1,
  },
  selectorDireccion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  direccionTextContainer: {
    marginLeft: 8,
  },
  direccionTitulo: {
    fontSize: 12,
    color: "#fff",
  },
  direccionTexto: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  direccionOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  direccionSelected: {
    backgroundColor: "#f5f5f5",
  },
  direccionOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  direccionOptionNombre: {
    fontSize: 16,
    fontWeight: "500",
  },
  direccionOptionDireccion: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  direccionOptionDetalles: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  agregarDireccion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  agregarDireccionText: {
    marginLeft: 12,
    color: "#0b8e0d",
    fontWeight: "500",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  iconosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "120%",
    marginBottom: 20,
  },
  iconoItem: {
    alignItems: "center",
    width: "23%", // Ajusta según el espacio necesario
  },
  iconoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  iconoImagen: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  iconoImagen2: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  iconoImagen3: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  iconoTexto: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginTop: 5,
  },
  // Agrega estos estilos al final de tu StyleSheet
  seccionProductos: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  categoriaContainer: {
    marginBottom: 30,
  },
  headerSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconoSeccionContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tituloSeccionGaleria: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  galeriaScroll: {
    paddingLeft: 5,
  },
  itemGaleria: {
    width: 180,
    marginRight: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10
  },
  imagenContainer: {
    height: 120,
    position: 'relative',
  },
  imagenGaleria: {
    width: '100%',
    height: '100%',
  },
  infoGaleria: {
    padding: 12,
  },
  descripcionGaleria: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    minHeight: 40,
  },
  precioProducto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A9D8F',
    marginBottom: 8,
  },
  empresaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 6,
    marginTop: 5,
  },
  logoEmpresa: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  nombreEmpresa: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  etiquetaCategoria: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFA000',
  },
  etiquetaTexto: {
    color: 'white',
    backgroundColor: '#FFA000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  etiquetaTextoOferta: {
    color: 'white',
    backgroundColor: '#FF5252',
    fontWeight: 'bold',
    fontSize: 12,
  },
  seccionOfertas: {
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  // Estilos para modal obligatorio
  modalObligatorioOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalObligatorioContainer: {
    backgroundColor: 'white',
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
  modalObligatorioHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalObligatorioTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  modalObligatorioMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalObligatorioActions: {
    gap: 12,
  },
  modalObligatorioButton: {
    backgroundColor: '#2A9D8F', // Se actualizará dinámicamente en el JSX
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#2A9D8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalObligatorioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HomeScreen;
