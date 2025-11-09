import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

const { width, height } = Dimensions.get('window');

// Componente de animación de loading elegante
const LoadingAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(1)).current;
  const wave2 = useRef(new Animated.Value(1)).current;
  const wave3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de escala suave (breathing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de brillo (glow effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 1)
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave1, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 2) - con delay
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(wave2, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 3) - con más delay
    Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(wave3, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const wave1Opacity = wave1.interpolate({
    inputRange: [1, 2],
    outputRange: [0.6, 0],
  });

  const wave2Opacity = wave2.interpolate({
    inputRange: [1, 2],
    outputRange: [0.5, 0],
  });

  const wave3Opacity = wave3.interpolate({
    inputRange: [1, 2],
    outputRange: [0.4, 0],
  });

  return (
    <View style={styles.loadingAnimationContainer}>
      {/* Ondas expansivas concéntricas */}
      <Animated.View
        style={[
          styles.loadingWave,
          {
            transform: [{ scale: wave1 }],
            opacity: wave1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.loadingWave,
          {
            transform: [{ scale: wave2 }],
            opacity: wave2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.loadingWave,
          {
            transform: [{ scale: wave3 }],
            opacity: wave3Opacity,
          },
        ]}
      />

      {/* Círculo de brillo (glow) */}
      <Animated.View
        style={[
          styles.loadingGlow,
          {
            opacity: glowOpacity,
          },
        ]}
      />
      
      {/* Logo con breathing suave */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image 
          source={require("../assets/welcome.png")} 
          style={styles.loadingLogo}
          contentFit="contain"
          tintColor="white"
        />
      </Animated.View>
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const userContext = useUser();
  const cargarUsuario = userContext?.cargarUsuario;
  const limpiarCacheCompleto = userContext?.limpiarCacheCompleto;
  
  const [correo, setCorreo] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false); // Modal de transición (solo éxito)
  const [validando, setValidando] = useState(false); // Loading en botón
  
  // Toast para notificaciones
  const toast = useToast();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso continua para el logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const limpiarDatos = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        
        if (!usuarioGuardado && sesionActiva !== 'true') {
          console.log('🧹 Limpiando AsyncStorage al abrir LoginScreen...');
          await AsyncStorage.clear();
          console.log('✅ AsyncStorage limpiado');
        }
      } catch (error) {
        console.error('❌ Error al limpiar AsyncStorage:', error);
      }
    };
    
    limpiarDatos();
  }, []);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      toast.error("Por favor, ingresa tu correo y contraseña");
      return;
    }

    setValidando(true);

    try {
      console.log('🔐 Intentando login...');
      
      // Ejecutar login
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ LOGIN EXITOSO - Ahora sí mostramos el modal de transición
        setValidando(false);
        setLoading(true);
        
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("sesionActiva", "true");
        
        console.log("✅ Login exitoso");
        
        if (limpiarCacheCompleto) {
          await limpiarCacheCompleto();
        }
        
        try {
          await cargarUsuario(true);
          console.log("✅ Usuario cargado");
        } catch (error) {
          console.error("❌ Error al cargar usuario:", error);
        }
        
        // Timer de 5 segundos para la animación
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Guardar el tipo de usuario para navegación
        const tipoUsuario = data.usuario?.tipo_usuario;
        const destinoNavegacion = (tipoUsuario === 'vendedor' || tipoUsuario === 'emprendedor') 
          ? "PedidosRecibidos" 
          : "Home";
        
        // PRIMERO: Guardar flag en AsyncStorage para que el overlay persista
        await AsyncStorage.setItem('mostrarOverlayTransicion', 'true');
        
        // SEGUNDO: Navegar inmediatamente (la siguiente pantalla empieza a cargar)
        navigation.reset({
          index: 0,
          routes: [{ name: destinoNavegacion }],
        });
        
        // TERCERO: La animación continuará en la siguiente pantalla
        // No hacemos nada aquí, el overlay se manejará globalmente
      } else {
        // ❌ LOGIN FALLIDO - Solo ocultar loading del botón
        setValidando(false);
        
        // Manejar error de email no verificado
        if (data.requiere_verificacion) {
          toast.error("📧 " + (data.error || "Por favor verifica tu correo electrónico antes de iniciar sesión."), 4000);
        } else {
          toast.error(data.mensaje || data.error || "Credenciales incorrectas", 4000);
        }
      }
      
    } catch (error) {
      console.error("Error:", error);
      
      // Mensajes de error más amigables en español
      let mensajeError = "No se pudo conectar al servidor. Verifica tu conexión a internet.";
      
      if (error.message?.includes('Network request failed')) {
        mensajeError = "Error de conexión. Verifica tu internet e intenta nuevamente.";
      } else if (error.message?.includes('timeout')) {
        mensajeError = "La conexión tardó demasiado. Intenta nuevamente.";
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      toast.error(mensajeError, 4000);
      setValidando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient animado */}
      <LinearGradient
        colors={["#1a535c", "#2A9D8F", "#4ecdc4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        {/* Círculos decorativos de fondo */}
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          {/* Logo y título con animación */}
          <Animated.View style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) },
              ],
            },
          ]}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require("../assets/welcome.png")} 
                style={styles.logo}
                contentFit="contain"
                tintColor="white"
              />
            </View>
            
            <Text style={styles.subtitle}>Tu comunidad, más cerca que nunca</Text>
          </Animated.View>

          {/* Formulario con animación */}
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            {/* Card del formulario */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Iniciar Sesión</Text>
              
              {/* Input de Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="Correo Electrónico"
                  placeholderTextColor="#95a5a6"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Input de Contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={contrasena}
                  onChangeText={setContrasena}
                  placeholder="Contraseña"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
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

              {/* Botón de Login */}
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={validando}
              >
                <LinearGradient
                  colors={validando ? ["#95a5a6", "#7f8c8d"] : ["#2A9D8F", "#1a7a6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {validando ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loginButtonText}>Validando...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Link de recuperar contraseña */}
              <TouchableOpacity
                onPress={() => navigation.navigate("RecuperarPassword")}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Separador */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón de Registro */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.registerButton}
              activeOpacity={0.8}
            >
              <View style={styles.registerButtonContent}>
                <Ionicons name="person-add-outline" size={20} color="#2A9D8F" />
                <Text style={styles.registerButtonText}>Crear cuenta nueva</Text>
              </View>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Loading mejorado con logo animado */}
      <Modal visible={loading} transparent={false} animationType="none">
        <LinearGradient
          colors={["#1a535c", "#2A9D8F", "#4ecdc4"]}
          style={styles.modalContainer}
        >
          <LoadingAnimation />
        </LinearGradient>
      </Modal>

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
  contentContainer: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // Círculos decorativos de fondo
  backgroundCircle1: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -150,
    right: -100,
  },
  backgroundCircle2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    bottom: -80,
    left: -80,
  },
  backgroundCircle3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    top: height * 0.4,
    left: -50,
  },
  // Logo y header
  logoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 50,
  },
  logoWrapper: {
    marginBottom: -14,
  },
  logo: {
    width: 200,
    height: 200,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    fontWeight: "400",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: -4,
  },
  // Formulario
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    marginBottom: 16,
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
    paddingVertical: 16,
    fontSize: 16,
    color: "#2c3e50",
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 20,
  },
  forgotPasswordText: {
    color: "#2A9D8F",
    fontSize: 14,
    fontWeight: "600",
  },
  // Separador
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
    paddingHorizontal: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  separatorText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 16,
  },
  // Botón de registro
  registerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 24,
    overflow: "hidden",
  },
  registerButtonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal de loading con animación
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
    height: '100%',
  },
  loadingAnimationContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWave: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  loadingGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  loadingLogo: {
    width: 130,
    height: 130,
  },
});

export default LoginScreen;
