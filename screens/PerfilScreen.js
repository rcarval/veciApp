import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Alert,
  ActivityIndicator 
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { API_ENDPOINTS } from "../config/api";

const PerfilScreen = () => {
  const navigation = useNavigation();
  const { usuario, loading, cargarUsuario, actualizarUsuarioLocal } = useUser();
  const { currentTheme, changeTheme, getNextTheme, isChangingTheme } = useTheme();
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);

  // Cargar usuario al iniciar (solo si no está en cache o es antiguo)
  useEffect(() => {
    cargarUsuario(false); // false = no forzar, usar cache si es válido
  }, []);

  // Cargar imagen cuando el usuario cambie
  useEffect(() => {
    cargarImagenPerfil();
  }, [usuario]);

  // Recargar usuario cuando se regrese a la pantalla (solo si es necesario)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarUsuario(false); // Usar cache si es válido, recargar si expiró
    });

    return unsubscribe;
  }, [navigation]);

  const cargarImagenPerfil = async () => {
    try {
      console.log('🖼️ cargarImagenPerfil - usuario.avatar_url:', usuario?.avatar_url);
      
      // Si el usuario tiene avatar_url del backend, usarlo
      if (usuario?.avatar_url) {
        console.log('🖼️ Usando avatar del backend:', usuario.avatar_url);
        setImagenPerfil(usuario.avatar_url);
        return;
      }
      
      // Fallback: cargar desde AsyncStorage (para compatibilidad)
      const imagenGuardada = await AsyncStorage.getItem('imagenPerfil');
      if (imagenGuardada) {
        console.log('🖼️ Usando avatar de AsyncStorage:', imagenGuardada);
        setImagenPerfil(imagenGuardada);
      } else {
        console.log('🖼️ No hay avatar disponible');
      }
    } catch (error) {
      console.log('Error al cargar imagen del perfil:', error);
    }
  };

  const subirAvatarAlBackend = async (uri) => {
    try {
      setSubiendoAvatar(true);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('avatar', {
        uri: uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      console.log('📤 Subiendo avatar al backend...');
      
      const response = await fetch(API_ENDPOINTS.SUBIR_AVATAR, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        console.log('✅ Avatar subido exitosamente:', data.avatar_url);
        console.log('✅ Usuario actual antes:', usuario?.avatar_url);
        
        // Actualizar el usuario en el contexto con la nueva URL
        if (actualizarUsuarioLocal) {
          const usuarioActualizado = {
            ...usuario,
            avatar_url: data.avatar_url
          };
          console.log('✅ Actualizando usuario en contexto:', usuarioActualizado.avatar_url);
          actualizarUsuarioLocal(usuarioActualizado);
        }
        
        // Forzar recarga del usuario desde el backend para obtener datos frescos
        console.log('🔄 Recargando usuario desde backend...');
        await cargarUsuario(true);
        
        // Actualizar estado local directamente
        console.log('✅ Estableciendo imagen local:', data.avatar_url);
        setImagenPerfil(data.avatar_url);
        
        // Limpiar AsyncStorage (ya no lo necesitamos)
        await AsyncStorage.removeItem('imagenPerfil');
        
        Alert.alert('Éxito', 'Avatar actualizado correctamente');
      } else {
        throw new Error(data.mensaje || 'Error al subir avatar');
      }
    } catch (error) {
      console.error('❌ Error al subir avatar:', error);
      Alert.alert('Error', `No se pudo subir el avatar: ${error.message}`);
    } finally {
      setSubiendoAvatar(false);
    }
  };

  const seleccionarImagenPerfil = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tus fotos para cambiar la imagen del perfil.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Mostrar opciones
      Alert.alert(
        'Cambiar foto de perfil',
        '¿Cómo quieres cambiar tu foto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar foto', onPress: () => abrirCamara() },
          { text: 'Elegir de galería', onPress: () => abrirGaleria() },
        ]
      );
    } catch (error) {
      console.log('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo acceder a las imágenes');
    }
  };

  const abrirCamara = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a la cámara para tomar una foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await subirAvatarAlBackend(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const abrirGaleria = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await subirAvatarAlBackend(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const cambiarTema = () => {
    const nextTheme = getNextTheme();
    changeTheme(nextTheme);
  };

  const cerrarSesion = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión? Se eliminarán todos los datos guardados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpiar AsyncStorage
              await AsyncStorage.clear();
              console.log('✅ Sesión cerrada y datos limpiados');
              
              // Navegar al Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          }
        }
      ]
    );
  };

  const opciones = usuario ? [
    { nombre: "Información Personal", icono: "user-circle", screen: "InformacionPersonal" },
    { nombre: "Mis Direcciones", icono: "map-pin", screen: "MisDirecciones" },
    { nombre: "Mis Pedidos", icono: "shopping-bag", screen: "MisPedidos" },
    { nombre: "Mis Emprendimientos", icono: "briefcase", screen: "Emprendimiento", mostrar: usuario.tipo_usuario === "emprendedor" || usuario.tipo_usuario === "admin" },
    { nombre: "Pedidos Recibidos", icono: "shopping-cart", screen: "PedidosRecibidos", mostrar: usuario.tipo_usuario === "emprendedor" || usuario.tipo_usuario === "admin" },
    { nombre: "Mi Plan", icono: "star", screen: "PlanScreen" },
    { nombre: "Necesito Ayuda", icono: "question-circle", screen: "HelpScreen" },
    { nombre: "Cerrar Sesión", icono: "sign-out", screen: "cerrarSesion", esAccion: true },
  ].filter(op => op.mostrar !== false) : [];

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Mi Perfil</Text>
          <TouchableOpacity 
            style={[styles.themeButton, isChangingTheme && styles.themeButtonDisabled]}
            onPress={cambiarTema}
            activeOpacity={0.7}
            disabled={isChangingTheme}
          >
            {isChangingTheme ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name={currentTheme.icon} size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.themeIndicator}>
          <Text style={styles.themeIndicatorText}>{currentTheme.name}</Text>
        </View>
      </LinearGradient>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {loading || subiendoAvatar ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
              {subiendoAvatar ? 'Subiendo avatar...' : 'Cargando perfil...'}
            </Text>
          </View>
        ) : usuario ? (
          <>
            {/* Tarjeta de perfil */}
            <View style={[styles.perfilCard, { 
              backgroundColor: currentTheme.cardBackground,
              shadowColor: currentTheme.shadow,
              borderColor: currentTheme.border
            }]}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity 
                  style={styles.avatarTouchable}
                  onPress={seleccionarImagenPerfil}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={imagenPerfil ? { uri: imagenPerfil } : require('../assets/favicon.png')} 
                    style={[styles.avatarImage, { borderColor: currentTheme.primary }]}
                  />
                  {subiendoAvatar && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  )}
                  <View style={[styles.cameraIconContainer, { backgroundColor: currentTheme.primary }]}>
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={[styles.nombreUsuario, { color: currentTheme.text }]}>{usuario.nombre}</Text>
                <Text style={[styles.tipoUsuario, { color: currentTheme.primary }]}>{usuario.tipo_usuario === "emprendedor" ? "Emprendedor" : "Cliente"}</Text>
                <Text style={[styles.tipoPlan, { color: currentTheme.text }]}>{usuario.plan_id ? "Plan Premium" : "Plan Básico"}</Text>
              </View>
            </View>

        {/* Accesos rápidos */}
        <View style={[styles.accesosContainer, { 
          backgroundColor: currentTheme.cardBackground,
          shadowColor: currentTheme.shadow,
          borderColor: currentTheme.border
        }]}>
          <Text style={[styles.seccionTitulo, { color: currentTheme.primary }]}>Accesos Rápidos</Text>
          <View style={styles.opcionesGrid}>
            {opciones.map((opcion) => (
              <TouchableOpacity 
                key={opcion.nombre} 
                style={[styles.opcionCard, { 
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border
                }]}
                onPress={() => {
                  // Manejar acciones especiales
                  if (opcion.esAccion && opcion.screen === 'cerrarSesion') {
                    cerrarSesion();
                    return;
                  }
                  
                  // Navegar según el tipo de screen
                  if (opcion.screen === 'InformacionPersonal' || opcion.screen === 'MisDirecciones' || opcion.screen === 'MisPedidos' || opcion.screen === 'PlanScreen' || opcion.screen === 'HelpScreen') {
                    // Screens dentro del stack Perfil
                    navigation.navigate(opcion.screen);
                  } else if (opcion.screen === 'Emprendimiento' || opcion.screen === 'PedidosRecibidos') {
                    // Screens principales
                    navigation.navigate(opcion.screen);
                  }
                }}
              >
                <View style={[styles.opcionIconoContainer, { backgroundColor: currentTheme.primary + '20' }]}>
                  <FontAwesome 
                    name={opcion.icono} 
                    size={24} 
                    color={opcion.esAccion ? "#e74c3c" : currentTheme.primary} 
                  />
                </View>
                <Text style={[
                  styles.opcionTexto,
                  { color: currentTheme.text },
                  opcion.esAccion && styles.opcionTextoAccion
                ]}>
                  {opcion.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#e74c3c" />
            <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
          </View>
        )}
      </ScrollView>
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
  },
  scrollContainer: {
    paddingBottom: 150, // Espacio para la barra inferior
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
  themeButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeButtonDisabled: {
    opacity: 0.5,
  },
  themeIndicator: {
    alignItems: 'center',
    marginTop: 5,
  },
  themeIndicatorText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  headerIcon: {
    marginRight: 10,
  },
  perfilCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2A9D8F',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  tipoUsuario: {
    fontSize: 16,
    color: '#2A9D8F',
    fontWeight: '600',
    marginTop: 5,
  },
  tipoPlan: {
    fontSize: 16,
    color: 'black',
    fontWeight: '600',
    marginTop: 5,
  },
  formContainer: {
    marginTop: 10,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A9D8F',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputFieldDisabled: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#777',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  botonGuardar: {
    backgroundColor: '#2A9D8F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  botonGuardarTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accesosContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  opcionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  opcionCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  opcionIconoContainer: {
    backgroundColor: '#e8f4f3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  opcionTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  opcionTextoAccion: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e74c3c",
    fontWeight: "500",
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PerfilScreen;