import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { API_ENDPOINTS } from "../config/api";

const NuevaPasswordScreen = ({ route, navigation }) => {
  const { correo } = route.params;
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);
  const [errorContrasena, setErrorContrasena] = useState("");

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

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

  const validarContrasena = (password) => /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password);

  const verificarContrasena = (text) => {
    setContrasena(text);
    if (text.length === 0) {
      setErrorContrasena("");
    } else if (!validarContrasena(text)) {
      setErrorContrasena("8-16 caracteres, 1 mayúscula, 1 número");
    } else if (confirmar.length > 0 && text !== confirmar) {
      setErrorContrasena("Las contraseñas no coinciden");
    } else {
      setErrorContrasena("");
    }
  };

  const verificarConfirmar = (text) => {
    setConfirmar(text);
    if (text.length > 0 && text !== contrasena) {
      setErrorContrasena("Las contraseñas no coinciden");
    } else if (contrasena.length > 0 && validarContrasena(contrasena)) {
      setErrorContrasena("");
    }
  };

  const cambiarContrasena = async () => {
    if (!contrasena || !confirmar) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    if (!validarContrasena(contrasena)) {
      Alert.alert("Error", "La contraseña debe tener 8-16 caracteres, incluir mayúscula y número.");
      return;
    }

    if (contrasena !== confirmar) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.CAMBIAR_PASSWORD, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        // Animación de éxito
        Animated.spring(successAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          Alert.alert(
            "¡Contraseña actualizada!",
            "Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.",
            [
              {
                text: "Ir al Login",
                onPress: () => navigation.navigate("Login")
              }
            ]
          );
        }, 500);
      } else {
        Alert.alert("Error", data.mensaje || data.error || "No se pudo actualizar la contraseña.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
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
        <View style={styles.contentContainer}>
          {/* Header */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={50} color="white" />
              </View>
              <Text style={styles.headerTitle}>Nueva Contraseña</Text>
              <Text style={styles.headerSubtitle}>
                Crea una contraseña segura para tu cuenta
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
              <Text style={styles.formTitle}>Requisitos de seguridad</Text>
              
              {/* Requisitos */}
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#2A9D8F" />
                  <Text style={styles.requirementText}>8 a 16 caracteres</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#2A9D8F" />
                  <Text style={styles.requirementText}>Al menos 1 mayúscula</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#2A9D8F" />
                  <Text style={styles.requirementText}>Al menos 1 número</Text>
                </View>
              </View>

              {/* Nueva Contraseña */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#2A9D8F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={contrasena}
                  onChangeText={verificarContrasena}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                  editable={!loading}
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
                  value={confirmar}
                  onChangeText={verificarConfirmar}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!verConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
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

              {/* Botón de guardar */}
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={cambiarContrasena}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2A9D8F", "#1a7a6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>Guardar Contraseña</Text>
                      <Ionicons name="save" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    paddingTop: 60,
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
    padding: 24,
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
    marginBottom: 16,
    textAlign: "center",
  },
  requirementsContainer: {
    backgroundColor: "#e7f5f3",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  requirementText: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "500",
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
    paddingVertical: 14,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default NuevaPasswordScreen;
