import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Modal, 
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { API_ENDPOINTS } from "../config/api";

const RecuperarPasswordScreen = ({ navigation }) => {
  const [correo, setCorreo] = useState("");
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

  const enviarCodigo = async () => {
    if (!correo) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert("Error", "Por favor ingresa un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.RECUPERAR_PASSWORD, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ correo: correo.toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Código enviado",
          "Si el correo existe, recibirás un código en los próximos minutos.",
          [
            {
              text: "OK",
              onPress: () => {
                setLoading(false);
                navigation.navigate("VerificarCodigo", { correo: correo.toLowerCase() });
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", data.mensaje || data.error || "No se pudo enviar el código.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
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
                <Ionicons name="key" size={50} color="white" />
              </View>
              <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
              <Text style={styles.headerSubtitle}>
                Te enviaremos un código de verificación
              </Text>
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
              <Text style={styles.formTitle}>Ingresa tu correo</Text>
              <Text style={styles.formSubtitle}>
                Recibirás un código de 6 dígitos para restablecer tu contraseña
              </Text>

              {/* Input de Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor="#95a5a6"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Botón de enviar */}
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={enviarCodigo}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2A9D8F", "#1a7a6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.sendButtonText}>Enviar Código</Text>
                      <Ionicons name="send" size={18} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Info adicional */}
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={18} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  El código expira en 5 minutos
                </Text>
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
  // Formulario
  formContainer: {
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    marginBottom: 20,
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
    paddingVertical: 14,
    fontSize: 15,
    color: "#2c3e50",
  },
  sendButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  sendButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#7f8c8d",
    fontWeight: "500",
  },
});

export default RecuperarPasswordScreen;
