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
  Alert,
  //BackHandler,
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
import LoadingVeciApp from "../components/LoadingVeciApp";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

const HomeScreen = ({ navigation }) => {
  const userContext = useUser();
  const { usuario, direcciones, direccionSeleccionada, loading, cargarUsuario, cargarDirecciones, establecerDireccionSeleccionada, modoVista, volverAVistaEmprendedor } = userContext;
  const { currentTheme } = useTheme();
  
  // Toast para notificaciones
  const toast = useToast();
  
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalObligatorioVisible, setModalObligatorioVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const intentosCargaRef = useRef(0);
  const modalYaMostrado = useRef(false);
  const direccionesRef = useRef([]); // Ref para tener valor actualizado en closures
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
        toast.warning("Tu sesión ha caducado, inicia sesión nuevamente", 3000);
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }, 3000);
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
          
          console.log('🏠 HomeScreen: Llamando a cargarUsuario(true)...');
          const usuarioCargado = await cargarUsuario(true); // Forzar recarga para obtener datos frescos
          console.log('🏠 HomeScreen: Usuario cargado:', usuarioCargado ? `EXISTE (ID: ${usuarioCargado.id})` : 'NULL');
          
          // Si después de cargar todavía es null, hay un error
          if (!usuarioCargado) {
            console.error('🏠 HomeScreen: No se pudo cargar el usuario después del intento');
            setCargandoUsuario(false);
            return;
          }
          
          // Si es vendedor, redirigir a PedidosRecibidos
          if (usuarioCargado.tipo_usuario === 'vendedor') {
            console.log('🏠 HomeScreen: Usuario es vendedor, redirigiendo a PedidosRecibidos');
            navigation.navigate("PedidosRecibidos");
            setCargandoUsuario(false);
            return;
          }
        } else {
          console.log('🏠 HomeScreen: Usuario existe, usando cache');
          await cargarUsuario(false); // Usar cache si es válido
          
          // Si es vendedor, redirigir a PedidosRecibidos
          if (usuario.tipo_usuario === 'vendedor') {
            console.log('🏠 HomeScreen: Usuario es vendedor, redirigiendo a PedidosRecibidos');
            navigation.navigate("PedidosRecibidos");
            setCargandoUsuario(false);
            return;
          }
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

  // Actualizar ref cuando cambian las direcciones
  useEffect(() => {
    direccionesRef.current = direcciones;
  }, [direcciones]);

  // Verificar direcciones y mostrar modal 1 segundo después de que termine la animación de loading
  // SOLO para usuarios tipo "cliente" O emprendedores en modo vista cliente
  useEffect(() => {
    // Usar tipo de usuario efectivo (considera modo vista)
    const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
    const esCliente = tipoEfectivo === 'cliente';
    
    // IMPORTANTE: Solo verificar direcciones cuando la carga inicial haya terminado
    // Esto evita mostrar el modal mientras las direcciones aún se están cargando
    if (cargandoUsuario || loading) {
      console.log('⏳ Todavía cargando datos, esperando para verificar direcciones...');
      return;
    }
    
    console.log('🔍 VERIFICACIÓN DE MODAL:', {
      esCliente,
      tipoReal: usuario?.tipo_usuario,
      modoVista,
      tipoEfectivo,
      cantidadDirecciones: direcciones?.length || 0,
      modalYaMostrado: modalYaMostrado.current,
      cargandoUsuario,
      loading
    });
    
    if (esCliente && direcciones && direcciones.length === 0 && !modalYaMostrado.current) {
      // Escuchar cuando termine la animación del overlay global
      const checkInterval = setInterval(async () => {
        const animacionTerminada = await AsyncStorage.getItem('animacionOverlayTerminada');
        if (animacionTerminada === 'true') {
          console.log('🎬 Animación de overlay detectada como terminada, esperando 1 segundo...');
          await AsyncStorage.removeItem('animacionOverlayTerminada');
          clearInterval(checkInterval);
          
          // Esperar 1 segundo adicional después de que termine la animación
          setTimeout(() => {
            // ⚠️ VERIFICAR NUEVAMENTE usando el ref actualizado (previene race condition)
            const direccionesActuales = direccionesRef.current;
            console.log('🔍 Verificación final antes de mostrar modal:', {
              cantidadDirecciones: direccionesActuales.length
            });
            
            if (direccionesActuales.length === 0) {
              console.log('📍 Mostrando modal de dirección obligatoria (usuario cliente sin direcciones)');
              setModalObligatorioVisible(true);
              modalYaMostrado.current = true; // Marcar como mostrado
            } else {
              console.log('✅ Direcciones cargadas durante la espera, NO mostrar modal');
            }
          }, 10);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    } else if (direcciones && direcciones.length > 0) {
      console.log('✅ Direcciones encontradas:', direcciones.length, '- Ocultando modal si estaba visible');
      setModalObligatorioVisible(false);
      modalYaMostrado.current = false; // Resetear cuando hay direcciones
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
  }, [direcciones, direccionSeleccionada, establecerDireccionSeleccionada, usuario?.tipo_usuario, modoVista, cargandoUsuario, loading]);

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

  // Ya no es necesario cargar calificación individual - viene en el JSON del backend
  // Función removida para optimizar requests

  // Función para agrupar emprendimientos por categoría de negocio
  const agruparEmprendimientosPorCategoria = (emprendimientos) => {
    const agrupados = {};
    
    for (const emp of emprendimientos) {
      const categoria = emp.categoria_principal || 'otros';
      
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      
      // La calificación ya viene en el JSON del backend (optimización)
      const rating = parseFloat(emp.calificacion_promedio) || 0;
      
      agrupados[categoria].push({
        id: emp.id,
        usuario_id: emp.usuario_id, // ✅ IMPORTANTE: Incluir usuario_id para validaciones
        nombre: emp.nombre,
        descripcion: emp.descripcion_corta || emp.descripcion,
        descripcionLarga: emp.descripcion_larga || emp.descripcion_corta || '',
        imagen: emp.background_url || require('../assets/icon2.png'),
        logo: emp.logo_url || require('../assets/icon2.png'),
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
        
        // Mapear emprendimientos a formato esperado por el Swiper (calificación ya viene en el JSON)
        const emprendimientosMapeados = destacadosSeleccionados.map(emp => {
          // La calificación ya viene en el JSON del backend (optimización)
          const rating = parseFloat(emp.calificacion_promedio) || 0;
          
          return {
            id: emp.id,
            usuario_id: emp.usuario_id, // ✅ IMPORTANTE: Incluir usuario_id para validaciones
            nombre: emp.nombre,
            descripcion: emp.descripcion_corta || emp.descripcion,
            descripcionLarga: emp.descripcion_larga || emp.descripcion_corta || '',
            imagen: emp.background_url || require('../assets/icon2.png'),
            logo: emp.logo_url || require('../assets/icon2.png'),
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
          usuario_id: emprendimiento.usuario_id, // ✅ CRÍTICO: Incluir usuario_id para validaciones
          nombre: emprendimiento.nombre,
          descripcion: emprendimiento.descripcion_corta || emprendimiento.descripcion,
          descripcionLarga: emprendimiento.descripcion_larga || emprendimiento.descripcion_corta || '',
          imagen: emprendimiento.background_url || require('../assets/icon2.png'),
          logo: emprendimiento.logo_url || require('../assets/icon2.png'),
          estado: mapearEstado(emprendimiento),
          telefono: emprendimiento.telefono,
          direccion: emprendimiento.direccion,
          metodosEntrega: emprendimiento.tipos_entrega || { delivery: true, retiro: true },
          metodosPago: emprendimiento.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
          rating: 4.5,
          horarios: emprendimiento.horarios,
          galeria: productos.map(prod => ({
            id: prod.id,
            imagen: prod.imagen_url ? { uri: prod.imagen_url } : require('../assets/icon2.png'),
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
            // Crear un ID único combinando emprendimiento y producto para evitar duplicados
            id: `${emprendimiento.id}-${producto.id}`,
            // Agregar la categoría al objeto
            categoria: categoria,
            // Sobrescribir solo lo específico del producto
            productoSeleccionado: {
              id: producto.id,
              imagen: producto.imagen_url ? { uri: producto.imagen_url } : require('../assets/icon2.png'),
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
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <LoadingVeciApp size={140} color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.text, marginTop: 30 }]}>
          {loading || cargandoUsuario ? 'Cargando tu comunidad...' : 'Preparando todo para ti...'}
        </Text>
      </View>
    );
  }

  const handleSeleccionDireccion = (id) => {
    if (establecerDireccionSeleccionada) {
      establecerDireccionSeleccionada(id);
    }
  };

  // Función para validar direcciones antes de navegar
  // SOLO aplica a usuarios tipo "cliente" O emprendedores en modo vista cliente
  const navegarConValidacion = (nombrePantalla, params = {}) => {
    // Pantallas que NO requieren validación de dirección
    const pantallasExentas = ['MisDirecciones', 'Login', 'Perfil', 'InformacionPersonal'];
    
    // Validar direcciones para clientes Y emprendedores en modo vista cliente
    const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
    const esCliente = tipoEfectivo === 'cliente';
    
    if (esCliente && !pantallasExentas.includes(nombrePantalla) && direcciones.length === 0) {
      // No navegar, el modal obligatorio ya está visible
      return;
    }
    
    navigation.navigate(nombrePantalla, params);
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
      {/* Banner de Modo Vista Cliente - Solo si el emprendedor está viendo como cliente */}
      {modoVista === 'cliente' && usuario?.tipo_usuario === 'emprendedor' && (
        <TouchableOpacity
          style={styles.modoVistaBanner}
          onPress={() => {
            Alert.alert(
              "Vista de Cliente Activa",
              "Estás viendo la app como cliente para probar tu negocio. ¿Quieres volver a tu perfil de emprendedor?",
              [
                { text: "Seguir como Cliente", style: "cancel" },
                {
                  text: "Volver a Emprendedor",
                  onPress: async () => {
                    await volverAVistaEmprendedor();
                    navigation.dispatch(
                      require('@react-navigation/native').CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Perfil' }],
                      })
                    );
                  }
                }
              ]
            );
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#f39c12', '#e67e22']}
            style={styles.modoVistaBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="eye" size={18} color="white" />
            <Text style={styles.modoVistaBannerTexto}>
              Modo Cliente Activo - Toca para volver
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <View
        style={[
          styles.container, 
          { backgroundColor: currentTheme.background },
          modoVista === 'cliente' && usuario?.tipo_usuario === 'emprendedor' && styles.containerConBanner
        ]}
      >
        <LinearGradient  
          colors={[currentTheme.primary, currentTheme.secondary]} 
          style={styles.headerModerno}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Selector de dirección elegante */}
          <TouchableOpacity
            style={styles.direccionModerna}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.direccionIconCircle}>
              <Ionicons name="location" size={18} color={currentTheme.primary} />
            </View>
            <View style={styles.direccionInfoModerna}>
              <Text style={styles.direccionLabelModerno}>Entregar en</Text>
              <Text style={styles.direccionTextoModerno} numberOfLines={1}>
                {direccionActual ? formatearDireccionMostrada(direccionActual.direccion) : 'Selecciona dirección'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          {/* Barra de búsqueda moderna */}
          <TouchableOpacity
            style={styles.searchBarModerno}
            onPress={() => navegarConValidacion('Busqueda')}
            activeOpacity={0.95}
          >
            <Ionicons name="search" size={20} color={currentTheme.primary} style={styles.searchIconStart} />
            <Text style={styles.searchPlaceholderModerno}>
              Buscar restaurantes, productos...
            </Text>
            <Ionicons name="options-outline" size={18} color="#95a5a6" />
          </TouchableOpacity>
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
          {/* Categorías principales - Banner horizontal */}
          <View style={styles.categoriasSection}>
            <Text style={[styles.categoriasTitle, { color: currentTheme.text }]}>
              Explorar Categorías
            </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriasBannerScroll}
              >
                {/* Comida */}
                <Pressable
                  onPress={() => navegarConValidacion('Comida', { categoria: 'comida' })}
                  style={({ pressed }) => [
                    styles.categoriaModernaMix,
                    pressed && styles.categoriaBannerPressed
                  ]}
                >
                  <Image
                    source={require('../assets/pizza.jpg')}
                    style={styles.categoriaModernaImagen}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', currentTheme.primary + 'DD']}
                    start={{ x: 2, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.categoriaModernaGradienteMix}
                  >
                    <View style={styles.categoriaModernaTextoMix}>
                      <View style={styles.categoriaModernaInfoMix}>
                        <Text style={styles.categoriaModernaTituloMix}>Comida</Text>
                        <Text style={styles.categoriaModernaSubtituloMix}>Restaurantes locales</Text>
                      </View>
                      <View style={styles.categoriaModernaBadgeMix}>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Servicios */}
                <Pressable
                  onPress={() => navegarConValidacion('Servicios', { categoria: 'servicios' })}
                  style={({ pressed }) => [
                    styles.categoriaModernaMix,
                    pressed && styles.categoriaBannerPressed
                  ]}
                >
                  <Image
                    source={require('../assets/gasfiter.jpg')}
                    style={styles.categoriaModernaImagen}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', currentTheme.primary + 'DD']}
                    start={{ x: 2, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.categoriaModernaGradienteMix}
                  >
                    <View style={styles.categoriaModernaTextoMix}>
                      <View style={styles.categoriaModernaInfoMix}>
                        <Text style={styles.categoriaModernaTituloMix}>Servicios</Text>
                        <Text style={styles.categoriaModernaSubtituloMix}>Profesionales cerca</Text>
                      </View>
                      <View style={styles.categoriaModernaBadgeMix}>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Tiendas */}
                <Pressable
                  onPress={() => navegarConValidacion('Negocios', { categoria: 'negocios', titulo: 'Tiendas & Negocios', icono: 'shopping-bag' })}
                  style={({ pressed }) => [
                    styles.categoriaModernaMix,
                    pressed && styles.categoriaBannerPressed
                  ]}
                >
                  <Image
                    source={require('../assets/almacen.jpg')}
                    style={styles.categoriaModernaImagen}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', currentTheme.primary + 'DD']}
                    start={{ x: 2, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.categoriaModernaGradienteMix}
                  >
                    <View style={styles.categoriaModernaTextoMix}>
                      <View style={styles.categoriaModernaInfoMix}>
                        <Text style={styles.categoriaModernaTituloMix}>Tiendas</Text>
                        <Text style={styles.categoriaModernaSubtituloMix}>Comercios locales</Text>
                      </View>
                      <View style={styles.categoriaModernaBadgeMix}>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Belleza */}
                <Pressable
                  onPress={() => navegarConValidacion('Belleza', { categoria: 'belleza' })}
                  style={({ pressed }) => [
                    styles.categoriaModernaMix,
                    pressed && styles.categoriaBannerPressed
                  ]}
                >
                  <Image
                    source={require('../assets/belleza.avif')}
                    style={styles.categoriaModernaImagen}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', currentTheme.primary + 'DD']}
                    start={{ x: 2, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.categoriaModernaGradienteMix}
                  >
                    <View style={styles.categoriaModernaTextoMix}>
                      <View style={styles.categoriaModernaInfoMix}>
                        <Text style={styles.categoriaModernaTituloMix}>Belleza</Text>
                        <Text style={styles.categoriaModernaSubtituloMix}>Salones y estética</Text>
                      </View>
                      <View style={styles.categoriaModernaBadgeMix}>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
          </View>

          <View style={styles.destacados}>
            {emprendimientosDestacados.length > 0 ? (
              <Swiper
                autoplay={true}
                autoplayTimeout={3}
                showsPagination={true}
                style={styles.swiper}
                dotStyle={styles.swiperDot}
                activeDotStyle={styles.swiperActiveDot}
                paginationStyle={styles.swiperPagination}
              >
                {emprendimientosDestacados.map((producto) => {
                const isOpen = producto.estado;
                const isVip = !producto.nombre; // Asume que los VIP no tienen nombre
                // Verificar si es propio emprendimiento
                const esPropioEmprendimiento = producto.usuario_id === usuario?.id;
                const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
                const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

                return (
                  <TouchableOpacity
                    key={producto.id}
                    style={styles.productoContainer}
                    onPress={() => {
                      if (isVip) {
                        navigation.navigate("PlanScreen");
                      } else {
                        // Si es propio emprendimiento en modo cliente, advertir
                        if (mostrarAdvertencia) {
                          toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
                          return;
                        }
                        // Si está cerrado, abrir en modo preview
                        const isPreview = producto.estado === 'Cerrado';
                        navegarConValidacion("PedidoDetalle", { 
                          producto,
                          isPreview: isPreview
                        });
                      }
                    }}
                  >
                    {/* Solo mostrar header y footer si NO es VIP */}
                    {!isVip ? (
                      <>
                        {/* Imagen principal con overlay */}
                        <View style={styles.productoImagenWrapper}>
                          <Image
                            source={producto.imagen}
                            style={styles.productoImagenDestacado}
                          />
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.productoImagenOverlay}
                          >
                            {/* Badge de estado */}
                            <View style={[
                              styles.productoBadgeEstado,
                              {
                                backgroundColor: isOpen === "Abierto" 
                                  ? 'rgba(46, 204, 113, 0.95)' 
                                  : isOpen === "Cierra Pronto"
                                  ? 'rgba(241, 196, 15, 0.95)'
                                  : 'rgba(231, 76, 60, 0.95)'
                              }
                            ]}>
                              <Animated.View
                                style={[
                                  styles.luzEstadoNuevo,
                                  {
                                    backgroundColor: "#FFF",
                                    opacity: isOpen === "Abierto" || isOpen === "Cierra Pronto" ? animatedValue : 1,
                                  },
                                ]}
                              />
                              <Text style={styles.productoEstadoNuevo}>
                                {producto.estado}
                              </Text>
                            </View>
                            
                            {/* Badge de propio negocio */}
                            {mostrarAdvertencia && (
                              <View style={[styles.productoBadgePropio]}>
                                <Ionicons name="storefront" size={12} color="white" />
                                <Text style={styles.productoBadgePropioTexto}>Tu Negocio</Text>
                              </View>
                            )}
                            
                            {/* Info inferior */}
                            <View style={styles.productoInfoOverlay}>
                              <View style={styles.productoLogoWrapper}>
                                <Image
                                  source={producto.logo}
                                  style={styles.productoLogoNuevo}
                                />
                              </View>
                              <View style={styles.productoInfoTexto}>
                                <Text style={styles.productoNombreNuevo} numberOfLines={1}>
                                  {producto.nombre}
                                </Text>
                                <Text style={styles.productoDescripcionNueva} numberOfLines={2}>
                                  {producto.descripcion}
                                </Text>
                                {/* Rating */}
                                <View style={styles.productoRatingNuevo}>
                                  <FontAwesome name="star" size={14} color="#FFD700" />
                                  <Text style={styles.productoRatingTexto}>
                                    {producto.rating?.toFixed(1) || '0.0'}
                                  </Text>
                                  <View style={styles.estrellasSeparador} />
                                  {[1, 2, 3, 4, 5].map((star) => {
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
                                      return <FontAwesome key={star} name="star" size={12} color="#FFD700" />;
                                    } else if (star - 0.5 <= rating && rating < star) {
                                      return <FontAwesome key={star} name="star-half-o" size={12} color="#FFD700" />;
                                    } else {
                                      return <FontAwesome key={star} name="star-o" size={12} color="#FFD700" />;
                                    }
                                  })}
                                </View>
                              </View>
                            </View>
                          </LinearGradient>
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
            ) : (
              <View style={styles.emptyStateHome}>
                <FontAwesome name="clock-o" size={64} color="#95a5a6" />
                <Text style={styles.emptyTitleHome}>
                  No hay emprendimientos disponibles
                </Text>
                <Text style={styles.emptySubtitleHome}>
                  Por el momento no hay negocios abiertos en tu zona.{'\n'}
                  Vuelve pronto para descubrir nuevos emprendimientos locales.
                </Text>
              </View>
            )}
          </View>
          {/* Sección de Ofertas Destacadas */}
{productosOferta && productosOferta.length > 0 && (
  <View style={styles.seccionOfertas}>
    <LinearGradient
      colors={['#FF5252', '#E91E63']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerSeccionGradiente}
    >
      <View style={styles.headerSeccionContenido}>
        <View style={styles.iconoSeccionContainerModerno}>
          <Ionicons name="pricetag" size={20} color="#FFF" />
        </View>
        <Text style={styles.tituloSeccionModerno}>
          Ofertas Destacadas
        </Text>
      </View>
      <View style={styles.lineaDecorativa} />
    </LinearGradient>
    
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.galeriaScroll}
    >
      {productosOferta.map(producto => {
        // Verificar si es propio emprendimiento
        console.log('🔍 OFERTAS - Verificando producto:', {
          productoId: producto.id,
          productoNombre: producto.nombre,
          productoUsuarioId: producto.usuario_id,
          usuarioId: usuario?.id,
          coincide: producto.usuario_id === usuario?.id
        });
        const esPropioEmprendimiento = producto.usuario_id === usuario?.id;
        const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
        const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

        return (
        <TouchableOpacity 
          key={producto.id}
          style={styles.itemGaleria}
          onPress={() => {
            console.log('👆 CLICK en OFERTA:', {
              productoId: producto.id,
              productoUsuarioId: producto.usuario_id,
              usuarioId: usuario?.id,
              esPropioEmprendimiento,
              tipoEfectivo,
              mostrarAdvertencia
            });
            if (mostrarAdvertencia) {
              toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
              return;
            }
            const isPreview = producto.estado === 'Cerrado';
            navegarConValidacion("PedidoDetalle", { 
              producto,
              isPreview: isPreview
            });
          }}
        >
          {/* Imagen del producto */}
          <View style={styles.imagenContainer}>
            <Image 
              source={producto.productoSeleccionado && producto.productoSeleccionado.imagen ? producto.productoSeleccionado.imagen : (producto.galeria && producto.galeria[0] ? producto.galeria[0].imagen : producto.imagen || require('../assets/icon2.png'))} 
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
                `$${Math.round(producto.productoSeleccionado.precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}` : 
                (producto.galeria && producto.galeria[0] && producto.galeria[0].precio ? 
                  `$${Math.round(producto.galeria[0].precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}` : 
                  "Consulte")}
            </Text>
            
            {/* Recuadro con logo y nombre de empresa */}
            <View style={styles.empresaContainer}>
              <Image 
                source={producto.logo || require('../assets/icon2.png')} 
                style={styles.logoEmpresa}
                contentFit="contain"
              />
              <Text style={styles.nombreEmpresa} numberOfLines={1}>
                {producto.nombre}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
)}
{productosDestacados && productosDestacados.length > 0 && (
  <View style={styles.seccionProductos}>
    {/* Filtramos las categorías únicas */}
    {Array.from(new Set(productosDestacados.map(p => p.categoria).filter(cat => cat))).map(categoria => (
      <View key={categoria} style={styles.categoriaContainer}>
        <LinearGradient
          colors={[currentTheme.primary, currentTheme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerSeccionGradiente}
        >
          <View style={styles.headerSeccionContenido}>
            <View style={styles.iconoSeccionContainerModerno}>
              <Ionicons 
                name={categoria === 'principal' ? 'star' : categoria === 'oferta' ? 'pricetag' : 'flame'} 
                size={20} 
                color="#FFF"
              />
            </View>
            <Text style={styles.tituloSeccionModerno}>
              {categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1) : 'Destacados'}
            </Text>
          </View>
          <View style={styles.lineaDecorativa} />
        </LinearGradient>
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galeriaScroll}
        >
          {productosDestacados
            .filter(producto => producto.categoria === categoria)
            .map(producto => {
              // Verificar si es propio emprendimiento
              console.log('🔍 DESTACADOS - Verificando producto:', {
                productoId: producto.id,
                productoNombre: producto.nombre,
                productoUsuarioId: producto.usuario_id,
                usuarioId: usuario?.id,
                coincide: producto.usuario_id === usuario?.id
              });
              const esPropioEmprendimiento = producto.usuario_id === usuario?.id;
              const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
              const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

              return (
              <TouchableOpacity 
                key={producto.id}
                style={styles.itemGaleria}
                onPress={() => {
                  console.log('👆 CLICK en DESTACADO:', {
                    productoId: producto.id,
                    productoUsuarioId: producto.usuario_id,
                    usuarioId: usuario?.id,
                    esPropioEmprendimiento,
                    tipoEfectivo,
                    mostrarAdvertencia
                  });
                  if (mostrarAdvertencia) {
                    toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
                    return;
                  }
                  navegarConValidacion("PedidoDetalle", { producto });
                }}
              >
                {/* Imagen del producto */}
                <View style={styles.imagenContainer}>
                  <Image 
                    source={producto.productoSeleccionado && producto.productoSeleccionado.imagen ? producto.productoSeleccionado.imagen : (producto.galeria && producto.galeria[0] ? producto.galeria[0].imagen : producto.imagen || require('../assets/icon2.png'))} 
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
                      `$${Math.round(producto.productoSeleccionado.precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}` : 
                      (producto.galeria && producto.galeria[0] && producto.galeria[0].precio ? 
                        `$${Math.round(producto.galeria[0].precio).toLocaleString("es-CL", { useGrouping: true }).replace(/,/g, '.')}` : 
                        "Consulte")}
                  </Text>
                  
                  {/* Recuadro con logo y nombre de empresa */}
                  <View style={styles.empresaContainer}>
                    <Image 
                      source={producto.logo || require('../assets/icon2.png')} 
                      style={styles.logoEmpresa}
                      contentFit="contain"
                    />
                    <Text style={styles.nombreEmpresa} numberOfLines={1}>
                      {producto.nombre}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              );
            })
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
                    <LinearGradient
                      colors={[currentTheme.primary, currentTheme.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.headerSeccionGradiente}
                    >
                      <View style={styles.headerSeccionContenido}>
                        <View style={styles.iconoSeccionContainerModerno}>
                          <Ionicons 
                            name={categoria === 'comida' ? 'restaurant' : categoria === 'servicios' ? 'construct' : categoria === 'negocios' ? 'storefront' : categoria === 'belleza' ? 'cut' : 'business'} 
                            size={20} 
                            color="#FFF"
                          />
                        </View>
                        <Text style={styles.tituloSeccionModerno}>
                          {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.lineaDecorativa} />
                    </LinearGradient>
                    
                    <ScrollView 
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.galeriaScroll}
                    >
                      {emprendimientosMostrar.map(emp => {
                        // Verificar si es propio emprendimiento
                        console.log('🔍 CATEGORÍA - Verificando emprendimiento:', {
                          empId: emp.id,
                          empNombre: emp.nombre,
                          empUsuarioId: emp.usuario_id,
                          usuarioId: usuario?.id,
                          coincide: emp.usuario_id === usuario?.id
                        });
                        const esPropioEmprendimiento = emp.usuario_id === usuario?.id;
                        const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
                        const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

                        return (
                        <TouchableOpacity 
                          key={emp.id}
                          style={styles.itemGaleria}
                          onPress={() => {
                            console.log('👆 CLICK en CATEGORÍA:', {
                              empId: emp.id,
                              empUsuarioId: emp.usuario_id,
                              usuarioId: usuario?.id,
                              esPropioEmprendimiento,
                              tipoEfectivo,
                              mostrarAdvertencia
                            });
                            if (mostrarAdvertencia) {
                              toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
                              return;
                            }
                            const isPreview = emp.estado === 'Cerrado';
                            navegarConValidacion("PedidoDetalle", { 
                              producto: emp,
                              isPreview: isPreview
                            });
                          }}
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
                                source={emp.logo || require('../assets/icon2.png')} 
                                style={styles.logoEmpresa}
                                contentFit="contain"
                              />
                              <Text style={styles.nombreEmpresa} numberOfLines={1}>
                                {emp.nombre}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                        );
                      })}
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

      {/* Toast para notificaciones */}
      <Toast
        visible={toast.toastConfig.visible}
        message={toast.toastConfig.message}
        type={toast.toastConfig.type}
        duration={toast.toastConfig.duration}
        onHide={toast.hideToast}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  // Banner de modo vista cliente
  modoVistaBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  modoVistaBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingTop: 50, // Espacio para el notch
    gap: 10,
  },
  modoVistaBannerTexto: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 130, // Espacio para la barra inferior
  },
  containerConBanner: {
    paddingTop: 50, // Espacio adicional cuando el banner está visible
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
    paddingBottom: 20,
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
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: 12,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  productoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  productoLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },

  productoNombre: {
    fontSize: 19,
    fontWeight: "800",
    flex: 1,
    color: "#2c3e50",
    letterSpacing: 0.3,
  },

  productoImagenPrincipal: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  productoImagenPrincipalVip: {
    width: "100%",
    height: 320, // Ajusta esta altura según necesites
    resizeMode: "cover",
  },
  productoDetalles: {
    padding: 18,
  },

  productoDescripcion: {
    fontSize: 15,
    color: "#7f8c8d",
    marginBottom: 14,
    lineHeight: 22,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  productoEstado: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  estrellas: {
    flexDirection: "row",
  },

  swiper: {
    paddingTop: 10,
    paddingBottom: 20,
    height: 410,
  },
  swiperPagination: {
    bottom: -5,
  },
  swiperDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  swiperActiveDot: {
    backgroundColor: '#2A9D8F',
    width: 24,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerModerno: {
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: -20,
    marginTop: -20
  },
  // Selector de dirección moderno
  direccionModerna: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  direccionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  direccionInfoModerna: {
    flex: 1,
  },
  direccionLabelModerno: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    marginBottom: 2,
  },
  direccionTextoModerno: {
    fontSize: 15,
    color: "white",
    fontWeight: "700",
  },
  // Barra de búsqueda moderna
  searchBarModerno: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconStart: {
    marginRight: 4,
  },
  searchPlaceholderModerno: {
    flex: 1,
    fontSize: 15,
    color: "#95a5a6",
    fontWeight: "500",
  },
  searchIconEnd: {
    padding: 4,
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
  categoriasSection: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  categoriasTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 8,
    letterSpacing: 0.3,
  },
  categoriasBannerScroll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 14,
  },
  categoriaBanner: {
    width: 200,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  categoriaBannerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  categoriaBannerGradient: {
    flex: 1,
    padding: 16,
  },
  categoriaBannerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoriaBannerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  categoriaBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  categoriaBannerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  categoriaBannerArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  // Estilos para banners con imagen
  categoriaBannerImagen: {
    width: 200,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  categoriaBannerBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  categoriaBannerOverlay: {
    flex: 1,
    padding: 16,
  },
  categoriaBannerContentImg: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoriaBannerTopImg: {
    alignItems: 'flex-start',
  },
  categoriaBannerIconWhite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoriaBannerBottomImg: {
    gap: 4,
  },
  categoriaBannerTitleImg: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoriaBannerSubtitleImg: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Estilos para cards publicitarias
  categoriaPublicitaria: {
    width: 240,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  categoriaPublicitariaOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  categoriaPublicitariaContent: {
    gap: 14,
  },
  categoriaPublicitariaTextContainer: {
    gap: 4,
  },
  categoriaPublicitariaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  categoriaPublicitariaTitulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  categoriaPublicitariaSubtitulo: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoriaPublicitariaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoriaPublicitariaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  // Estilos para cards modernas con gradiente horizontal
  categoriaModerna: {
    width: 220,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  categoriaModernaImagen: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    right: 0,
  },
  categoriaModernaGradiente: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  categoriaModernaTexto: {
    flexDirection: 'column',
    gap: 12,
    maxWidth: '60%',
  },
  categoriaModernaTitulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoriaModernaFlecha: {
    alignSelf: 'flex-start',
  },
  // Variante 2: Gradiente diagonal desde esquina
  categoriaModernaV2: {
    width: 220,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  categoriaModernaGradienteV2: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  categoriaModernaTextoV2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriaModernaTituloV2: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoriaModernaBadgeV2: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  // Variante 3: Gradiente con dos colores + subtítulo
  categoriaModernaV3: {
    width: 220,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  categoriaModernaGradienteV3: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  categoriaModernaTextoV3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriaModernaInfoV3: {
    flex: 1,
    gap: 6,
  },
  categoriaModernaTituloV3: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoriaModernaSubtituloV3: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Variante Mix: Combinación de V2 y V3
  categoriaModernaMix: {
    width: 220,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  categoriaModernaGradienteMix: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  categoriaModernaTextoMix: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoriaModernaInfoMix: {
    flex: 1,
    gap: 4,
  },
  categoriaModernaTituloMix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoriaModernaSubtituloMix: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoriaModernaBadgeMix: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  // Estilos para el nuevo diseño de cards del swiper
  productoImagenWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  productoImagenDestacado: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productoImagenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  productoBadgeEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  productoBadgePropio: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(155, 89, 182, 0.95)',
    marginBottom: 6,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  productoBadgePropioTexto: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  luzEstadoNuevo: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productoEstadoNuevo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  productoInfoOverlay: {
    flexDirection: 'row',
    gap: 14,
  },
  productoLogoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  productoLogoNuevo: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  productoInfoTexto: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 6,
  },
  productoNombreNuevo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  productoDescripcionNueva: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 19,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productoRatingNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  productoRatingTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 6,
  },
  estrellasSeparador: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  // Estilos antiguos (mantener por compatibilidad)
  categoriaButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 105,
  },
  categoriaContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    flex: 1,
  },
  categoriaIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriaTexto: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    numberOfLines: 1,
  },
  emptyStateHome: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    height: 380,
    marginHorizontal: -40,
    paddingBottom: 10
  },
  emptyTitleHome: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitleHome: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 22,
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
  headerSeccionGradiente: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  headerSeccionContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoSeccionContainerModerno: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloSeccionModerno: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lineaDecorativa: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
