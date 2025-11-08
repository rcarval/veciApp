import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { API_ENDPOINTS } from "../config/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [confirmarCorreo, setConfirmarCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [comuna, setComuna] = useState("");
  const [comunas, setComunas] = useState([]);
  const [cargandoComunas, setCargandoComunas] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState("cliente");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast para notificaciones
  const toast = useToast();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validaciones
  const verificarCorreo = (text) => {
    setCorreo(text);
    setErrorCorreo(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? text !== confirmarCorreo && confirmarCorreo.length > 0
          ? "Los correos no coinciden"
          : ""
        : text.length > 0 ? "Ingresa un correo válido" : ""
    );
  };

  const verificarConfirmarCorreo = (text) => {
    setConfirmarCorreo(text);
    setErrorCorreo(text !== correo && text.length > 0 ? "Los correos no coinciden" : "");
  };

  const verificarContrasena = (text) => {
    setContrasena(text);
    setErrorContrasena(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(text)
        ? text !== confirmarContrasena && confirmarContrasena.length > 0
          ? "Las contraseñas no coinciden"
          : ""
        : text.length > 0 ? "8-16 caracteres, 1 mayúscula, 1 número" : ""
    );
  };

  const verificarConfirmarContrasena = (text) => {
    setConfirmarContrasena(text);
    setErrorContrasena(
      text !== contrasena && text.length > 0 ? "Las contraseñas no coinciden" : ""
    );
  };

  const validarCorreo = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarContrasena = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password);

  // Cargar comunas
  useEffect(() => {
    const cargarComunas = async () => {
      try {
        setCargandoComunas(true);
        const response = await fetch(API_ENDPOINTS.COMUNAS);
        const data = await response.json();
        
        if (response.ok && data.comunas) {
          setComunas(data.comunas);
          if (data.comunas.length > 0) {
            setComuna(data.comunas[0].id.toString());
          }
        } else {
          setComunas([
            { id: 1, nombre: 'Isla de Maipo' },
            { id: 2, nombre: 'Talagante' }
          ]);
          setComuna('1');
        }
      } catch (error) {
        console.error('Error al cargar comunas:', error);
        setComunas([
          { id: 1, nombre: 'Isla de Maipo' },
          { id: 2, nombre: 'Talagante' }
        ]);
        setComuna('1');
      } finally {
        setCargandoComunas(false);
      }
    };

    cargarComunas();
  }, []);

  const handleRegister = async () => {
    if (!nombre || !correo || !confirmarCorreo || !contrasena || !confirmarContrasena) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (!validarCorreo(correo)) {
      toast.error("Ingresa un correo válido");
      return;
    }
    if (correo !== confirmarCorreo) {
      toast.error("Los correos no coinciden");
      return;
    }
    if (!validarContrasena(contrasena)) {
      toast.error("La contraseña debe tener 8-16 caracteres, con mayúscula y número");
      return;
    }
    if (contrasena !== confirmarContrasena) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    setLoading(true);

    try {
      const datosRegistro = {
        nombre,
        correo: correo.toLowerCase(),
        contrasena,
        tipo_usuario: tipoUsuario === 'vecino' ? 'cliente' : tipoUsuario,
      };

      if (comuna) {
        datosRegistro.comuna_id = parseInt(comuna);
      }

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(datosRegistro),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("✅ ¡Registro exitoso! Hemos enviado un correo de verificación a " + correo, 5000);
        
        // Navegar al login después de 3 segundos
        setTimeout(() => {
          navigation.navigate("Login");
        }, 3000);
      } else {
        const mensajeError = data.mensaje || data.error || "No se pudo completar el registro.";
        toast.error(mensajeError);
      }
    } catch (error) {
      console.error("Error:", error);
      
      let mensajeError = "No se pudo conectar al servidor. Verifica tu conexión a internet.";
      if (error.message?.includes('Network request failed')) {
        mensajeError = "Error de conexión. Verifica tu internet e intenta nuevamente.";
      } else if (error.message?.includes('timeout')) {
        mensajeError = "La conexión tardó demasiado. Intenta nuevamente.";
      }
      
      toast.error(mensajeError, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#1a535c", "#2A9D8F", "#4ecdc4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            <View style={styles.headerContent}>
              <View style={styles.logoMini}>
                <Image 
                  source={require("../assets/welcome.png")} 
                  style={styles.logoSmall}
                  contentFit="contain"
                  tintColor="white"
                />
              </View>
              <Text style={styles.headerTitle}>Crear Cuenta</Text>
              <Text style={styles.headerSubtitle}>Únete a tu comunidad local</Text>
            </View>
          </Animated.View>

          {/* Formulario */}
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            <View style={styles.formCard}>
              {/* Nombre */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre completo"
                  placeholderTextColor="#95a5a6"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={correo}
                  onChangeText={verificarCorreo}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#95a5a6"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Confirmar Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={confirmarCorreo}
                  onChangeText={verificarConfirmarCorreo}
                  placeholder="Confirmar correo"
                  placeholderTextColor="#95a5a6"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {errorCorreo ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{errorCorreo}</Text>
                </View>
              ) : null}

              {/* Contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={contrasena}
                  onChangeText={verificarContrasena}
                  placeholder="Contraseña"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setVerPassword(!verPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={verPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#7f8c8d"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirmar Contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={confirmarContrasena}
                  onChangeText={verificarConfirmarContrasena}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!verConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setVerConfirmPassword(!verConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={verConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#7f8c8d"
                  />
                </TouchableOpacity>
              </View>

              {errorContrasena ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{errorContrasena}</Text>
                </View>
              ) : null}

              {/* Tipo de Usuario - Compacto */}
              <View style={styles.pickerContainerCompact}>
                <View style={styles.pickerIconContainer}>
                  <Ionicons name="briefcase-outline" size={20} color="#2A9D8F" />
                </View>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={tipoUsuario}
                    onValueChange={(itemValue) => setTipoUsuario(itemValue)}
                    style={styles.pickerCompact}
                  >
                    <Picker.Item label="Quiero Comprar" value="cliente" />
                    <Picker.Item label="Quiero Comprar y Vender" value="emprendedor" />
                  </Picker>
                </View>
              </View>

              {/* Comuna - Compacto */}
              <View style={styles.pickerContainerCompact}>
                <View style={styles.pickerIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#2A9D8F" />
                </View>
                {cargandoComunas ? (
                  <View style={styles.loadingComunasCompact}>
                    <ActivityIndicator size="small" color="#2A9D8F" />
                    <Text style={styles.loadingTextCompact}>Cargando...</Text>
                  </View>
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={comuna}
                      onValueChange={(itemValue) => setComuna(itemValue)}
                      style={styles.pickerCompact}
                    >
                      <Picker.Item label="Selecciona comuna" value="" />
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

              {/* Botón de registro */}
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister}
                disabled={loading || cargandoComunas}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2A9D8F", "#1a7a6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButtonGradient}
                >
                  {loading ? (
                    <View style={styles.buttonLoading}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.registerButtonText}>Registrando...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Link a login */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  container: {
    flex: 1,
    backgroundColor: "#1a535c",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 30,
    paddingBottom: 30,
  },
  // Círculos decorativos
  backgroundCircle1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -100,
    right: -80,
  },
  backgroundCircle2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    bottom: -60,
    left: -60,
  },
  // Header
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  logoMini: {
    marginBottom: 8,
  },
  logoSmall: {
    width: 60,
    height: 60,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
    fontWeight: "400",
  },
  // Formulario
  formContainer: {
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2c3e50",
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    flex: 1,
  },
  // Picker compacto
  pickerContainerCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e9ecef",
    marginBottom: 14,
    height: 52,
    overflow: "hidden",
  },
  pickerIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  pickerCompact: {
    color: "#2c3e50",
    fontSize: 15,
  },
  loadingComunasCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTextCompact: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  // Botones
  registerButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
  },
  loginLinkText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
  loginLinkBold: {
    color: "#2A9D8F",
    fontWeight: "700",
  },
});

export default RegisterScreen;
