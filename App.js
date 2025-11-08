import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Animated, View, StyleSheet, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CarritoProvider } from "./context/CarritoContext";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import PerfilScreen from "./screens/PerfilScreen";
import RecuperarPasswordScreen from "./screens/RecuperarPasswordScreen";
import VerificarCodigoScreen from "./screens/VerificarCodigoScreen";
import NuevaPasswordScreen from "./screens/NuevaPasswordScreen";
import PedidoDetalleScreen from "./screens/PedidoDetalleScreen";
import MisPublicacionesScreen from "./screens/PerfilScreen";
import OfertasScreen from "./screens/OfertasScreen";
import FavoritosScreen from "./screens/FavoritosScreen";
import BusquedaScreen from "./screens/BusquedaScreen";
import ComidaScreen from "./screens/ComidaScreen";
import ServiciosScreen from "./screens/ServiciosScreen";
import NegocioScreen from "./screens/NegocioScreen";
import BellezaScreen from "./screens/BellezaScreen";
import InformacionPersonalScreen from "./screens/InformacionPersonalScreen";
import EmprendimientoScreen from "./screens/EmprendimientoScreen";
import ProductosEmprendimientoScreen from "./screens/ProductosEmprendimientoScreen";
import MisEstadisticasScreen from "./screens/MisEstadisticasScreen";
import MisDireccionesScreen from "./screens/MisDireccionesScreen";
import MisPedidosScreen from "./screens/MisPedidosScreen";
import PedidosRecibidosScreen from "./screens/PedidosRecibidosScreen";
import VendedorScreen from "./screens/VendedorScreen";
import PlanScreen from "./screens/PlanScreen";
import HelpScreen from "./screens/HelpScreen";
import CuponesScreen from "./screens/CuponesScreen";
import IngresarTelefonoScreen from "./screens/IngresarTelefonoScreen";
import PedidoPopup from "./components/PedidoPopup";
import AppWithBottomBar from "./components/AppWithBottomBar";
import NotificationHandler from "./components/NotificationHandler";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Componente de animación de loading (versión estática para overlay)
const LoadingAnimationStatic = () => {
  return (
    <View style={overlayStyles.loadingAnimationContainer}>
      <View style={overlayStyles.loadingGlowStatic} />
      <Image 
        source={require("./assets/welcome.png")} 
        style={overlayStyles.loadingLogo}
        contentFit="contain"
        tintColor="white"
      />
    </View>
  );
};

// Componente global de overlay de transición
const GlobalTransitionOverlay = () => {
  const [mostrar, setMostrar] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const navigationRef = useRef(null);

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      const flag = await AsyncStorage.getItem('mostrarOverlayTransicion');
      if (flag === 'true') {
        console.log('🎬 Overlay global detectado, iniciando transición');
        setMostrar(true);
        await AsyncStorage.removeItem('mostrarOverlayTransicion');
        
        // Pequeño delay para que la pantalla se monte
        setTimeout(() => {
          // Animar fade out + zoom out
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.4,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Ocultar después de la animación
            setTimeout(async () => {
              setMostrar(false);
              opacity.setValue(1);
              scale.setValue(1);
              
              // Guardar flag indicando que la animación terminó
              await AsyncStorage.setItem('animacionOverlayTerminada', 'true');
              console.log('✅ Animación de overlay completada, flag guardado');
            }, 100);
          });
        }, 150);
      }
    }, 100); // Verificar cada 100ms

    return () => clearInterval(checkInterval);
  }, []);

  if (!mostrar) return null;

  return (
    <Animated.View
      style={[
        overlayStyles.overlay,
        {
          opacity: opacity,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["#1a535c", "#2A9D8F", "#4ecdc4"]}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={overlayStyles.overlayCenter}>
          <Animated.View
            style={{
              transform: [{ scale: scale }],
            }}
          >
            <LoadingAnimationStatic />
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Configuración de transiciones personalizadas
const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  },
});

const fadeIn = ({ current }) => ({
  cardStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  },
});

const slideFromRight = ({ current, layouts }) => ({
  cardStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      },
    ],
  },
});

const slideFromBottom = ({ current, layouts }) => ({
  cardStyle: {
    transform: [
      {
        translateY: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.height, 0],
        }),
      },
    ],
  },
});

const zoomIn = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
    transform: [
      {
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  },
});

// Componente wrapper para manejar la navegación
function AppNavigator({ usuario }) {
  const navigation = useNavigation();
  
  console.log('🏗️ AppNavigator renderizando - usuario:', usuario ? 'EXISTE' : 'NULL');
  
  // Determinar pantalla inicial según tipo de usuario
  const getPantallaInicial = () => {
    if (!usuario) return "Login";
    
    const tipoUsuario = usuario.tipo_usuario;
    if (tipoUsuario === 'vendedor' || tipoUsuario === 'emprendedor') {
      return "PedidosRecibidos";
    }
    return "Home";
  };
  
  return (
    <>
      <PedidoPopup navigation={navigation} />
      <Stack.Navigator 
        initialRouteName={getPantallaInicial()}
        screenOptions={{
          // Optimización: Detach previous screen cuando se navega para liberar memoria
          detachPreviousScreen: true,
          // Deshabilitar gestos si no queremos que el usuario pueda volver atrás con gestos
          gestureEnabled: true,
          // Limitar la profundidad del stack para evitar acumulación excesiva
          headerMode: 'screen',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />

        <Stack.Screen
          name="RecuperarPassword"
          component={RecuperarPasswordScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: slideFromRight,
          }}
        />

        <Stack.Screen
          name="VerificarCodigo"
          component={VerificarCodigoScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: zoomIn,
          }}
        />

        <Stack.Screen
          name="NuevaPassword"
          component={NuevaPasswordScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: slideFromBottom,
          }}
        />

        <Stack.Screen
          name="PedidoDetalle"
          component={PedidoDetalleScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Detalle",
            headerShown: false,
            cardStyleInterpolator: zoomIn,
            detachPreviousScreen: true,
            
          }}
        />

        {/* Pantallas principales - accesibles desde cualquier nivel */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: forFade,
            // Detach previous screen cuando navegas desde Home (libera memoria)
            detachPreviousScreen: true,
            // Prevenir que el usuario vuelva atrás desde Home (ya que es la pantalla principal)
            gestureEnabled: false,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 300,
                },
              },
            }
          }}
        />

        <Stack.Screen
          name="Ofertas"
          component={OfertasScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Ofertas",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
            
          }}
        />

        <Stack.Screen
          name="Favoritos"
          component={FavoritosScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Favoritos",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Busqueda"
          component={BusquedaScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Busqueda",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Comida"
          component={ComidaScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Comida",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Servicios"
          component={ServiciosScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Servicios",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Negocios"
          component={NegocioScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Negocios",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Belleza"
          component={BellezaScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Belleza",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="ProductosEmprendimiento"
          component={ProductosEmprendimientoScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Productos",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="MisEstadisticas"
          component={MisEstadisticasScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Estadisticas",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="Emprendimiento"
          component={EmprendimientoScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Mi Emprendimiento",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="MisDirecciones"
          component={MisDireccionesScreen}
          options={{
            title: "Mis Direcciones",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="MisPedidos"
          component={MisPedidosScreen}
          options={{
            title: "Mis Pedidos",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="PedidosRecibidos"
          component={PedidosRecibidosScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Pedidos Recibidos",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="VendedorScreen"
          component={VendedorScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{
            title: "Gestionar Vendedor",
            headerShown: false,
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />

        <Stack.Screen
          name="PlanScreen"
          component={PlanScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
            
          }}
        />


        {/* Pantallas dentro del stack Perfil - directamente en el stack principal */}
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
          }}
        />
        <Stack.Screen
          name="InformacionPersonal"
          component={InformacionPersonalScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
          }}
        />
        <Stack.Screen
          name="HelpScreen"
          component={HelpScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: forFade,
            detachPreviousScreen: true,
          }}
        />
        <Stack.Screen
          name="Cupones"
          component={CuponesScreen}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: slideFromBottom,
            detachPreviousScreen: true,
          }}
        />
        <Stack.Screen
          name="IngresarTelefono"
          component={IngresarTelefonoScreen}
          options={{ 
            headerShown: false, 
            cardStyleInterpolator: slideFromBottom,
            gestureEnabled: false, // No permitir cerrar con gesto
          }}
        />









































      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  console.log('🏗️ App principal - usuario:', usuario ? 'EXISTE' : 'NULL');

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        // Verificar si hay token (indica sesión activa)
        const token = await AsyncStorage.getItem("token");
        
        if (token) {
          // Si hay token, cargar usuario
          const usuarioGuardado = await AsyncStorage.getItem("usuario");
          if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
            console.log("✅ Sesión restaurada desde AsyncStorage");
          }
        } else {
          console.log("ℹ️ No hay sesión activa, mostrando Login");
        }
      } catch (error) {
        console.log("❌ Error al cargar sesión:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarSesion();
  }, []);

  // Mostrar splash mientras carga la sesión
  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a535c', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingAnimationStatic />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a535c" translucent={false} />
      <ThemeProvider>
        <UserProvider>
          <CarritoProvider>
            <NavigationContainer>
              <NotificationHandler>
                <AppWithBottomBar>
                  <AppNavigator usuario={usuario} />
                </AppWithBottomBar>
              </NotificationHandler>
              {/* Overlay global de transición */}
              <GlobalTransitionOverlay />
            </NavigationContainer>
          </CarritoProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Estilos para el overlay global
const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimationContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingGlowStatic: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  loadingLogo: {
    width: 130,
    height: 130,
  },
});
