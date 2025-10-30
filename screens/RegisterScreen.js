import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_ENDPOINTS } from "../config/api";

const RegisterScreen = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [confirmarCorreo, setConfirmarCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comuna, setComuna] = useState("");
  const [comunas, setComunas] = useState([]);
  const [cargandoComunas, setCargandoComunas] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState("cliente");
  const [nivelSeguridad, setNivelSeguridad] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Cargar comunas desde el backend
  useEffect(() => {
    const cargarComunas = async () => {
      try {
        setCargandoComunas(true);
        const response = await fetch(API_ENDPOINTS.COMUNAS);
        const data = await response.json();
        
        if (response.ok && data.comunas) {
          setComunas(data.comunas);
          // Seleccionar la primera comuna por defecto si hay comunas
          if (data.comunas.length > 0) {
            setComuna(data.comunas[0].id.toString());
          }
        } else {
          console.error('Error al cargar comunas:', data);
          // Fallback a comunas hardcodeadas si falla la API
          setComunas([
            { id: 1, nombre: 'Isla de Maipo' },
            { id: 2, nombre: 'Talagante' }
          ]);
          setComuna('1');
        }
      } catch (error) {
        console.error('Error de conexión al cargar comunas:', error);
        // Fallback a comunas hardcodeadas
        setComunas([
          { id: 1, nombre: 'Isla de Maipo' },
          { id: 2, nombre: 'Talagante' }
        ]);
        setComuna('1');
      } finally {
        setCargandoComunas(false);
      }
    };

    cargarComunas();
  }, []);

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
    setLoading(true);

    try {
      // Preparar datos para envío
      const datosRegistro = {
        nombre,
        correo: correo.toLowerCase(),
        contrasena,
        telefono,
        tipo_usuario: tipoUsuario === 'vecino' ? 'cliente' : tipoUsuario, // Mapear vecino -> cliente
      };

      // Agregar comuna_id solo si se seleccionó una comuna
      if (comuna) {
        datosRegistro.comuna_id = parseInt(comuna);
      }

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(datosRegistro),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Registro exitoso",
          data.mensaje || "Tu cuenta ha sido creada exitosamente. ¡Bienvenido a VeciApp!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
      } else {
        const mensajeError = data.mensaje || data.error || "No se pudo completar el registro.";
        Alert.alert("Error", mensajeError);
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
            <Picker.Item label="Solo Comprar" value="cliente" />
            <Picker.Item label="Comprar y Vender" value="emprendedor" />
          </Picker>
        </View>

        {/* 🔥 Comuna (Picker mejorado - cargado desde API) */}
        <View style={styles.pickerContainer}>
          {cargandoComunas ? (
            <View style={styles.loadingComunas}>
              <ActivityIndicator size="small" color="#2A9D8F" />
              <Text style={styles.loadingText}>Cargando comunas...</Text>
            </View>
          ) : (
            <Picker
              selectedValue={comuna}
              onValueChange={(itemValue) => setComuna(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona una comuna" value="" />
              {comunas.map((comunaItem) => (
                <Picker.Item
                  key={comunaItem.id}
                  label={comunaItem.nombre}
                  value={comunaItem.id.toString()}
                />
              ))}
            </Picker>
          )}
        </View>

        {/* 🔥 Botón de registro */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading || cargandoComunas}
        >
          {loading ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.buttonText}>Registrando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
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
  loadingComunas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RegisterScreen;
