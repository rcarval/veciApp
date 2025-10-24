import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InformacionPersonalScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const usuario = route.params?.usuario ?? {};

  // Estados para los datos del formulario
  const [nombre, setNombre] = useState(usuario.nombre);
  const [telefono, setTelefono] = useState(usuario.telefono);
  const [comuna, setComuna] = useState(usuario.comuna_id.toString());
  
  // Estados para la verificación
  const [modalVisible, setModalVisible] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState(3);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Lista de comunas disponibles
  const comunas = [
    { id: "1", nombre: "Isla de Maipo" },
    { id: "2", nombre: "Talagante" },
  ];

  // Función para enviar código de verificación (simulado)
  const enviarCodigoVerificacion = () => {
    // En una aplicación real, aquí se haría una llamada a tu backend
    // para enviar el SMS con el código de verificación
    
    // Simulamos el envío con un código aleatorio
    const codigoSimulado = Math.floor(1000 + Math.random() * 9000).toString();
    setCodigoEnviado(codigoSimulado);
    setIntentosRestantes(3);
    setTiempoRestante(120); // 2 minutos en segundos
    
    // Mostrar el código en consola para pruebas (eliminar en producción)
    console.log("Código de verificación (solo para pruebas):", codigoSimulado);
    
    // Iniciar cuenta regresiva
    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    Alert.alert(
      "Código enviado",
      "Hemos enviado un código de verificación a tu teléfono."
    );
  };

  // Función para verificar el código
  const verificarCodigo = () => {
    if (codigoVerificacion === codigoEnviado) {
      // Código correcto, proceder a guardar cambios
      guardarCambios();
      setModalVisible(false);
      Alert.alert("Éxito", "Tus datos han sido actualizados correctamente.");
    } else {
      // Código incorrecto
      setIntentosRestantes(intentosRestantes - 1);
      if (intentosRestantes <= 1) {
        Alert.alert(
          "Error",
          "Código incorrecto. No te quedan más intentos. Por favor solicita un nuevo código."
        );
        setModalVisible(false);
      } else {
        Alert.alert(
          "Error",
          `Código incorrecto. Te quedan ${intentosRestantes - 1} intentos.`
        );
      }
    }
  };

  // Función para guardar los cambios (simulada)
  const guardarCambios = async () => {
    try {
      // Aquí normalmente harías una llamada a tu API para actualizar los datos
      const usuarioActualizado = {
        ...usuario,
        nombre,
        telefono,
        comuna_id: parseInt(comuna),
      };
      
      // Actualizar en AsyncStorage
      await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      
      // Navegar de vuelta o mostrar mensaje de éxito
      navigation.goBack();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    }
  };

  // Función para validar si hay cambios
  const hayCambios = () => {
    return (
      nombre !== usuario.nombre ||
      telefono !== usuario.telefono ||
      comuna !== usuario.comuna_id.toString()
    );
  };

  // Función para manejar el guardado
  const manejarGuardado = () => {
    if (!hayCambios()) {
      Alert.alert("Información", "No hay cambios que guardar.");
      return;
    }

    // Si cambió el teléfono, requerimos verificación
    if (telefono !== usuario.telefono) {
      enviarCodigoVerificacion();
      setModalVisible(true);
    } else {
      // Si no cambió el teléfono, guardar directamente
      guardarCambios();
    }
  };

  return (
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Información Personal</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.inputField}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ingresa tu nombre completo"
            />
          </View>

          {/* Campo Teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.inputField}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+56912345678"
              keyboardType="phone-pad"
            />
          </View>

          {/* Campo Comuna */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comuna</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={comuna}
                onValueChange={(itemValue) => setComuna(itemValue)}
                style={styles.picker}
              >
                {comunas.map((comuna) => (
                  <Picker.Item
                    key={comuna.id}
                    label={comuna.nombre}
                    value={comuna.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[
              styles.botonGuardar,
              !hayCambios() && styles.botonGuardarInactivo,
            ]}
            onPress={manejarGuardado}
            disabled={!hayCambios()}
          >
            <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de verificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verificación por SMS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Hemos enviado un código de verificación al número {telefono}.
              Ingresa el código a continuación:
            </Text>

            <TextInput
              style={styles.codigoInput}
              value={codigoVerificacion}
              onChangeText={setCodigoVerificacion}
              placeholder="Código de 4 dígitos"
              keyboardType="number-pad"
              maxLength={4}
            />

            {tiempoRestante > 0 && (
              <Text style={styles.tiempoRestante}>
                Tiempo restante: {Math.floor(tiempoRestante / 60)}:
                {(tiempoRestante % 60).toString().padStart(2, "0")}
              </Text>
            )}

            {tiempoRestante === 0 && (
              <TouchableOpacity
                onPress={enviarCodigoVerificacion}
                style={styles.botonReenviar}
              >
                <Text style={styles.botonReenviarTexto}>Reenviar código</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.botonVerificar}
              onPress={verificarCodigo}
              disabled={codigoVerificacion.length !== 4}
            >
              <Text style={styles.botonVerificarTexto}>Verificar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barra de navegación inferior */}
      <LinearGradient colors={["#2A9D8F", "#1D7874"]} style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Home')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Ofertas")}
        >
          <Ionicons name="pricetag" size={24} color="white" />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Favoritos")}
        >
          <Ionicons name="heart" size={24} color="white" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace("Perfil")}
        >
          <Ionicons name="person" size={24} color="#0b5b52" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginLeft: 10,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 52,
    width: "100%",
  },
  botonGuardar: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  botonGuardarInactivo: {
    backgroundColor: "#ccc",
  },
  botonGuardarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    lineHeight: 24,
  },
  codigoInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  tiempoRestante: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 15,
  },
  botonReenviar: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  botonReenviarTexto: {
    color: "#2A9D8F",
    fontSize: 16,
    fontWeight: "bold",
  },
  botonVerificar: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botonVerificarInactivo: {
    backgroundColor: "#ccc",
  },
  botonVerificarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "100%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopColor: "#e1e1e1",
    backgroundColor: "#2A9D8F",
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
});

export default InformacionPersonalScreen;