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
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const InformacionPersonalScreen = () => {
  const navigation = useNavigation();
  const { invalidarUsuario, cargarUsuario } = useUser();
  const { currentTheme } = useTheme();

  // Estados para los datos del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comuna, setComuna] = useState("");
  const [comunas, setComunas] = useState([]);
  const [cargandoComunas, setCargandoComunas] = useState(true);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [usuarioOriginal, setUsuarioOriginal] = useState(null);
  
  // Estados para la verificación
  const [modalVisible, setModalVisible] = useState(false);
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState(3);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Cargar datos del usuario desde el backend
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setCargandoUsuario(true);
        const token = await AsyncStorage.getItem("token");
        
        if (!token) {
          Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
          navigation.navigate("Login");
          return;
        }

        const response = await fetch(API_ENDPOINTS.PERFIL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setNombre(data.nombre || "");
          setTelefono(data.telefono || "");
          setComuna(data.comuna_id ? data.comuna_id.toString() : "");
          setUsuarioOriginal({
            nombre: data.nombre || "",
            telefono: data.telefono || "",
            comuna_id: data.comuna_id || null,
          });
        } else {
          Alert.alert("Error", data.mensaje || data.error || "No se pudo cargar tu información.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        Alert.alert("Error", "No se pudo conectar al servidor.");
        navigation.goBack();
      } finally {
        setCargandoUsuario(false);
      }
    };

    // Cargar comunas desde el backend
    const cargarComunas = async () => {
      try {
        setCargandoComunas(true);
        const response = await fetch(API_ENDPOINTS.COMUNAS);
        const data = await response.json();
        
        if (response.ok && data.comunas) {
          setComunas(data.comunas);
        } else {
          // Fallback a comunas hardcodeadas
          setComunas([
            { id: 1, nombre: "Isla de Maipo" },
            { id: 2, nombre: "Talagante" },
          ]);
        }
      } catch (error) {
        console.error("Error al cargar comunas:", error);
        // Fallback a comunas hardcodeadas
        setComunas([
          { id: 1, nombre: "Isla de Maipo" },
          { id: 2, nombre: "Talagante" },
        ]);
      } finally {
        setCargandoComunas(false);
      }
    };

    cargarUsuario();
    cargarComunas();
  }, []);

  // Función para enviar código de verificación (simulado por ahora)
  const enviarCodigoVerificacion = () => {
    // TODO: Implementar envío real de SMS cuando se tenga servicio SMS
    // Por ahora simulamos el envío con un código aleatorio
    const codigoSimulado = Math.floor(1000 + Math.random() * 9000).toString();
    setCodigoEnviado(codigoSimulado);
    setIntentosRestantes(3);
    setTiempoRestante(120); // 2 minutos en segundos
    
    // Mostrar el código en consola para pruebas
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

  // Función para guardar los cambios en el backend
  const guardarCambios = async () => {
    try {
      setGuardando(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
        navigation.navigate("Login");
        return;
      }

      const datosActualizar = {
        nombre,
        telefono: telefono || null,
        comuna_id: comuna ? parseInt(comuna) : null,
      };
      
      console.log('📤 Actualizando perfil:', JSON.stringify(datosActualizar, null, 2));

      const response = await fetch(API_ENDPOINTS.ACTUALIZAR_PERFIL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(datosActualizar),
      });

      const data = await response.json();
      console.log('📥 Respuesta actualización:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('✅ Perfil actualizado exitosamente');
        // Actualizar token en AsyncStorage si el backend lo devuelve
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }

        // Invalidar cache y recargar usuario en el contexto
        invalidarUsuario();
        await cargarUsuario(true); // Forzar recarga para obtener datos actualizados

        Alert.alert("Éxito", data.mensaje || "Tus datos han sido actualizados correctamente.");
        navigation.goBack();
      } else {
        console.log('❌ Error actualizando perfil:', data.error || data.mensaje);
        Alert.alert("Error", data.mensaje || data.error || "No se pudieron guardar los cambios.");
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Función para validar si hay cambios
  const hayCambios = () => {
    if (!usuarioOriginal) return false;
    
    const comunaActual = comuna || "";
    const comunaOriginal = usuarioOriginal.comuna_id ? usuarioOriginal.comuna_id.toString() : "";
    
    return (
      nombre !== usuarioOriginal.nombre ||
      telefono !== (usuarioOriginal.telefono || "") ||
      comunaActual !== comunaOriginal
    );
  };

  // Función para manejar el guardado
  const manejarGuardado = () => {
    if (!hayCambios()) {
      Alert.alert("Información", "No hay cambios que guardar.");
      return;
    }

    // Si cambió el teléfono, requerimos verificación
    if (usuarioOriginal && telefono !== (usuarioOriginal.telefono || "")) {
      enviarCodigoVerificacion();
      setModalVisible(true);
    } else {
      // Si no cambió el teléfono, guardar directamente
      guardarCambios();
    }
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Información Personal</Text>
        </View>
      </LinearGradient>

      {cargandoUsuario ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A9D8F" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre Completo</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ingresa tu nombre completo"
                editable={!guardando}
              />
            </View>

            {/* Campo Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Teléfono</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="+56912345678"
                keyboardType="phone-pad"
                editable={!guardando}
              />
            </View>

            {/* Campo Comuna */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Comuna</Text>
              <View style={[styles.pickerWrapper, { borderColor: currentTheme.border }]}>
                {cargandoComunas ? (
                  <View style={styles.loadingComunas}>
                    <ActivityIndicator size="small" color={currentTheme.primary} />
                    <Text style={[styles.loadingComunasText, { color: currentTheme.textSecondary }]}>Cargando comunas...</Text>
                  </View>
                ) : (
                  <Picker
                    selectedValue={comuna}
                    onValueChange={(itemValue) => setComuna(itemValue)}
                    style={[styles.picker, { color: currentTheme.text }]}
                    enabled={!guardando}
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
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[
                styles.botonGuardar,
                { backgroundColor: currentTheme.primary },
                (!hayCambios() || guardando) && styles.botonGuardarInactivo,
              ]}
              onPress={manejarGuardado}
              disabled={!hayCambios() || guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

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
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Verificación por SMS</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalText, { color: currentTheme.textSecondary }]}>
              Hemos enviado un código de verificación al número {telefono}.
              Ingresa el código a continuación:
            </Text>

            <TextInput
              style={[styles.codigoInput, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={codigoVerificacion}
              onChangeText={setCodigoVerificacion}
              placeholder="Código de 4 dígitos"
              keyboardType="number-pad"
              maxLength={4}
            />

            {tiempoRestante > 0 && (
              <Text style={[styles.tiempoRestante, { color: currentTheme.textSecondary }]}>
                Tiempo restante: {Math.floor(tiempoRestante / 60)}:
                {(tiempoRestante % 60).toString().padStart(2, "0")}
              </Text>
            )}

            {tiempoRestante === 0 && (
              <TouchableOpacity
                onPress={enviarCodigoVerificacion}
                style={styles.botonReenviar}
              >
                <Text style={[styles.botonReenviarTexto, { color: currentTheme.primary }]}>Reenviar código</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.botonVerificar, { backgroundColor: currentTheme.primary }]}
              onPress={verificarCodigo}
              disabled={codigoVerificacion.length !== 4}
            >
              <Text style={styles.botonVerificarTexto}>Verificar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barra de navegación inferior */}
      <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={[styles.tabBar, { borderTopColor: currentTheme.border, backgroundColor: currentTheme.primary }]}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  loadingComunas: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  loadingComunasText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
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