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
import { API_ENDPOINTS } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import LoadingVeciApp from "../components/LoadingVeciApp";

const NegocioScreen = ({ navigation, route }) => {
  const { currentTheme } = useTheme();
  const { usuario, modoVista } = useUser();
  const toast = useToast();
  const { categoria = 'tiendas', titulo = 'Tiendas & Negocios', icono = 'shopping-bag' } = route.params || {};
  
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEmprendimientos();
  }, [categoria]);

  const cargarEmprendimientos = async () => {
    try {
      setCargando(true);
      console.log(`📦 Cargando emprendimientos de categoría: ${categoria}`);
      
      const response = await fetch(`${API_ENDPOINTS.EMPRENDIMIENTOS}?categoria=${categoria}`);
      const data = await response.json();
      
      if (data.ok && data.emprendimientos) {
        console.log('✅ Emprendimientos cargados:', data.emprendimientos.length);
        setEmprendimientos(data.emprendimientos);
      } else {
        setEmprendimientos([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar emprendimientos:', error);
      toast.error('No se pudieron cargar los emprendimientos');
      setEmprendimientos([]);
    } finally {
      setCargando(false);
    }
  };

  // Mapear estado del backend al formato del frontend
  const mapearEstado = (estadoCalculado) => {
    if (estadoCalculado === 'abierto') return 'Abierto';
    if (estadoCalculado === 'cierra_pronto') return 'Cierra Pronto';
    return 'Cerrado';
  };

  // Formatear nombre de subcategoría
  const formatearSubcategoria = (subcategoria) => {
    if (!subcategoria) return '';
    
    // Diccionario de palabras especiales que necesitan tildes
    const palabrasEspeciales = {
      'rapida': 'Rápida',
      'rapido': 'Rápido',
      'abarrotes': 'Abarrotes',
      'panaderia': 'Panadería',
      'carniceria': 'Carnicería',
      'ferreteria': 'Ferretería',
      'libreria': 'Librería',
      'papeleria': 'Papelería',
      'floristeria': 'Floristería',
      'joyeria': 'Joyería',
      'boutique': 'Boutique',
      'optica': 'Óptica',
      'farmacia': 'Farmacia',
      'veterinaria': 'Veterinaria',
      'minimarket': 'Minimarket',
      'almacen': 'Almacén',
    };
    
    // Reemplazar guiones bajos por espacios
    const sinGuiones = subcategoria.replace(/_/g, ' ');
    
    // Capitalizar primera letra de cada palabra
    return sinGuiones
      .split(' ')
      .map(palabra => {
        if (!palabra) return '';
        const palabraLower = palabra.toLowerCase();
        
        // Si la palabra está en el diccionario, usar la versión correcta
        if (palabrasEspeciales[palabraLower]) {
          return palabrasEspeciales[palabraLower];
        }
        
        // Si no, capitalizar normalmente
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Agrupar por subcategoría
  const agruparPorSubcategoria = () => {
    const agrupados = {};
    
    emprendimientos.forEach(emp => {
      if (emp.subcategorias && Array.isArray(emp.subcategorias)) {
        emp.subcategorias.forEach(subcat => {
          if (!agrupados[subcat]) {
            agrupados[subcat] = [];
          }
          agrupados[subcat].push(emp);
        });
      }
    });
    
    return agrupados;
  };

  const emprendimientosAgrupados = agruparPorSubcategoria();

  const navegarADetalle = (emp) => {
    // Verificar si es propio emprendimiento
    const esPropioEmprendimiento = emp.usuario_id === usuario?.id;
    const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
    const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

    if (mostrarAdvertencia) {
      toast.warning(
        "No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
      return;
    }

    const producto = {
      id: emp.id,
      usuario_id: emp.usuario_id, // ✅ AGREGAR usuario_id
      nombre: emp.nombre,
      descripcion: emp.descripcion_corta || emp.descripcion_larga || '',
      descripcionLarga: emp.descripcion_larga || '',
      imagen: emp.background_url ? { uri: emp.background_url } : require('../assets/icon.png'),
      logo: emp.logo_url ? { uri: emp.logo_url } : require('../assets/icon.png'),
      estado: mapearEstado(emp.estado_calculado),
      telefono: emp.telefono,
      direccion: emp.direccion,
      metodosEntrega: emp.tipos_entrega || { delivery: true, retiro: true },
      metodosPago: emp.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
      rating: 4.5,
      horarios: emp.horarios,
      galeria: [],
    };
    
    // Si está cerrado, abrir en modo preview
    const isPreview = emp.estado_calculado === 'cerrado';
    navigation.navigate("PedidoDetalle", { producto, isPreview });
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.botonAtrasModerno}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCentro}>
            <View style={styles.headerIconWrapper}>
              <FontAwesome name={icono} size={28} color="white" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerSubtitle}>Explora</Text>
              <Text style={styles.tituloPrincipal}>{titulo}</Text>
            </View>
          </View>
          {!cargando && emprendimientos.length > 0 && (
            <View style={styles.headerBadgeWrapper}>
              <View style={[styles.headerBadge, { backgroundColor: 'white' }]}>
                <Text style={[styles.headerBadgeText, { color: currentTheme.primary }]}>
                  {emprendimientos.length}
                </Text>
              </View>
            </View>
          )}
          {(cargando || emprendimientos.length === 0) && <View style={{ width: 44 }} />}
        </View>
      </LinearGradient>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <LoadingVeciApp size={120} color={currentTheme.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.text, marginTop: 30 }]}>
            Cargando emprendimientos...
          </Text>
        </View>
      ) : emprendimientos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
            <FontAwesome name="inbox" size={64} color={currentTheme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
            No hay emprendimientos disponibles
          </Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
            Aún no hay establecimientos en esta categoría.{'\n'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Agrupar por subcategoría */}
          {Object.keys(emprendimientosAgrupados).length > 0 ? (
            Object.entries(emprendimientosAgrupados).map(([subcategoria, emps]) => (
              <View key={subcategoria} style={styles.categoriaContainer}>
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerSeccionGradiente}
                >
                  <View style={styles.headerSeccionContenido}>
                    <View style={styles.iconoSeccionModerno}>
                      <Ionicons name="storefront" size={20} color="#FFF" />
                    </View>
                    <Text style={styles.tituloSeccionModerno}>
                      {formatearSubcategoria(subcategoria)}
                    </Text>
                  </View>
                  <View style={styles.lineaDecorativa} />
                </LinearGradient>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galeriaScroll}
                >
                  {emps.map((emp) => {
                    const estado = mapearEstado(emp.estado_calculado);
                    
                    return (
                      <TouchableOpacity
                        key={emp.id}
                        style={[styles.itemGaleria, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
                        onPress={() => navegarADetalle(emp)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={['transparent', 'transparent']}
                          style={styles.itemGaleriaGradiente}
                        >
                          {/* Imagen del emprendimiento */}
                          <View style={styles.imagenContainer}>
                            <Image
                              source={emp.background_url ? { uri: emp.background_url } : require('../assets/icon.png')}
                              style={styles.imagenGaleria}
                              contentFit="cover"
                            />
                            
                            {/* Overlay de gradiente */}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.3)']}
                              style={styles.imagenOverlay}
                            />
                            
                            {/* Logo superpuesto con efecto mejorado */}
                            {emp.logo_url && (
                              <View style={[styles.logoOverlay, { shadowColor: currentTheme.shadow }]}>
                                <Image
                                  source={{ uri: emp.logo_url }}
                                  style={styles.logoMiniatura}
                                  contentFit="cover"
                                />
                              </View>
                            )}
                            
                            {/* Badge de estado mejorado */}
                            <View style={[
                              styles.estadoBadge,
                              estado === 'Abierto' && styles.estadoAbierto,
                              estado === 'Cierra Pronto' && styles.estadoCierraPronto,
                              estado === 'Cerrado' && styles.estadoCerrado
                            ]}>
                              <View style={[
                                styles.estadoDot,
                                estado === 'Abierto' && { backgroundColor: '#4CAF50' },
                                estado === 'Cierra Pronto' && { backgroundColor: '#FF9800' },
                                estado === 'Cerrado' && { backgroundColor: '#F44336' }
                              ]} />
                              <Text style={styles.estadoTexto}>{estado}</Text>
                            </View>
                          </View>

                          {/* Información del emprendimiento */}
                          <View style={styles.infoGaleria}>
                            <Text style={[styles.nombreGaleria, { color: currentTheme.text }]} numberOfLines={1}>
                              {emp.nombre}
                            </Text>
                            <Text style={[styles.descripcionGaleria, { color: currentTheme.textSecondary }]} numberOfLines={2}>
                              {emp.descripcion_corta || emp.descripcion_larga || 'Sin descripción'}
                            </Text>
                            
                            <View style={styles.dividerModerno} />
                            
                            <View style={styles.infoFooter}>
                              <View style={styles.ubicacionInfo}>
                                <View style={[styles.ubicacionIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
                                  <Ionicons name="location" size={14} color={currentTheme.primary} />
                                </View>
                                <Text style={[styles.ubicacionTexto, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                                  {emp.direccion}
                                </Text>
                              </View>
                              
                              {/* Indicador de métodos de entrega */}
                              <View style={styles.metodosBadgeContainer}>
                                {emp.tipos_entrega?.delivery && (
                                  <View style={[styles.metodoBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                                    <Ionicons name="bicycle" size={12} color={currentTheme.primary} />
                                  </View>
                                )}
                                {emp.tipos_entrega?.retiro && (
                                  <View style={[styles.metodoBadge, { backgroundColor: currentTheme.secondary + '15' }]}>
                                    <Ionicons name="bag-handle" size={12} color={currentTheme.secondary} />
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
                <FontAwesome name="inbox" size={64} color={currentTheme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
                No hay establecimientos
              </Text>
              <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
                Aún no hay emprendimientos en esta categoría.{'\n'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

      
      <Toast
        visible={toast.toastConfig.visible}
        message={toast.toastConfig.message}
        type={toast.toastConfig.type}
        duration={toast.toastConfig.duration}
        onHide={toast.hideToast}
      />
const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
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
    gap: 12,
  },
  botonAtrasModerno: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerCentro: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadgeWrapper: {
    alignItems: 'center',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
  },
  categoriaContainer: {
    marginBottom: 30,
    paddingHorizontal: 15,
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
  iconoSeccionModerno: {
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
  galeriaScroll: {
    paddingLeft: 5,
    paddingRight: 5,
  },
  itemGaleria: {
    width: 290,
    marginRight: 16,
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 10,
  },
  itemGaleriaGradiente: {
    flex: 1,
  },
  imagenContainer: {
    height: 180,
    position: "relative",
  },
  imagenGaleria: {
    width: "100%",
    height: "100%",
  },
  imagenOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  logoOverlay: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "white",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  logoMiniatura: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  estadoBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    gap: 6,
  },
  estadoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  estadoAbierto: {
    backgroundColor: "rgba(76, 175, 80, 0.95)",
  },
  estadoCierraPronto: {
    backgroundColor: "rgba(255, 152, 0, 0.95)",
  },
  estadoCerrado: {
    backgroundColor: "rgba(244, 67, 54, 0.95)",
  },
  estadoTexto: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoGaleria: {
    padding: 18,
    gap: 4,
  },
  nombreGaleria: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  descripcionGaleria: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
    minHeight: 38,
    lineHeight: 20,
  },
  dividerModerno: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  infoFooter: {
    gap: 10,
  },
  ubicacionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ubicacionIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ubicacionTexto: {
    fontSize: 13,
    color: "#95a5a6",
    flex: 1,
    fontWeight: '500',
  },
  metodosBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
  },
  metodoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NegocioScreen;
