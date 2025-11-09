import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const InformacionPersonalScreen = () => {
  const navigation = useNavigation();
  const { invalidarUsuario, cargarUsuario } = useUser();
  const { currentTheme } = useTheme();

  // Estados para los datos del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comuna, setComuna] = useState("");
  const [comunas, setComunas] = useState([]);
  const [cargandoComunas, setCargandoComunas] = useState(true);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuarioOriginal, setUsuarioOriginal] = useState(null);
  
  // Estados para la verificación
  const [modalVisible, setModalVisible] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState(3);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Cargar datos del usuario desde el backend
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setCargandoUsuario(true);
        const token = await AsyncStorage.getItem("token");
        
        if (!token) {
          Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
          navigation.navigate("Login");
          return;
        }

        const response = await fetch(API_ENDPOINTS.PERFIL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setNombre(data.nombre || "");
          setTelefono(data.telefono || "");
          setComuna(data.comuna_id ? data.comuna_id.toString() : "");
          setUsuarioOriginal({
            nombre: data.nombre || "",
            telefono: data.telefono || "",
            comuna_id: data.comuna_id || null,
          });
        } else {
          Alert.alert("Error", data.mensaje || data.error || "No se pudo cargar tu información.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        Alert.alert("Error", "No se pudo conectar al servidor.");
        navigation.goBack();
      } finally {
        setCargandoUsuario(false);
      }
    };

    // Cargar comunas desde el backend
    const cargarComunas = async () => {
      try {
        setCargandoComunas(true);
        const response = await fetch(API_ENDPOINTS.COMUNAS);
        const data = await response.json();
        
        if (response.ok && data.comunas) {
          setComunas(data.comunas);
        } else {
          console.error('No se pudieron cargar comunas desde la API');
          setComunas([]);
        }
      } catch (error) {
        console.error("Error al cargar comunas:", error);
        setComunas([]);
      } finally {
        setCargandoComunas(false);
      }
    };

    cargarUsuario();
    cargarComunas();
  }, []);

  // Función para enviar código de verificación (simulado por ahora)
  const enviarCodigoVerificacion = () => {
    // TODO: Implementar envío real de SMS cuando se tenga servicio SMS
    // Por ahora simulamos el envío con un código aleatorio
    const codigoSimulado = Math.floor(1000 + Math.random() * 9000).toString();
    setCodigoEnviado(codigoSimulado);
    setIntentosRestantes(3);
    setTiempoRestante(120); // 2 minutos en segundos
    
    // Mostrar el código en consola para pruebas
    console.log("Código de verificación (solo para pruebas):", codigoSimulado);
    
    // Iniciar cuenta regresiva
    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    Alert.alert(
      "Código enviado",
      "Hemos enviado un código de verificación a tu teléfono."
    );
  };

  // Función para verificar el código
  const verificarCodigo = () => {
    if (codigoVerificacion === codigoEnviado) {
      // Código correcto, proceder a guardar cambios
      guardarCambios();
      setModalVisible(false);
      Alert.alert("Éxito", "Tus datos han sido actualizados correctamente.");
    } else {
      // Código incorrecto
      setIntentosRestantes(intentosRestantes - 1);
      if (intentosRestantes <= 1) {
        Alert.alert(
          "Error",
          "Código incorrecto. No te quedan más intentos. Por favor solicita un nuevo código."
        );
        setModalVisible(false);
      } else {
        Alert.alert(
          "Error",
          `Código incorrecto. Te quedan ${intentosRestantes - 1} intentos.`
        );
      }
    }
  };

  // Función para guardar los cambios en el backend
  const guardarCambios = async () => {
    try {
      setGuardando(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
        navigation.navigate("Login");
        return;
      }

      const datosActualizar = {
        nombre,
        telefono: telefono || null,
        comuna_id: comuna ? parseInt(comuna) : null,
      };
      
      console.log('📤 Actualizando perfil:', JSON.stringify(datosActualizar, null, 2));

      const response = await fetch(API_ENDPOINTS.ACTUALIZAR_PERFIL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(datosActualizar),
      });

      const data = await response.json();
      console.log('📥 Respuesta actualización:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('✅ Perfil actualizado exitosamente');
        // Actualizar token en AsyncStorage si el backend lo devuelve
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }

        // Invalidar cache y recargar usuario en el contexto
        invalidarUsuario();
        await cargarUsuario(true); // Forzar recarga para obtener datos actualizados

        Alert.alert("Éxito", data.mensaje || "Tus datos han sido actualizados correctamente.");
        navigation.goBack();
      } else {
        console.log('❌ Error actualizando perfil:', data.error || data.mensaje);
        Alert.alert("Error", data.mensaje || data.error || "No se pudieron guardar los cambios.");
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Función para validar si hay cambios
  const hayCambios = () => {
    if (!usuarioOriginal) return false;
    
    const comunaActual = comuna || "";
    const comunaOriginal = usuarioOriginal.comuna_id ? usuarioOriginal.comuna_id.toString() : "";
    
    return (
      nombre !== usuarioOriginal.nombre ||
      telefono !== (usuarioOriginal.telefono || "") ||
      comunaActual !== comunaOriginal
    );
  };

  // Función para manejar el guardado
  const manejarGuardado = () => {
    if (!hayCambios()) {
      Alert.alert("Información", "No hay cambios que guardar.");
      return;
    }

    // Si cambió el teléfono, requerimos verificación
    if (usuarioOriginal && telefono !== (usuarioOriginal.telefono || "")) {
      enviarCodigoVerificacion();
      setModalVisible(true);
    } else {
      // Si no cambió el teléfono, guardar directamente
      guardarCambios();
    }
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
              <Ionicons name="person" size={28} color="white" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerSubtitle}>Edita tu</Text>
              <Text style={styles.tituloPrincipal}>Información</Text>
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {cargandoUsuario ? (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[currentTheme.primary + '30', currentTheme.secondary + '30']}
            style={styles.loadingGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ActivityIndicator size="large" color={currentTheme.primary} />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>Cargando información...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.formContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            <LinearGradient
              colors={[currentTheme.primary + '08', 'transparent']}
              style={styles.formGradiente}
            >
              {/* Campo Nombre */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="person-outline" size={16} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre Completo</Text>
                </View>
                <View style={[styles.inputContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                  <Ionicons name="text-outline" size={20} color={currentTheme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputModerno, { color: currentTheme.text }]}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ingresa tu nombre completo"
                    placeholderTextColor={currentTheme.textSecondary}
                    editable={!guardando}
                  />
                </View>
              </View>

              {/* Campo Teléfono */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="call-outline" size={16} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Teléfono</Text>
                </View>
                <View style={[styles.inputContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                  <Ionicons name="phone-portrait-outline" size={20} color={currentTheme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputModerno, { color: currentTheme.text }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="+56912345678"
                    placeholderTextColor={currentTheme.textSecondary}
                    keyboardType="phone-pad"
                    editable={!guardando}
                  />
                </View>
              </View>

              {/* Campo Comuna */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="location-outline" size={16} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Comuna</Text>
                </View>
                <View style={[styles.pickerContainerModerno, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                  <Ionicons name="navigate-outline" size={20} color={currentTheme.primary} style={styles.pickerIcon} />
                  {cargandoComunas ? (
                    <View style={styles.loadingComunasModerno}>
                      <ActivityIndicator size="small" color={currentTheme.primary} />
                      <Text style={[styles.loadingComunasText, { color: currentTheme.textSecondary }]}>Cargando...</Text>
                    </View>
                  ) : (
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={comuna}
                        onValueChange={(itemValue) => setComuna(itemValue)}
                        style={[styles.pickerModerno, { color: currentTheme.text }]}
                        enabled={!guardando}
                      >
                        <Picker.Item label="Selecciona una comuna" value="" />
                        {comunas.map((comunaItem) => (
                          <Picker.Item
                            key={comunaItem.id}
                            label={comunaItem.nombre}
                            value={comunaItem.id.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  )}
                </View>
              </View>

              {/* Botón Guardar */}
              <TouchableOpacity
                style={[styles.botonGuardarModerno, (!hayCambios() || guardando) && styles.botonGuardarInactivo]}
                onPress={manejarGuardado}
                disabled={!hayCambios() || guardando}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={(!hayCambios() || guardando) ? ['#95a5a6', '#7f8c8d'] : [currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonGuardarGradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {guardando ? (
                    <>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={styles.botonGuardarTexto}>Guardando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="white" />
                      <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      )}

      {/* Modal de verificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            <LinearGradient
              colors={[currentTheme.primary + '10', 'transparent']}
              style={styles.modalGradiente}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrapper}>
                  <LinearGradient
                    colors={[currentTheme.primary, currentTheme.secondary]}
                    style={styles.modalIconoGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="shield-checkmark" size={28} color="white" />
                  </LinearGradient>
                </View>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={28} color={currentTheme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Verificación por SMS</Text>
              
              <Text style={[styles.modalText, { color: currentTheme.textSecondary }]}>
                Hemos enviado un código de verificación al número {telefono}.
                Ingresa el código a continuación:
              </Text>

              <View style={[styles.codigoInputContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                <Ionicons name="keypad-outline" size={22} color={currentTheme.primary} />
                <TextInput
                  style={[styles.codigoInputModerno, { color: currentTheme.text }]}
                  value={codigoVerificacion}
                  onChangeText={setCodigoVerificacion}
                  placeholder="••••"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              {tiempoRestante > 0 && (
                <View style={styles.tiempoContainer}>
                  <Ionicons name="time-outline" size={16} color={currentTheme.primary} />
                  <Text style={[styles.tiempoRestante, { color: currentTheme.textSecondary }]}>
                    Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
              )}

              {tiempoRestante === 0 && (
                <TouchableOpacity
                  onPress={enviarCodigoVerificacion}
                  style={[styles.botonReenviarModerno, { borderColor: currentTheme.primary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-circle-outline" size={20} color={currentTheme.primary} />
                  <Text style={[styles.botonReenviarTexto, { color: currentTheme.primary }]}>Reenviar código</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.botonVerificarModerno, codigoVerificacion.length !== 4 && styles.botonVerificarInactivo]}
                onPress={verificarCodigo}
                disabled={codigoVerificacion.length !== 4}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={codigoVerificacion.length !== 4 ? ['#95a5a6', '#7f8c8d'] : [currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonVerificarGradiente}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-done-circle" size={22} color="white" />
                  <Text style={styles.botonVerificarTexto}>Verificar Código</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Barra de navegación inferior */}
      <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={[styles.tabBar, { borderTopColor: currentTheme.border, backgroundColor: currentTheme.primary }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Home')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Ofertas")}
        >
          <Ionicons name="pricetag" size={24} color="white" />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Favoritos")}
        >
          <Ionicons name="heart" size={24} color="white" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Perfil")}
        >
          <Ionicons name="person" size={24} color="#0b5b52" />
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
  },
  scrollContainer: {
    paddingBottom: 150,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  formContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  formGradiente: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
    gap: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: {
    marginRight: 4,
  },
  inputModerno: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#2c3e50",
  },
  pickerContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
  },
  pickerIcon: {
    marginRight: 4,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  pickerModerno: {
    color: "#2c3e50",
    fontSize: 15,
  },
  loadingComunasModerno: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingComunasText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  botonGuardarModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  botonGuardarGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  botonGuardarInactivo: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  modalGradiente: {
    padding: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  modalIconoGradiente: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  modalText: {
    fontSize: 15,
    color: "#7f8c8d",
    marginBottom: 24,
    lineHeight: 22,
    textAlign: "center",
  },
  codigoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 18,
    marginBottom: 16,
    gap: 12,
  },
  codigoInputModerno: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    textAlign: "center",
    color: "#2c3e50",
    fontWeight: '700',
    letterSpacing: 8,
  },
  tiempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  tiempoRestante: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: '600',
  },
  botonReenviarModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2A9D8F",
    marginBottom: 20,
    gap: 8,
  },
  botonReenviarTexto: {
    color: "#2A9D8F",
    fontSize: 15,
    fontWeight: "700",
  },
  botonVerificarModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  botonVerificarGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  botonVerificarInactivo: {
    opacity: 0.6,
  },
  botonVerificarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingGradiente: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: '600',
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
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
});

export default InformacionPersonalScreen;