import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PlanScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const usuario = route.params?.usuario ?? {};
  
  const [planActual, setPlanActual] = useState(usuario.plan_id ? "premium" : "basico");
  const [modalVisible, setModalVisible] = useState(false);
  const [cargando, setCargando] = useState(false);

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

  const handleSuscribirsePremium = () => {
    setModalVisible(true);
  };

  const confirmarSuscripcion = async () => {
    setCargando(true);
    try {
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
              // Simular delay de procesamiento
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Actualizar el usuario con plan premium
              const usuarioActualizado = {
                ...usuario,
                plan_id: "premium",
                fecha_suscripcion: new Date().toISOString(),
                estado_suscripcion: "activa"
              };

              // Guardar en AsyncStorage
              await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
              
              setPlanActual("premium");
              setModalVisible(false);
              setCargando(false);
              
              Alert.alert(
                "¡Felicidades! 🎉",
                "Te has suscrito exitosamente al Plan Premium. Ahora tienes acceso a todas las funcionalidades avanzadas.",
                [
                  {
                    text: "Continuar"                    
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.log("Error al suscribirse:", error);
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
              const usuarioActualizado = {
                ...usuario,
                plan_id: null,
                fecha_suscripcion: null,
                estado_suscripcion: "cancelada"
              };

              await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
              setPlanActual("basico");
              
              Alert.alert("Suscripción cancelada", "Has vuelto al Plan Básico.");
            } catch (error) {
              console.log("Error al cancelar:", error);
              Alert.alert("Error", "No se pudo cancelar la suscripción.");
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
      <View key={planKey} style={[styles.planCard, esPlanActual && styles.planCardActual]}>
        <LinearGradient
          colors={esPlanActual ? [plan.color, "#1D7874"] : ["#f8f9fa", "#ffffff"]}
          style={styles.planGradient}
        >
          <View style={styles.planHeader}>
            <View style={styles.planIconContainer}>
              <FontAwesome 
                name={plan.icono} 
                size={24} 
                color={esPlanActual ? "white" : plan.color} 
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planNombre, esPlanActual && styles.planNombreActual]}>
                {plan.nombre}
              </Text>
              <Text style={[styles.planPrecio, esPlanActual && styles.planPrecioActual]}>
                {plan.precio}
                {plan.periodo && (
                  <Text style={styles.planPeriodo}> / {plan.periodo}</Text>
                )}
              </Text>
              <Text style={[styles.planDescripcion, esPlanActual && styles.planDescripcionActual]}>
                {plan.descripcion}
              </Text>
            </View>
          </View>

          <View style={styles.caracteristicasContainer}>
            <Text style={[styles.caracteristicasTitulo, esPlanActual && styles.caracteristicasTituloActual]}>
              {esPlanActual ? "✅ Incluye:" : "Características:"}
            </Text>
            {plan.caracteristicas.map((caracteristica, index) => (
              <View key={index} style={styles.caracteristicaItem}>
                <FontAwesome 
                  name="check" 
                  size={12} 
                  color={esPlanActual ? "white" : "#27ae60"} 
                />
                <Text style={[styles.caracteristicaTexto, esPlanActual && styles.caracteristicaTextoActual]}>
                  {caracteristica}
                </Text>
              </View>
            ))}
          </View>

          {plan.limitaciones && (
            <View style={styles.limitacionesContainer}>
              <Text style={styles.limitacionesTitulo}>Limitaciones:</Text>
              {plan.limitaciones.map((limitacion, index) => (
                <View key={index} style={styles.limitacionItem}>
                  <FontAwesome name="times" size={12} color="#e74c3c" />
                  <Text style={styles.limitacionTexto}>{limitacion}</Text>
                </View>
              ))}
            </View>
          )}

          {plan.beneficios && (
            <View style={styles.beneficiosContainer}>
              <Text style={[styles.beneficiosTitulo, esPlanActual && styles.beneficiosTituloActual]}>
                🚀 Beneficios:
              </Text>
              {plan.beneficios.map((beneficio, index) => (
                <View key={index} style={styles.beneficioItem}>
                  <FontAwesome 
                    name="rocket" 
                    size={12} 
                    color={esPlanActual ? "white" : "#f39c12"} 
                  />
                  <Text style={[styles.beneficioTexto, esPlanActual && styles.beneficioTextoActual]}>
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
                style={[styles.suscribirseButton, { backgroundColor: plan.color }]}
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
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
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
        <View style={styles.resumenContainer}>
          <Text style={styles.resumenTitulo}>Resumen de tu Plan</Text>
          <View style={styles.resumenCard}>
            <FontAwesome 
              name={planes[planActual].icono} 
              size={32} 
              color={planes[planActual].color} 
            />
            <View style={styles.resumenInfo}>
              <Text style={styles.resumenPlan}>{planes[planActual].nombre}</Text>
              <Text style={styles.resumenPrecio}>{planes[planActual].precio}</Text>
              {planActual === "premium" && (
                <Text style={styles.resumenPeriodo}>Facturación mensual</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.planesContainer}>
          <Text style={styles.planesTitulo}>Planes Disponibles</Text>
          {Object.keys(planes).map(renderPlanCard)}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitulo}>💡 Información Importante</Text>
          <View style={styles.infoItem}>
            <FontAwesome name="info-circle" size={16} color="#3498db" />
            <Text style={styles.infoTexto}>
              Puedes cambiar de plan en cualquier momento desde esta pantalla.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="credit-card" size={16} color="#3498db" />
            <Text style={styles.infoTexto}>
              El Plan Premium se renueva automáticamente cada mes.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="shield" size={16} color="#3498db" />
            <Text style={styles.infoTexto}>
              Tus datos están protegidos con encriptación de nivel bancario.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FontAwesome name="star" size={24} color="#2A9D8F" />
              <Text style={styles.modalTitulo}>Suscribirse al Plan Premium</Text>
            </View>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalPrecio}>$4.990 / mes</Text>
              <Text style={styles.modalDescripcion}>
                Accede a todas las funcionalidades premium y haz crecer tu negocio.
              </Text>
            </View>

            <View style={styles.modalBeneficios}>
              <Text style={styles.modalBeneficiosTitulo}>Incluye:</Text>
              <Text style={styles.modalBeneficio}>✓ Vitrina virtual completa</Text>
              <Text style={styles.modalBeneficio}>✓ Promoción destacada</Text>
              <Text style={styles.modalBeneficio}>✓ Estadísticas avanzadas</Text>
              <Text style={styles.modalBeneficio}>✓ Soporte prioritario</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmButton, cargando && styles.modalConfirmButtonDisabled]}
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
  resumenInfo: {
    marginLeft: 15,
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
