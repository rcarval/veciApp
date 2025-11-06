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
import LoadingVeciApp from "../components/LoadingVeciApp";

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
      descripcion: "Ideal para iniciar tu negocio",
      color: "#95a5a6",
      icono: "star-o",
      caracteristicas: [
        "1 emprendimiento",
        "Presentación de tu negocio",
        "Contacto directo con clientes",
        "Gestión de pedidos",
        "Soporte por email",
      ],
      beneficios: [
        "Comienza sin inversión",
        "Prueba la plataforma",
        "Valida tu idea de negocio",
      ]
    },
    premium: {
      nombre: "Plan Premium",
      precio: "$4.990",
      periodo: "mensual",
      descripcion: "Maximiza tu potencial de ventas",
      color: "#2A9D8F",
      icono: "star",
      caracteristicas: [
        "Hasta 3 emprendimientos",
        "1 vendedor por emprendimiento",
        "Vitrina virtual con hasta 30 productos",
        "Categorías: Principal, Secundario, Ofertas",
        "Mayor visibilidad en la app",
        "Estadísticas de ventas en tiempo real",
        "Soporte personalizado prioritario",
        "Panel de administración avanzado",
      ],
      beneficios: [
        "3x más emprendimientos que el plan básico",
        "Delega la gestión con vendedores",
        "Expón productos en vitrina destacada",
        "Toma decisiones con estadísticas",
        "Aumenta tus ventas con mayor visibilidad",
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

  // Recargar cuando la pantalla gana foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('🔄 PlanScreen ganó foco, recargando usuario...');
      await cargarUsuario(true); // Forzar recarga para ver cambios recientes
    });

    return unsubscribe;
  }, [navigation]);

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
      <View key={planKey} style={[
        styles.planCard, 
        esPremium && styles.planCardPremium,
        esPlanActual && styles.planCardActual
      ]}>
        {/* Badge "Recomendado" solo para Premium */}
        {esPremium && !esPlanActual && (
          <View style={styles.badgeRecomendado}>
            <LinearGradient
              colors={['#f39c12', '#e67e22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeGradient}
            >
              <Ionicons name="star" size={14} color="white" />
              <Text style={styles.badgeTexto}>MÁS POPULAR</Text>
            </LinearGradient>
          </View>
        )}

        {/* Badge "Plan Actual" */}
        {esPlanActual && (
          <View style={styles.badgeActual}>
            <LinearGradient
              colors={['#27ae60', '#229954']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeGradient}
            >
              <Ionicons name="checkmark-circle" size={14} color="white" />
              <Text style={styles.badgeTexto}>TU PLAN</Text>
            </LinearGradient>
          </View>
        )}

        <LinearGradient
          colors={esPremium ? ['#2A9D8F', '#1a7a6e'] : ['#ecf0f1', '#d5dbdb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planGradient}
        >
          {/* Header con icono */}
          <View style={styles.planHeader}>
            <View style={[
              styles.planIconContainer, 
              { backgroundColor: esPremium ? 'rgba(255,255,255,0.25)' : 'rgba(149,165,166,0.2)' }
            ]}>
              <Ionicons 
                name={esPremium ? "diamond-outline" : "cube-outline"} 
                size={24} 
                color={esPremium ? "white" : "#7f8c8d"} 
              />
            </View>
          </View>

          {/* Título y precio */}
          <View style={styles.planTitleSection}>
            <Text style={[
              styles.planNombre, 
              esPremium && styles.planNombrePremium
            ]}>
              {plan.nombre}
            </Text>
            <Text style={[
              styles.planDescripcion, 
              esPremium && styles.planDescripcionPremium
            ]}>
              {plan.descripcion}
            </Text>
            <View style={styles.planPrecioContainer}>
              <Text style={[
                styles.planPrecio, 
                esPremium && styles.planPrecioPremium
              ]}>
                {plan.precio}
              </Text>
              {plan.periodo && (
                <Text style={[
                  styles.planPeriodo, 
                  esPremium && { color: 'rgba(255,255,255,0.8)' }
                ]}> / {plan.periodo}</Text>
              )}
            </View>
            {esPremium && (
              <View style={styles.valorAgregadoContainer}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.valorAgregadoTexto}>
                  3x más ventas potenciales
                </Text>
              </View>
            )}
          </View>

          {/* Características con iconos */}
          <View style={styles.caracteristicasContainer}>
            {plan.caracteristicas.map((caracteristica, index) => (
              <View key={index} style={[
                styles.caracteristicaItem,
                esPremium && styles.caracteristicaItemPremium
              ]}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color={esPremium ? "#fff" : "#27ae60"} 
                  style={styles.checkIcon}
                />
                <Text style={[
                  styles.caracteristicaTexto, 
                  esPremium && styles.caracteristicaTextoPremium
                ]}>
                  {caracteristica}
                </Text>
              </View>
            ))}
          </View>


          {/* Beneficios destacados */}
          {plan.beneficios && (
            <View style={[
              styles.beneficiosContainer,
              esPremium && styles.beneficiosContainerPremium
            ]}>
              <Text style={[
                styles.beneficiosTitulo, 
                esPremium && styles.beneficiosTituloPremium
              ]}>
                🎯 ¿Por qué elegir {esPremium ? 'Premium' : 'Básico'}?
              </Text>
              {plan.beneficios.map((beneficio, index) => (
                <View key={index} style={styles.beneficioItem}>
                  <Ionicons 
                    name="flash-outline" 
                    size={13} 
                    color={esPremium ? "#fff" : "#f39c12"} 
                    style={styles.beneficioIcon}
                  />
                  <Text style={[
                    styles.beneficioTexto, 
                    esPremium && styles.beneficioTextoPremium
                  ]}>
                    {beneficio}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón de acción */}
          <View style={styles.planActions}>
            {esPlanActual ? (
              <>
                <View style={[
                  styles.planActualContainer,
                  esPremium && styles.planActualContainerPremium
                ]}>
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.planActualTexto}>Plan Actual</Text>
                </View>
                {esPremium && (
                  <TouchableOpacity
                    style={styles.cancelarButtonFull}
                    onPress={cancelarSuscripcion}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cancelarButtonContent}>
                      <Ionicons name="close-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.cancelarButtonTextFull}>Cancelar Suscripción</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.suscribirseButtonContainer}
                onPress={esPremium ? handleSuscribirsePremium : () => {}}
                disabled={!esPremium}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={esPremium ? ['#f39c12', '#e67e22'] : ['#95a5a6', '#7f8c8d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.suscribirseButton}
                >
                  <Text style={styles.suscribirseButtonText}>
                    {esPremium ? "🚀 Actualizar a Premium" : "Plan Básico"}
                  </Text>
                  {esPremium && (
                    <Ionicons name="arrow-forward-circle" size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      {/* Header Moderno */}
      <LinearGradient
        colors={['#2A9D8F', '#1a7a6e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <View style={styles.headerIconContainer}>
              <Ionicons name="diamond" size={28} color="white" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.tituloPrincipal}>Mi Plan</Text>
              <Text style={styles.subtituloPrincipal}>Gestiona tu suscripción</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {cargandoPlan ? (
          <View style={styles.loadingContainer}>
            <LoadingVeciApp size={120} color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary, marginTop: 30 }]}>
              Cargando información del plan...
            </Text>
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
                  <Ionicons 
                    name={planActual === 'premium' ? "diamond-outline" : "cube-outline"} 
                    size={24} 
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
          <Text style={[styles.infoTitulo, { color: currentTheme.text }]}>💡 ¿Por qué Premium?</Text>
          <View style={styles.infoItem}>
            <FontAwesome name="rocket" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Expande tu negocio con hasta 3 emprendimientos simultáneos.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="users" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Asigna 1 vendedor por emprendimiento para gestionar mejor tus ventas.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="star" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Crea vitrinas virtuales con hasta 30 productos destacados.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="bar-chart" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Accede a estadísticas de ventas para tomar mejores decisiones.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="eye" size={16} color={currentTheme.primary} />
            <Text style={[styles.infoTexto, { color: currentTheme.text }]}>
              Mayor visibilidad = más clientes encontrándote en la app.
            </Text>
          </View>
        </View>
          </>
        )}
      </ScrollView>

      {/* Modal de confirmación moderno */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header del modal con gradiente */}
            <LinearGradient
              colors={['#2A9D8F', '#1a7a6e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="rocket-outline" size={32} color="white" />
              </View>
              <Text style={styles.modalTitulo}>¡Actualiza a Premium!</Text>
              <Text style={styles.modalSubtitulo}>
                Triplica tu potencial de ventas
              </Text>
            </LinearGradient>
            
            {/* Precio destacado */}
            <View style={styles.modalPrecioContainer}>
              <View style={styles.modalPrecioBox}>
                <Text style={styles.modalPrecioLabel}>Inversión mensual</Text>
                <Text style={styles.modalPrecio}>$4.990</Text>
                <Text style={styles.modalPrecioPeriodo}>por mes</Text>
                <View style={styles.modalRetornoContainer}>
                  <Ionicons name="trending-up" size={16} color="#27ae60" />
                  <Text style={styles.modalRetornoTexto}>ROI potencial: 10x</Text>
                </View>
              </View>
            </View>

            {/* Beneficios destacados */}
            <View style={styles.modalBeneficios}>
              <Text style={styles.modalBeneficiosTitulo}>🎁 Obtendrás acceso inmediato a:</Text>
              <View style={styles.modalBeneficiosList}>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="business-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>Hasta 3 emprendimientos</Text>
                </View>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="people-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>1 vendedor por emprendimiento</Text>
                </View>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="storefront-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>Vitrina con 30 productos</Text>
                </View>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="stats-chart-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>Estadísticas en tiempo real</Text>
                </View>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="eye-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>Mayor visibilidad</Text>
                </View>
                <View style={styles.modalBeneficioItem}>
                  <Ionicons name="headset-outline" size={16} color="#2A9D8F" />
                  <Text style={styles.modalBeneficio}>Soporte personalizado</Text>
                </View>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Ahora no</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButtonContainer}
                onPress={confirmarSuscripcion}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#f39c12', '#e67e22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmButton}
                >
                  {cargando ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.modalConfirmButtonText}>🚀 Activar Premium</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </>
                  )}
                </LinearGradient>
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
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  subtituloPrincipal: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    fontWeight: "500",
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 150, // Espacio para la barra inferior
  },
  resumenContainer: {
    marginBottom: 20,
  },
  resumenTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  resumenCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  planesContainer: {
    marginBottom: 20,
  },
  planesTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  planCardPremium: {
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.01 }],
  },
  planCardActual: {
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  // Badges
  badgeRecomendado: {
    position: "absolute",
    top: -10,
    right: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeActual: {
    position: "absolute",
    top: -10,
    right: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#27ae60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
    gap: 5,
  },
  badgeTexto: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planGradient: {
    padding: 14,
    borderRadius: 16,
  },
  planHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  planIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  // Títulos y precios
  planTitleSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  planNombre: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2c3e50",
    textAlign: "center",
  },
  planNombrePremium: {
    color: "white",
    fontSize: 20,
  },
  planDescripcion: {
    fontSize: 11,
    color: "#7f8c8d",
    marginTop: 2,
    textAlign: "center",
  },
  planDescripcionPremium: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
  },
  planPrecioContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 5,
  },
  planPrecio: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2A9D8F",
    letterSpacing: -1,
  },
  planPrecioPremium: {
    color: "white",
    fontSize: 28,
  },
  planPeriodo: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  valorAgregadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    gap: 3,
  },
  valorAgregadoTexto: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 10,
    fontWeight: "700",
  },
  caracteristicasContainer: {
    marginBottom: 8,
  },
  caracteristicaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
  },
  caracteristicaItemPremium: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  checkIcon: {
    marginRight: 7,
  },
  caracteristicaTexto: {
    fontSize: 12,
    color: "#2c3e50",
    flex: 1,
    lineHeight: 16,
    fontWeight: "500",
  },
  caracteristicaTextoPremium: {
    color: "white",
    fontWeight: "600",
  },
  limitacionesContainer: {
    marginBottom: 8,
  },
  limitacionesTitulo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e74c3c",
    marginBottom: 4,
  },
  limitacionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  limitacionTexto: {
    fontSize: 11,
    color: "#7f8c8d",
    marginLeft: 6,
  },
  beneficiosContainer: {
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 8,
    borderRadius: 6,
  },
  beneficiosContainerPremium: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  beneficiosTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  beneficiosTituloPremium: {
    color: "rgba(255,255,255,0.95)",
  },
  beneficioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  beneficioIcon: {
    marginRight: 6,
  },
  beneficioTexto: {
    fontSize: 11,
    color: "#2c3e50",
    flex: 1,
    lineHeight: 14,
    fontWeight: "500",
  },
  beneficioTextoPremium: {
    color: "rgba(255,255,255,0.9)",
  },
  planActions: {
    marginTop: 8,
  },
  planActualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    borderRadius: 12,
  },
  planActualContainerPremium: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  planActualTexto: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  cancelarButtonFull: {
    backgroundColor: "rgba(231,76,60,0.15)",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cancelarButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelarButtonTextFull: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  suscribirseButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  suscribirseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  suscribirseButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  infoContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  infoTexto: {
    fontSize: 13,
    color: "#34495e",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  // Estilos del modal moderno
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 25,
    width: "90%",
    maxWidth: 420,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  modalHeaderGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalSubtitulo: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  modalPrecioContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  modalPrecioBox: {
    alignItems: "center",
  },
  modalPrecioLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalPrecio: {
    fontSize: 40,
    fontWeight: "900",
    color: "#2A9D8F",
    letterSpacing: -1,
    marginTop: 4,
  },
  modalPrecioPeriodo: {
    fontSize: 13,
    color: "#95a5a6",
    fontWeight: "500",
  },
  modalRetornoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d5f4e6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  modalRetornoTexto: {
    fontSize: 11,
    color: "#27ae60",
    fontWeight: "700",
  },
  modalBeneficios: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalBeneficiosTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 10,
  },
  modalBeneficiosList: {
    gap: 8,
  },
  modalBeneficioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalBeneficio: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "500",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  modalCancelButtonText: {
    color: "#7f8c8d",
    fontSize: 14,
    fontWeight: "600",
  },
  modalConfirmButtonContainer: {
    flex: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default PlanScreen;
