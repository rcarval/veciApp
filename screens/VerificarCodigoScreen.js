import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { API_ENDPOINTS } from "../config/api";

const VerificarCodigoScreen = ({ route, navigation }) => {
  const { correo } = route.params;
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const inputsRef = Array.from({ length: 6 }, () => useRef(null));
  const [contador, setContador] = useState(30);
  const [puedeReenviar, setPuedeReenviar] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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

  // Contador
  useEffect(() => {
    if (contador > 0) {
      const timer = setInterval(() => setContador((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setPuedeReenviar(true);
    }
  }, [contador]);

  const manejarCambio = (text, index) => {
    if (text.length > 1) text = text[0];
    const nuevoCodigo = [...codigo];
    nuevoCodigo[index] = text;
    setCodigo(nuevoCodigo);

    if (text && index < 5) inputsRef[index + 1].current.focus();
    if (!text && index > 0) inputsRef[index - 1].current.focus();
  };

  const manejarBorrar = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef[index - 1].current.focus();
    }
  };

  const verificarCodigo = async () => {
    const codigoFinal = codigo.join("");
    if (codigoFinal.length !== 6) {
      Alert.alert("Error", "Debes ingresar los 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.VERIFICAR_CODIGO, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ correo, codigo: codigoFinal }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Código verificado",
          "Código correcto. Ahora puedes crear tu nueva contraseña.",
          [
            {
              text: "Continuar",
              onPress: () => navigation.navigate("NuevaPassword", { correo })
            }
          ]
        );
      } else {
        Alert.alert("Error", data.mensaje || data.error || "Código inválido o expirado.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.RECUPERAR_PASSWORD, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (response.ok) {
        setContador(30);
        setPuedeReenviar(false);
        setCodigo(["", "", "", "", "", ""]);
        Alert.alert("Código reenviado", "Revisa tu correo electrónico.");
      } else {
        Alert.alert("Error", data.mensaje || "No se pudo reenviar el código.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
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
        <View style={styles.contentContainer}>
          {/* Header */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={50} color="white" />
              </View>
              <Text style={styles.headerTitle}>Verificar Código</Text>
              <Text style={styles.headerSubtitle}>
                Ingresa el código enviado a
              </Text>
              <Text style={styles.emailText}>{correo}</Text>
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
              <Text style={styles.formTitle}>Código de 6 dígitos</Text>
              
              {/* Inputs del código */}
              <View style={styles.codeInputContainer}>
                {codigo.map((digito, index) => (
                  <TextInput
                    key={index}
                    ref={inputsRef[index]}
                    style={styles.codeInput}
                    value={digito}
                    onChangeText={(text) => manejarCambio(text, index)}
                    onKeyPress={(event) => manejarBorrar(event, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Botón de verificar */}
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={verificarCodigo}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2A9D8F", "#1a7a6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>Verificar</Text>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Contador y reenviar */}
              <View style={styles.resendContainer}>
                {puedeReenviar ? (
                  <TouchableOpacity onPress={reenviarCodigo}>
                    <Text style={styles.resendText}>
                      ¿No recibiste el código? <Text style={styles.resendLink}>Reenviar</Text>
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={16} color="#7f8c8d" />
                    <Text style={styles.timerText}>
                      Reenviar en {contador}s
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 50,
    paddingBottom: 40,
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
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "400",
  },
  emailText: {
    fontSize: 14,
    color: "white",
    marginTop: 4,
    fontWeight: "700",
  },
  // Formulario
  formContainer: {
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 24,
    textAlign: "center",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
  },
  verifyButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  resendContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  resendLink: {
    color: "#2A9D8F",
    fontWeight: "700",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
});

export default VerificarCodigoScreen;
