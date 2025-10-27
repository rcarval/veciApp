import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import PlanScreen from "./screens/PlanScreen";
import PedidoPopup from "./components/PedidoPopup";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Configuración de transiciones personalizadas
const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
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
  
  return (
    <>
      <PedidoPopup navigation={navigation} usuario={usuario} />
      <Stack.Navigator initialRouteName="Login">
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
            title: "Recuperar Contraseña",
            cardStyleInterpolator: slideFromRight,
          }}
        />

        <Stack.Screen
          name="VerificarCodigo"
          component={VerificarCodigoScreen}
          options={{
            title: "Verificar Código",
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
          options={{
            title: "Detalle",
            headerShown: false,
            cardStyleInterpolator: zoomIn,
          }}
        />

        <Stack.Screen
          name="Ofertas"
          component={OfertasScreen}
          options={{
            title: "Ofertas",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="Favoritos"
          component={FavoritosScreen}
          options={{
            title: "Favoritos",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="Busqueda"
          component={BusquedaScreen}
          options={{
            title: "Busqueda",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{
            title: "Perfil",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="Comida"
          component={ComidaScreen}
          options={{
            title: "Comida",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="Servicios"
          component={ServiciosScreen}
          options={{
            title: "Servicios",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="ProductosEmprendimiento"
          component={ProductosEmprendimientoScreen}
          options={{
            title: "Productos",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        <Stack.Screen
          name="MisEstadisticas"
          component={MisEstadisticasScreen}
          options={{
            title: "Estadisticas",
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        />
        
        {/* Drawer con transición personalizada */}
        <Stack.Screen
          name="HomeDrawer"
          options={{
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        >
          {() => (
            <Stack.Navigator
              screenOptions={{
                drawerType: "slide",
                overlayColor: "transparent",
                drawerStyle: {
                  backgroundColor: "#f5f5f5",
                  width: "70%",
                },
                sceneContainerStyle: {
                  backgroundColor: "#ffffff",
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
              <Stack.Screen
                name="Ofertas"
                component={OfertasScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{
                  title: "Ofertas",
                  headerShown: false,
                  cardStyleInterpolator: forFade,
                }}
              />
              <Stack.Screen
                name="Favoritos"
                component={FavoritosScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{
                  title: "Ofertas",
                  headerShown: false,
                  cardStyleInterpolator: forFade,
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
                }}
              />
              <Stack.Screen
                name="MisDirecciones"
                component={MisDireccionesScreen}
                options={{
                  title: "Mis Direcciones",
                  headerShown: false,
                  cardStyleInterpolator: forFade,
                }}
              />
              <Stack.Screen
                name="MisPedidos"
                component={MisPedidosScreen}
                options={{
                  title: "Mis Pedidos",
                  headerShown: false,
                  cardStyleInterpolator: forFade,
                }}
              />
              <Stack.Screen
                name="PedidosRecibidos"
                component={PedidosRecibidosScreen}
                options={{
                  title: "Pedidos Recibidos",
                  headerShown: false,
                  cardStyleInterpolator: forFade,
                }}
              />
                      <Stack.Screen
          name="Perfil"
          options={{
            headerShown: false,
            cardStyleInterpolator: forFade,
          }}
        >
          {() => (
            <Stack.Navigator
              screenOptions={{
                drawerType: "slide",
                overlayColor: "transparent",
                drawerStyle: {
                  backgroundColor: "#f5f5f5",
                  width: "70%",
                },
                sceneContainerStyle: {
                  backgroundColor: "#ffffff",
                },
              }}
            >
                              <Stack.Screen
                name="Perfil"
                component={PerfilScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
                <Stack.Screen
                name="InformacionPersonal"
                component={InformacionPersonalScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
                              <Stack.Screen
                name="Emprendimiento"
                component={EmprendimientoScreen}
                initialParams={usuario ? { usuario } : {}}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
              <Stack.Screen
                name="MisDirecciones"
                component={MisDireccionesScreen}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
              <Stack.Screen
                name="MisPedidos"
                component={MisPedidosScreen}
                options={{ headerShown: false, cardStyleInterpolator: forFade }}
              />
        <Stack.Screen
          name="PlanScreen"
          component={PlanScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ headerShown: false, cardStyleInterpolator: forFade }}
        />
        <Stack.Screen
          name="PedidosRecibidos"
          component={PedidosRecibidosScreen}
          initialParams={usuario ? { usuario } : {}}
          options={{ headerShown: false, cardStyleInterpolator: forFade }}
        />
              </Stack.Navigator>
          )}
        </Stack.Screen>
            </Stack.Navigator>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        // Limpiar sesión activa al iniciar la app
        await AsyncStorage.removeItem("sesionActiva");
        console.log("🧹 Sesión activa limpiada al iniciar app");
        
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator usuario={usuario} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
