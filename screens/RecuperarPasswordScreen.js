import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
//import { Video } from "expo-av";

const RecuperarPasswordScreen = ({ navigation }) => {
  const [correo, setCorreo] = useState("");
const [loading, setLoading] = useState(false);
  const enviarCodigo = async () => {
    if (!correo) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://192.168.18.58:3000/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        navigation.navigate("VerificarCodigo", { correo });
      } else {
        Alert.alert("Error", data.mensaje || "Correo no registrado.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  return (
    <LinearGradient colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]} style={styles.container}>
      <Modal visible={loading} transparent={true} animationType="fade">

</Modal>
      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="Ingresa tu correo" autoCapitalize="none" />
      <TouchableOpacity style={styles.button} onPress={enviarCodigo}>
        <Text style={styles.buttonText}>Enviar Código</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "top", paddingHorizontal: 30, paddingVertical:60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: { width: "100%", padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#fff", marginBottom: 10 },
  button: { backgroundColor: "#2A9D8F", padding: 12, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  loadingGif: {
    width: 150,
    height: 150,
    marginTop: 10,
    borderRadius: 100
  },
  modalContainer: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 🔥 Fondo semi-transparente
  },
});

export default RecuperarPasswordScreen;
