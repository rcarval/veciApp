import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Modal,
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
import LoadingVeciApp from "../components/LoadingVeciApp";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

// Componente de diálogo de confirmación elegante
const ConfirmDialog = ({ visible, title, message, onCancel, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", confirmColor = "#2A9D8F", isDangerous = false }) => {
  if (!visible) return null;
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={confirmDialogStyles.overlay}>
        <View style={confirmDialogStyles.container}>
          <View style={confirmDialogStyles.iconContainer}>
            <View style={[confirmDialogStyles.iconCircle, { backgroundColor: isDangerous ? '#e74c3c20' : '#2A9D8F20' }]}>
              <Ionicons 
                name={isDangerous ? "alert-circle" : "help-circle"} 
                size={40} 
                color={isDangerous ? "#e74c3c" : "#2A9D8F"} 
              />
            </View>
          </View>
          
          <Text style={confirmDialogStyles.title}>{title}</Text>
          <Text style={confirmDialogStyles.message}>{message}</Text>
          
          <View style={confirmDialogStyles.buttonContainer}>
            <TouchableOpacity
              style={[confirmDialogStyles.button, confirmDialogStyles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={confirmDialogStyles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[confirmDialogStyles.button, confirmDialogStyles.confirmButton, { backgroundColor: isDangerous ? '#e74c3c' : confirmColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={confirmDialogStyles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const confirmDialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 0.3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
});

// Componente de ActionSheet para seleccionar foto
const PhotoActionSheet = ({ visible, onClose, onCamera, onGallery }) => {
  if (!visible) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={actionSheetStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={actionSheetStyles.container}>
          <View style={actionSheetStyles.header}>
            <View style={actionSheetStyles.handle} />
            <Text style={actionSheetStyles.title}>Cambiar foto de perfil</Text>
          </View>
          
          <TouchableOpacity
            style={actionSheetStyles.option}
            onPress={onCamera}
            activeOpacity={0.7}
          >
            <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#3498db20' }]}>
              <Ionicons name="camera" size={24} color="#3498db" />
            </View>
            <Text style={actionSheetStyles.optionText}>Tomar foto</Text>
            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={actionSheetStyles.option}
            onPress={onGallery}
            activeOpacity={0.7}
          >
            <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#9b59b620' }]}>
              <Ionicons name="images" size={24} color="#9b59b6" />
            </View>
            <Text style={actionSheetStyles.optionText}>Elegir de galería</Text>
            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={actionSheetStyles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={actionSheetStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const actionSheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#dee2e6',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    letterSpacing: 0.2,
  },
  cancelButton: {
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c757d',
    letterSpacing: 0.3,
  },
});

const PerfilScreen = () => {
  const navigation = useNavigation();
  const { usuario, direcciones, loading, cargarUsuario, actualizarUsuarioLocal, modoVista, cambiarAVistaCliente, volverAVistaEmprendedor } = useUser();
  const { currentTheme, changeTheme, getNextTheme, isChangingTheme } = useTheme();
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [imagenError, setImagenError] = useState(false);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [perfilCargado, setPerfilCargado] = useState(false);
  
  // Toast para notificaciones
  const toast = useToast();
  
  // Estados para diálogos y action sheets
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDangerous: false,
  });
  
  const [photoActionSheet, setPhotoActionSheet] = useState(false);

  // Cargar usuario solo una vez al montar (si no hay cache o es antiguo)
  useEffect(() => {
    const cargarPerfilInicial = async () => {
      // Solo cargar si no hay usuario en el contexto o si el cache está expirado
      if (!usuario) {
        console.log('🔄 PerfilScreen: No hay usuario, cargando desde backend...');
        await cargarUsuario(false); // false = usar cache si es válido
      } else {
        console.log('✅ PerfilScreen: Usando usuario del contexto (cache)');
        // Cargar imagen del usuario existente
        cargarImagenPerfil();
      }
      setPerfilCargado(true);
    };

    cargarPerfilInicial();
  }, []); // Solo ejecutar una vez al montar

  // Cargar imagen cuando el usuario cambie
  useEffect(() => {
    if (usuario) {
      cargarImagenPerfil();
      setImagenError(false); // Reset error cuando cambia el usuario
    }
  }, [usuario?.avatar_url]); // Solo cuando cambie el avatar_url

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
      
      // Primero verificar si hay imagen en cache local
      const cachedAvatarUrl = await AsyncStorage.getItem('cachedAvatarUrl');
      const cachedAvatarTimestamp = await AsyncStorage.getItem('cachedAvatarTimestamp');
      
      // Si hay avatar_url del backend y coincide con el cache, usar cache
      if (usuario?.avatar_url && cachedAvatarUrl === usuario.avatar_url) {
        const timestamp = cachedAvatarTimestamp ? parseInt(cachedAvatarTimestamp) : 0;
        const ahora = Date.now();
        
        // Cache válido si tiene menos de 1 día
        if (ahora - timestamp < 24 * 60 * 60 * 1000) {
          console.log('🖼️ Usando avatar del cache local:', cachedAvatarUrl);
          setImagenPerfil(cachedAvatarUrl);
          return;
        }
      }
      
      // Si el usuario tiene avatar_url del backend, usarlo y guardarlo en cache
      if (usuario?.avatar_url) {
        console.log('🖼️ Usando avatar del backend:', usuario.avatar_url);
        setImagenPerfil(usuario.avatar_url);
        
        // Guardar en cache local para futuras cargas
        await AsyncStorage.setItem('cachedAvatarUrl', usuario.avatar_url);
        await AsyncStorage.setItem('cachedAvatarTimestamp', Date.now().toString());
        return;
      }
      
      // Fallback: cargar desde AsyncStorage (para compatibilidad con versión antigua)
      const imagenGuardada = await AsyncStorage.getItem('imagenPerfil');
      if (imagenGuardada) {
        console.log('🖼️ Usando avatar de AsyncStorage (legacy):', imagenGuardada);
        setImagenPerfil(imagenGuardada);
      } else {
        console.log('🖼️ No hay avatar disponible, usando imagen genérica');
        setImagenPerfil(null); // null = usar imagen genérica
      }
    } catch (error) {
      console.log('Error al cargar imagen del perfil:', error);
      setImagenPerfil(null); // En caso de error, usar imagen genérica
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
        
        // Actualizar el usuario en el contexto con la nueva URL (sin recargar desde backend)
        if (actualizarUsuarioLocal && usuario) {
          const usuarioActualizado = {
            ...usuario,
            avatar_url: data.avatar_url
          };
          console.log('✅ Actualizando usuario en contexto local:', usuarioActualizado.avatar_url);
          actualizarUsuarioLocal(usuarioActualizado);
        }
        
        // Actualizar estado local directamente con la nueva URL
        console.log('✅ Estableciendo nueva imagen:', data.avatar_url);
        setImagenPerfil(data.avatar_url);
        
        // Limpiar cache de avatar anterior y guardar el nuevo
        await AsyncStorage.removeItem('cachedAvatarUrl');
        await AsyncStorage.removeItem('cachedAvatarTimestamp');
        await AsyncStorage.removeItem('imagenPerfil'); // Limpiar también el legacy
        
        // Guardar nueva imagen en cache
        await AsyncStorage.setItem('cachedAvatarUrl', data.avatar_url);
        await AsyncStorage.setItem('cachedAvatarTimestamp', Date.now().toString());
        
        // Invalidar cache del usuario para que se recargue en la próxima vez
        // pero no forzar recarga inmediata (ya actualizamos localmente)
        console.log('✅ Avatar actualizado, cache de imagen actualizado');
        
        toast.success('Avatar actualizado correctamente');
      } else {
        throw new Error(data.mensaje || 'Error al subir avatar');
      }
    } catch (error) {
      console.error('❌ Error al subir avatar:', error);
      toast.error(`No se pudo subir el avatar: ${error.message}`);
    } finally {
      setSubiendoAvatar(false);
    }
  };

  const seleccionarImagenPerfil = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        toast.warning('Necesitamos acceso a tus fotos para cambiar la imagen del perfil', 4000);
        return;
      }

      // Mostrar ActionSheet elegante
      setPhotoActionSheet(true);
    } catch (error) {
      console.log('Error al seleccionar imagen:', error);
      toast.error('No se pudo acceder a las imágenes');
    }
  };

  const abrirCamara = async () => {
    setPhotoActionSheet(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        toast.warning('Necesitamos acceso a la cámara para tomar una foto', 4000);
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
      toast.error('No se pudo tomar la foto');
    }
  };

  const abrirGaleria = async () => {
    setPhotoActionSheet(false);
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
      toast.error('No se pudo seleccionar la imagen');
    }
  };

  const cambiarTema = () => {
    const nextTheme = getNextTheme();
    changeTheme(nextTheme);
  };

  const cerrarSesion = async () => {
    setConfirmDialog({
      visible: true,
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión? Se eliminarán todos los datos guardados.',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Cancelar',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, visible: false });
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
          toast.error('No se pudo cerrar la sesión');
        }
      },
    });
  };

  // Determinar tipo de usuario efectivo (considerando modo vista)
  const tipoUsuarioEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
  
  // Opciones organizadas por secciones (estilo configuración)
  const opcionesCuenta = usuario ? [
    { nombre: "Información Personal", icono: "person-circle", iconoTipo: "ionicon", screen: "InformacionPersonal", descripcion: "Nombre, correo y teléfono" },
    { nombre: "Mis Direcciones", icono: "location", iconoTipo: "ionicon", screen: "MisDirecciones", mostrar: tipoUsuarioEfectivo !== "emprendedor" && tipoUsuarioEfectivo !== "vendedor", descripcion: "Gestiona tus direcciones" },
  ].filter(op => op.mostrar !== false) : [];
  
  const opcionesPedidos = usuario ? [
    { nombre: "Mis Pedidos", icono: "cart", iconoTipo: "ionicon", screen: "MisPedidos", mostrar: tipoUsuarioEfectivo !== "emprendedor" && tipoUsuarioEfectivo !== "vendedor", descripcion: "Historial de compras" },
    { nombre: "Mis Cupones", icono: "pricetag", iconoTipo: "ionicon", screen: "Cupones", descripcion: "Descuentos y promociones" },
  ].filter(op => op.mostrar !== false) : [];
  
  const opcionesNegocio = usuario ? [
    { nombre: "Mi Plan", icono: "star", iconoTipo: "ionicon", screen: "PlanScreen", mostrar: usuario.tipo_usuario === "emprendedor" || usuario.tipo_usuario === "admin", descripcion: "Gestiona tu suscripción" },
  ].filter(op => op.mostrar !== false) : [];
  
  const opcionesSoporte = usuario ? [
    { nombre: "Necesito Ayuda", icono: "help-circle", iconoTipo: "ionicon", screen: "HelpScreen", descripcion: "Centro de ayuda" },
  ] : [];

  // Función helper para renderizar opciones
  const renderOpcion = (opcion) => (
    <TouchableOpacity
      key={opcion.nombre}
      style={[styles.opcionRow, { backgroundColor: currentTheme.cardBackground, borderBottomColor: currentTheme.border }]}
      onPress={() => {
        // Validar direcciones antes de navegar (excepto a MisDirecciones)
        const esCliente = usuario?.tipo_usuario === 'cliente';
        
        if (esCliente && direcciones.length === 0 && opcion.screen !== 'MisDirecciones') {
          setConfirmDialog({
            visible: true,
            title: "⚠️ Dirección requerida",
            message: "Debes agregar al menos una dirección antes de continuar. Esto es necesario para poder recibir pedidos y servicios.",
            confirmText: "Ir a Mis Direcciones",
            cancelText: "Cancelar",
            isDangerous: false,
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, visible: false });
              navigation.navigate('MisDirecciones');
            },
          });
          return;
        }
        navigation.navigate(opcion.screen);
      }}
      activeOpacity={0.6}
    >
      <View style={[styles.opcionIconContainer, { backgroundColor: currentTheme.primary + '15' }]}>
        <Ionicons name={opcion.icono} size={24} color={currentTheme.primary} />
      </View>
      <View style={styles.opcionTextoContainer}>
        <Text style={[styles.opcionTitulo, { color: currentTheme.text }]}>
          {opcion.nombre}
        </Text>
        {opcion.descripcion && (
          <Text style={[styles.opcionDescripcion, { color: currentTheme.textSecondary }]}>
            {opcion.descripcion}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={22} color={currentTheme.textSecondary} />
    </TouchableOpacity>
  );

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
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Tu cuenta</Text>
            <Text style={styles.tituloPrincipal}>Mi Perfil</Text>
          </View>
          <TouchableOpacity 
            style={[styles.themeButtonModerno, isChangingTheme && styles.themeButtonDisabled]}
            onPress={cambiarTema}
            activeOpacity={0.7}
            disabled={isChangingTheme}
          >
            {isChangingTheme ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name={currentTheme.icon} size={28} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.themeIndicatorModerno}>
          <Text style={styles.themeIndicatorText}>{currentTheme.name}</Text>
        </View>
      </LinearGradient>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {loading || subiendoAvatar ? (
          <View style={styles.loadingContainer}>
            <LoadingVeciApp size={120} color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary, marginTop: 30 }]}>
              {subiendoAvatar ? 'Subiendo avatar...' : 'Cargando perfil...'}
            </Text>
          </View>
        ) : usuario ? (
          <>
            {/* Tarjeta de perfil moderna */}
            <View style={[styles.perfilCardModerna, { 
              backgroundColor: currentTheme.cardBackground,
              shadowColor: currentTheme.shadow
            }]}>
              <LinearGradient
                colors={[currentTheme.primary + '10', 'transparent']}
                style={styles.perfilCardGradiente}
              >
                <TouchableOpacity 
                  style={styles.avatarTouchableModerno}
                  onPress={seleccionarImagenPerfil}
                  activeOpacity={0.8}
                >
                  <View style={[styles.avatarWrapperModerno, { borderColor: currentTheme.primary }]}>
                    {imagenPerfil && !imagenError ? (
                      <Image 
                        source={{ uri: imagenPerfil }} 
                        style={styles.avatarImageModerno}
                        onError={(e) => {
                          console.log('❌ Error cargando avatar, usando imagen genérica', e.nativeEvent.error);
                          setImagenPerfil(null);
                          setImagenError(false);
                        }}
                      />
                    ) : (
                      <View style={[styles.avatarImageModerno, styles.avatarPlaceholderModerno, { backgroundColor: currentTheme.primary + '15' }]}>
                        <Ionicons name="person" size={56} color={currentTheme.primary} />
                      </View>
                    )}
                    {subiendoAvatar && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="small" color="white" />
                      </View>
                    )}
                    <LinearGradient
                      colors={[currentTheme.primary, currentTheme.secondary]}
                      style={styles.cameraIconModerno}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="camera" size={18} color="white" />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.perfilInfoModerna}>
                  <Text style={[styles.nombreUsuarioModerno, { color: currentTheme.text }]}>
                    {usuario.nombre}
                  </Text>
                  <View style={styles.perfilBadgesContainer}>
                    <View style={[styles.perfilBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="briefcase" size={14} color={currentTheme.primary} />
                      <Text style={[styles.perfilBadgeTexto, { color: currentTheme.primary }]}>
                        {tipoUsuarioEfectivo === "emprendedor" ? "Emprendedor" : "Cliente"}
                      </Text>
                    </View>
                    <View style={[styles.perfilBadge, { backgroundColor: currentTheme.secondary + '15' }]}>
                      <Ionicons name="star" size={14} color={currentTheme.secondary} />
                      <Text style={[styles.perfilBadgeTexto, { color: currentTheme.secondary }]}>
                        {usuario.plan_id ? "Premium" : "Básico"}
                      </Text>
                    </View>
                    {/* Badge de Modo Vista si está activo */}
                    {modoVista === 'cliente' && (
                      <View style={[styles.perfilBadge, { backgroundColor: '#f39c12' + '15' }]}>
                        <Ionicons name="eye" size={14} color="#f39c12" />
                        <Text style={[styles.perfilBadgeTexto, { color: '#f39c12' }]}>
                          Modo Cliente
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>

        {/* Botón de Cambio de Vista - Solo para Emprendedores */}
        {usuario.tipo_usuario === "emprendedor" && (
          <View style={styles.cambioVistaSectionModerna}>
            <TouchableOpacity
              style={styles.cambioVistaCard}
              onPress={() => {
                if (modoVista === 'cliente') {
                  setConfirmDialog({
                    visible: true,
                    title: "Volver a Vista Emprendedor",
                    message: "¿Quieres volver a tu perfil de emprendedor?",
                    confirmText: "Volver",
                    cancelText: "Cancelar",
                    isDangerous: false,
                    onConfirm: async () => {
                      setConfirmDialog({ ...confirmDialog, visible: false });
                      await volverAVistaEmprendedor();
                      // Reiniciar navegación para aplicar cambios
                      navigation.dispatch(
                        require('@react-navigation/native').CommonActions.reset({
                          index: 0,
                          routes: [{ name: 'Perfil' }],
                        })
                      );
                    },
                  });
                } else {
                  setConfirmDialog({
                    visible: true,
                    title: "Cambiar a Vista Cliente",
                    message: "Podrás ver y usar la app como si fueras un cliente. Esto te permitirá probar tu negocio desde la perspectiva del cliente.",
                    confirmText: "Cambiar a Cliente",
                    cancelText: "Cancelar",
                    isDangerous: false,
                    onConfirm: async () => {
                      setConfirmDialog({ ...confirmDialog, visible: false });
                      await cambiarAVistaCliente();
                      // Reiniciar navegación para aplicar cambios
                      navigation.dispatch(
                        require('@react-navigation/native').CommonActions.reset({
                          index: 0,
                          routes: [{ name: 'Home' }],
                        })
                      );
                    },
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={modoVista === 'cliente' ? ['#e74c3c', '#c0392b'] : ['#f39c12', '#e67e22']}
                style={styles.cambioVistaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cambioVistaIcono}>
                  <Ionicons 
                    name={modoVista === 'cliente' ? "arrow-back-circle" : "eye"} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <View style={styles.cambioVistaTextos}>
                  <Text style={styles.cambioVistaTitulo}>
                    {modoVista === 'cliente' ? "Volver a Vista Emprendedor" : "Ver como Cliente"}
                  </Text>
                  <Text style={styles.cambioVistaDescripcion}>
                    {modoVista === 'cliente' 
                      ? "Regresa a tu perfil de emprendedor" 
                      : "Prueba tu negocio como cliente"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Secciones de configuración */}
        
        {/* Cuenta */}
        {opcionesCuenta.length > 0 && (
          <View style={styles.seccionContainer}>
            <Text style={[styles.seccionHeader, { color: currentTheme.textSecondary }]}>
              CUENTA
            </Text>
            <View style={[styles.seccionCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              {opcionesCuenta.map((opcion, index) => (
                <View key={opcion.nombre}>
                  {renderOpcion(opcion)}
                  {index < opcionesCuenta.length - 1 && <View style={[styles.divider, { backgroundColor: currentTheme.border }]} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pedidos y Cupones */}
        {opcionesPedidos.length > 0 && (
          <View style={styles.seccionContainer}>
            <Text style={[styles.seccionHeader, { color: currentTheme.textSecondary }]}>
              PEDIDOS
            </Text>
            <View style={[styles.seccionCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              {opcionesPedidos.map((opcion, index) => (
                <View key={opcion.nombre}>
                  {renderOpcion(opcion)}
                  {index < opcionesPedidos.length - 1 && <View style={[styles.divider, { backgroundColor: currentTheme.border }]} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Negocio (solo emprendedores) */}
        {opcionesNegocio.length > 0 && (
          <View style={styles.seccionContainer}>
            <Text style={[styles.seccionHeader, { color: currentTheme.textSecondary }]}>
              NEGOCIO
            </Text>
            <View style={[styles.seccionCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              {opcionesNegocio.map((opcion) => renderOpcion(opcion))}
            </View>
          </View>
        )}

        {/* Soporte */}
        <View style={styles.seccionContainer}>
          <Text style={[styles.seccionHeader, { color: currentTheme.textSecondary }]}>
            SOPORTE
          </Text>
          <View style={[styles.seccionCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            {opcionesSoporte.map((opcion) => renderOpcion(opcion))}
          </View>
        </View>

        {/* Botón de Cerrar Sesión pequeño y discreto */}
        <View style={styles.cerrarSesionContainer}>
          <TouchableOpacity
            style={[styles.cerrarSesionButton, { borderColor: '#e74c3c30' }]}
            onPress={cerrarSesion}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
            <Text style={styles.cerrarSesionText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: currentTheme.textSecondary }]}>
            VeciApp v1.0.0
          </Text>
        </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#e74c3c" />
            <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
          </View>
        )}
      </ScrollView>

      {/* Diálogo de confirmación elegante */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
      />

      {/* Action Sheet para seleccionar foto */}
      <PhotoActionSheet
        visible={photoActionSheet}
        onClose={() => setPhotoActionSheet(false)}
        onCamera={abrirCamara}
        onGallery={abrirGaleria}
      />

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
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  scrollContainer: {
    paddingBottom: 150, // Espacio para la barra inferior
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
  themeButtonModerno: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  themeButtonDisabled: {
    opacity: 0.5,
  },
  themeIndicatorModerno: {
    alignItems: 'center',
    marginTop: 10,
  },
  themeIndicatorText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Estilos modernos para la card de perfil
  perfilCardModerna: {
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  perfilCardGradiente: {
    padding: 24,
    paddingTop: 32,
  },
  avatarTouchableModerno: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapperModerno: {
    position: 'relative',
    padding: 6,
    borderRadius: 70,
    borderWidth: 4,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImageModerno: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholderModerno: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconModerno: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  perfilInfoModerna: {
    alignItems: 'center',
    gap: 12,
  },
  nombreUsuarioModerno: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  perfilBadgesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  perfilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  perfilBadgeTexto: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Estilos para cambio de vista
  cambioVistaSectionModerna: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  cambioVistaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cambioVistaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  cambioVistaIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cambioVistaTextos: {
    flex: 1,
  },
  cambioVistaTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  cambioVistaDescripcion: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  // Estilos modernos para accesos rápidos
  accesosSectionModerna: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  seccionTituloModerno: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },
  opcionesGridModerno: {
    gap: 12,
  },
  opcionCardModerna: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  opcionCardGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  opcionIconoModerno: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionTextoModerno: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  opcionChevron: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Nuevos estilos para diseño de configuración
  seccionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  seccionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  seccionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  opcionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  opcionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionTextoContainer: {
    flex: 1,
    gap: 3,
  },
  opcionTitulo: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  opcionDescripcion: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    marginLeft: 78,
  },
  cerrarSesionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  cerrarSesionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cerrarSesionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
    letterSpacing: 0.2,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default PerfilScreen;