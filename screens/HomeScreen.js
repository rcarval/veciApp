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
  //BackHandler,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Swiper from "react-native-swiper";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const HomeScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalObligatorioVisible, setModalObligatorioVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem("usuario");
        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }
      } catch (error) {
        console.log("Error al obtener el usuario:", error);
      }
    };
    cargarUsuario();
  }, []);

  useEffect(() => {
    const cargarDirecciones = async () => {
      try {
        const direccionesGuardadas = await AsyncStorage.getItem('direcciones');
        if (direccionesGuardadas) {
          const direccionesData = JSON.parse(direccionesGuardadas);
          setDirecciones(direccionesData);
          
          // Si no hay direcciones, mostrar modal obligatorio
          if (direccionesData.length === 0) {
            setModalObligatorioVisible(true);
            return;
          }
          
          // Seleccionar la dirección principal por defecto
          const direccionPrincipal = direccionesData.find(dir => dir.esPrincipal);
          if (direccionPrincipal) {
            setDireccionSeleccionada(direccionPrincipal.id);
          } else if (direccionesData.length > 0) {
            setDireccionSeleccionada(direccionesData[0].id);
          }
        } else {
          // No hay direcciones guardadas, mostrar modal obligatorio
          setModalObligatorioVisible(true);
        }
      } catch (error) {
        console.log('Error al cargar direcciones:', error);
        setModalObligatorioVisible(true);
      }
    };
    cargarDirecciones();
  }, []);

  // Recargar direcciones cuando se regrese a la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const cargarDirecciones = async () => {
        try {
          const direccionesGuardadas = await AsyncStorage.getItem('direcciones');
          if (direccionesGuardadas) {
            const direccionesData = JSON.parse(direccionesGuardadas);
            setDirecciones(direccionesData);
            
            // Si no hay direcciones, mostrar modal obligatorio SIEMPRE
            if (direccionesData.length === 0) {
              setModalObligatorioVisible(true);
              return;
            } else {
              // Si hay direcciones, ocultar el modal
              setModalObligatorioVisible(false);
            }
            
            // Mantener la selección actual o seleccionar la principal
            if (!direccionSeleccionada || !direccionesData.find(dir => dir.id === direccionSeleccionada)) {
              const direccionPrincipal = direccionesData.find(dir => dir.esPrincipal);
              if (direccionPrincipal) {
                setDireccionSeleccionada(direccionPrincipal.id);
              } else if (direccionesData.length > 0) {
                setDireccionSeleccionada(direccionesData[0].id);
              }
            }
          } else {
            // No hay direcciones guardadas, mostrar modal obligatorio
            setModalObligatorioVisible(true);
          }
        } catch (error) {
          console.log('Error al cargar direcciones:', error);
          setModalObligatorioVisible(true);
        }
      };
      cargarDirecciones();
    });

    return unsubscribe;
  }, [navigation]);

  // Verificar constantemente si hay direcciones y mostrar/ocultar modal
  useEffect(() => {
    if (direcciones.length === 0) {
      setModalObligatorioVisible(true);
    } else {
      setModalObligatorioVisible(false);
    }
  }, [direcciones]);
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

  const handleSeleccionDireccion = (id) => {
    setDireccionSeleccionada(id);
  };

  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const direccionActual = direcciones.find(
    (dir) => dir.id === direccionSeleccionada
  );

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

  const emprendimientosDestacados = [
    ...(usuario?.tipo_usuario === "emprendedor" 
      ? [{
          id: -1,
          imagen: require("../assets/premium.png"),
        }]
      : []),
    {
      id: 1,
      nombre: "Pizzeria Donatelo",
      descripcion: "Pizzas de masa madre",
      descripcionLarga:
        "Deliciosas pizzas con masa madre, hechas con mucho amor y amasada por la abuela de brazos musculosos.",
      imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2hdQeNVlyu20ReOpJcNwdgW0ER5hwxnauQ&s",
      logo: require("../assets/donatelo.png"),
      estado: "Abierto",
      telefono: "+56994908047",
      direccion: "Manuel Rodríguez 885, Isla de Maipo",
      metodosEntrega: { delivery: true, retiro: true },
      metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
      rating: 4.8,
      galeria: [
        {
          imagen: require("../assets/pizza-margarita.jpg"),
          nombre: "Pizza Margarita",
          descripcion: "Pizza Margarita clásica con ingredientes frescos",
          precio: 8990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/Pepperoni-pizza.webp"),
          nombre: "Pizza Pepperoni",
          descripcion: "Pizza Pepperoni con doble porción de pepperoni",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizza-iberica.webp"),
          nombre: "Pizza Iberica",
          descripcion: "Pizza Iberica con carne de cerdo y verduras",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizza-cuatro-quesos.jpg"),
          nombre: "Pizza cuatro quesos",
          descripcion: "Pizza cuatro quesos con extra queso",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizzaOferta.jpg"),
          nombre: "Pizza promo",
          descripcion: "Pizzas a elección 2 x 1",
          precio: 12990,
          categoria: "oferta"
        },
        {
          imagen: require("../assets/bebidas.jpg"),
          nombre: "Bebida en Lata",
          descripcion: "Coca Cola, Fanta o Sprite",
          precio: 1990,
          categoria: "secundario"
        },
      ]
    },
    {
      id: 2,
      nombre: "Pelucan",
      descripcion: "Estilismo profesional para perros.",
      descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
      imagen: require("../assets/pelucan.webp"),
      logo: require("../assets/pelucan_logo.png"),
      estado: "Cerrado",
      telefono: "+56994908047",
      direccion: "Vista Hermosa 319, Isla de Maipo",
      metodosEntrega: { delivery: true, retiro: true },
      metodosPago: { tarjeta: true, efectivo: true, transferencia: true },
      rating: 4.6,
    },
    {
      id: 3,
      nombre: "Grill Burger",
      descripcion: "Ricas hamburguesas caseras.",
      descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
      imagen: require("../assets/burger.webp"),
      logo: require("../assets/grillburger_logo.jpg"),
      estado: "Abierto",
      telefono: "+56994908047",
      direccion: "Balmaceda 1458, Talagante",
      metodosEntrega: { delivery: false, retiro: true },
      metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
      rating: 3.9,
    },
    {
      id: 4,
      nombre: "Carniceria Los Chinitos",
      descripcion: "Expertos en Carnes.",
      descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
      imagen: require("../assets/carniceria.webp"),
      logo: require("../assets/loschinitos_logo.jpg"),
      estado: "Abierto",
      telefono: "+56994908047",
      direccion: "El Zorzal Nte. 608, Isla de Maipo",
      metodosEntrega: { delivery: true, retiro: true },
      metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
      rating: 2.4,
      galeria: [
        {
          imagen: require("../assets/huachalomo.webp"),
          descripcion: "Huachalomo Categoría V 1 KG",
          precio: 9990,
          categoria: "principal"
        }
      ]
    },
    {
      id: 5,
      nombre: "Maestro José",
      descripcion: "Reparación y Construcción.",
      descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
      imagen: require("../assets/construccion.jpg"),
      logo: require("../assets/maestrojose_logo.jpeg"),
      estado: "Cierra Pronto",
      telefono: "+56994908047",
      direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
      metodosEntrega: { delivery: true, retiro: false },
      metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
      rating: 3.4,
    },
    {
      id: 6,
      nombre: "Gasfiter Experto",
      descripcion: "Reparación de Cañerías.",
      descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
      imagen: require("../assets/gasfiter.jpg"),
      logo: require("../assets/gasfiter_logo.jpeg"),
      estado: "Abierto",
      telefono: "+56994908047",
      direccion: "Balmaceda 1458, Talagante",
      metodosEntrega: { delivery: false, retiro: true },
      metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
      rating: 4.1,
    }
  ];
  
  const productosDestacados = [
    {
    id: 1,
    nombre: "Pizzeria Donatelo",
    descripcion: "Pizzas de masa madre",
    categoria: "comida",
    descripcionLarga:
      "Deliciosas pizzas con masa madre, hechas con mucho amor y amasada por la abuela de brazos musculosos.",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2hdQeNVlyu20ReOpJcNwdgW0ER5hwxnauQ&s",
    logo: require("../assets/donatelo.png"),
    estado: "Abierto",
    telefono: "+56994908047",
    direccion: "Manuel Rodríguez 885, Isla de Maipo",
    metodosEntrega: { delivery: true, retiro: true },
    metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
    rating: 4.8,
    galeria: [
      {
        imagen: require("../assets/pizza-margarita.jpg"),
        descripcion: "Pizza Margarita clásica con ingredientes frescos",
        precio: 8990,
        categoria: "principal"
      }
    ]
  },
  {
    id: 5,
    nombre: "Maestro José",
    descripcion: "Reparación y Construcción.",
    categoria: "servicios",
    descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
    imagen: require("../assets/construccion.jpg"),
    logo: require("../assets/maestrojose_logo.jpeg"),
    estado: "Cierra Pronto",
    telefono: "+56994908047",
    direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
    metodosEntrega: { delivery: true, retiro: false },
    metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
    rating: 3.4,
    galeria: [
      {
        imagen: require("../assets/pizza-margarita.jpg"),
        descripcion: "Pizza Margarita clásica con ingredientes frescos",
        precio: 8990,
        categoria: "principal"
      }
    ]
  },
  {
    id: 7,
    nombre: "Maestro José",
    descripcion: "Reparación y Construcción.",
    categoria: "negocios",
    descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
    imagen: require("../assets/construccion.jpg"),
    logo: require("../assets/maestrojose_logo.jpeg"),
    estado: "Cierra Pronto",
    telefono: "+56994908047",
    direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
    metodosEntrega: { delivery: true, retiro: false },
    metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
    rating: 3.4,
    galeria: [
      {
        imagen: require("../assets/pizza-margarita.jpg"),
        descripcion: "Pizza Margarita clásica con ingredientes frescos",
        precio: 8990,
        categoria: "principal"
      }
    ]
  },
  {
    id: 8,
    nombre: "Maestro José",
    descripcion: "Reparación y Construcción.",
    categoria: "belleza",
    descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
    imagen: require("../assets/construccion.jpg"),
    logo: require("../assets/maestrojose_logo.jpeg"),
    estado: "Cierra Pronto",
    telefono: "+56994908047",
    direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
    metodosEntrega: { delivery: true, retiro: false },
    metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
    rating: 3.4,
    galeria: [
      {
        imagen: require("../assets/pizza-margarita.jpg"),
        descripcion: "Pizza Margarita clásica con ingredientes frescos",
        precio: 8990,
        categoria: "principal"
      }
    ]
  }
];

const productosOferta = [
  {
  id: 1,
  nombre: "Pizzeria Donatelo",
  descripcion: "Pizzas de masa madre",
  categoria: "comida",
  descripcionLarga:
    "Deliciosas pizzas con masa madre, hechas con mucho amor y amasada por la abuela de brazos musculosos.",
  imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2hdQeNVlyu20ReOpJcNwdgW0ER5hwxnauQ&s",
  logo: require("../assets/donatelo.png"),
  estado: "Abierto",
  telefono: "+56994908047",
  direccion: "Manuel Rodríguez 885, Isla de Maipo",
  metodosEntrega: { delivery: true, retiro: true },
  metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
  rating: 4.8,
  galeria: [
    {
      imagen: require("../assets/pizza-margarita.jpg"),
      descripcion: "Pizza Margarita clásica con ingredientes frescos",
      precio: 8990,
      categoria: "oferta"
    }
  ]
},
{
  id: 5,
  nombre: "Maestro José",
  descripcion: "Reparación y Construcción.",
  categoria: "servicios",
  descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
  imagen: require("../assets/construccion.jpg"),
  logo: require("../assets/maestrojose_logo.jpeg"),
  estado: "Cierra Pronto",
  telefono: "+56994908047",
  direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
  metodosEntrega: { delivery: true, retiro: false },
  metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
  rating: 3.4,
  galeria: [
    {
      imagen: require("../assets/pizza-margarita.jpg"),
      descripcion: "Pizza Margarita clásica con ingredientes frescos",
      precio: 8990,
      categoria: "oferta"
    }
  ]
},
{
  id: 7,
  nombre: "Maestro José",
  descripcion: "Reparación y Construcción.",
  categoria: "negocios",
  descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
  imagen: require("../assets/construccion.jpg"),
  logo: require("../assets/maestrojose_logo.jpeg"),
  estado: "Cierra Pronto",
  telefono: "+56994908047",
  direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
  metodosEntrega: { delivery: true, retiro: false },
  metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
  rating: 3.4,
  galeria: [
    {
      imagen: require("../assets/pizza-margarita.jpg"),
      descripcion: "Pizza Margarita clásica con ingredientes frescos",
      precio: 8990,
      categoria: "oferta"
    }
  ]
},
{
  id: 8,
  nombre: "Maestro José",
  descripcion: "Reparación y Construcción.",
  categoria: "belleza",
  descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
  imagen: require("../assets/construccion.jpg"),
  logo: require("../assets/maestrojose_logo.jpeg"),
  estado: "Cierra Pronto",
  telefono: "+56994908047",
  direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
  metodosEntrega: { delivery: true, retiro: false },
  metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
  rating: 3.4,
  galeria: [
    {
      imagen: require("../assets/pizza-margarita.jpg"),
      descripcion: "Pizza Margarita clásica con ingredientes frescos",
      precio: 8990,
      categoria: "oferta"
    }
  ]
}
];

// Función para agrupar productos por categoría
// Función para obtener icono según categoría
const getIconForCategory = (categoria) => {
  const icons = {
    "comida": "cutlery",
    "belleza": "scissors",
    "servicio": "wrench",
    "negocios": "shopping-bag"
  };
  return icons[categoria.toLowerCase()] || "tag";
};

  // ✅ **Menú lateral con el menú colapsable dentro**
  return (
    <View style={styles.containerMaster}>
      <View
        style={styles.container}
      >
        <LinearGradient  colors={['#2A9D8F', '#1D7874']} style={styles.direccionContainer}>
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
                {direcciones.map((direccion) => (
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
            source={producto.galeria[0].imagen} 
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
            {producto.galeria[0].descripcion}
          </Text>
          
          {/* Precio */}
          <Text style={styles.precioProducto}>
            {producto.galeria[0].precio ? 
              `$${producto.galeria[0].precio.toLocaleString("es-CL")}` : 
              "Consulte"}
          </Text>
          
          {/* Recuadro con logo y nombre de empresa */}
          <View style={styles.empresaContainer}>
            <Image 
              source={producto.logo} 
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
<View style={styles.seccionProductos}>
  {/* Filtramos las categorías únicas */}
  {Array.from(new Set(productosDestacados.map(p => p.categoria))).map(categoria => (
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
          {categoria.toUpperCase()}
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
                  source={producto.galeria[0].imagen} 
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
                  {producto.galeria[0].descripcion}
                </Text>
                
                {/* Precio */}
                <Text style={styles.precioProducto}>
                  {producto.galeria[0].precio ? 
                    `$${producto.galeria[0].precio.toLocaleString("es-CL")}` : 
                    "Consulte"}
                </Text>
                
                {/* Recuadro con logo y nombre de empresa */}
                <View style={styles.empresaContainer}>
                  <Image 
                    source={producto.logo} 
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
              <Ionicons name="location" size={32} color="#2A9D8F" />
              <Text style={styles.modalObligatorioTitle}>
                ¡Necesitas una dirección!
              </Text>
            </View>
            
            <Text style={styles.modalObligatorioMessage}>
              Para poder recibir pedidos y servicios, necesitas agregar al menos una dirección de entrega.
            </Text>
            
            <View style={styles.modalObligatorioActions}>
              <TouchableOpacity
                style={styles.modalObligatorioButton}
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
    backgroundColor: '#2A9D8F',
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
