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

const FavoritosScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
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
    const updatedUsuario = {
      ...usuario,
      direccionSeleccionada: id,
    };
    setUsuario(updatedUsuario);
    AsyncStorage.setItem("usuario", JSON.stringify(updatedUsuario));
  };

  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const direccionActual = usuario.direcciones.find(
    (dir) => dir.id === usuario.direccionSeleccionada
  );

  const toggleSection = (index) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const misFavoritos = [
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
      rating: 4.8
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
      nombre: "Caniceria Los Chinitos",
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
          descripcion: "Pizza Margarita clásica con ingredientes frescos",
          precio: 8990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/Pepperoni-pizza.webp"),
          descripcion: "Pizza Pepperoni con doble porción de pepperoni",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizza-iberica.webp"),
          descripcion: "Pizza Iberica con carne de cerdo y verduras",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizza-cuatro-quesos.jpg"),
          descripcion: "Pizza cuatro quesos con extra queso",
          precio: 9990,
          categoria: "principal"
        },
        {
          imagen: require("../assets/pizzaOferta.jpg"),
          descripcion: "Pizzas a elección 2 x 1",
          precio: 12990,
          categoria: "oferta"
        },
        {
          imagen: require("../assets/bebidas.jpg"),
          descripcion: "Bebidas en Lata",
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
      nombre: "Caniceria Los Chinitos",
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
      precioOferta: 7990,
      categoria: "oferta",
      descuento: 10
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
      precioOferta: 7990,
      categoria: "oferta",
      descuento: 20
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
      precioOferta: 7990,
      categoria: "oferta",
      descuento: 50
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
      precioOferta: 7990,
      categoria: "oferta",
      descuento: 5
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
<LinearGradient
  colors={['#2A9D8F', '#1D7874']}
  style={styles.headerGradient}
>
  <View style={styles.headerTitleContainer}>
    <Ionicons name="heart" size={24} color="white" style={styles.headerIcon} />
    <Text style={styles.tituloPrincipal}>Favoritos</Text>
  </View>
</LinearGradient>
      <View
        style={styles.container}
      >

        {/* ✅ Sección de productos destacados */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.destacados}>

{/* Titulo "Ofertas Imperdibles" - Versión Minimalista */}
{misFavoritos.length > 0 ? (
  <View style={styles.favoritosContainer}>
    {/* Dividimos los favoritos en grupos de 4 para las filas */}
    {Array(Math.ceil(misFavoritos.length / 3)).fill().map((_, rowIndex) => (
      <View key={rowIndex} style={styles.favoritosRow}>
        {misFavoritos.slice(rowIndex * 3, rowIndex * 3 + 3).map((favorito) => (
          <TouchableOpacity
            key={favorito.id}
            style={styles.favoritoItem}
            onPress={() => navigation.navigate("PedidoDetalle", { producto: favorito })}
          >
            <View style={styles.favoritoCircle}>
              <Image 
                source={favorito.logo} 
                style={styles.favoritoLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.favoritoNombre} numberOfLines={1}>
              {favorito.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    ))}
  </View>
) : (
  <View style={styles.emptyFavoritosContainer}>
    <FontAwesome name="heart" size={60} color="#e0e0e0" />
    <Text style={styles.emptyFavoritosText}>No tienes favoritos aún</Text>
    <Text style={styles.emptyFavoritosSubtext}>
      Guarda tus emprendimientos favoritos para encontrarlos fácilmente
    </Text>
  </View>
)}
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
                                    ? navigation.replace("Perfil")
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
          TOP EN {categoria.toUpperCase()}
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
                  resizeMode="cover"
                />
          <View style={[styles.etiquetaCategoria, {backgroundColor: 'yellow'}]}>
                                    <FontAwesome
                                      name="star"
                                      size={16}
                                      color="black"
                                    />
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
                    resizeMode="contain"
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
      <LinearGradient  colors={['#2A9D8F', '#1D7874']} style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Ofertas')}
        >
          <Ionicons name="pricetag" size={24} color="white" />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          //onPress={() => navigation.navigate('Favoritos')}
        >
          <Ionicons name="heart" size={24} color="#0b5b52" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Perfil')}
        >
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </LinearGradient>
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
    marginLeft: 10, // Añade este margen para separar del ícono
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 10,
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
  },
  searchIcon: {
    padding: 5,
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
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "100%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopColor: "#e1e1e1",
    backgroundColor: "#2A9D8F",
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
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
  etiquetaOfertaSwiper: {
    position: 'absolute',
    top: 60,
    right: 15,
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 2,
  },
  etiquetaOfertaText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  swiperOfertas: {
    height: 300, // Altura reducida
    marginBottom: 15,
  },
  slideOfertaContainer: {
    height: 260, // 20px menos que el contenedor
    paddingHorizontal: 10,
  },
  slideContent: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageColumn: {
    width: '45%',
    position: 'relative',
  },
  imagenOfertaCompacta: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoCompacto: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  logoMiniatura: {
    width: 50,
    height: 50,
    borderRadius: 15,
  },
  descuentoCompacto: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'yellow',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  infoColumn: {
    width: '55%',
    padding: 12,
    justifyContent: 'space-between',
  },
  nombreCompacto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  descripcionCompacta: {
    fontSize: 12,
    color: '#666',
    marginVertical: 5,
  },
  precioContainerCompact: {
    marginVertical: 5,
  },
  precioOriginalCompact: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  precioFinalCompact: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A9D8F',
  },
  botonCompacto: {
    backgroundColor: '#FF5252',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 5,
  },
  botonTextoCompacto: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  descuentoText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  tituloMinimalistaContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingBottom: 30
  },
  tituloMinimalistaText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#2A9D8F',
    letterSpacing: 0.5,
  },favoritosContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  favoritosRow: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Espaciado uniforme entre los ítems
    marginBottom: 15,
  },
  favoritoItem: {
    alignItems: "center",
    width: 100, // Tamaño de cada favorito
  },
  favoritoCircle: {
    width: 80,
    height: 80,
    borderRadius: 50, // Forma de círculo
    backgroundColor: "#fff", // Fondo blanco para resaltar el logo
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4, // Sombra en Android
  },
  favoritoLogo: {
    width: 70,
    height: 70,
    borderRadius: 45
  },
  favoritoNombre: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
    textAlign: "center",
    width: 70, // Ajuste para evitar desbordes
  },
  emptyFavoritosContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyFavoritosText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  emptyFavoritosSubtext: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 20,
  },
});

export default FavoritosScreen;
