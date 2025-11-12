import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Modal, View } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useCarrito } from '../context/CarritoContext';

const BottomTabBarCliente = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { direcciones, usuario } = useUser();
  const { carritoActivo, cantidadItems, limpiarCarrito } = useCarrito();
  // Estados del modal deshabilitados (el modal ahora lo maneja PedidoDetalleScreen)
  // const [advertenciaVisible, setAdvertenciaVisible] = useState(false);
  // const [pantallaPendiente, setPantallaPendiente] = useState(null);
  const styles = BottomTabBarClienteStyles(currentTheme);

  // Función para obtener el color del icono (todos blancos por ahora)
  const getIconColor = () => {
    return "white";
  };

  // Función para manejar la navegación con validación de direcciones
  const manejarNavegacion = (nombrePantalla) => {
    console.log('🔵 BottomTabBar: manejarNavegacion ->', nombrePantalla);
    
    // NOTA: La protección del carrito la maneja PedidoDetalleScreen directamente
    // mediante listeners de 'beforeRemove' y 'tabPress'. No interceptamos aquí
    // para evitar modales duplicados.
    
    // Navegar normalmente con validaciones
    console.log('✅ Navegando con validaciones');
    ejecutarNavegacionDirecta(nombrePantalla);
  };

  // Función para ejecutar la navegación directamente (con validaciones)
  const ejecutarNavegacionDirecta = (nombrePantalla) => {
    // Solo validar direcciones para clientes
    const esCliente = usuario?.tipo_usuario === 'cliente';
    
    // Si es cliente, no hay direcciones y no va a MisDirecciones, bloquear
    if (esCliente && direcciones.length === 0 && nombrePantalla !== 'MisDirecciones') {
      Alert.alert(
        "⚠️ Dirección requerida",
        "Debes agregar al menos una dirección antes de continuar. Esto es necesario para poder recibir pedidos y servicios.",
        [{ text: "Entendido" }]
      );
      return;
    }
    
    // Ejecutar la navegación con reset para limpiar el stack y liberar memoria
    console.log('🧹 Limpiando stack de navegación y navegando a:', nombrePantalla);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: nombrePantalla }],
      })
    );
  };

  return (
    <>
      {/* MODAL ELIMINADO: La protección del carrito la maneja PedidoDetalleScreen 
          mediante listeners de beforeRemove y tabPress. No hay modal duplicado aquí. */}
      
      {/* NOTA: Si alguna vez se necesita mostrar el modal desde este componente,
          descomentar el código del modal más abajo. Por ahora está deshabilitado
          para evitar conflictos con el modal de PedidoDetalleScreen. */}
      
      {false && ( // Modal deshabilitado - cambiar a {advertenciaVisible && ( si se necesita
        <Modal
          animationType="slide"
          transparent={true}
          visible={false}
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
                  <Text style={styles.advertenciaBadgeTexto}>{String(cantidadItems || 0)}</Text>
                </View>
              </View>
              <View style={styles.advertenciaHeaderTextos}>
                <Text style={styles.advertenciaTituloModerno}>¡Carrito Activo!</Text>
                <Text style={styles.advertenciaSubtituloModerno}>
                  {String(cantidadItems || 0)} {cantidadItems === 1 ? 'producto' : 'productos'} en tu carrito
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
                    setPantallaPendiente(null);
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
                    setAdvertenciaVisible(false);
                    limpiarCarrito();
                    if (pantallaPendiente) {
                      ejecutarNavegacionDirecta(pantallaPendiente);
                      setPantallaPendiente(null);
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
      )} {/* Fin del modal deshabilitado */}

      <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={styles.tabBar}>
        {/* Inicio */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => manejarNavegacion('Home')}
        >
          <Ionicons name="home" size={24} color={getIconColor()} />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        {/* Ofertas */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => manejarNavegacion('Ofertas')}
        >
          <Ionicons name="pricetag" size={24} color={getIconColor()} />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        {/* Favoritos */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => manejarNavegacion('Favoritos')}
        >
          <Ionicons name="heart" size={24} color={getIconColor()} />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => manejarNavegacion('Perfil')}
        >
          <Ionicons name="person" size={24} color={getIconColor()} />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
};

const BottomTabBarClienteStyles = (theme) => StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "105%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: -10,
    borderTopColor: theme.border,
    backgroundColor: theme.primary,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
  // Estilos del modal de advertencia modernos
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
});

export default BottomTabBarCliente;
