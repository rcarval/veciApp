import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const VerificarCodigoScreen = ({ route, navigation }) => {
  const { correo } = route.params;
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const inputsRef = Array.from({ length: 6 }, () => useRef(null));
  const [contador, setContador] = useState(30);
  const [puedeReenviar, setPuedeReenviar] = useState(false);

  // 🕒 **Iniciar contador de 30 segundos**
  useEffect(() => {
    if (contador > 0) {
      const timer = setInterval(() => setContador((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setPuedeReenviar(true);
    }
  }, [contador]);

  // 🔄 **Manejar cambios en los inputs**
  const manejarCambio = (text, index) => {
    if (text.length > 1) text = text[0]; // Limitar a un solo dígito
    const nuevoCodigo = [...codigo];
    nuevoCodigo[index] = text;
    setCodigo(nuevoCodigo);

    // ✅ Avanzar al siguiente input
    if (text && index < 5) inputsRef[index + 1].current.focus();

    // ✅ Retroceder al anterior si borra
    if (!text && index > 0) inputsRef[index - 1].current.focus();
  };

  // 🔄 **Detectar tecla "Backspace" para retroceder**
  const manejarBorrar = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef[index - 1].current.focus();
    }
  };

  // ✅ **Enviar el código al backend**
  const verificarCodigo = async () => {
    const codigoFinal = codigo.join("");
    if (codigoFinal.length !== 6) {
      Alert.alert("Error", "Debes ingresar los 6 dígitos.");
      return;
    }

    try {
      const response = await fetch("http://192.168.18.58:3000/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, codigo: codigoFinal }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate("NuevaPassword", { correo });
      } else {
        Alert.alert("Error", "Código inválido o expirado.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor.");
    }
  };

  // 🔄 **Reenviar código tras 30 segundos**
  const reenviarCodigo = async () => {
    try {
      await fetch("http://192.168.18.58:3000/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      setContador(30);
      setPuedeReenviar(false);
      Alert.alert("Código reenviado", "Revisa tu correo.");
    } catch (error) {
      Alert.alert("Error", "No se pudo reenviar el código.");
    }
  };

  return (
    <LinearGradient colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]} style={styles.container}>
      <Text style={styles.title}>Verificar Código</Text>
      <Text style={styles.label}>Código de 6 dígitos. Expira en 3 minutos</Text>

      <View style={styles.inputContainer}>
        {codigo.map((digito, index) => (
          <TextInput
            key={index}
            ref={inputsRef[index]}
            style={styles.input}
            value={digito}
            onChangeText={(text) => manejarCambio(text, index)}
            onKeyPress={(event) => manejarBorrar(event, index)}
            keyboardType="numeric"
            maxLength={1}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={verificarCodigo}>
        <Text style={styles.buttonText}>Verificar</Text>
      </TouchableOpacity>

      {/* 🕒 **Contador y botón de reenviar código** */}
      <Text style={styles.contador}>
        {puedeReenviar ? "¿No recibiste el código?" : `Reenviar en ${contador}s`}
      </Text>

      <TouchableOpacity
        style={[styles.reenviarButton, !puedeReenviar && styles.reenviarDisabled]}
        onPress={reenviarCodigo}
        disabled={!puedeReenviar}
      >
        <Text style={styles.reenviarButtonText}>Reenviar Código</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "top", paddingHorizontal: 30, paddingVertical:60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 10 },

  inputContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  input: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 20,
    marginHorizontal: 5,
  },

  button: { backgroundColor: "#2A9D8F", padding: 12, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },

  contador: { fontSize: 16, marginTop: 20, color: "#777" },

  reenviarButton: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: "#F18F01", alignItems: "center" },
  reenviarButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  reenviarDisabled: { backgroundColor: "#ccc" },
});

export default VerificarCodigoScreen;
