import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { API_ENDPOINTS } from "../config/api";
import pedidoService from "../services/pedidoService";
import LoadingVeciApp from "../components/LoadingVeciApp";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

const FavoritosScreen = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { usuario, modoVista } = useUser();
  const toast = useToast();
  const [favoritos, setFavoritos] = useState([]);
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

  // Función para cargar favoritos desde el backend
  const cargarFavoritos = async () => {
    try {
      setCargando(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('⚠️ No hay token, usuario no autenticado');
        setFavoritos([]);
        return;
      }

      console.log('⭐ Cargando favoritos desde el backend...');
      
      const response = await fetch(API_ENDPOINTS.FAVORITOS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar favoritos');
      }
      
      const data = await response.json();
      if (data.ok && data.favoritos) {
        console.log('✅ Favoritos cargados:', data.favoritos.length);
        
        // Mapear favoritos al formato esperado por el frontend (calificación ya viene en el JSON)
        const favoritosMapeados = data.favoritos.map((fav) => {
          // La calificación ya viene en el JSON del backend (optimización)
          const rating = parseFloat(fav.calificacion_promedio) || 0;
          
          return {
            id: fav.id,
            usuario_id: fav.usuario_id, // ✅ AGREGAR usuario_id
            nombre: fav.nombre,
            descripcion: fav.descripcion_corta || '',
            descripcionLarga: fav.descripcion_larga || '',
            imagen: fav.background_url ? { uri: fav.background_url } : require('../assets/icon.png'),
            logo: fav.logo_url ? { uri: fav.logo_url } : require('../assets/icon.png'),
            estado: mapearEstado(fav.estado_calculado),
            telefono: fav.telefono,
            direccion: fav.direccion,
            metodosEntrega: fav.tipos_entrega || { delivery: true, retiro: true },
            metodosPago: fav.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
            rating: rating,
            horarios: fav.horarios || {},
            categoria: fav.categoria_principal || 'otros',
            galeria: [] // Se cargarán al entrar al detalle
          };
        });
        
        setFavoritos(favoritosMapeados);
      } else {
        console.log('⚠️ No se pudieron cargar favoritos');
        setFavoritos([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar favoritos:', error);
      toast.error('No se pudieron cargar los favoritos');
      setFavoritos([]);
    } finally {
      setCargando(false);
    }
  };

  // Recargar favoritos cada vez que la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      if (usuario) {
        cargarFavoritos();
      }
    }, [usuario])
  );

  if (cargando) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <LoadingVeciApp size={120} color={currentTheme.primary} />
        <Text style={{ marginTop: 30, color: currentTheme.text, fontSize: 16, fontWeight: '600' }}>Cargando favoritos...</Text>
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
            <Ionicons name="heart" size={32} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Tus lugares preferidos</Text>
            <Text style={styles.tituloPrincipal}>Mis Favoritos</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={[styles.headerBadgeText, { color: currentTheme.primary }]}>
              {favoritos.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.scrollContainer}
      >
        {favoritos.length > 0 ? (
          <View style={styles.favoritosGrid}>
            {favoritos.map((favorito) => (
              <TouchableOpacity
                key={favorito.id}
                style={[styles.favoritoCard, { backgroundColor: currentTheme.cardBackground }]}
                onPress={() => {
                  // Verificar si es propio emprendimiento
                  const esPropioEmprendimiento = favorito.usuario_id === usuario?.id;
                  const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
                  const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

                  if (mostrarAdvertencia) {
                    toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
                    return;
                  }

                  const isPreview = favorito.estado === 'Cerrado';
                  navigation.navigate("PedidoDetalle", { 
                    producto: favorito,
                    isPreview: isPreview
                  });
                }}
                activeOpacity={0.85}
              >
                {/* Imagen de fondo */}
                <View style={styles.favoritoImagenWrapper}>
                  <Image 
                    source={favorito.imagen} 
                    style={styles.favoritoImagen}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.favoritoGradiente}
                  >
                    {/* Badge de estado */}
                    <View style={[
                      styles.favoritoEstadoBadge,
                      {
                        backgroundColor: 
                          favorito.estado === 'Abierto' ? 'rgba(76, 175, 80, 0.95)' :
                          favorito.estado === 'Cierra Pronto' ? 'rgba(255, 152, 0, 0.95)' :
                          'rgba(244, 67, 54, 0.95)'
                      }
                    ]}>
                      <Text style={styles.favoritoEstadoTexto}>{favorito.estado}</Text>
                    </View>
                    
                    {/* Info inferior */}
                    <View style={styles.favoritoInfo}>
                      <View style={styles.favoritoLogoWrapper}>
                        <Image 
                          source={favorito.logo} 
                          style={styles.favoritoLogoCard}
                          contentFit="contain"
                        />
                      </View>
                      <View style={styles.favoritoTextos}>
                        <Text style={styles.favoritoNombreCard} numberOfLines={1}>
                          {favorito.nombre}
                        </Text>
                        <Text style={styles.favoritoDescripcionCard} numberOfLines={1}>
                          {favorito.descripcion || favorito.categoria}
                        </Text>
                        {/* Rating */}
                        <View style={styles.favoritoRating}>
                          <FontAwesome name="star" size={12} color="#FFD700" />
                          <Text style={styles.favoritoRatingTexto}>
                            {favorito.rating?.toFixed(1) || '0.0'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFavoritosContainer}>
            <FontAwesome name="heart-o" size={80} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyFavoritosText, { color: currentTheme.text }]}>
              No tienes favoritos aún
            </Text>
            <Text style={[styles.emptyFavoritosSubtext, { color: currentTheme.textSecondary }]}>
              Marca emprendimientos como favoritos tocando el ❤️ en su página de detalle
            </Text>
          </View>
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
  headerBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  favoritosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 14,
  },
  favoritoCard: {
    width: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 6,
  },
  favoritoImagenWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  favoritoImagen: {
    width: '100%',
    height: '100%',
  },
  favoritoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 14,
  },
  favoritoEstadoBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  favoritoEstadoTexto: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  favoritoInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  favoritoLogoWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  favoritoLogoCard: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  favoritoTextos: {
    flex: 1,
    gap: 3,
  },
  favoritoNombreCard: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  favoritoDescripcionCard: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoritoRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  favoritoRatingTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyFavoritosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyFavoritosText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyFavoritosSubtext: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default FavoritosScreen;
