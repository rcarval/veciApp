import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { API_ENDPOINTS } from "../config/api";
import pedidoService from "../services/pedidoService";
import LoadingVeciApp from "../components/LoadingVeciApp";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

const OfertasScreen = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { usuario, modoVista } = useUser();
  const toast = useToast();
  const [productosOferta, setProductosOferta] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Función para mapear estado del backend al frontend
  const mapearEstado = (estadoCalculado) => {
    if (estadoCalculado === 'cierra_pronto') {
      return 'Cierra Pronto';
    } else if (estadoCalculado === 'abierto') {
      return 'Abierto';
    } else if (estadoCalculado === 'cerrado') {
      return 'Cerrado';
    }
    return 'Cerrado';
  };

  // Ya no es necesario cargar calificación individual - viene en el JSON del backend
  // Función removida para optimizar requests

  // Función para agrupar productos por categoría de emprendimiento
  const agruparProductosPorCategoria = (productos) => {
    const agrupados = {};
    
    for (const prod of productos) {
      const categoria = prod.categoria_principal || 'otros';
      
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      
      // La calificación ya viene en el JSON del backend (optimización)
      const rating = parseFloat(prod.calificacion_promedio) || 0;
      
      // Mapear producto al formato esperado por el frontend
      const productoMapeado = {
        id: prod.emprendimiento_id,
        usuario_id: prod.emprendimiento_usuario_id, // ✅ AGREGAR usuario_id del emprendimiento
        nombre: prod.emprendimiento_nombre,
        descripcion: prod.emprendimiento_descripcion || '',
        descripcionLarga: prod.emprendimiento_descripcion || '',
        imagen: prod.emprendimiento_background ? { uri: prod.emprendimiento_background } : require('../assets/icon.png'),
        logo: prod.emprendimiento_logo ? { uri: prod.emprendimiento_logo } : require('../assets/icon.png'),
        estado: mapearEstado(prod.estado_calculado),
        telefono: prod.emprendimiento_telefono,
        direccion: prod.emprendimiento_direccion,
        metodosEntrega: prod.tipos_entrega || { delivery: true, retiro: true },
        metodosPago: prod.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
        rating: rating,
        horarios: prod.horarios || {},
        categoria: categoria,
        galeria: [{
          id: prod.id,
          imagen: prod.imagen_url ? { uri: prod.imagen_url } : require('../assets/icon.png'),
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: parseFloat(prod.precio),
          precioOferta: prod.precio_oferta ? parseFloat(prod.precio_oferta) : parseFloat(prod.precio),
          categoria: prod.categoria,
          descuento: prod.precio_oferta ? Math.round(((parseFloat(prod.precio) - parseFloat(prod.precio_oferta)) / parseFloat(prod.precio)) * 100) : 0
        }]
      };
      
      agrupados[categoria].push(productoMapeado);
    }
    
    return agrupados;
  };

  // Función para cargar ofertas desde el backend
  const cargarOfertas = async () => {
    try {
      setCargando(true);
      console.log('🏷️ Cargando ofertas desde el backend...');
      
      const response = await fetch(API_ENDPOINTS.OFERTAS);
      
      if (!response.ok) {
        throw new Error('Error al cargar ofertas');
      }
      
      const data = await response.json();
      if (data.ok && data.productos) {
        console.log('✅ Ofertas cargadas:', data.productos.length);
        
        // Filtrar solo productos de emprendimientos abiertos o que cierran pronto
        const productosAbiertos = data.productos.filter(p => 
          p.estado_calculado === 'abierto' || p.estado_calculado === 'cierra_pronto'
        );
        
        console.log('✅ Productos de emprendimientos abiertos:', productosAbiertos.length);
        
        // Agrupar por categoría de emprendimiento (ya no es async)
        const agrupados = agruparProductosPorCategoria(productosAbiertos);
        
        // Convertir a array plano para el swiper y las listas
        const todosLosProductos = [];
        Object.values(agrupados).forEach(categoria => {
          todosLosProductos.push(...categoria);
        });
        
        console.log('✅ Productos agrupados por categoría:', Object.keys(agrupados));
        
        setProductosOferta(todosLosProductos);
      } else {
        console.log('⚠️ No se pudieron cargar ofertas');
        setProductosOferta([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar ofertas:', error);
      toast.error('No se pudieron cargar las ofertas');
      setProductosOferta([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarOfertas();
    }
  }, [usuario]);

  // Función para obtener icono según categoría
  const getIconForCategory = (categoria) => {
    if (!categoria) return "tag";
    const icons = {
      "comida": "cutlery",
      "belleza": "scissors",
      "servicio": "wrench",
      "servicios": "wrench",
      "negocios": "shopping-bag",
      "otros": "tag"
    };
    return icons[categoria.toLowerCase()] || "tag";
  };

  // Agrupar productos por categoría de emprendimiento
  const productosPorCategoria = productosOferta.reduce((acc, producto) => {
    const categoria = producto.categoria || 'otros';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(producto);
    return acc;
  }, {});

  if (cargando) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <LoadingVeciApp size={120} color={currentTheme.primary} />
        <Text style={{ marginTop: 30, color: currentTheme.text, fontSize: 16, fontWeight: '600' }}>Cargando ofertas...</Text>
      </View>
    );
  }

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
            <Ionicons name="pricetag" size={32} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Descuentos exclusivos</Text>
            <Text style={styles.tituloPrincipal}>Ofertas del Día</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="flame" size={24} color={currentTheme.primary} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.scrollContainer}
      >
        {productosOferta.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="tag" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
              No hay ofertas disponibles
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
              Vuelve pronto para ver las nuevas ofertas
            </Text>
          </View>
        ) : (
          <>
            {/* Sección de Ofertas por Categoría */}
            {Object.entries(productosPorCategoria).map(([categoria, productos]) => (
              <View key={categoria} style={styles.seccionOfertas}>
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerSeccionGradiente}
                >
                  <View style={styles.headerSeccionContenido}>
                    <View style={styles.iconoSeccionModerno}>
                      <Ionicons 
                        name={categoria === 'comida' ? 'restaurant' : categoria === 'servicios' ? 'construct' : categoria === 'negocios' ? 'storefront' : categoria === 'belleza' ? 'cut' : 'business'} 
                        size={20} 
                        color="#FFF"
                      />
                    </View>
                    <Text style={styles.tituloSeccionModerno}>
                      Ofertas en {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                    </Text>
                    <View style={styles.badgeOferta}>
                      <Ionicons name="flash" size={14} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.lineaDecorativa} />
                </LinearGradient>
                
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galeriaScroll}
                >
                  {productos.map(producto => {
                    // Verificar si es propio emprendimiento
                    const esPropioEmprendimiento = producto.usuario_id === usuario?.id;
                    const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
                    const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

                    return (
                    <TouchableOpacity 
                      key={`${producto.id}_${producto.galeria[0].id}`}
                      style={[styles.itemGaleria, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
                      onPress={() => {
                        if (mostrarAdvertencia) {
                          toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
                          return;
                        }
                        // Si está cerrado, abrir en modo preview
                        const isPreview = producto.estado === 'Cerrado';
                        navigation.navigate("PedidoDetalle", { 
                          producto,
                          isPreview: isPreview
                        });
                      }}
                    >
                      {/* Imagen del producto */}
                      <View style={styles.imagenContainer}>
          <Image 
            source={producto.galeria[0].imagen} 
            style={styles.imagenGaleria}
            contentFit="cover"
          />
          <View style={[styles.etiquetaCategoria, { 
            backgroundColor: currentTheme.primary,
            shadowColor: currentTheme.primary 
          }]}>
            <Text style={styles.etiquetaTextoOferta}>
              {producto.galeria[0].descuento > 0 ? `-${producto.galeria[0].descuento}%` : 'OFERTA'}
            </Text>
          </View>
                      </View>
                      
                      {/* Información del producto */}
                      <View style={styles.infoGaleria}>
                        {/* Descripción del producto */}
                        <Text style={[styles.descripcionGaleria, { color: currentTheme.text }]} numberOfLines={2}>
                          {producto.galeria[0].descripcion}
                        </Text>
                        
                        {/* Precio con descuento */}
                        <View style={styles.precioContainer}>
                          {producto.galeria[0].descuento > 0 && (
                            <Text style={styles.precioOriginal}>
                              ${producto.galeria[0].precio.toLocaleString("es-CL")}
                            </Text>
                          )}
                          <Text style={[styles.precioProducto, { color: currentTheme.primary }]}>
                            ${producto.galeria[0].precioOferta.toLocaleString("es-CL")}
                          </Text>
                        </View>
                        
                        {/* Recuadro con logo y nombre de empresa */}
                        <View style={[styles.empresaContainer, { backgroundColor: currentTheme.background }]}>
                          <Image 
                            source={producto.logo} 
                            style={styles.logoEmpresa}
                            contentFit="contain"
                          />
                          <Text style={[styles.nombreEmpresa, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                            {producto.nombre}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                  })}
                </ScrollView>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      
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
    paddingBottom: 130,
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 10,
    paddingTop: 10,
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
    gap: 14,
  },
  headerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
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
  seccionOfertas: {
    marginTop: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  headerSeccionGradiente: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  headerSeccionContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoSeccionModerno: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloSeccionModerno: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badgeOferta: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lineaDecorativa: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    width: 190,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 10
  },
  imagenContainer: {
    height: 130,
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
  precioContainer: {
    marginBottom: 8,
  },
  precioOriginal: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  precioProducto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A9D8F',
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
    top: 12,
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  etiquetaTextoOferta: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default OfertasScreen;
