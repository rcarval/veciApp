import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const NuevaPasswordScreen = ({ route, navigation }) => {
  const { correo } = route.params;
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const validarContrasena = (password) => /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password);

  const cambiarContrasena = async () => {
    if (!validarContrasena(contrasena)) {
      Alert.alert("Error", "La contraseña debe tener 8-16 caracteres, una mayúscula y un número.");
      return;
    }
    if (contrasena !== confirmar) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch("http://192.168.18.58:3000/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Tu contraseña ha sido cambiada.");
        navigation.navigate("Login"); // Redirigir al login
      } else {
        Alert.alert("Error", "No se pudo actualizar la contraseña.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  return (
    <LinearGradient colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]} style={styles.container}>
      <Text style={styles.label}>Nueva Contraseña</Text>
      <TextInput style={styles.input} value={contrasena} onChangeText={setContrasena} placeholder="Nueva contraseña" secureTextEntry />
      
      <Text style={styles.label}>Confirmar Contraseña</Text>
      <TextInput style={styles.input} value={confirmar} onChangeText={setConfirmar} placeholder="Confirmar contraseña" secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={cambiarContrasena}>
        <Text style={styles.buttonText}>Guardar Nueva Contraseña</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "left", justifyContent: "top", paddingHorizontal: 30, paddingVertical: 100 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  button: { backgroundColor: "#2A9D8F", padding: 12, borderRadius: 8, width: "100%", alignItems: "center", marginTop:20 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});

export default NuevaPasswordScreen;
