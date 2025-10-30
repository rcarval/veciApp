import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { API_ENDPOINTS } from "../config/api";

const NuevaPasswordScreen = ({ route, navigation }) => {
  const { correo } = route.params;
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);

  const validarContrasena = (password) => /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password);

  const cambiarContrasena = async () => {
    if (!contrasena || !confirmar) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    if (!validarContrasena(contrasena)) {
      Alert.alert(
        "Error", 
        "La contraseña debe tener entre 8 y 16 caracteres, incluir al menos una mayúscula, un número y una letra minúscula."
      );
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
        Alert.alert(
          "Éxito", 
          data.mensaje || "Tu contraseña ha sido cambiada correctamente.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
      } else {
        Alert.alert("Error", data.mensaje || data.error || "No se pudo actualizar la contraseña.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]} style={styles.container}>
      <Text style={styles.title}>Nueva Contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu nueva contraseña. Debe tener entre 8 y 16 caracteres, incluir mayúsculas, números y letras minúsculas.
      </Text>

      <Text style={styles.label}>Nueva Contraseña</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          value={contrasena} 
          onChangeText={setContrasena} 
          placeholder="Nueva contraseña" 
          secureTextEntry={!verPassword}
          editable={!loading}
        />
        <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.eyeIcon}>
          <Text style={styles.eyeIconText}>{verPassword ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.label}>Confirmar Contraseña</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          value={confirmar} 
          onChangeText={setConfirmar} 
          placeholder="Confirmar contraseña" 
          secureTextEntry={!verConfirmPassword}
          editable={!loading}
        />
        <TouchableOpacity onPress={() => setVerConfirmPassword(!verConfirmPassword)} style={styles.eyeIcon}>
          <Text style={styles.eyeIconText}>{verConfirmPassword ? "👁️" : "🙈"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={cambiarContrasena}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Guardar Nueva Contraseña</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingHorizontal: 30, 
    paddingVertical: 40 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 10,
    color: "#333",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10
  },
  label: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 5,
    alignSelf: "flex-start",
    width: "100%",
    color: "#333"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 15
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  eyeIcon: {
    marginLeft: 10,
    padding: 5
  },
  eyeIconText: {
    fontSize: 20
  },
  button: { 
    backgroundColor: "#2A9D8F", 
    padding: 14, 
    borderRadius: 8, 
    width: "100%", 
    alignItems: "center", 
    marginTop: 20 
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
});

export default NuevaPasswordScreen;
