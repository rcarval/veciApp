import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
//import { Video } from "expo-av";

const LoginScreen = ({ navigation }) => {
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
    //Test
    if(true){
      const jsonUser = {
        usuario: {
            id: 16,
            nombre: "Rodrigo Alonso Carvallo González ",
            correo: "rodrigocarvallog@gmail.com",
            telefono: "+56994908047",
            tipo_usuario: "admin",
            estado_cuenta: "activa",
            recovery_code: "895920",
            recovery_expiration: "2025-05-14T01:45:08.000Z",
            fecha_registro: "2025-05-12T03:08:55.000Z",
            comuna_id: 1,
            direcciones: [
              { id: 1, nombre: "Casa", direccion: "El Chucao 434", comuna: "Isla de Maipo" },
              { id: 2, nombre: "Trabajo", direccion: "Bario 2141", comuna: "Talagante" },
              { id: 3, nombre: "Otro", direccion: "Pje. Crucero 107", comuna: "Isla de Maipo" }
            ],
            direccionSeleccionada: 1,
            plan_id: null
        },
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYsImlhdCI6MTc0NzIwMDI2OSwiZXhwIjoxNzQ3Mjg2NjY5fQ.J6yMiS4_7phuoZDN6466lEIzuJh00EniPb5EL8IsAeI",
        mensaje: "Inicio de sesión exitoso"
    };
      AsyncStorage.setItem("usuario", JSON.stringify(jsonUser.usuario));
      await AsyncStorage.setItem("token", jsonUser.token);
      await AsyncStorage.setItem("sesionActiva", "true"); // Marcar sesión como activa
      console.log("✅ Login exitoso - sesionActiva marcada como true");
      navigation.navigate("HomeDrawer");
    }else{
      try {
        const response = await fetch("http://192.168.18.58:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contrasena }),
        });
        const data = await response.json();
        if (response.ok) {
          await AsyncStorage.setItem("usuario", JSON.stringify(data.usuario));
          await AsyncStorage.setItem("token", data.token);
          await AsyncStorage.setItem("sesionActiva", "true"); // Marcar sesión como activa
          console.log("✅ Login exitoso (API) - sesionActiva marcada como true");
          navigation.navigate("HomeDrawer");
        } else {
          Alert.alert("Error", data.mensaje || "Credenciales incorrectas");
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo conectar al servidor.");
        console.log("No se pudo conectar al servidor: ", error);
      }
    }


    setLoading(false);
  };

  return (
    <LinearGradient
      colors={["#ffffff", "#ffffff", "#0b8e0d"]}
      style={styles.container}
    >
      <Modal visible={loading} transparent={true} animationType="fade">

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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 🔥 Fondo semi-transparente
  },
});

export default LoginScreen;
