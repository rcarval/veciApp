import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const PlanScreen = () => {
  const navigation = useNavigation();
  const { usuario, cargarUsuario, invalidarUsuario, actualizarUsuarioLocal } = useUser();
  const { currentTheme } = useTheme();
  
  const [planActual, setPlanActual] = useState("basico");
  const [modalVisible, setModalVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoPlan, setCargandoPlan] = useState(true);

  const planes = {
    basico: {
      nombre: "Plan Básico",
      precio: "Gratis",
      descripcion: "Perfecto para comenzar",
      color: "#95a5a6",
      icono: "star-o",
      caracteristicas: [
        "Perfil de usuario completo",
        "Acceso a todos los negocios",
        "Sistema de pedidos básico",
        "Soporte por email",
        "Hasta 3 direcciones guardadas",
      ],
      limitaciones: [
        "Sin promoción destacada",
        "Sin vitrina virtual",
        "Sin estadísticas avanzadas",
        "Sin soporte prioritario",
      ]
    },
    premium: {
      nombre: "Plan Premium",
      precio: "$4.990",
      periodo: "mensual",
      descripcion: "Para emprendedores serios",
      color: "#2A9D8F",
      icono: "star",
      caracteristicas: [
        "Todo lo del Plan Básico",
        "Vitrina virtual completa",
        "Promoción destacada en búsquedas",
        "Estadísticas avanzadas de ventas",
        "Soporte prioritario 24/7",
        "Direcciones ilimitadas",
        "Gestión de inventario",
        "Notificaciones push personalizadas",
        "Análisis de clientes",
        "Herramientas de marketing",
      ],
      beneficios: [
        "Mayor visibilidad en la app",
        "Herramientas profesionales",
        "Crecimiento acelerado del negocio",
        "Soporte especializado",
      ]
    }
  };

  // Cargar plan del usuario desde el contexto (usando cache si es válido)
  useEffect(() => {
    const cargarPlan = async () => {
      try {
        setCargandoPlan(true);
        await cargarUsuario(false); // Usar cache si es válido
      } catch (error) {
        console.error("Error al cargar plan:", error);
      } finally {
        setCargandoPlan(false);
      }
    };
    cargarPlan();
  }, []);

  // Actualizar planActual cuando cambia el usuario
  useEffect(() => {
    if (usuario) {
      const plan = usuario.plan_id || null;
      // plan_id: null/1 = basico, 2 = premium
      setPlanActual(plan === 2 ? "premium" : "basico");
    }
  }, [usuario]);

  const handleSuscribirsePremium = () => {
    setModalVisible(true);
  };

  const confirmarSuscripcion = async () => {
    setCargando(true);
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
        navigation.navigate("Login");
        return;
      }

      // Simular proceso de pago con tarjeta de prueba
      Alert.alert(
        "💳 Procesando Pago",
        "Para pruebas, simula un pago con tarjeta de prueba:\n\nTarjeta: 4242 4242 4242 4242\nFecha: 12/25\nCVV: 123\n\nEste es un entorno de desarrollo.",
        [
          {
            text: "Cancelar",
            onPress: () => {
              setCargando(false);
              setModalVisible(false);
            },
            style: "cancel"
          },
          {
            text: "Simular Pago Exitoso",
            onPress: async () => {
              try {
                console.log('📤 Suscribiéndose al plan premium...');
                // Llamar al backend para suscribirse
                const response = await fetch(API_ENDPOINTS.SUSCRIBIRSE_PREMIUM, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                });

                const data = await response.json();
                console.log('📥 Respuesta suscripción:', JSON.stringify(data, null, 2));

                if (response.ok && data.ok) {
                  console.log('✅ Suscripción exitosa');
                  // Actualizar contexto (esto actualiza el cache y todas las pantallas)
                  actualizarUsuarioLocal(data.usuario);
                  setPlanActual("premium");
                  
                  setModalVisible(false);
                  setCargando(false);
                  
                  Alert.alert(
                    "¡Felicidades! 🎉",
                    data.mensaje || "Te has suscrito exitosamente al Plan Premium. Ahora tienes acceso a todas las funcionalidades avanzadas.",
                    [
                      {
                        text: "Continuar"                    
                      }
                    ]
                  );
                } else {
                  console.log('❌ Error al suscribirse:', data.error);
                  Alert.alert("Error", data.mensaje || data.error || "No se pudo procesar la suscripción.");
                  setCargando(false);
                }
              } catch (error) {
                console.error("Error al suscribirse:", error);
                Alert.alert(
                  "Error de conexión",
                  "No se pudo conectar al servidor. Verifica tu conexión a internet."
                );
                setCargando(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al suscribirse:", error);
      Alert.alert("Error", "No se pudo procesar la suscripción. Inténtalo de nuevo.");
      setCargando(false);
    }
  };

  const cancelarSuscripcion = async () => {
    Alert.alert(
      "Cancelar Suscripción",
      "¿Estás seguro de que quieres cancelar tu suscripción Premium? Perderás acceso a todas las funcionalidades avanzadas.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              setCargando(true);
              const token = await AsyncStorage.getItem("token");
              
              if (!token) {
                Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
                navigation.navigate("Login");
                return;
              }

              console.log('📤 Cancelando suscripción...');
              // Llamar al backend para cancelar suscripción
              const response = await fetch(API_ENDPOINTS.CANCELAR_SUSCRIPCION, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              });

              const data = await response.json();
              console.log('📥 Respuesta cancelación:', JSON.stringify(data, null, 2));

              if (response.ok && data.ok) {
                console.log('✅ Suscripción cancelada');
                // Actualizar contexto (esto actualiza el cache y todas las pantallas)
                actualizarUsuarioLocal(data.usuario);
                setPlanActual("basico");
                
                setCargando(false);
                
                Alert.alert("Suscripción cancelada", data.mensaje || "Has vuelto al Plan Básico.");
              } else {
                console.log('❌ Error al cancelar:', data.error);
                Alert.alert("Error", data.mensaje || data.error || "No se pudo cancelar la suscripción.");
                setCargando(false);
              }
            } catch (error) {
              console.error("Error al cancelar:", error);
              Alert.alert(
                "Error de conexión",
                "No se pudo conectar al servidor. Verifica tu conexión a internet."
              );
              setCargando(false);
            }
          }
        }
      ]
    );
  };

  const renderPlanCard = (planKey) => {
    const plan = planes[planKey];
    const esPlanActual = planActual === planKey;
    const esPremium = planKey === "premium";

    return (
      <View key={planKey} style={[styles.planCard, esPlanActual && [styles.planCardActual, { shadowColor: currentTheme.shadow }], !esPlanActual && { shadowColor: currentTheme.shadow }]}>
        <LinearGradient
          colors={esPlanActual ? [currentTheme.primary, currentTheme.secondary] : [currentTheme.cardBackground, currentTheme.cardBackground]}
          style={styles.planGradient}
        >
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, { backgroundColor: esPlanActual ? 'rgba(255,255,255,0.2)' : currentTheme.primary + '20' }]}>
              <FontAwesome 
                name={plan.icono} 
                size={24} 
                color={esPlanActual ? "white" : currentTheme.primary} 
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planNombre, esPlanActual && styles.planNombreActual, !esPlanActual && { color: currentTheme.text }]}>
                {plan.nombre}
              </Text>
              <Text style={[styles.planPrecio, esPlanActual && styles.planPrecioActual, !esPlanActual && { color: currentTheme.primary }]}>
                {plan.precio}
                {plan.periodo && (
                  <Text style={[styles.planPeriodo, esPlanActual && { color: 'rgba(255,255,255,0.8)' }, !esPlanActual && { color: currentTheme.textSecondary }]}> / {plan.periodo}</Text>
                )}
              </Text>
              <Text style={[styles.planDescripcion, esPlanActual && styles.planDescripcionActual, !esPlanActual && { color: currentTheme.textSecondary }]}>
                {plan.descripcion}
              </Text>
            </View>
          </View>

          <View style={styles.caracteristicasContainer}>
            <Text style={[styles.caracteristicasTitulo, esPlanActual && styles.caracteristicasTituloActual, !esPlanActual && { color: currentTheme.text }]}>
              {esPlanActual ? "✅ Incluye:" : "Características:"}
            </Text>
            {plan.caracteristicas.map((caracteristica, index) => (
              <View key={index} style={styles.caracteristicaItem}>
                <FontAwesome 
                  name="check" 
                  size={12} 
                  color={esPlanActual ? "white" : "#27ae60"} 
                />
                <Text style={[styles.caracteristicaTexto, esPlanActual && styles.caracteristicaTextoActual, !esPlanActual && { color: currentTheme.text }]}>
                  {caracteristica}
                </Text>
              </View>
            ))}
          </View>

          {plan.limitaciones && (
            <View style={styles.limitacionesContainer}>
              <Text style={[styles.limitacionesTitulo, { color: esPlanActual ? 'rgba(255,255,255,0.8)' : currentTheme.textSecondary }]}>Limitaciones:</Text>
              {plan.limitaciones.map((limitacion, index) => (
                <View key={index} style={styles.limitacionItem}>
                  <FontAwesome name="times" size={12} color={esPlanActual ? 'rgba(255,255,255,0.7)' : "#e74c3c"} />
                  <Text style={[styles.limitacionTexto, { color: esPlanActual ? 'rgba(255,255,255,0.8)' : currentTheme.textSecondary }]}>{limitacion}</Text>
                </View>
              ))}
            </View>
          )}

          {plan.beneficios && (
            <View style={styles.beneficiosContainer}>
              <Text style={[styles.beneficiosTitulo, esPlanActual && styles.beneficiosTituloActual, !esPlanActual && { color: currentTheme.text }]}>
                🚀 Beneficios:
              </Text>
              {plan.beneficios.map((beneficio, index) => (
                <View key={index} style={styles.beneficioItem}>
                  <FontAwesome 
                    name="rocket" 
                    size={12} 
                    color={esPlanActual ? "white" : "#f39c12"} 
                  />
                  <Text style={[styles.beneficioTexto, esPlanActual && styles.beneficioTextoActual, !esPlanActual && { color: currentTheme.text }]}>
                    {beneficio}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.planActions}>
            {esPlanActual ? (
              <View style={styles.planActualContainer}>
                <FontAwesome name="check-circle" size={20} color="white" />
                <Text style={styles.planActualTexto}>Plan Actual</Text>
                {esPremium && (
                  <TouchableOpacity
                    style={styles.cancelarButton}
                    onPress={cancelarSuscripcion}
                  >
                    <Text style={styles.cancelarButtonText}>Cancelar Suscripción</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.suscribirseButton, { backgroundColor: esPremium ? currentTheme.primary : plan.color || currentTheme.primary }]}
                onPress={esPremium ? handleSuscribirsePremium : () => {}}
                disabled={!esPremium}
              >
                <Text style={styles.suscribirseButtonText}>
                  {esPremium ? "Suscribirse Ahora" : "Plan Actual"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <FontAwesome name="star" size={24} color="white" />
            <Text style={styles.tituloPrincipal}>Mi Plan</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {cargandoPlan ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>Cargando información del plan...</Text>
          </View>
        ) : (
          <>
            <View style={styles.resumenContainer}>
              <Text style={[styles.resumenTitulo, { color: currentTheme.text }]}>Resumen de tu Plan</Text>
              <View style={[styles.resumenCard, { 
                backgroundColor: currentTheme.cardBackground, 
                shadowColor: currentTheme.shadow,
                borderColor: currentTheme.border,
                borderWidth: 1
              }]}>
                <View style={[styles.resumenIconWrapper, { backgroundColor: currentTheme.primary + '20' }]}>
                  <FontAwesome 
                    name={planes[planActual].icono} 
                    size={32} 
                    color={currentTheme.primary} 
                  />
                </View>
                <View style={styles.resumenInfo}>
                  <Text style={[styles.resumenPlan, { color: currentTheme.text }]}>{planes[planActual].nombre}</Text>
                  <Text style={[styles.resumenPrecio, { color: currentTheme.primary }]}>{planes[planActual].precio}</Text>
                  {planActual === "premium" && (
                    <Text style={[styles.resumenPeriodo, { color: currentTheme.textSecondary }]}>Facturación mensual</Text>
                  )}
                  {usuario?.fecha_suscripcion && (
                    <Text style={[styles.resumenFecha, { color: currentTheme.textSecondary }]}>
                      Suscrito desde: {new Date(usuario.fecha_suscripcion).toLocaleDateString('es-CL')}
                    </Text>
                  )}
                  {usuario?.vigencia_hasta && (
                    <Text style={[styles.resumenVigencia, { color: currentTheme.primary, fontWeight: 'bold' }]}>
                      {usuario.estado_suscripcion === 'cancelada' ? '⚠️ ' : '✓ '}
                      Vence el: {new Date(usuario.vigencia_hasta).toLocaleDateString('es-CL')}
                    </Text>
                  )}
                  {usuario?.estado_suscripcion === 'cancelada' && usuario?.vigencia_hasta && (
                    <Text style={[styles.resumenCancelada, { color: '#e74c3c', fontSize: 12 }]}>
                      Después de esta fecha volverás al plan básico
                    </Text>
                  )}
                </View>
              </View>
            </View>

        <View style={styles.planesContainer}>
          <Text style={[styles.planesTitulo, { color: currentTheme.text }]}>Planes Disponibles</Text>
          {Object.keys(planes).map(renderPlanCard)}
        </View>

        <View style={[styles.infoContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
          <Text style={[styles.infoTitulo, { color: currentTheme.text }]}>💡 Información Importante</Text>
          <View style={styles.infoItem}>
            <FontAwesome name="info-circle" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Puedes cambiar de plan en cualquier momento desde esta pantalla.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="credit-card" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              El Plan Premium se renueva automáticamente cada mes.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="shield" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Tus datos están protegidos con encriptación de nivel bancario.
            </Text>
          </View>
        </View>
          </>
        )}
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <FontAwesome name="star" size={24} color={currentTheme.primary} />
              <Text style={[styles.modalTitulo, { color: currentTheme.text }]}>Suscribirse al Plan Premium</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={[styles.modalPrecio, { color: currentTheme.primary }]}>$4.990 / mes</Text>
              <Text style={[styles.modalDescripcion, { color: currentTheme.textSecondary }]}>
                Accede a todas las funcionalidades premium y haz crecer tu negocio.
              </Text>
            </View>

            <View style={styles.modalBeneficios}>
              <Text style={[styles.modalBeneficiosTitulo, { color: currentTheme.text }]}>Incluye:</Text>
              <Text style={[styles.modalBeneficio, { color: currentTheme.text }]}>✓ Vitrina virtual completa</Text>
              <Text style={[styles.modalBeneficio, { color: currentTheme.text }]}>✓ Promoción destacada</Text>
              <Text style={[styles.modalBeneficio, { color: currentTheme.text }]}>✓ Estadísticas avanzadas</Text>
              <Text style={[styles.modalBeneficio, { color: currentTheme.text }]}>✓ Soporte prioritario</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: currentTheme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: currentTheme.primary }, cargando && styles.modalConfirmButtonDisabled]}
                onPress={confirmarSuscripcion}
                disabled={cargando}
              >
                {cargando ? (
                  <Text style={styles.modalConfirmButtonText}>Procesando...</Text>
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Confirmar Suscripción</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  container: {
    flex: 1,
    paddingBottom: 130, // Espacio para la barra inferior
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 150, // Espacio para la barra inferior + margen extra
  },
  resumenContainer: {
    marginBottom: 30,
  },
  resumenTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  resumenCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  resumenInfo: {
    marginLeft: 0,
    flex: 1,
  },
  resumenPlan: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  resumenPrecio: {
    fontSize: 16,
    color: "#2A9D8F",
    fontWeight: "600",
    marginTop: 2,
  },
  resumenPeriodo: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  resumenFecha: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 4,
    fontStyle: "italic",
  },
  resumenVigencia: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  resumenCancelada: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  planesContainer: {
    marginBottom: 30,
  },
  planesTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardActual: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  planGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  planIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  planInfo: {
    flex: 1,
  },
  planNombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  planNombreActual: {
    color: "white",
  },
  planPrecio: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2A9D8F",
    marginTop: 2,
  },
  planPrecioActual: {
    color: "white",
  },
  planPeriodo: {
    fontSize: 14,
    fontWeight: "normal",
  },
  planDescripcion: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  planDescripcionActual: {
    color: "rgba(255,255,255,0.8)",
  },
  caracteristicasContainer: {
    marginBottom: 15,
  },
  caracteristicasTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  caracteristicasTituloActual: {
    color: "white",
  },
  caracteristicaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  caracteristicaTexto: {
    fontSize: 14,
    color: "#34495e",
    marginLeft: 8,
  },
  caracteristicaTextoActual: {
    color: "white",
  },
  limitacionesContainer: {
    marginBottom: 15,
  },
  limitacionesTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 8,
  },
  limitacionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  limitacionTexto: {
    fontSize: 13,
    color: "#7f8c8d",
    marginLeft: 8,
  },
  beneficiosContainer: {
    marginBottom: 20,
  },
  beneficiosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f39c12",
    marginBottom: 10,
  },
  beneficiosTituloActual: {
    color: "white",
  },
  beneficioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  beneficioTexto: {
    fontSize: 14,
    color: "#34495e",
    marginLeft: 8,
  },
  beneficioTextoActual: {
    color: "white",
  },
  planActions: {
    marginTop: 10,
  },
  planActualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  planActualTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelarButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 15,
  },
  cancelarButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  suscribirseButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  suscribirseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoTexto: {
    fontSize: 14,
    color: "#34495e",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginLeft: 10,
  },
  modalInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalPrecio: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A9D8F",
    marginBottom: 5,
  },
  modalDescripcion: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 20,
  },
  modalBeneficios: {
    marginBottom: 25,
  },
  modalBeneficiosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  modalBeneficio: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e74c3c",
    marginRight: 10,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
  },
  modalConfirmButtonDisabled: {
    backgroundColor: "#bdc3c7",
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PlanScreen;
