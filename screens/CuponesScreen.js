import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";

const CuponesScreen = ({ navigation, route }) => {
  const { currentTheme } = useTheme();
  const { usuario, cargarUsuario } = useUser();
  const [codigoCupon, setCodigoCupon] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [canjeandoCupon, setCanjeandoCupon] = useState(false);
  const [cuponValidado, setCuponValidado] = useState(null);
  const [misCupones, setMisCupones] = useState([]);
  const [beneficiosActivos, setBeneficiosActivos] = useState([]);
  const [cargandoCupones, setCargandoCupones] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalExito, setModalExito] = useState(false);
  const [cuponCanjeado, setCuponCanjeado] = useState(null);

  // Modo de selección (solo desde PedidoDetalleScreen)
  const { modoSeleccion, emprendimientoId, onCuponSeleccionado } = route.params || {};

  // Cargar cupones y beneficios
  const cargarDatos = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      console.log("🎫 Cargando cupones y beneficios...");

      // Cargar cupones canjeados
      const cuponesResponse = await fetch(API_ENDPOINTS.MIS_CUPONES, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cuponesData = await cuponesResponse.json();
      if (cuponesData.ok) {
        setMisCupones(cuponesData.cupones || []);
        console.log("✅ Cupones cargados:", cuponesData.cupones?.length || 0);
      }

      // Cargar beneficios activos
      const beneficiosResponse = await fetch(API_ENDPOINTS.BENEFICIOS_ACTIVOS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const beneficiosData = await beneficiosResponse.json();
      if (beneficiosData.ok) {
        setBeneficiosActivos(beneficiosData.beneficios || []);
        console.log("✅ Beneficios activos:", beneficiosData.beneficios?.length || 0);
      }
    } catch (error) {
      console.error("❌ Error al cargar cupones:", error);
    } finally {
      setCargandoCupones(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  const validarCupon = async () => {
    if (!codigoCupon.trim()) {
      Alert.alert("Error", "Ingresa un código de cupón");
      return;
    }

    try {
      setValidandoCupon(true);
      const token = await AsyncStorage.getItem("token");

      console.log("🔍 Validando cupón:", codigoCupon);

      const response = await fetch(API_ENDPOINTS.VALIDAR_CUPON, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo: codigoCupon.trim() }),
      });

      const data = await response.json();

      if (data.ok && data.valido) {
        console.log("✅ Cupón válido:", data.cupon);
        setCuponValidado(data.cupon);
      } else {
        Alert.alert(
          "Cupón No Válido",
          data.error || data.detalle || "El cupón ingresado no es válido",
          [{ text: "Entendido" }]
        );
        setCuponValidado(null);
      }
    } catch (error) {
      console.error("❌ Error al validar cupón:", error);
      Alert.alert("Error", "No se pudo validar el cupón. Inténtalo de nuevo.");
    } finally {
      setValidandoCupon(false);
    }
  };

  const canjearCupon = async () => {
    if (!cuponValidado) return;

    try {
      setCanjeandoCupon(true);
      const token = await AsyncStorage.getItem("token");

      console.log("🎁 Canjeando cupón:", cuponValidado.codigo);

      const response = await fetch(API_ENDPOINTS.CANJEAR_CUPON, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo: cuponValidado.codigo }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log("✅ Cupón canjeado exitosamente");
        setCuponCanjeado(data.canje);
        setModalExito(true);
        setCodigoCupon("");
        setCuponValidado(null);
        
        // Si es cupón de premium, invalidar cache del usuario para reflejar cambios
        if (cuponValidado.tipo_beneficio === 'premium_gratis') {
          console.log("🔄 Invalidando cache de usuario para reflejar plan premium actualizado");
          await cargarUsuario(true); // Forzar recarga desde backend
        }
        
        cargarDatos(); // Recargar cupones y beneficios
      } else {
        Alert.alert("Error", data.error || "No se pudo canjear el cupón");
      }
    } catch (error) {
      console.error("❌ Error al canjear cupón:", error);
      Alert.alert("Error", "No se pudo canjear el cupón. Inténtalo de nuevo.");
    } finally {
      setCanjeandoCupon(false);
    }
  };

  // Función para seleccionar cupón aplicable (modo selección desde PedidoDetalle)
  const seleccionarCupon = (beneficio) => {
    if (onCuponSeleccionado) {
      console.log("✅ Cupón seleccionado para aplicar:", beneficio);
      onCuponSeleccionado(beneficio);
      navigation.goBack();
    }
  };

  // Función para obtener icono según tipo de beneficio
  const getIconoBeneficio = (tipo) => {
    const iconos = {
      premium_gratis: "rocket",
      descuento_porcentaje: "pricetag",
      descuento_monto: "cash",
      descuento_producto: "gift",
      envio_gratis: "bicycle",
      producto_gratis: "gift-outline",
    };
    return iconos[tipo] || "ticket";
  };

  // Función para obtener color según tipo de beneficio
  const getColorBeneficio = (tipo) => {
    const colores = {
      premium_gratis: "#f39c12",
      descuento_porcentaje: "#e74c3c",
      descuento_monto: "#27ae60",
      descuento_producto: "#9b59b6",
      envio_gratis: "#3498db",
      producto_gratis: "#e67e22",
    };
    return colores[tipo] || currentTheme.primary;
  };

  // Función para formatear el beneficio
  const formatearBeneficio = (tipo, valor) => {
    switch (tipo) {
      case "premium_gratis":
        return `${valor} días de Premium GRATIS`;
      case "descuento_porcentaje":
        return `${valor}% de descuento`;
      case "descuento_monto":
        return `$${parseInt(valor).toLocaleString("es-CL")} de descuento`;
      case "envio_gratis":
        return "Delivery GRATIS";
      case "descuento_producto":
        return "Descuento en producto";
      case "producto_gratis":
        return "Producto GRATIS";
      default:
        return "Beneficio especial";
    }
  };

  // Filtrar beneficios aplicables según el contexto
  const beneficiosAplicables = modoSeleccion && emprendimientoId
    ? beneficiosActivos.filter(b => {
        // Si es un beneficio de premium, no aplica para compras
        if (b.tipo_beneficio === 'premium_gratis') return false;
        
        // Si el beneficio es para un emprendimiento específico, verificar que coincida
        if (b.emprendimiento_id && b.emprendimiento_id !== emprendimientoId) return false;
        
        return true;
      })
    : beneficiosActivos;

  if (cargandoCupones) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
          Cargando cupones...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextos}>
            <Text style={styles.headerSubtitle}>
              {modoSeleccion ? "Selecciona un cupón" : "Gestiona tus beneficios"}
            </Text>
            <Text style={styles.headerTitle}>
              {modoSeleccion ? "Aplicar Descuento" : "Mis Cupones"}
            </Text>
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="ticket" size={30} color="white" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.primary}
            colors={[currentTheme.primary]}
          />
        }
      >
        {/* Formulario de ingreso de cupón */}
        {!modoSeleccion && (
          <View style={[styles.formCard, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.formHeader}>
              <Ionicons name="add-circle" size={24} color={currentTheme.primary} />
              <Text style={[styles.formTitulo, { color: currentTheme.text }]}>
                ¿Tienes un código?
              </Text>
            </View>

            <View style={[styles.inputContainer, { borderColor: currentTheme.border }]}>
              <Ionicons name="ticket-outline" size={22} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.input, { color: currentTheme.text }]}
                value={codigoCupon}
                onChangeText={(text) => {
                  setCodigoCupon(text.toUpperCase());
                  setCuponValidado(null);
                }}
                placeholder="Ingresa tu código"
                placeholderTextColor={currentTheme.textSecondary}
                autoCapitalize="characters"
                maxLength={50}
              />
              {codigoCupon.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setCodigoCupon("");
                    setCuponValidado(null);
                  }}
                >
                  <Ionicons name="close-circle" size={22} color={currentTheme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {cuponValidado && (
              <View style={[styles.cuponValidadoCard, { backgroundColor: currentTheme.background }]}>
                <LinearGradient
                  colors={[getColorBeneficio(cuponValidado.tipo_beneficio), getColorBeneficio(cuponValidado.tipo_beneficio) + '99']}
                  style={styles.cuponValidadoIcono}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={getIconoBeneficio(cuponValidado.tipo_beneficio)} size={28} color="white" />
                </LinearGradient>
                <View style={styles.cuponValidadoInfo}>
                  <Text style={[styles.cuponValidadoTitulo, { color: currentTheme.text }]}>
                    {cuponValidado.descripcion}
                  </Text>
                  <Text style={[styles.cuponValidadoValor, { color: getColorBeneficio(cuponValidado.tipo_beneficio) }]}>
                    {formatearBeneficio(cuponValidado.tipo_beneficio, cuponValidado.valor_beneficio)}
                  </Text>
                  {cuponValidado.emprendimiento_nombre && (
                    <Text style={[styles.cuponValidadoDetalle, { color: currentTheme.textSecondary }]}>
                      📍 Válido en: {cuponValidado.emprendimiento_nombre}
                    </Text>
                  )}
                  {cuponValidado.producto_nombre && (
                    <Text style={[styles.cuponValidadoDetalle, { color: currentTheme.textSecondary }]}>
                      🎁 Producto: {cuponValidado.producto_nombre}
                    </Text>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={32} color="#27ae60" />
              </View>
            )}

            <View style={styles.formBotones}>
              <TouchableOpacity
                style={[styles.botonValidar, cuponValidado && styles.botonValidado]}
                onPress={cuponValidado ? canjearCupon : validarCupon}
                disabled={validandoCupon || canjeandoCupon || codigoCupon.trim().length === 0}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={cuponValidado ? ['#27ae60', '#229954'] : [currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {validandoCupon || canjeandoCupon ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={cuponValidado ? "gift" : "search"}
                        size={20}
                        color="white"
                      />
                      <Text style={styles.botonTexto}>
                        {cuponValidado ? "Canjear Cupón" : "Validar Código"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBox, { backgroundColor: currentTheme.primary + '10', borderLeftColor: currentTheme.primary }]}>
              <Ionicons name="information-circle" size={18} color={currentTheme.primary} />
              <Text style={[styles.infoTexto, { color: currentTheme.primary }]}>
                Los cupones pueden otorgar descuentos, envío gratis, días de Premium y más beneficios
              </Text>
            </View>
          </View>
        )}

        {/* Beneficios Activos */}
        {(modoSeleccion ? beneficiosAplicables : beneficiosActivos).length > 0 && (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="sparkles" size={22} color={currentTheme.primary} />
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                {modoSeleccion ? "Cupones Disponibles" : "Beneficios Activos"}
              </Text>
              <View style={[styles.badge, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.badgeTexto}>
                  {(modoSeleccion ? beneficiosAplicables : beneficiosActivos).length}
                </Text>
              </View>
            </View>

            {(modoSeleccion ? beneficiosAplicables : beneficiosActivos).map((beneficio) => {
              const color = getColorBeneficio(beneficio.tipo_beneficio);
              const fechaExpiracion = beneficio.fecha_expiracion ? new Date(beneficio.fecha_expiracion) : null;
              const diasRestantes = fechaExpiracion
                ? Math.ceil((fechaExpiracion - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <TouchableOpacity
                  key={beneficio.id}
                  style={[styles.beneficioCard, { backgroundColor: currentTheme.cardBackground }]}
                  onPress={modoSeleccion ? () => seleccionarCupon(beneficio) : null}
                  activeOpacity={modoSeleccion ? 0.7 : 1}
                  disabled={!modoSeleccion}
                >
                  <LinearGradient
                    colors={[color, color + '99']}
                    style={styles.beneficioIcono}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={getIconoBeneficio(beneficio.tipo_beneficio)} size={28} color="white" />
                  </LinearGradient>

                  <View style={styles.beneficioInfo}>
                    <Text style={[styles.beneficioDescripcion, { color: currentTheme.text }]}>
                      {beneficio.descripcion}
                    </Text>
                    <Text style={[styles.beneficioValor, { color }]}>
                      {formatearBeneficio(beneficio.tipo_beneficio, beneficio.valor)}
                    </Text>
                    {diasRestantes !== null && diasRestantes > 0 && (
                      <View style={styles.beneficioExpiracion}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={diasRestantes <= 7 ? "#e74c3c" : currentTheme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.beneficioExpiracionTexto,
                            {
                              color: diasRestantes <= 7 ? "#e74c3c" : currentTheme.textSecondary,
                            },
                          ]}
                        >
                          {diasRestantes === 1
                            ? "Expira mañana"
                            : `${diasRestantes} días restantes`}
                        </Text>
                      </View>
                    )}
                    {beneficio.emprendimiento_id && (
                      <Text style={[styles.beneficioDetalle, { color: currentTheme.textSecondary }]}>
                        📍 Válido en emprendimiento específico
                      </Text>
                    )}
                  </View>

                  {modoSeleccion && (
                    <Ionicons name="chevron-forward" size={24} color={currentTheme.textSecondary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Cupones Canjeados */}
        {!modoSeleccion && misCupones.length > 0 && (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="receipt-outline" size={22} color={currentTheme.primary} />
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                Historial de Cupones
              </Text>
              <View style={[styles.badge, { backgroundColor: currentTheme.textSecondary }]}>
                <Text style={styles.badgeTexto}>{misCupones.length}</Text>
              </View>
            </View>

            {misCupones.map((cupon) => {
              const color = getColorBeneficio(cupon.tipo_beneficio);
              const esUsado = cupon.estado === "usado";
              const esExpirado = cupon.estado === "expirado";

              return (
                <View
                  key={cupon.id}
                  style={[
                    styles.cuponHistorialCard,
                    { backgroundColor: currentTheme.cardBackground },
                    (esUsado || esExpirado) && styles.cuponInactivo,
                  ]}
                >
                  <LinearGradient
                    colors={[color + '30', color + '15']}
                    style={styles.cuponHistorialIcono}
                  >
                    <Ionicons name={getIconoBeneficio(cupon.tipo_beneficio)} size={24} color={color} />
                  </LinearGradient>

                  <View style={styles.cuponHistorialInfo}>
                    <Text style={[styles.cuponHistorialCodigo, { color: currentTheme.text }]}>
                      {cupon.codigo}
                    </Text>
                    <Text style={[styles.cuponHistorialDescripcion, { color: currentTheme.textSecondary }]}>
                      {cupon.descripcion}
                    </Text>
                    <Text style={[styles.cuponHistorialFecha, { color: currentTheme.textSecondary }]}>
                      Canjeado: {new Date(cupon.fecha_canje).toLocaleDateString("es-CL")}
                    </Text>
                  </View>

                  <View style={[
                    styles.estadoBadge,
                    {
                      backgroundColor: esUsado
                        ? "#95a5a6" + '20'
                        : esExpirado
                        ? "#e74c3c" + '20'
                        : "#27ae60" + '20',
                    },
                  ]}>
                    <Text
                      style={[
                        styles.estadoBadgeTexto,
                        {
                          color: esUsado ? "#95a5a6" : esExpirado ? "#e74c3c" : "#27ae60",
                        },
                      ]}
                    >
                      {esUsado ? "Usado" : esExpirado ? "Expirado" : "Activo"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Estado vacío */}
        {!modoSeleccion && beneficiosActivos.length === 0 && misCupones.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: currentTheme.primary + '10' }]}>
              <Ionicons name="ticket-outline" size={64} color={currentTheme.primary} />
            </View>
            <Text style={[styles.emptyTitulo, { color: currentTheme.text }]}>
              No tienes cupones canjeados
            </Text>
            <Text style={[styles.emptySubtitulo, { color: currentTheme.textSecondary }]}>
              Ingresa un código arriba para obtener descuentos y beneficios especiales
            </Text>
          </View>
        )}

        {/* Estado vacío en modo selección */}
        {modoSeleccion && beneficiosAplicables.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: currentTheme.textSecondary + '10' }]}>
              <Ionicons name="alert-circle-outline" size={64} color={currentTheme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitulo, { color: currentTheme.text }]}>
              No hay cupones disponibles
            </Text>
            <Text style={[styles.emptySubtitulo, { color: currentTheme.textSecondary }]}>
              No tienes cupones aplicables para este emprendimiento
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de Éxito */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalExito}
        onRequestClose={() => setModalExito(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
            <LinearGradient
              colors={["#27ae60", "#229954"]}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalIconWrapper}>
                <Ionicons name="checkmark-circle" size={64} color="white" />
              </View>
              <Text style={styles.modalTitulo}>¡Cupón Canjeado!</Text>
              <Text style={styles.modalSubtitulo}>
                {cuponCanjeado?.descripcion || "Tu beneficio está activo"}
              </Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              {cuponCanjeado && (
                <>
                  <View style={[styles.modalInfoBox, { backgroundColor: currentTheme.background }]}>
                    <Text style={[styles.modalInfoLabel, { color: currentTheme.textSecondary }]}>
                      Código:
                    </Text>
                    <Text style={[styles.modalInfoValor, { color: currentTheme.text }]}>
                      {cuponCanjeado.cupon_codigo}
                    </Text>
                  </View>

                  <View style={[styles.modalInfoBox, { backgroundColor: currentTheme.background }]}>
                    <Text style={[styles.modalInfoLabel, { color: currentTheme.textSecondary }]}>
                      Beneficio:
                    </Text>
                    <Text style={[styles.modalInfoValor, { color: currentTheme.text }]}>
                      {formatearBeneficio(cuponCanjeado.tipo_beneficio, cuponCanjeado.valor_beneficio)}
                    </Text>
                  </View>

                  {cuponCanjeado.fecha_expiracion && (
                    <View style={[styles.modalInfoBox, { backgroundColor: currentTheme.background }]}>
                      <Text style={[styles.modalInfoLabel, { color: currentTheme.textSecondary }]}>
                        {cuponCanjeado.tipo_beneficio === 'premium_gratis' ? 'Premium hasta:' : 'Válido hasta:'}
                      </Text>
                      <Text style={[styles.modalInfoValor, { color: currentTheme.text }]}>
                        {new Date(cuponCanjeado.fecha_expiracion).toLocaleDateString("es-CL")}
                      </Text>
                    </View>
                  )}

                  {cuponCanjeado.tipo_beneficio === 'premium_gratis' && (
                    <View style={[styles.modalInfoBox, { backgroundColor: '#27ae60' + '10' }]}>
                      <Ionicons name="information-circle" size={18} color="#27ae60" />
                      <Text style={[styles.infoTexto, { color: '#27ae60', fontSize: 13 }]}>
                        Tu plan premium ha sido {usuario?.plan_id === 2 ? 'extendido' : 'activado'}. Revisa "Mi Plan" para ver todos los detalles.
                      </Text>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.modalBoton}
                onPress={() => setModalExito(false)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark" size={22} color="white" />
                  <Text style={styles.botonTexto}>Entendido</Text>
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
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTextos: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  headerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Formulario
  formCard: {
    margin: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  formTitulo: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cuponValidadoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#27ae60",
  },
  cuponValidadoIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cuponValidadoInfo: {
    flex: 1,
    gap: 4,
  },
  cuponValidadoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cuponValidadoValor: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cuponValidadoDetalle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  formBotones: {
    gap: 12,
  },
  botonValidar: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  botonValidado: {
    shadowColor: "#27ae60",
  },
  botonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  botonTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    borderLeftWidth: 3,
  },
  infoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  // Secciones
  seccion: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  seccionTitulo: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  // Beneficios Activos
  beneficioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  beneficioIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  beneficioInfo: {
    flex: 1,
    gap: 4,
  },
  beneficioDescripcion: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  beneficioValor: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  beneficioExpiracion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  beneficioExpiracionTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  beneficioDetalle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  // Cupones Historial
  cuponHistorialCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cuponInactivo: {
    opacity: 0.6,
  },
  cuponHistorialIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cuponHistorialInfo: {
    flex: 1,
    gap: 4,
  },
  cuponHistorialCodigo: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cuponHistorialDescripcion: {
    fontSize: 14,
    fontWeight: "500",
  },
  cuponHistorialFecha: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoBadgeTexto: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitulo: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitulo: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    padding: 32,
    alignItems: "center",
  },
  modalIconWrapper: {
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalSubtitulo: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
  },
  modalBody: {
    padding: 24,
    gap: 12,
  },
  modalInfoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalInfoValor: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  modalBoton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default CuponesScreen;

