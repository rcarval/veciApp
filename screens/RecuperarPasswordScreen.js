import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { API_ENDPOINTS } from "../config/api";

const RecuperarPasswordScreen = ({ navigation }) => {
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);

  const enviarCodigo = async () => {
    if (!correo) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    // Validar formato de correo básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido.");
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
          data.mensaje || "Si el correo existe en nuestro sistema, recibirás un código de recuperación en los próximos minutos.",
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
      console.error("Error de conexión:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
      );
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]} style={styles.container}>
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#2A9D8F" />
          <Text style={styles.loadingText}>Enviando código...</Text>
        </View>
      </Modal>

      <Text style={styles.title}>Recuperar Contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu correo electrónico y te enviaremos un código de recuperación
      </Text>

      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput 
        style={styles.input} 
        value={correo} 
        onChangeText={setCorreo} 
        placeholder="tu@correo.com" 
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={enviarCodigo}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Enviar Código</Text>
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
    paddingVertical: 60 
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
    paddingHorizontal: 20
  },
  label: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 5,
    alignSelf: "flex-start",
    width: "100%",
    color: "#333"
  },
  input: { 
    width: "100%", 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    backgroundColor: "#fff", 
    marginBottom: 20,
    fontSize: 16
  },
  button: { 
    backgroundColor: "#2A9D8F", 
    padding: 14, 
    borderRadius: 8, 
    width: "100%", 
    alignItems: "center",
    marginTop: 10
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 15,
    fontSize: 16
  },
});

export default RecuperarPasswordScreen;
