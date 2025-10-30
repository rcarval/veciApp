import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
//import { Video } from "expo-av";

const LoginScreen = ({ navigation }) => {
  // Usar useUser solo cuando sea necesario, no en cada render
  const userContext = useUser();
  const cargarUsuario = userContext?.cargarUsuario;
  const limpiarCacheCompleto = userContext?.limpiarCacheCompleto;
  
  const [correo, setCorreo] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert("Error", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);

    try {
      // Llamada al nuevo backend VeciApp-Backend
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
        // Guardar token
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("sesionActiva", "true");
        
        console.log("✅ Login exitoso - Guardando datos...");
        
        // Limpiar cache completo y cargar usuario en el contexto
        if (limpiarCacheCompleto) {
          console.log("🧹 Limpiando cache completo...");
          await limpiarCacheCompleto();
        }
        
        try {
          console.log("🔄 Cargando usuario en contexto...");
          await cargarUsuario(true); // Forzar recarga después del login
          console.log("✅ Usuario cargado en contexto exitosamente");
        } catch (error) {
          console.error("❌ Error al cargar usuario en contexto:", error);
          // Continuar de todas formas, HomeScreen intentará cargar
        }
        
        console.log("✅ Navegando a Home...");
        navigation.navigate("Home");
      } else {
        // Manejar errores del backend
        const mensajeError = data.mensaje || data.error || "Credenciales incorrectas";
        Alert.alert("Error", mensajeError);
        console.log("Error en login:", data);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      Alert.alert(
        "Error de conexión", 
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté ejecutándose."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#ffffff", "#ffffff", "#0b8e0d"]}
      style={styles.container}
    >
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#2A9D8F" />
          <Text style={styles.loadingText}>Iniciando sesión...</Text>
        </View>
      </Modal>
      <Text style={styles.title}>Bienvenidos a</Text>
      <Image source={require("../assets/welcome.png")} style={styles.logo} />

      <View style={styles.inputBox}>
        <FontAwesome name="envelope" size={20} color="#555" />
        <TextInput
          value={correo}
          onChangeText={setCorreo}
          placeholder="Correo Electrónico"
          style={styles.input}
          keyboardType="email-address"
          autoCompleteType="email"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputBox}>
        <FontAwesome name="lock" size={20} color="#555" />
        <TextInput
          style={styles.input}
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="Contraseña"
          secureTextEntry={!verPassword}
          autoCompleteType="password"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
          <FontAwesome
            name={verPassword ? "eye" : "eye-slash"}
            size={22}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("RecuperarPassword")}
        style={styles.link}
      >
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={styles.link}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "top",
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2A9D8F",
    marginTop: 120,
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginVertical: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
    marginTop: 20,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
  },
  linkText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingGif: {
    width: 150,
    height: 150,
    marginTop: 10,
    borderRadius: 100,
  },
  modalContainer: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingText: {
    marginTop: 15,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;
