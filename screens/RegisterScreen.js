import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [confirmarCorreo, setConfirmarCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comuna, setComuna] = useState("1"); // Combo temporal
  const [tipoUsuario, setTipoUsuario] = useState("vecino");
  const [nivelSeguridad, setNivelSeguridad] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);

  // 🔥 Verifica si el correo ingresado es válido y coincide con la confirmación
  const verificarCorreo = (text) => {
    setCorreo(text);
    setErrorCorreo(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? text !== confirmarCorreo
          ? "Los correos no coinciden"
          : ""
        : "Ingresa un correo válido"
    );
  };

  // 🔥 Verifica si el correo de confirmación coincide con el original
  const verificarConfirmarCorreo = (text) => {
    setConfirmarCorreo(text);
    setErrorCorreo(text !== correo ? "Los correos no coinciden" : "");
  };

  // 🔥 Verifica si la contraseña es segura y coincide con la confirmación
  const verificarContrasena = (text) => {
    setContrasena(text);
    setErrorContrasena(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(text)
        ? text !== confirmarContrasena
          ? "Las contraseñas no coinciden"
          : ""
        : "La contraseña debe tener entre 8 y 16 caracteres, incluir al menos una mayúscula, un número y una letra"
    );
  };

  // 🔥 Verifica si la confirmación de contraseña es correcta
  const verificarConfirmarContrasena = (text) => {
    setConfirmarContrasena(text);
    setErrorContrasena(
      text !== contrasena ? "Las contraseñas no coinciden" : ""
    );
  };

  const validarCorreo = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarTelefono = (numero) => /^\+56\d{9}$/.test(numero);
  const validarContrasena = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password);

  const evaluarSeguridad = (password) => {
    if (password.length < 8) return "Débil";
    if (/^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,16}$/.test(password))
      return "Fuerte";
    return "Moderada";
  };
  const handleRegister = async () => {
    console.log(correo);
    if (
      !nombre ||
      !correo ||
      !confirmarCorreo ||
      !contrasena ||
      !confirmarContrasena ||
      !telefono
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    if (!validarCorreo(correo)) {
      Alert.alert("Error", "Ingresa un correo válido.");
      return;
    }
    if (correo !== confirmarCorreo) {
      Alert.alert("Error", "Los correos no coinciden.");
      return;
    }
    if (!validarTelefono(telefono)) {
      Alert.alert(
        "Error",
        "Ingresa un número de teléfono válido (+56XXXXXXXXX)."
      );
      return;
    }
    if (!validarContrasena(contrasena)) {
      Alert.alert(
        "Error",
        "La contraseña debe tener entre 8 y 16 caracteres, con al menos una mayúscula, además de números y letras."
      );
      return;
    }
    if (contrasena !== confirmarContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    console.log("Correo antes de envío:", correo);
    console.log(
      "JSON.stringify antes de envío:",
      JSON.stringify({
        nombre,
        correo,
        contrasena,
        telefono,
        comuna_id: comuna,
        tipo_usuario: tipoUsuario,
      })
    );
    try {
      const response = await fetch(
        "http://192.168.18.58:3000/api/auth/registro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            nombre,
            correo,
            contrasena,
            telefono,
            comuna_id: comuna,
            tipo_usuario: tipoUsuario,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Registro exitoso",
          `Revisa tu correo para activar tu cuenta.`
        );
        navigation.navigate("Login"); // Redirige al login
      } else {
        Alert.alert(
          "Error",
          data.mensaje || "No se pudo completar el registro."
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar al servidor." + error);
      console.log("Error de conexión:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <LinearGradient
        colors={["#d5fdfa", "#edeeb7", "#0b8e0d"]}
        style={styles.container}
      >
        <Text style={styles.title}>Registro en Marketplace</Text>

        {/* 🔥 Nombre Completo */}
        <View style={styles.inputBox}>
          <FontAwesome name="user" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
          />
        </View>

        {/* 🔥 Correo */}
        <View style={styles.inputBox}>
          <FontAwesome name="envelope" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={verificarCorreo}
            placeholder="Tu correo"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errorCorreo ? (
          <Text style={styles.errorTexto}>
            <FontAwesome name="times-circle" size={14} color="red" />{" "}
            {errorCorreo}
          </Text>
        ) : null}

        {/* 🔥 Confirmar Correo */}
        <View style={styles.inputBox}>
          <FontAwesome name="envelope" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={confirmarCorreo}
            onChangeText={verificarConfirmarCorreo}
            placeholder="Confirma tu correo"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* 🔥 Contraseña */}
        <View style={styles.inputBox}>
          <FontAwesome name="lock" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={contrasena}
            onChangeText={verificarContrasena}
            placeholder="Contraseña"
            secureTextEntry={!verPassword}
          />
          <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
            <FontAwesome
              name={verPassword ? "eye" : "eye-slash"}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        {errorContrasena ? (
          <Text style={styles.errorTexto}>
            <FontAwesome name="times-circle" size={14} color="red" />{" "}
            {errorContrasena}
          </Text>
        ) : null}

        {/* 🔥 Confirmar Contraseña */}
        <View style={styles.inputBox}>
          <FontAwesome name="lock" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={confirmarContrasena}
            onChangeText={verificarConfirmarContrasena}
            placeholder="Confirma tu contraseña"
            secureTextEntry={!verConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setVerConfirmPassword(!verConfirmPassword)}
          >
            <FontAwesome
              name={verConfirmPassword ? "eye" : "eye-slash"}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        {/* 🔥 Teléfono */}
        <View style={styles.inputBox}>
          <FontAwesome name="phone" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+56XXXXXXXXX"
            keyboardType="phone-pad"
          />
        </View>

        {/* 🔥 Objetivo (Picker mejorado) */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={tipoUsuario}
            onValueChange={(itemValue) => setTipoUsuario(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Solo Comprar" value="vecino" />
            <Picker.Item label="Comprar y Vender" value="emprendedor" />
          </Picker>
        </View>

        {/* 🔥 Comuna (Picker mejorado) */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={comuna}
            onValueChange={(itemValue) => setComuna(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Isla de Maipo" value="1" />
            <Picker.Item label="Talagante" value="2" />
          </Picker>
        </View>

        {/* 🔥 Botón de registro */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 20 },
  label: {
    alignSelf: "flex-start",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
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
  pickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12, // 🔥 Bordes redondeados más suaves
    paddingHorizontal: 8,
    width: "85%",
    paddingVertical: 0,
    marginVertical: 10,
    elevation: 4, // 🔥 Sombra para destacar
    height: "5%",
    justifyContent: "center",
  },

  picker: {
    width: "100%",
    color: "#333", // 🔥 Mejor contraste
    fontSize: 14, // 🔥 Ajuste de tamaño para mejor lectura
  },

  errorTexto: {
    color: "red",
    fontSize: 14,
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
    width: "85%",
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  loginLink: { marginTop: 15 },
  loginText: { color: "#2c7edb", fontSize: 16, fontWeight: "600" },
  scrollContainer: {
    flexGrow: 1, // Espacio extra para evitar que el último elemento quede pegado abajo
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginVertical: 10,
  },
  inputPass: {
    flex: 1,
    paddingVertical: 12,
  },
  icon: {
    marginLeft: 10,
  },
});

export default RegisterScreen;
