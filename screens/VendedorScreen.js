import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_ENDPOINTS } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import LoadingVeciApp from "../components/LoadingVeciApp";

const VendedorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const emprendimiento = route.params?.emprendimiento ?? {};
  
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoVendedor, setCargandoVendedor] = useState(true);
  const [vendedorExistente, setVendedorExistente] = useState(null);
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmPassword, setVerConfirmPassword] = useState(false);

  useEffect(() => {
    cargarVendedorExistente();
  }, []);

  const cargarVendedorExistente = async () => {
    try {
      setCargandoVendedor(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        navigation.goBack();
        return;
      }

      const response = await fetch(API_ENDPOINTS.OBTENER_VENDEDOR(emprendimiento.id), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        if (data.vendedor) {
          setVendedorExistente(data.vendedor);
          setNombre(data.vendedor.nombre);
          setCorreo(data.vendedor.correo);
        }
      } else {
        console.log("No hay vendedor existente");
      }
    } catch (error) {
      console.error("Error al cargar vendedor:", error);
      Alert.alert("Error", "No se pudo cargar el vendedor existente");
    } finally {
      setCargandoVendedor(false);
    }
  };

  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del vendedor");
      return false;
    }
    if (!correo.trim()) {
      Alert.alert("Error", "Por favor ingresa el correo del vendedor");
      return false;
    }
    if (!correo.includes("@") || !correo.includes(".")) {
      Alert.alert("Error", "Por favor ingresa un correo válido");
      return false;
    }
    if (contrasena.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (contrasena !== confirmarContrasena) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const crearVendedor = async () => {
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const response = await fetch(API_ENDPOINTS.CREAR_VENDEDOR(emprendimiento.id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre,
          correo,
          contrasena,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        Alert.alert(
          "✅ Vendedor Creado",
          `El vendedor ha sido creado exitosamente.\n\n📧 Se ha enviado un correo de activación a:\n${correo}\n\n⚠️ El vendedor debe activar su cuenta haciendo clic en el enlace del correo antes de poder iniciar sesión.`,
          [
            {
              text: "Entendido",
              onPress: () => {
                setNombre("");
                setCorreo("");
                setContrasena("");
                setConfirmarContrasena("");
                cargarVendedorExistente();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", data.error || "No se pudo crear el vendedor");
      }
    } catch (error) {
      console.error("Error al crear vendedor:", error);
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  const eliminarVendedor = () => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este vendedor? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              
              if (!token) {
                Alert.alert("Error", "No hay sesión activa");
                return;
              }

              const response = await fetch(API_ENDPOINTS.ELIMINAR_VENDEDOR(emprendimiento.id), {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok && data.ok) {
                Alert.alert("Éxito", "Vendedor eliminado correctamente");
                setVendedorExistente(null);
                setNombre("");
                setCorreo("");
                setContrasena("");
                setConfirmarContrasena("");
              } else {
                Alert.alert("Error", data.error || "No se pudo eliminar el vendedor");
              }
            } catch (error) {
              console.error("Error al eliminar vendedor:", error);
              Alert.alert("Error", "No se pudo conectar al servidor");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButtonModerno}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleWrapper}>
            <View style={styles.iconoBadge}>
              <Ionicons name="people" size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.headerTextos}>
              <Text style={styles.headerSubtitulo}>Gestión de</Text>
              <Text style={styles.headerTitulo} numberOfLines={1}>
                Vendedor
              </Text>
            </View>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {cargandoVendedor ? (
          <View style={styles.loadingContainer}>
            <LoadingVeciApp size={120} color={currentTheme.primary} />
            <Text style={[styles.loadingTexto, { color: currentTheme.text, marginTop: 30 }]}>
              Cargando información...
            </Text>
          </View>
        ) : vendedorExistente ? (
          <>
            {/* Vista de vendedor existente */}
            <View style={[styles.infoCardModerna, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <LinearGradient
                colors={['#27ae6015', 'transparent']}
                style={styles.infoCardGradiente}
              >
                <View style={styles.infoHeaderModerno}>
                  <View style={[
                    styles.checkIconCircle, 
                    { backgroundColor: vendedorExistente.estado === 'activo' ? '#27ae60' : '#f39c12' }
                  ]}>
                    <Ionicons 
                      name={vendedorExistente.estado === 'activo' ? "checkmark-circle" : "time"} 
                      size={40} 
                      color="white" 
                    />
                  </View>
                  <Text style={[styles.infoTitleModerno, { color: currentTheme.text }]}>
                    {vendedorExistente.estado === 'activo' ? 'Vendedor Activo' : 'Vendedor Pendiente'}
                  </Text>
                  <Text style={[styles.infoSubtitle, { color: currentTheme.textSecondary }]}>
                    {vendedorExistente.estado === 'activo' 
                      ? 'Tu emprendimiento cuenta con un vendedor activo'
                      : 'El vendedor debe activar su cuenta por correo electrónico'}
                  </Text>
                  
                  {/* Badge de estado */}
                  <View style={[
                    styles.estadoBadge,
                    { backgroundColor: vendedorExistente.estado === 'activo' ? '#27ae6020' : '#f39c1220' }
                  ]}>
                    <Ionicons 
                      name={vendedorExistente.estado === 'activo' ? 'checkmark-circle' : 'alert-circle'} 
                      size={14} 
                      color={vendedorExistente.estado === 'activo' ? '#27ae60' : '#f39c12'} 
                    />
                    <Text style={[
                      styles.estadoBadgeTexto,
                      { color: vendedorExistente.estado === 'activo' ? '#27ae60' : '#f39c12' }
                    ]}>
                      {vendedorExistente.estado === 'activo' ? 'CUENTA ACTIVADA' : 'PENDIENTE DE ACTIVACIÓN'}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.vendedorDetalles, { backgroundColor: currentTheme.background }]}>
                  <View style={styles.infoItemModerno}>
                    <View style={[styles.infoIconCircle, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="person" size={20} color={currentTheme.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Nombre</Text>
                      <Text style={[styles.infoValue, { color: currentTheme.text }]}>
                        {vendedorExistente.nombre}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItemModerno}>
                    <View style={[styles.infoIconCircle, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="mail" size={20} color={currentTheme.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Correo</Text>
                      <Text style={[styles.infoValue, { color: currentTheme.text }]}>
                        {vendedorExistente.correo}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItemModerno}>
                    <View style={[styles.infoIconCircle, { backgroundColor: currentTheme.primary + '15' }]}>
                      <Ionicons name="storefront" size={20} color={currentTheme.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Emprendimiento</Text>
                      <Text style={[styles.infoValue, { color: currentTheme.text }]}>
                        {emprendimiento.nombre}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.advertenciaModerna, { backgroundColor: '#fff3cd', borderColor: '#ffc107' }]}>
                  <Ionicons name="alert-circle" size={20} color="#856404" />
                  <Text style={[styles.advertenciaTextoModerno, { color: '#856404' }]}>
                    Este vendedor podrá gestionar todos los pedidos de este emprendimiento
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.deleteButtonModerno}
              onPress={eliminarVendedor}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#e74c3c', '#c0392b']}
                style={styles.deleteButtonGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.deleteButtonTextModerno}>Eliminar Vendedor</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Formulario para crear vendedor */}
            <View style={[styles.formCardModerna, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <View style={styles.formHeaderModerno}>
                <View style={[styles.formIconCircle, { backgroundColor: currentTheme.primary }]}>
                  <Ionicons name="person-add" size={28} color="white" />
                </View>
                <Text style={[styles.formTitleModerno, { color: currentTheme.text }]}>
                  Crear Nuevo Vendedor
                </Text>
                <Text style={[styles.formSubtitleModerno, { color: currentTheme.textSecondary }]}>
                  El vendedor tendrá acceso solo a gestionar pedidos de:
                </Text>
                <View style={[styles.emprendimientoBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                  <Ionicons name="storefront" size={16} color={currentTheme.primary} />
                  <Text style={[styles.emprendimientoNombre, { color: currentTheme.primary }]}>
                    {emprendimiento.nombre}
                  </Text>
                </View>
              </View>

              <View style={styles.formBodyModerno}>
                <View style={styles.inputGroupModerno}>
                  <View style={styles.labelConIcono}>
                    <Ionicons name="person" size={14} color={currentTheme.primary} />
                    <Text style={[styles.inputLabelModerno, { color: currentTheme.text }]}>
                      Nombre Completo*
                    </Text>
                  </View>
                  <View style={[styles.inputContainerModerno, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                    <Ionicons name="person-outline" size={20} color={currentTheme.primary} />
                    <TextInput
                      style={[styles.inputModerno, { color: currentTheme.text }]}
                      placeholder="Ej: Juan Pérez"
                      placeholderTextColor={currentTheme.textSecondary}
                      value={nombre}
                      onChangeText={setNombre}
                    />
                  </View>
                </View>

                <View style={styles.inputGroupModerno}>
                  <View style={styles.labelConIcono}>
                    <Ionicons name="mail" size={14} color={currentTheme.primary} />
                    <Text style={[styles.inputLabelModerno, { color: currentTheme.text }]}>
                      Correo Electrónico*
                    </Text>
                  </View>
                  <View style={[styles.inputContainerModerno, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                    <Ionicons name="mail-outline" size={20} color={currentTheme.primary} />
                    <TextInput
                      style={[styles.inputModerno, { color: currentTheme.text }]}
                      placeholder="vendedor@ejemplo.com"
                      placeholderTextColor={currentTheme.textSecondary}
                      value={correo}
                      onChangeText={setCorreo}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroupModerno}>
                  <View style={styles.labelConIcono}>
                    <Ionicons name="lock-closed" size={14} color={currentTheme.primary} />
                    <Text style={[styles.inputLabelModerno, { color: currentTheme.text }]}>
                      Contraseña*
                    </Text>
                  </View>
                  <View style={[styles.inputContainerModerno, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={currentTheme.primary} />
                    <TextInput
                      style={[styles.inputModerno, { color: currentTheme.text }]}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={currentTheme.textSecondary}
                      value={contrasena}
                      onChangeText={setContrasena}
                      secureTextEntry={!verPassword}
                    />
                    <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
                      <Ionicons 
                        name={verPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={currentTheme.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroupModerno}>
                  <View style={styles.labelConIcono}>
                    <Ionicons name="lock-closed" size={14} color={currentTheme.primary} />
                    <Text style={[styles.inputLabelModerno, { color: currentTheme.text }]}>
                      Confirmar Contraseña*
                    </Text>
                  </View>
                  <View style={[styles.inputContainerModerno, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={currentTheme.primary} />
                    <TextInput
                      style={[styles.inputModerno, { color: currentTheme.text }]}
                      placeholder="Repite la contraseña"
                      placeholderTextColor={currentTheme.textSecondary}
                      value={confirmarContrasena}
                      onChangeText={setConfirmarContrasena}
                      secureTextEntry={!verConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setVerConfirmPassword(!verConfirmPassword)}>
                      <Ionicons 
                        name={verConfirmPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={currentTheme.textSecondary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButtonModerno,
                    loading && styles.submitButtonDisabled
                  ]}
                  onPress={crearVendedor}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={loading ? ['#95a5a6', '#7f8c8d'] : [currentTheme.primary, currentTheme.secondary]}
                    style={styles.submitButtonGradiente}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <View style={styles.loadingButtonContent}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.submitButtonTextModerno}>Creando...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={22} color="white" />
                        <Text style={styles.submitButtonTextModerno}>Crear Vendedor</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={[styles.infoBoxModerno, { backgroundColor: currentTheme.primary + '10', borderColor: currentTheme.primary }]}>
                  <Ionicons name="information-circle" size={20} color={currentTheme.primary} />
                  <View style={styles.infoBoxTextos}>
                    <Text style={[styles.infoTextoModerno, { color: currentTheme.text }]}>
                      <Text style={{ fontWeight: '700' }}>Podrá:</Text> Ver y gestionar pedidos de este emprendimiento
                    </Text>
                    <Text style={[styles.infoTextoModerno, { color: currentTheme.text }]}>
                      <Text style={{ fontWeight: '700' }}>NO podrá:</Text> Ver estadísticas, gestionar productos o configurar el emprendimiento
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 130, // Espacio para la barra inferior
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  backButtonModerno: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  iconoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextos: {
    marginLeft: 12,
    flex: 1,
  },
  headerSubtitulo: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 150, // Espacio para el menú inferior
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingTexto: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Card de información moderna
  infoCardModerna: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCardGradiente: {
    padding: 24,
  },
  infoHeaderModerno: {
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  checkIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  infoTitleModerno: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginTop: 12,
  },
  estadoBadgeTexto: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  vendedorDetalles: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 16,
  },
  infoItemModerno: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  advertenciaModerna: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  advertenciaTextoModerno: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  // Card de formulario moderna
  formCardModerna: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeaderModerno: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 10,
  },
  formIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  formTitleModerno: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  formSubtitleModerno: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  emprendimientoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
    marginTop: 4,
  },
  emprendimientoNombre: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  formBodyModerno: {
    padding: 20,
  },
  inputGroupModerno: {
    marginBottom: 20,
  },
  labelConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabelModerno: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainerModerno: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  inputModerno: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  submitButtonModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitButtonTextModerno: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoBoxModerno: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBoxTextos: {
    flex: 1,
    gap: 10,
  },
  infoTextoModerno: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  deleteButtonModerno: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deleteButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  deleteButtonTextModerno: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default VendedorScreen;
