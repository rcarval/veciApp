import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Platform
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_ENDPOINTS } from "../config/api";
import { useTheme } from "../context/ThemeContext";

const EmprendimientoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const usuario = route.params?.usuario ?? {};
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lógica de planes
  // plan_id: 2 = Premium, null/1 = Básico
  // Si está cancelada pero la vigencia no ha expirado, sigue siendo premium
  const tienePlanPremium = usuario?.plan_id == 2; // Comparación flexible (== en lugar de ===)
  const vigenciaActiva = usuario?.vigencia_hasta && new Date(usuario.vigencia_hasta) > new Date();
  const esPlanPremium = tienePlanPremium && vigenciaActiva;
  
  const limitEmprendimientos = esPlanPremium ? 3 : 1;
  const puedeAgregarMas = emprendimientos.length < limitEmprendimientos;
  
  console.log('Plan ID:', usuario?.plan_id, '| Tipo:', typeof usuario?.plan_id, '| Vigencia:', usuario?.vigencia_hasta, '| Es Premium:', esPlanPremium);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEmprendimiento, setCurrentEmprendimiento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados para el formulario
  const [nombre, setNombre] = useState("");
  const [descripcionCorta, setDescripcionCorta] = useState("");
  const [descripcionLarga, setDescripcionLarga] = useState("");
  const [comuna, setComuna] = useState("1");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [logo, setLogo] = useState(null);
  const [background, setBackground] = useState(null);
  const [validandoDireccion, setValidandoDireccion] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState(
    []
  );
  const [categorias, setCategorias] = useState([]); // Ahora dinámicas desde backend
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  
  // Estados adicionales para validación con mapa
  const [region, setRegion] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [direccionValidada, setDireccionValidada] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  
  // Estados para verificación por SMS
  const [modalVerificacionVisible, setModalVerificacionVisible] = useState(false);
  const [emprendimientoParaVerificar, setEmprendimientoParaVerificar] = useState(null);
  const [codigoVerificacion, setCodigoVerificacion] = useState(['', '', '', '', '', '']);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  
  // Referencias para los inputs de código
  const codigoInputRefs = useRef([]);
  codigoInputRefs.current = [0, 1, 2, 3, 4, 5].map(
    (_, i) => codigoInputRefs.current[i] || React.createRef()
  );
  
  // Cargar categorías desde el backend
  const cargarCategorias = async () => {
    try {
      setCargandoCategorias(true);
      const response = await fetch(API_ENDPOINTS.CATEGORIAS);
      const data = await response.json();
      
      if (response.ok && data.ok) {
        setCategorias(data.categorias);
      } else {
        console.error('Error al cargar categorías:', data);
        // Fallback a categorías por defecto si falla
        setCategorias([]);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategorias([]);
    } finally {
      setCargandoCategorias(false);
    }
  };

  // Definir estructura inicial de horarios
  const horariosIniciales = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
    Sábado: [],
    Domingo: [],
  };
  const [horarios, setHorarios] = useState(horariosIniciales);
  const [diaSeleccionado, setDiaSeleccionado] = useState("Lunes");
  const [mostrarModalHorario, setMostrarModalHorario] = useState(false);
  const [horarioEditando, setHorarioEditando] = useState(null);

  const [mediosPago, setMediosPago] = useState({
    efectivo: false,
    tarjeta: false,
    transferencia: false,
  });

  const [tiposEntrega, setTiposEntrega] = useState({
    retiro: false,
    delivery: false,
  });
  const [costoDelivery, setCostoDelivery] = useState("");

  // Comunas disponibles
  const comunas = [
    { id: "1", nombre: "Isla de Maipo" },
    { id: "2", nombre: "Talagante" },
  ];

  // Función de notificaciones eliminada
  async function registerForPushNotificationsAsync() {
    console.log('Notificaciones no disponibles');
    return null;
  }

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Obtener ubicación actual del usuario
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso de ubicación denegado");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);
  // Cargar emprendimientos al iniciar
  const ModalHorario = ({
    visible,
    onClose,
    onSave,
    horarioExistente,
    diaSeleccionado,
    setDiaSeleccionado,
  }) => {
    const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
    const [diaParaAgregar, setDiaParaAgregar] = useState("Lunes");
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [horaFin, setHoraFin] = useState(new Date());
    const [error, setError] = useState("");

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const formatHora = (date) => {
      return date.toTimeString().slice(0, 5);
    };

    const handleChangeInicio = (event, selectedDate) => {
      setShowInicioPicker(false);
      if (selectedDate) {
        setHoraInicio(selectedDate);
        setError("");
      }
    };

    const handleChangeFin = (event, selectedDate) => {
      setShowFinPicker(false);
      if (selectedDate) {
        setHoraFin(selectedDate);
        setError("");
      }
    };

    const validarHorario = () => {
      if (horaInicio >= horaFin) {
        setError("⚠️ La hora de inicio debe ser anterior a la de cierre");
        return false;
      }
      setError("");
      return true;
    };

    const abrirModalAgregar = (dia) => {
      // Solo actualizar estados locales, NO el estado padre
      setDiaParaAgregar(dia);
      // Resetear horas a valores por defecto
      const inicioDefault = new Date();
      inicioDefault.setHours(8, 0, 0, 0);
      const finDefault = new Date();
      finDefault.setHours(18, 0, 0, 0);
      setHoraInicio(inicioDefault);
      setHoraFin(finDefault);
      setError("");
      setShowInicioPicker(false);
      setShowFinPicker(false);
      setModalAgregarVisible(true);
    };

    const handleSave = () => {
      if (validarHorario()) {
        // Pasar el día específico directamente, sin actualizar estado padre
        onSave({
          inicio: formatHora(horaInicio),
          fin: formatHora(horaFin),
        }, diaParaAgregar);
        
        setError("");
        setModalAgregarVisible(false);
        setShowInicioPicker(false);
        setShowFinPicker(false);
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalHorarioFullScreen}>
          {/* Header fijo */}
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.modalHorarioHeaderFull}
          >
            <View style={styles.modalHorarioHeaderContent}>
              <TouchableOpacity onPress={() => {
                onClose();
                setError("");
              }}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalHorarioTitleFull}>Gestionar Horarios</Text>
              <View style={{ width: 28 }} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalHorarioScrollContent}>
            {/* Vista de calendario semanal */}
            <View style={styles.calendarioSemanalContainer}>
              <Text style={styles.calendarioTitulo}>📅 Horarios de la Semana</Text>
              <Text style={styles.calendarioSubtitulo}>Toca un día para agregar horarios</Text>
              
              {diasSemana.map((dia) => {
                const horariosDia = horarios[dia] || [];
                const tieneHorarios = horariosDia.length > 0;

                return (
                  <TouchableOpacity
                    key={dia}
                    style={styles.calendarioDiaRow}
                    onPress={() => abrirModalAgregar(dia)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.calendarioDiaInfo}>
                      <View style={styles.calendarioDiaHeader}>
                        <Text style={styles.calendarioDiaNombre}>{dia}</Text>
                        <Ionicons name="add-circle-outline" size={22} color={currentTheme.primary} />
                      </View>
                      {tieneHorarios ? (
                        <View style={styles.calendarHorariosLista}>
                          {horariosDia.map((horario, idx) => (
                            <View key={idx} style={[styles.calendarHorarioChip, { backgroundColor: currentTheme.primary }]}>
                              <Text style={styles.calendarHorarioTexto}>
                                {horario.inicio} - {horario.fin}
                              </Text>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  eliminarHorario(dia, horario.id);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="close-circle" size={16} color="white" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.calendarioSinHorario}>Toca para agregar horario</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal secundario para agregar horario */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalAgregarVisible}
              onRequestClose={() => setModalAgregarVisible(false)}
            >
              <View style={styles.modalSecundarioOverlay}>
                <View style={styles.modalSecundarioContent}>
                  <View style={styles.modalSecundarioHeader}>
                    <Text style={styles.modalSecundarioTitulo}>
                      Horario para {diaParaAgregar}
                    </Text>
                    <TouchableOpacity onPress={() => setModalAgregarVisible(false)}>
                      <Ionicons name="close" size={28} color="#7f8c8d" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.horasContainerModal}>
                    <View style={styles.horaInputGroupModal}>
                      <Text style={styles.horaLabelModal}>Apertura</Text>
                      <TouchableOpacity
                        style={[styles.horaButtonModal, { borderColor: currentTheme.primary }]}
                        onPress={() => {
                          setShowFinPicker(false);
                          setShowInicioPicker(true);
                        }}
                      >
                        <Ionicons name="time-outline" size={24} color={currentTheme.primary} />
                        <Text style={styles.horaButtonTextModal}>{formatHora(horaInicio)}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.horaSeparatorModal}>
                      <Ionicons name="arrow-forward" size={24} color="#bdc3c7" />
                    </View>

                    <View style={styles.horaInputGroupModal}>
                      <Text style={styles.horaLabelModal}>Cierre</Text>
                      <TouchableOpacity
                        style={[styles.horaButtonModal, { borderColor: currentTheme.primary }]}
                        onPress={() => {
                          setShowInicioPicker(false);
                          setShowFinPicker(true);
                        }}
                      >
                        <Ionicons name="time-outline" size={24} color={currentTheme.primary} />
                        <Text style={styles.horaButtonTextModal}>{formatHora(horaFin)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {showInicioPicker && (
                    <DateTimePicker
                      value={horaInicio}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleChangeInicio}
                    />
                  )}

                  {showFinPicker && (
                    <DateTimePicker
                      value={horaFin}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleChangeFin}
                    />
                  )}

                  {error ? (
                    <View style={styles.errorContainerModal}>
                      <Text style={styles.errorTextModerno}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.botonesModalSecundario}>
                    <TouchableOpacity
                      style={styles.botonCancelarModal}
                      onPress={() => {
                        setModalAgregarVisible(false);
                        setError("");
                      }}
                    >
                      <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.botonGuardarModal, { backgroundColor: currentTheme.primary }]}
                      onPress={handleSave}
                    >
                      <Ionicons name="checkmark" size={24} color="white" />
                      <Text style={styles.botonGuardarTexto}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const ListaHorarios = ({ horarios, onEdit, onDelete }) => {
    const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const tieneHorarios = Object.values(horarios).some((dia) => dia.length > 0);

    return (
      <View style={styles.listaHorariosContainer}>
        <Text style={styles.listaHorariosTitulo}>Horarios Configurados</Text>

        {tieneHorarios ? (
          <View style={styles.horariosCompactos}>
            {diasOrdenados.map((dia) => {
              const horariosDia = horarios[dia] || [];
              if (horariosDia.length === 0) return null;

              return (
                <View key={dia} style={styles.diaHorarioRow}>
                  <View style={styles.diaHorarioInfo}>
                    <Text style={styles.diaTextoCompacto}>{dia}</Text>
                    <View style={styles.horariosChips}>
                      {horariosDia.map((horario, index) => (
                        <View key={`${dia}-${index}`} style={styles.horarioChip}>
                          <Text style={styles.horarioChipTexto}>
                            {horario.inicio} - {horario.fin}
                          </Text>
                          <TouchableOpacity
                            onPress={() => onDelete(dia, horario.id)}
                            style={styles.horarioDeleteButton}
                          >
                            <Ionicons name="close-circle" size={16} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.sinHorariosContainer}>
            <Ionicons name="time-outline" size={40} color="#bdc3c7" />
            <Text style={styles.sinHorariosText}>
              No hay horarios configurados
            </Text>
            <Text style={styles.sinHorariosSubtext}>
              Toca el botón de arriba para agregar
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Componente para mostrar los horarios de un día
  const HorariosDia = ({ dia, horarios, onAdd, onEdit, onDelete }) => {
    return (
      <View style={styles.horariosDiaContainer}>
        <Text style={styles.horariosDiaTitle}>{dia}</Text>

        {horarios.length === 0 ? (
          <Text style={styles.horariosDiaEmpty}>No hay horarios definidos</Text>
        ) : (
          <View style={styles.horariosList}>
            {horarios.map((horario) => (
              <View key={horario.id} style={styles.horarioItem}>
                <Text style={styles.horarioText}>
                  {horario.inicio} - {horario.fin}
                </Text>

                <View style={styles.horarioActions}>
                  <TouchableOpacity onPress={() => onEdit(horario)}>
                    <MaterialIcons name="edit" size={18} color="#2A9D8F" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => onDelete(horario.id)}>
                    <MaterialIcons name="delete" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addHorarioButton} onPress={onAdd}>
          <Text style={styles.addHorarioButtonText}>+ Agregar Horario</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Función para validar solapamiento de horarios
  const validarSolapamiento = (horarios, nuevoHorario) => {
    const [nuevoInicioH, nuevoInicioM] = nuevoHorario.inicio
      .split(":")
      .map(Number);
    const [nuevoFinH, nuevoFinM] = nuevoHorario.fin.split(":").map(Number);

    for (const horario of horarios) {
      const [inicioH, inicioM] = horario.inicio.split(":").map(Number);
      const [finH, finM] = horario.fin.split(":").map(Number);

      // Convertir a minutos para facilitar la comparación
      const nuevoInicio = nuevoInicioH * 60 + nuevoInicioM;
      const nuevoFin = nuevoFinH * 60 + nuevoFinM;
      const inicioExistente = inicioH * 60 + inicioM;
      const finExistente = finH * 60 + finM;

      // Verificar solapamiento
      if (
        (nuevoInicio >= inicioExistente && nuevoInicio < finExistente) ||
        (nuevoFin > inicioExistente && nuevoFin <= finExistente) ||
        (nuevoInicio <= inicioExistente && nuevoFin >= finExistente)
      ) {
        return false; // Hay solapamiento
      }
    }

    return true; // No hay solapamiento
  };

  const agregarHorario = () => {
    setHorarioEditando(null);
    setMostrarModalHorario(true);
  };

  const editarHorario = (dia, horario) => {
    setDiaSeleccionado(dia);
    setHorarioEditando(horario);
    setMostrarModalHorario(true);
  };

  const eliminarHorario = (dia, id) => {
    const nuevosHorarios = { ...horarios };
    nuevosHorarios[dia] = (nuevosHorarios[dia] || []).filter((h) => h.id !== id);
    setHorarios(nuevosHorarios);
  };

  const guardarHorario = ({ inicio, fin }, diaEspecifico) => {
    const dia = diaEspecifico || diaSeleccionado;
    const horariosDia = [...(horarios[dia] || [])];

    const horariosParaValidar = horarioEditando
      ? horariosDia.filter((h) => h.id !== horarioEditando.id)
      : horariosDia;

    if (!validarSolapamiento(horariosParaValidar, { inicio, fin })) {
      Alert.alert("Error", "Este horario se solapa con otro ya existente");
      return;
    }

    if (horarioEditando) {
      const nuevosHorarios = { ...horarios };
      nuevosHorarios[dia] = horariosDia.map((h) =>
        h.id === horarioEditando.id ? { ...h, inicio, fin } : h
      );
      setHorarios(nuevosHorarios);
    } else {
      const nuevoHorarioConId = {
        inicio,
        fin,
        id: Date.now().toString(),
      };
      setHorarios({
        ...horarios,
        [dia]: [...horariosDia, nuevoHorarioConId],
      });
    }
  };

  // Función para validar que al menos un día tenga horarios definidos
  const validarHorarios = () => {
    return Object.values(horarios).some((dia) => dia.length > 0);
  };

  // Función para obtener ubicación exacta
  const getCurrentLocation = async () => {
    try {
      setIsSearching(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom más cercano
        longitudeDelta: 0.005,
      };

      setUserLocation(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Obtener dirección
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = [
          address.street,
          address.streetNumber,
          address.subregion,
          address.city,
        ]
          .filter(Boolean)
          .join(", ");
        setCurrentAddress(formattedAddress);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo obtener la ubicación");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    cargarEmprendimientos();
    cargarCategorias();
  }, []);


  // Modificar el campo de dirección en el modal:
  const renderAddressField = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Dirección*</Text>
      <TouchableOpacity
        style={styles.direccionButton}
        onPress={openMapPicker}
      >
        <View style={styles.direccionButtonContent}>
          <Ionicons name="map" size={20} color={currentTheme.primary} />
          <Text style={[styles.direccionButtonText, direccion && styles.direccionButtonTextFilled]}>
            {direccion || "Selecciona en el mapa"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#bdc3c7" />
        </View>
      </TouchableOpacity>
      {direccionValidada && (
        <View style={styles.validacionContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
          <Text style={styles.validacionText}>Dirección validada</Text>
        </View>
      )}
      {validandoDireccion && (
        <View style={styles.validandoContainer}>
          <ActivityIndicator size="small" color={currentTheme.primary} />
          <Text style={styles.validandoText}>Validando dirección...</Text>
        </View>
      )}
    </View>
  );

  // Modal del mapa mejorado
  const renderMapModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={mapModalVisible}
      statusBarTranslucent={true}
    >
      <View style={styles.mapModalContainer}>
        {/* Encabezado */}
        <LinearGradient
          colors={[currentTheme.primary, currentTheme.secondary]}
          style={styles.mapModalHeader}
        >
          <TouchableOpacity
            style={styles.mapBackButton}
            onPress={() => setMapModalVisible(false)}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.mapModalTitle}>Seleccionar ubicación</Text>
        </LinearGradient>

        {/* Contenedor principal del mapa */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Ubicación seleccionada"
              >
                <View style={styles.customMarker}>
                  <Ionicons name="location" size={30} color={currentTheme.primary} />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.mapBottomPanel}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={18} color={currentTheme.primary} />
              <Text style={styles.locationLabel}>Dirección:</Text>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.addressInput}
                value={currentAddress}
                onChangeText={setCurrentAddress}
                placeholder="Escribe una dirección o selecciona en el mapa"
                multiline={true}
                numberOfLines={2}
              />
              <TouchableOpacity
                style={[styles.searchButton, buscandoDireccion && styles.searchButtonDisabled]}
                onPress={() => buscarDireccionEnMapa(currentAddress)}
                disabled={buscandoDireccion}
              >
                {buscandoDireccion ? (
                  <Ionicons name="hourglass" size={20} color="#bdc3c7" />
                ) : (
                  <Ionicons name="search" size={20} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.mapActions}>
              <TouchableOpacity
                style={styles.cancelMapButton}
                onPress={() => setMapModalVisible(false)}
              >
                <Text style={styles.cancelMapButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmMapButton, 
                  { backgroundColor: currentTheme.primary },
                  validandoDireccion && styles.disabledButton
                ]}
                onPress={confirmMapLocation}
                disabled={validandoDireccion}
              >
                {validandoDireccion ? (
                  <Text style={styles.confirmMapButtonText}>Validando...</Text>
                ) : (
                  <Text style={styles.confirmMapButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const buscarDireccion = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      // Obtener el nombre de la comuna basado en el ID seleccionado
      const comunaSeleccionada = comunas.find((c) => c.id === comuna);
      const comunaNombre = comunaSeleccionada
        ? `, ${comunaSeleccionada.nombre}, Chile`
        : ", Chile";
      const apiKey = "AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4"; // Reemplaza con tu API key
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery + comunaNombre
        )}&key=${apiKey}&region=cl`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.005, // Zoom más cercano
          longitudeDelta: 0.005,
        };

        setUserLocation(newRegion);
        setSelectedLocation({
          latitude: location.lat,
          longitude: location.lng,
        });

        // Actualizar la dirección mostrada
        setCurrentAddress(data.results[0].formatted_address);
      } else {
        Alert.alert("Error", "No se encontró la dirección");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo completar la búsqueda");
    } finally {
      setIsSearching(false);
    }
  };

  // Función para abrir el mapa (nueva función mejorada)
  const openMapPicker = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesitan permisos de ubicación para usar el mapa');
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom más cercano
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Obtener dirección actual
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setCurrentAddress(`${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`.trim());
      }

      setMapModalVisible(true);
    } catch (error) {
      console.log('Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  // Función para manejar el press en el mapa (nueva función mejorada)
  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`.trim();
        setCurrentAddress(fullAddress);
      }
    } catch (error) {
      console.log('Error al obtener dirección:', error);
    }
  };

  // Función para confirmar la ubicación del mapa (nueva función mejorada)
  const confirmMapLocation = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Por favor selecciona una ubicación en el mapa");
      return;
    }

    setValidandoDireccion(true);
    try {
      // Validar dirección con Google Maps
      const validationResult = await validarDireccionConGoogle(currentAddress, selectedLocation);
      
      if (validationResult.exacta) {
        setDireccionValidada(validationResult);
        setDireccion(validationResult.direccion);
        setMapModalVisible(false);
        Alert.alert("Éxito", "Dirección validada correctamente");
      } else {
        Alert.alert("Error", "La dirección no es lo suficientemente precisa. Por favor selecciona un punto más específico.");
      }
    } catch (error) {
      console.log('Error al validar dirección:', error);
      Alert.alert("Error", "No se pudo validar la dirección");
    } finally {
      setValidandoDireccion(false);
    }
  };

  // Función para buscar dirección y mover el mapa (nueva función mejorada)
  const buscarDireccionEnMapa = async (direccion) => {
    if (!direccion.trim()) return;

    setBuscandoDireccion(true);
    try {
      const API_KEY = "AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4";
      const encodedAddress = encodeURIComponent(direccion.trim());
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const resultado = data.results[0];
        const location = resultado.geometry.location;
        
        const newRegion = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.005, // Zoom más cercano
          longitudeDelta: 0.005,
        };

        setRegion(newRegion);
        setSelectedLocation({
          latitude: location.lat,
          longitude: location.lng,
        });

        // Actualizar la dirección mostrada con el formato completo
        setCurrentAddress(resultado.formatted_address);
      } else {
        Alert.alert("Error", "No se encontró la dirección especificada");
      }
    } catch (error) {
      console.log('Error al buscar dirección:', error);
      Alert.alert("Error", "No se pudo buscar la dirección");
    } finally {
      setBuscandoDireccion(false);
    }
  };

  // Función para validar dirección con Google Maps (nueva función mejorada)
  const validarDireccionConGoogle = async (direccion, coordenadas) => {
    try {
      const API_KEY = "AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4";
      const encodedAddress = encodeURIComponent(direccion);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const resultado = data.results[0];
        
        // Validar precisión (ROOFTOP = máxima precisión)
        if (resultado.geometry.location_type !== "ROOFTOP") {
          return { exacta: false };
        }

        // Verificar que las coordenadas coincidan aproximadamente
        const googleLat = resultado.geometry.location.lat;
        const googleLng = resultado.geometry.location.lng;
        const distancia = Math.sqrt(
          Math.pow(googleLat - coordenadas.latitude, 2) + 
          Math.pow(googleLng - coordenadas.longitude, 2)
        );

        // Si la distancia es menor a 0.001 grados (aproximadamente 100 metros)
        if (distancia < 0.001) {
          return {
            exacta: true,
            direccion: resultado.formatted_address,
            coordenadas: resultado.geometry.location,
          };
        }
      }

      return { exacta: false };
    } catch (error) {
      console.log('Error en validación Google:', error);
      return { exacta: false };
    }
  };

  const cargarEmprendimientos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        console.log("No hay token, no se pueden cargar emprendimientos");
        setEmprendimientos([]);
        return;
      }

      const response = await fetch(API_ENDPOINTS.MIS_EMPRENDIMIENTOS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // Mapear los datos del backend al formato esperado por el frontend
        // INCLUIR emprendimientos en verificación para poder completar el proceso
        const emprendimientosMapeados = data.emprendimientos.map(emp => ({
          id: emp.id.toString(),
          nombre: emp.nombre,
          descripcionCorta: emp.descripcion_corta || "",
          descripcionLarga: emp.descripcion_larga || "",
          comuna: emp.comuna_id?.toString() || "1",
          direccion: emp.direccion,
          telefono: emp.telefono || "",
          logo: emp.logo_url,
          background: emp.background_url,
          status: emp.estado || "pendiente",
          categoria: emp.categoria_principal,
          subcategorias: emp.subcategorias || [],
          horarios: emp.horarios || {},
          metodosPago: emp.medios_pago || {},
          metodosEntrega: {
            ...(emp.tipos_entrega || {}),
            deliveryCosto: emp.costo_delivery || "Consultar"
          },
          ubicacion: emp.latitud && emp.longitud ? {
            latitude: parseFloat(emp.latitud),
            longitude: parseFloat(emp.longitud)
          } : null,
          fechaCreacion: emp.fecha_creacion,
          esBorrador: emp.es_borrador || false,
          emprendimientoOriginalId: emp.emprendimiento_original_id || null,
        }));
        
        setEmprendimientos(emprendimientosMapeados);
      } else {
        console.error("Error al cargar emprendimientos:", data);
        setEmprendimientos([]);
      }
    } catch (error) {
      console.error("Error al cargar emprendimientos:", error);
      setEmprendimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const guardarImagenesRespaldo = async (logoUri, backgroundUri) => {
    try {
      await AsyncStorage.setItem(
        "emprendimiento_backup_images",
        JSON.stringify({
          logo: logoUri,
          background: backgroundUri,
        })
      );
    } catch (error) {
      console.error("Error al guardar imágenes de respaldo:", error);
    }
  };

  // Función para subir imagen al backend
  const subirImagenEmprendimiento = async (uri, tipo, emprendimientoId) => {
    try {
      setSubiendoImagen(true);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const formData = new FormData();
      formData.append(tipo, {
        uri: uri,
        type: 'image/jpeg',
        name: `${tipo}.jpg`,
      });

      const endpoint = tipo === 'logo' 
        ? API_ENDPOINTS.SUBIR_LOGO_EMPRENDIMIENTO(emprendimientoId)
        : API_ENDPOINTS.SUBIR_BACKGROUND_EMPRENDIMIENTO(emprendimientoId);

      console.log(`📤 Subiendo ${tipo} del emprendimiento ${emprendimientoId}...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        const imageUrl = tipo === 'logo' ? data.logo_url : data.background_url;
        console.log(`✅ ${tipo} subido exitosamente:`, imageUrl);
        return imageUrl;
      } else {
        throw new Error(data.mensaje || `Error al subir ${tipo}`);
      }
    } catch (error) {
      console.error(`❌ Error al subir ${tipo}:`, error);
      throw error;
    } finally {
      setSubiendoImagen(false);
    }
  };

  // Función para seleccionar y subir imagen
  const seleccionarImagen = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tus fotos para seleccionar imágenes.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === "logo" ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Guardar la URI localmente (se subirá al presionar "Guardar")
      if (tipo === "logo") {
        setLogo(result.assets[0].uri);
      } else {
        setBackground(result.assets[0].uri);
      }
    }
  };

  // Validar dirección con Google Maps (simulación)
  const validarDireccion = async (direccion, comunaNombre) => {
    // 1. Validación básica de entrada
    if (!direccion || !comunaNombre) {
      Alert.alert(
        "Error",
        "Debes ingresar una dirección y seleccionar una comuna" +
          direccion +
          ", " +
          comunaNombre
      );
      return false;
    }

    try {
      setValidandoDireccion(true);
      const apiKey = "AIzaSyC7UNb-61Xv8cAd_020VrzG7ccvXpTrJg4";
      const direccionCompleta = `${direccion}, ${comunaNombre}, Chile`;
      // 2. Llamada a la API de Geocoding
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          direccionCompleta
        )}&key=${apiKey}&language=es&region=cl`
      );

      const data = await response.json();
      // 3. Validación de respuesta
      if (data.status !== "OK") {
        Alert.alert("Error", "No se encontró la dirección");
        return false;
      }

      const resultado = data.results[0];

      // 4. Validación de precisión (ROOFTOP = máxima precisión)
      if (resultado.geometry.location_type !== "ROOFTOP") {
        //Alert.alert("Dirección inexacta", "Debes ingresar una dirección exacta con número");
        return false;
      }

      // 5. Extraer componentes clave
      const numero = resultado.address_components.find((c) =>
        c.types.includes("street_number")
      )?.long_name;

      const calle = resultado.address_components.find((c) =>
        c.types.includes("route")
      )?.long_name;

      const comunaEncontrada = resultado.address_components.find(
        (c) =>
          c.types.includes("administrative_area_level_3") ||
          c.types.includes("political")
      )?.long_name;

      // 6. Validación de coincidencia exacta
      const direccionAPI =
        `${calle} ${numero}, ${comunaEncontrada}`.toLowerCase();
      const direccionInput = direccionCompleta.toLowerCase();

      if (!direccionAPI.includes(direccionInput.split(",")[0].toLowerCase())) {
        Alert.alert(
          "Sugerencia",
          `¿Tal véz quisiste decir "${calle} ${numero}"?`,
          [
            { text: "No", style: "cancel" },
            { text: "Sí", onPress: () => setDireccion(`${calle} ${numero}`) },
          ]
        );
        return false;
      }
      // 7. Validación de comuna
      if (comunaEncontrada.toLowerCase() !== comunaNombre.toLowerCase()) {
        Alert.alert(
          "Comuna incorrecta",
          `La dirección pertenece a ${comunaEncontrada}`,
          [{ text: "Entendido" }]
        );
        return false;
      }

      return {
        exacta: true,
        direccion: `${calle} ${numero}, ${comunaEncontrada}`,
        coordenadas: resultado.geometry.location,
      };
    } catch (error) {
      Alert.alert("Error", "No se pudo validar la dirección");
      return false;
    } finally {
      setValidandoDireccion(false);
    }
  };

  const EstadoNegocio = ({ estado }) => {
    const getEstilo = () => {
      switch (estado.toLowerCase()) {
        case "activo":
          return { backgroundColor: "#4CAF50", color: "white" }; // Verde
        case "pendiente":
          return { backgroundColor: "#FFC107", color: "#333" }; // Amarillo
        case "rechazado":
          return { backgroundColor: "#F44336", color: "white" }; // Rojo
        default:
          return { backgroundColor: "#9E9E9E", color: "white" }; // Gris
      }
    };

    const estilo = getEstilo();

    return (
      <View style={[styles.estadoContainer, estilo]}>
        <Text style={styles.estadoText}>{estado.toUpperCase()}</Text>
      </View>
    );
  };

  // Guardar emprendimiento
  const guardarEmprendimiento = async () => {
    const direccionFinal = direccion;

    if (!direccionFinal) {
      Alert.alert("Error", "Por favor ingresa una dirección");
      return;
    }

    if (!nombre || !descripcionCorta || !direccion || !telefono) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return;
    }

    if (descripcionCorta.length > 50) {
      Alert.alert(
        "Error",
        "La descripción corta no puede exceder los 50 caracteres"
      );
      return;
    }

    if (descripcionLarga.length > 1000) {
      Alert.alert(
        "Error",
        "La descripción larga no puede exceder los 1000 caracteres"
      );
      return;
    }

    if (!validarHorarios()) {
      Alert.alert("Error", "Debes definir al menos un horario de atención");
      return;
    }

    if (!categoriaSeleccionada) {
      Alert.alert("Error", "Por favor selecciona una categoría principal");
      return;
    }

    if (subcategoriasSeleccionadas.length === 0) {
      Alert.alert("Error", "Por favor selecciona al menos una subcategoría");
      return;
    }

    // Obtener el nombre de la comuna basado en el ID seleccionado
    const comunaSeleccionada = comunas.find((c) => c.id === comuna);
    if (!comunaSeleccionada) {
      Alert.alert("Error", "Comuna no válida");
      return;
    }

    // Mostramos diálogo de confirmación
    Alert.alert(
      "Confirmar envío",
      `¿Estás seguro de que deseas ${
        isEditing ? "actualizar" : "enviar a evaluación"
      } este emprendimiento?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, confirmar",
          onPress: async () => {
            try {
              setGuardando(true);
              const token = await AsyncStorage.getItem("token");
              
              if (!token) {
                Alert.alert("Error", "No hay sesión activa");
                return;
              }

              // Preparar datos para el backend
              const emprendimientoData = {
                nombre,
                descripcion_corta: descripcionCorta,
                descripcion_larga: descripcionLarga,
                comuna_id: parseInt(comuna),
                direccion: currentAddress || direccion,
                telefono,
                categoria_principal: categoriaSeleccionada,
                subcategorias: subcategoriasSeleccionadas,
                horarios: horarios,
                medios_pago: mediosPago,
                tipos_entrega: tiposEntrega,
                costo_delivery: tiposEntrega.delivery ? costoDelivery : null,
                latitud: selectedLocation?.latitude || null,
                longitud: selectedLocation?.longitude || null,
              };

              let emprendimientoCreado;
              let data; // Declarar aquí para poder usarlo después
              
              if (isEditing) {
                // Actualizar emprendimiento existente
                const response = await fetch(
                  API_ENDPOINTS.EMPRENDIMIENTO_BY_ID(currentEmprendimiento.id),
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(emprendimientoData),
                  }
                );

                data = await response.json();
                if (!response.ok || !data.ok) {
                  throw new Error(data.mensaje || "Error al actualizar emprendimiento");
                }
                emprendimientoCreado = data.emprendimiento;
              } else {
                // Crear nuevo emprendimiento
                const response = await fetch(API_ENDPOINTS.EMPRENDIMIENTOS, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                  body: JSON.stringify(emprendimientoData),
                });

                data = await response.json();
                if (!response.ok || !data.ok) {
                  throw new Error(data.mensaje || "Error al crear emprendimiento");
                }
                emprendimientoCreado = data.emprendimiento;
              }

              // Si hay imágenes locales seleccionadas, subirlas
              const emprendimientoId = emprendimientoCreado.id.toString();
              if (logo && !logo.startsWith('http')) {
                try {
                  console.log('📤 Subiendo logo...');
                  await subirImagenEmprendimiento(logo, 'logo', emprendimientoId);
                  console.log('✅ Logo subido correctamente');
                } catch (error) {
                  console.error('❌ Error al subir logo:', error);
                }
              }
              if (background && !background.startsWith('http')) {
                try {
                  console.log('📤 Subiendo background...');
                  await subirImagenEmprendimiento(background, 'background', emprendimientoId);
                  console.log('✅ Background subido correctamente');
                } catch (error) {
                  console.error('❌ Error al subir background:', error);
                }
              }

              // Recargar lista de emprendimientos
              await cargarEmprendimientos();
              
              resetForm();
              setModalVisible(false);
              
              // Si requiere verificación, abrir modal de verificación
              if (data.requiere_verificacion) {
                setEmprendimientoParaVerificar(emprendimientoCreado);
                setModalVerificacionVisible(true);
                
                // Esperar a que el modal se abra y luego enviar código
                setTimeout(async () => {
                  await enviarCodigoVerificacion(emprendimientoCreado.id);
                }, 500);
              } else {
                Alert.alert(
                  "Éxito",
                  `Emprendimiento ${
                    isEditing ? "actualizado" : "creado"
                  } correctamente`
                );
              }
            } catch (error) {
              console.error("Error al guardar emprendimiento:", error);
              Alert.alert("Error", error.message || "No se pudo guardar el emprendimiento");
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  // Editar emprendimiento
  const editarEmprendimiento = async (emprendimiento) => {
    // Recargar categorías para obtener los últimos cambios
    await cargarCategorias();
    
    setCurrentEmprendimiento(emprendimiento);
    setNombre(emprendimiento.nombre);
    setDescripcionCorta(emprendimiento.descripcionCorta);
    setDescripcionLarga(emprendimiento.descripcionLarga);
    setComuna(emprendimiento.comuna);
    setDireccion(emprendimiento.direccion);
    setTelefono(emprendimiento.telefono);
    setLogo(emprendimiento.logo);
    setBackground(emprendimiento.background);
    setHorarios(emprendimiento.horarios || { ...horariosIniciales });
    setIsEditing(true);
    setModalVisible(true);
    setMediosPago(
      emprendimiento.metodosPago || {
        efectivo: false,
        tarjeta: false,
        transferencia: false,
      }
    );
    setTiposEntrega(
      emprendimiento.metodosEntrega || {
        retiro: false,
        delivery: false,
      }
    );
    setCostoDelivery(emprendimiento.metodosEntrega?.deliveryCosto || "");
    setCategoriaSeleccionada(emprendimiento.categoria || null);
    setSubcategoriasSeleccionadas(emprendimiento.subcategorias || []);
  };

  // Eliminar emprendimiento
  const eliminarEmprendimiento = (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este emprendimiento?",
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

              const response = await fetch(
                API_ENDPOINTS.EMPRENDIMIENTO_BY_ID(id),
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();
              
              if (response.ok && data.ok) {
                // Recargar lista de emprendimientos
                await cargarEmprendimientos();
                Alert.alert("Éxito", "Emprendimiento eliminado correctamente");
              } else {
                throw new Error(data.mensaje || "Error al eliminar emprendimiento");
              }
            } catch (error) {
              console.error("Error al eliminar emprendimiento:", error);
              Alert.alert("Error", error.message || "No se pudo eliminar el emprendimiento");
            }
          },
        },
      ]
    );
  };

  // Resetear formulario
  const resetForm = () => {
    setNombre("");
    setDescripcionCorta("");
    setDescripcionLarga("");
    setComuna("1");
    setDireccion("");
    setTelefono("");
    setLogo(null);
    setBackground(null);
    setHorarios({ ...horariosIniciales });
    setCurrentEmprendimiento(null);
    setIsEditing(false);
    setMediosPago({
      efectivo: false,
      tarjeta: false,
      transferencia: false,
    });
    setTiposEntrega({
      retiro: false,
      delivery: false,
    });
    setCostoDelivery("");
    // Limpiar estados del mapa
    setDireccionValidada(null);
    setCurrentAddress("");
    setSelectedLocation(null);
    setMapModalVisible(false);
  };

  const actualizarEstadoEmprendimiento = async (id, isActive) => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.EMPRENDIMIENTO_BY_ID(id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: isActive ? 'activo' : 'inactivo'
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok && data.ok) {
        // Actualizar solo el emprendimiento específico en el estado local (sin recargar todo)
        setEmprendimientos(prevEmprendimientos => 
          prevEmprendimientos.map(emp => 
            emp.id === id 
              ? { ...emp, status: isActive ? 'activo' : 'inactivo' }
              : emp
          )
        );
      } else {
        throw new Error(data.mensaje || "Error al actualizar estado");
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      Alert.alert("Error", error.message || "No se pudo actualizar el estado del emprendimiento");
    }
  };

  const EmprendimientoItem = ({ item, navigation, comunas, editarEmprendimiento, eliminarEmprendimiento, actualizarEstadoEmprendimiento, previsualizarEmprendimiento, esPlanPremium }) => {
    const [isActive, setIsActive] = useState(item.status === 'activo');
  
    const toggleActive = async () => {
      if (isActive) {
        Alert.alert(
          "Confirmar desactivación",
          "¿Está seguro que quiere desactivar su emprendimiento?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Desactivar",
              onPress: async () => {
                setIsActive(false);
                await actualizarEstadoEmprendimiento(item.id, false);
              },
            },
          ]
        );
      } else {
        setIsActive(true);
        await actualizarEstadoEmprendimiento(item.id, true);
    
        // Notificaciones no disponibles
        console.log("Estado actualizado - Tu emprendimiento ya se encuentra activo");
      }
    };

    const getEstadoInfo = (estado) => {
      switch (estado?.toLowerCase()) {
        case "verificacion":
          return { color: "#3498db", label: "VERIFICANDO", icon: "shield-checkmark" };
        case "activo":
          return { color: "#4CAF50", label: "ACTIVO", icon: "checkmark-circle" };
        case "pendiente":
          return { color: "#FFC107", label: "PENDIENTE", icon: "time" };
        case "rechazado":
          return { color: "#F44336", label: "RECHAZADO", icon: "close-circle" };
        default:
          return { color: "#9E9E9E", label: "INACTIVO", icon: "pause-circle" };
      }
    };

    const estadoInfo = getEstadoInfo(item.status);
    const [expandido, setExpandido] = useState(false);
    
    // Verificar si hay descripción larga que se pueda expandir
    const tieneDescripcionLarga = item.descripcionLarga && item.descripcionLarga.length > 0;
    const descripcionEsLarga = tieneDescripcionLarga && item.descripcionLarga.length > 150;
  
    return (
      <View style={[styles.cardElegante, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
        {/* Header elegante con imagen */}
        <View style={styles.headerElegante}>
          {item.background ? (
            <ImageBackground
              source={{ uri: item.background }}
              style={styles.backgroundElegante}
              imageStyle={{ borderTopLeftRadius: 22, borderTopRightRadius: 22 }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.overlayElegante}
              >
                {/* Logo flotante */}
                <View style={styles.logoFlotanteElegante}>
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.logoImagenElegante} />
                  ) : (
                    <View style={[styles.logoPlaceholderElegante, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                      <Ionicons name="business" size={32} color="white" />
                    </View>
                  )}
                </View>

                {/* Badge de estado flotante */}
                <View style={[styles.estadoFlotante, { backgroundColor: estadoInfo.color }]}>
                  <Ionicons name={estadoInfo.icon} size={12} color="white" />
                  <Text style={styles.estadoTextoElegante}>{estadoInfo.label}</Text>
                </View>

                {/* Nombre del emprendimiento */}
                <View style={styles.nombreSectionElegante}>
                  <Text style={styles.nombreElegante} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                  {item.descripcionCorta && (
                    <Text style={styles.subtituloElegante} numberOfLines={2}>
                      {item.descripcionCorta}
                    </Text>
                  )}
                  {/* Badge de borrador */}
                  {item.esBorrador && (
                    <View style={[styles.borradorBadge, { backgroundColor: 'rgba(52, 152, 219, 0.9)' }]}>
                      <Ionicons name="document-text" size={10} color="white" />
                      <Text style={styles.borradorTexto}>CAMBIOS PENDIENTES</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[currentTheme.primary, currentTheme.secondary]}
              style={styles.overlayElegante}
            >
              <View style={styles.logoFlotanteElegante}>
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.logoImagenElegante} />
                ) : (
                  <View style={[styles.logoPlaceholderElegante, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Ionicons name="business" size={32} color="white" />
                  </View>
                )}
              </View>

              <View style={[styles.estadoFlotante, { backgroundColor: estadoInfo.color }]}>
                <Ionicons name={estadoInfo.icon} size={12} color="white" />
                <Text style={styles.estadoTextoElegante}>{estadoInfo.label}</Text>
              </View>

              <View style={styles.nombreSectionElegante}>
                <Text style={styles.nombreElegante} numberOfLines={2}>
                  {item.nombre}
                </Text>
                {item.descripcionCorta && (
                  <Text style={styles.subtituloElegante} numberOfLines={2}>
                    {item.descripcionCorta}
                  </Text>
                )}
                {/* Badge de borrador */}
                {item.esBorrador && (
                  <View style={[styles.borradorBadge, { backgroundColor: 'rgba(52, 152, 219, 0.9)' }]}>
                    <Ionicons name="document-text" size={10} color="white" />
                    <Text style={styles.borradorTexto}>CAMBIOS PENDIENTES</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Contenido elegante */}
        <View style={styles.contenidoElegante}>
          {/* Descripción larga (solo si existe y es larga) */}
          {tieneDescripcionLarga && (
            <View style={styles.descripcionEleganteContainer}>
              <Text 
                style={[styles.descripcionEleganteTexto, { color: currentTheme.textSecondary }]} 
                numberOfLines={expandido ? undefined : 3}
              >
                {item.descripcionLarga}
              </Text>
              {descripcionEsLarga && (
                <TouchableOpacity 
                  onPress={() => setExpandido(!expandido)}
                  activeOpacity={0.7}
                  style={[styles.verMasButtonElegante, { borderColor: currentTheme.primary + '30' }]}
                >
                  <Text style={[styles.verMasTextoElegante, { color: currentTheme.primary }]}>
                    {expandido ? 'Ver menos' : 'Ver más'}
                  </Text>
                  <Ionicons 
                    name={expandido ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={currentTheme.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Información de contacto elegante */}
          <View style={[styles.infoContainerElegante, { backgroundColor: currentTheme.background }]}>
            <View style={styles.infoRowElegante}>
              <View style={[styles.iconCircleElegante, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="location" size={18} color="white" />
              </View>
              <View style={styles.infoTextoContainer}>
                <Text style={[styles.infoLabelElegante, { color: currentTheme.textSecondary }]}>
                  Ubicación
                </Text>
                <Text style={[styles.infoValorElegante, { color: currentTheme.text }]} numberOfLines={2}>
                  {item.direccion}, {comunas.find((c) => c.id === item.comuna)?.nombre}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowElegante}>
              <View style={[styles.iconCircleElegante, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="call" size={18} color="white" />
              </View>
              <View style={styles.infoTextoContainer}>
                <Text style={[styles.infoLabelElegante, { color: currentTheme.textSecondary }]}>
                  Teléfono
                </Text>
                <Text style={[styles.infoValorElegante, { color: currentTheme.text }]}>
                  {item.telefono}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowElegante}>
              <View style={[styles.iconCircleElegante, { backgroundColor: isActive ? '#4CAF50' : '#95a5a6' }]}>
                <Ionicons name={isActive ? "flash" : "flash-off"} size={18} color="white" />
              </View>
              <View style={styles.infoTextoContainerFlex}>
                <View>
                  <Text style={[styles.infoLabelElegante, { color: currentTheme.textSecondary }]}>
                    Estado
                  </Text>
                  <Text style={[styles.infoValorElegante, { color: isActive ? '#4CAF50' : '#95a5a6' }]}>
                    {isActive ? 'Emprendimiento activo' : 'Emprendimiento inactivo'}
                  </Text>
                </View>
                <Switch 
                  trackColor={{ false: "#d1d5db", true: "#4CAF50" }} 
                  thumbColor="white"
                  ios_backgroundColor="#d1d5db"
                  onValueChange={toggleActive}
                  value={isActive}
                />
              </View>
            </View>
          </View>

          {/* Botones de acción elegantes */}
          <View style={styles.accionesElegantes}>
            {/* Verificar - Solo si está en estado verificacion */}
            {item.status === "verificacion" && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: '#3498db', flex: 1, minWidth: '100%' }]}
                onPress={() => {
                  setEmprendimientoParaVerificar(item);
                  setModalVerificacionVisible(true);
                  setTimeout(async () => {
                    await enviarCodigoVerificacion(item.id);
                  }, 500);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>
                  {item.esBorrador ? 'Verificar Cambios' : 'Completar Verificación'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Previsualizar - Solo si NO está en verificación */}
            {item.status !== "verificacion" && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: currentTheme.primary }]}
                onPress={() => previsualizarEmprendimiento(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>Previsualizar</Text>
              </TouchableOpacity>
            )}

            {/* Productos - Solo Plan Premium y NO en verificación */}
            {esPlanPremium && item.status !== "verificacion" && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: currentTheme.secondary }]}
                onPress={() => navigation.navigate("ProductosEmprendimiento", { emprendimiento: item })}
                activeOpacity={0.8}
              >
                <Ionicons name="pricetags" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>Productos</Text>
              </TouchableOpacity>
            )}

            {/* Estadísticas - Solo Plan Premium y NO en verificación */}
            {esPlanPremium && item.status !== "verificacion" && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: '#9b59b6' }]}
                onPress={() => navigation.navigate("MisEstadisticas", { emprendimiento: item })}
                activeOpacity={0.8}
              >
                <Ionicons name="stats-chart" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>Estadísticas</Text>
              </TouchableOpacity>
            )}

            {/* Vendedores - Solo Plan Premium y si está activo */}
            {esPlanPremium && item.status === "activo" && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: '#3498db' }]}
                onPress={() => navigation.navigate("VendedorScreen", { emprendimiento: item })}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>Vendedores</Text>
              </TouchableOpacity>
            )}

            {/* Editar - Solo si está activo o inactivo (NO en verificación, pendiente o rechazado) */}
            {(item.status === "activo" || item.status === "inactivo") && !item.esBorrador && (
              <TouchableOpacity
                style={[styles.botonAccionElegante, { backgroundColor: '#16a085' }]}
                onPress={() => editarEmprendimiento(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="create" size={22} color="white" />
                <Text style={styles.botonTextoElegante}>Editar</Text>
              </TouchableOpacity>
            )}

            {/* Eliminar - Siempre visible */}
            <TouchableOpacity
              style={[styles.botonAccionElegante, { backgroundColor: '#e74c3c' }]}
              onPress={() => eliminarEmprendimiento(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={22} color="white" />
              <Text style={styles.botonTextoElegante}>
                {item.esBorrador ? 'Cancelar Borrador' : 'Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar item de emprendimiento
  const renderEmprendimiento = ({ item }) => (
    <EmprendimientoItem 
      item={item}
      navigation={navigation}
      comunas={comunas}
      editarEmprendimiento={editarEmprendimiento}
      eliminarEmprendimiento={eliminarEmprendimiento}
      actualizarEstadoEmprendimiento={actualizarEstadoEmprendimiento}
      previsualizarEmprendimiento={previsualizarEmprendimiento}
      esPlanPremium={esPlanPremium}
    />
  );

  // Función para enviar código de verificación
  const enviarCodigoVerificacion = async (emprendimientoId) => {
    try {
      setEnviandoCodigo(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.ENVIAR_CODIGO_VERIFICACION(emprendimientoId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (response.ok && data.ok) {
        setCodigoEnviado(true);
        // Limpiar código anterior y enfocar primer input
        setCodigoVerificacion(['', '', '', '', '', '']);
        setTimeout(() => {
          codigoInputRefs.current[0]?.focus();
        }, 300);
        
        Alert.alert("Código Enviado", data.mensaje);
        
        // En desarrollo, mostrar el código
        if (data.codigo_dev) {
          console.log("🔐 Código de verificación (DEV):", data.codigo_dev);
          Alert.alert("DESARROLLO", `Código: ${data.codigo_dev}`);
        }
      } else {
        throw new Error(data.error || "Error al enviar código");
      }
    } catch (error) {
      console.error("Error al enviar código:", error);
      Alert.alert("Error", error.message || "No se pudo enviar el código de verificación");
    } finally {
      setEnviandoCodigo(false);
    }
  };

  // Función para verificar código ingresado
  const verificarCodigoIngresado = async () => {
    try {
      const codigoCompleto = codigoVerificacion.join('');
      
      if (codigoCompleto.length !== 6) {
        Alert.alert("Error", "Por favor ingresa los 6 dígitos del código");
        return;
      }

      setVerificandoCodigo(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.VERIFICAR_CODIGO_EMPRENDIMIENTO(emprendimientoParaVerificar.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ codigo: codigoCompleto }),
        }
      );

      const data = await response.json();
      
      if (response.ok && data.ok) {
        setModalVerificacionVisible(false);
        setCodigoVerificacion(['', '', '', '', '', '']);
        setCodigoEnviado(false);
        
        // Recargar emprendimientos
        await cargarEmprendimientos();
        
        Alert.alert(
          "¡Verificación Exitosa!",
          data.mensaje,
          [{ text: "Entendido", style: "default" }]
        );
      } else {
        if (data.codigo_expirado) {
          Alert.alert(
            "Código Expirado",
            data.error,
            [
              { text: "Cancelar", style: "cancel" },
              { 
                text: "Enviar Nuevo Código", 
                onPress: () => enviarCodigoVerificacion(emprendimientoParaVerificar.id) 
              }
            ]
          );
        } else {
          Alert.alert("Error", data.error || "Código incorrecto");
        }
      }
    } catch (error) {
      console.error("Error al verificar código:", error);
      Alert.alert("Error", error.message || "No se pudo verificar el código");
    } finally {
      setVerificandoCodigo(false);
    }
  };

  const previsualizarEmprendimiento = async (emprendimiento) => {
    try {
      // Obtener los productos del emprendimiento desde AsyncStorage
      const emprendimientosGuardados = await AsyncStorage.getItem(
        "emprendimientos"
      );
      let productos = [];

      if (emprendimientosGuardados) {
        const emprendimientos = JSON.parse(emprendimientosGuardados);
        const emp = emprendimientos.find((e) => e.id === emprendimiento.id);
        if (emp && emp.productos) {
          productos = emp.productos;
        }
      }

      // Convertir productos a la estructura de galería esperada
      const galeria = productos.map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ? producto.descripcion : "",
        precio: producto.precio,
        categoria: producto.categoria,
        imagen: { uri: producto.imagen },
      }));
      // Convertir horarios de objeto por días a array de strings
      const formatHorarios = () => {
        if (!emprendimiento.horarios) return [];

        // Si ya es un array (formato antiguo), lo devolvemos tal cual
        if (Array.isArray(emprendimiento.horarios))
          return emprendimiento.horarios;

        // Si es objeto por días (nuevo formato), lo convertimos
        const horariosArray = [];
        Object.entries(emprendimiento.horarios).forEach(
          ([dia, horariosDia]) => {
            if (Array.isArray(horariosDia) && horariosDia.length > 0) {
              const horariosStr = horariosDia
                .map((h) => `${h.inicio} - ${h.fin}`)
                .join(", ");
              horariosArray.push(`${dia}: ${horariosStr}`);
            }
          }
        );

        return horariosArray.length > 0
          ? horariosArray
          : ["Horario no definido"];
      };

      const emprendimientoPreview = {
        ...emprendimiento,
        horarios: formatHorarios(), // Usamos la función de formato
        galeria: galeria,
        imagen: emprendimiento.background
          ? { uri: emprendimiento.background }
          : null,
        logo: emprendimiento.logo ? { uri: emprendimiento.logo } : null,
        estado: emprendimiento.status === "activo" ? "Abierto" : "Cerrado",
        rating: null,
        descripcion: emprendimiento.descripcionCorta,
        descripcionLarga: emprendimiento.descripcionLarga,
        metodosPago: emprendimiento.metodosPago || {
          tarjeta: true,
          efectivo: true,
          transferencia: false,
        },
        metodosEntrega: emprendimiento.metodosEntrega || {
          delivery: true,
          retiro: true,
          deliveryCosto: "Consultar",
        },
      };

        navigation.navigate("PedidoDetalle", { producto: emprendimientoPreview, isPreview: true });
    } catch (error) {
      console.error("Error al preparar previsualización:", error);
      Alert.alert("Error", "No se pudo cargar la previsualización");
    }
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
          <View style={styles.headerIconWrapper}>
            <Ionicons name="business" size={28} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Gestiona tus</Text>
            <Text style={styles.tituloPrincipal}>Emprendimientos</Text>
          </View>
          {!loading && emprendimientos.length > 0 && (
            <View style={styles.headerBadgeWrapper}>
              <View style={[styles.headerBadge, { backgroundColor: 'white' }]}>
                <Text style={[styles.headerBadgeText, { color: currentTheme.primary }]}>
                  {emprendimientos.length}
                </Text>
              </View>
            </View>
          )}
          {(loading || emprendimientos.length === 0) && <View style={{ width: 44 }} />}
        </View>
      </LinearGradient>

      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={[currentTheme.primary + '20', currentTheme.secondary + '20']}
              style={styles.loadingGradiente}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ActivityIndicator size="large" color={currentTheme.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.text }]}>
                Cargando emprendimientos...
              </Text>
            </LinearGradient>
          </View>
        ) : emprendimientos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: currentTheme.primary + '15' }]}>
              <FontAwesome name="building" size={64} color={currentTheme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No tienes emprendimientos</Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
              Registra tu primer emprendimiento para comenzar a vender{'\n'}
              tus productos y servicios en la comunidad
            </Text>
          </View>
        ) : (
          <FlatList
            data={emprendimientos}
            renderItem={renderEmprendimiento}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Botón flotante moderno - Solo si puede agregar más */}
        {puedeAgregarMas && (
          <TouchableOpacity
            style={[styles.addButtonModerno, { shadowColor: currentTheme.primary }]}
            onPress={async () => {
              // Recargar categorías para obtener los últimos cambios
              await cargarCategorias();
              resetForm();
              setModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[currentTheme.primary, currentTheme.secondary]}
              style={styles.addButtonGradientModerno}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.addIconWrapper}>
                <Ionicons name="add" size={26} color="white" />
              </View>
              <View style={styles.addLabelWrapper}>
                <Text style={styles.addLabelText}>Nuevo</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Mensaje cuando alcanza el límite */}
        {!puedeAgregarMas && (
          <View style={[styles.limiteBanner, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.limiteIcono}>
              <Ionicons name="lock-closed" size={20} color="#FFA726" />
            </View>
            <View style={styles.limiteTextoContainer}>
              <Text style={[styles.limiteTitulo, { color: currentTheme.text }]}>
                Límite alcanzado
              </Text>
              <Text style={[styles.limiteSubtitulo, { color: currentTheme.textSecondary }]}>
                {esPlanPremium 
                  ? 'Has alcanzado el máximo de 3 emprendimientos' 
                  : 'Actualiza a Premium para tener hasta 3 emprendimientos'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal para agregar/editar emprendimiento */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <LinearGradient
          colors={[currentTheme.primary, currentTheme.secondary]}
          style={styles.modalHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? "Editar Emprendimiento" : "Nuevo Emprendimiento"}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        <ScrollView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          {/* Sección: Información Básica */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="information-circle" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Información Básica</Text>
            </View>

            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="storefront" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre del Emprendimiento*</Text>
              </View>
              <TextInput
                style={[styles.inputField, { color: currentTheme.text, borderColor: currentTheme.border }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Mi Negocio Local"
                placeholderTextColor={currentTheme.textSecondary}
              />
            </View>

            {/* Campo Descripción Corta */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="text" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                  Descripción Corta* (max 50 caracteres)
                </Text>
              </View>
              <TextInput
                style={[styles.inputField, { color: currentTheme.text, borderColor: currentTheme.border }]}
                value={descripcionCorta}
                onChangeText={setDescripcionCorta}
                placeholder="Breve descripción de tu emprendimiento"
                placeholderTextColor={currentTheme.textSecondary}
                maxLength={50}
              />
              <Text style={[styles.charCounter, { color: currentTheme.textSecondary }]}>
                {descripcionCorta.length}/50 caracteres
              </Text>
            </View>

            {/* Campo Descripción Larga */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="document-text" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                  Descripción Larga (max 1000 caracteres)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.inputField,
                  styles.resizableInput,
                  { height: Math.max(100, descripcionLarga.length / 3), color: currentTheme.text, borderColor: currentTheme.border },
                ]}
                value={descripcionLarga}
                onChangeText={setDescripcionLarga}
                placeholder="Descripción detallada de tu emprendimiento..."
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                maxLength={1000}
                textAlignVertical="top"
                onContentSizeChange={(e) => {
                  const { height } = e.nativeEvent.contentSize;
                }}
              />
              <Text style={[styles.charCounter, { color: currentTheme.textSecondary }]}>
                {descripcionLarga.length}/1000 caracteres
              </Text>
            </View>
          </View>

          {/* Sección: Ubicación */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="location" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Ubicación y Contacto</Text>
            </View>

            {/* Campo Comuna */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="navigate-circle" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Comuna*</Text>
              </View>
              <View style={[styles.pickerWrapper, { borderColor: currentTheme.border }]}>
                <Picker
                  selectedValue={comuna}
                  onValueChange={(itemValue) => setComuna(itemValue)}
                  style={[styles.picker, { color: currentTheme.text }]}
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

            {renderAddressField()}
            
            {/* Campo Teléfono */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="call" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Teléfono*</Text>
              </View>
              <TextInput
                style={[styles.inputField, { color: currentTheme.text, borderColor: currentTheme.border }]}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="+56912345678"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Sección: Medios de Pago y Entrega */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="card" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Medios de Pago y Entrega</Text>
            </View>

            {/* Medios de Pago */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="cash" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Medios de Pago*</Text>
              </View>
            <View style={styles.pillsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentPill,
                  { borderColor: mediosPago.efectivo ? currentTheme.primary : currentTheme.border },
                  mediosPago.efectivo && { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  setMediosPago({
                    ...mediosPago,
                    efectivo: !mediosPago.efectivo,
                  })
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: mediosPago.efectivo ? 'white' : currentTheme.text },
                    mediosPago.efectivo && styles.pillTextSelected,
                  ]}
                >
                  Efectivo
                </Text>
                {mediosPago.efectivo && (
                  <View style={styles.pillIcon}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentPill,
                  { borderColor: mediosPago.tarjeta ? currentTheme.primary : currentTheme.border },
                  mediosPago.tarjeta && { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  setMediosPago({ ...mediosPago, tarjeta: !mediosPago.tarjeta })
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: mediosPago.tarjeta ? 'white' : currentTheme.text },
                    mediosPago.tarjeta && styles.pillTextSelected,
                  ]}
                >
                  Tarjeta
                </Text>
                {mediosPago.tarjeta && (
                  <View style={styles.pillIcon}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentPill,
                  { borderColor: mediosPago.transferencia ? currentTheme.primary : currentTheme.border },
                  mediosPago.transferencia && { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  setMediosPago({
                    ...mediosPago,
                    transferencia: !mediosPago.transferencia,
                  })
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: mediosPago.transferencia ? 'white' : currentTheme.text },
                    mediosPago.transferencia && styles.pillTextSelected,
                  ]}
                >
                  Transferencia
                </Text>
                {mediosPago.transferencia && (
                  <View style={styles.pillIcon}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            </View>

            {/* Tipos de Entrega */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="bicycle" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Tipos de Entrega*</Text>
              </View>
            <View style={styles.pillsContainer}>
              <TouchableOpacity
                style={[
                  styles.deliveryPill,
                  { borderColor: tiposEntrega.retiro ? currentTheme.primary : currentTheme.border },
                  tiposEntrega.retiro && { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  setTiposEntrega({
                    ...tiposEntrega,
                    retiro: !tiposEntrega.retiro,
                  })
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: tiposEntrega.retiro ? 'white' : currentTheme.text },
                    tiposEntrega.retiro && styles.pillTextSelected,
                  ]}
                >
                  Retiro en local
                </Text>
                {tiposEntrega.retiro && (
                  <View style={styles.pillIcon}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryPill,
                  { borderColor: tiposEntrega.delivery ? currentTheme.primary : currentTheme.border },
                  tiposEntrega.delivery && { backgroundColor: currentTheme.primary },
                ]}
                onPress={() =>
                  setTiposEntrega({
                    ...tiposEntrega,
                    delivery: !tiposEntrega.delivery,
                  })
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: tiposEntrega.delivery ? 'white' : currentTheme.text },
                    tiposEntrega.delivery && styles.pillTextSelected,
                  ]}
                >
                  Delivery
                </Text>
                {tiposEntrega.delivery && (
                  <View style={styles.pillIcon}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            </View>

            {/* Campo para costo de delivery (solo visible si delivery está seleccionado) */}
            {tiposEntrega.delivery && (
              <View style={[styles.inputGroup, { marginTop: 0 }]}>
                <View style={styles.labelConIcono}>
                  <Ionicons name="pricetag" size={14} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                    Costo de Delivery (opcional)
                  </Text>
                </View>
                <TextInput
                  style={[styles.inputField, { color: currentTheme.text, borderColor: currentTheme.border }]}
                  value={costoDelivery}
                  onChangeText={setCostoDelivery}
                  placeholder="Ej: $1.500 o Gratis para compras sobre $10.000"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="default"
                />
              </View>
            )}
          </View>

          {/* Sección: Horarios de Atención */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="time" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Horarios de Atención</Text>
            </View>

            <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.agregarHorarioButtonModerno, { borderColor: currentTheme.primary }]}
              onPress={agregarHorario}
            >
              <View style={[styles.agregarIconCircle, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="add" size={20} color="white" />
              </View>
              <Text style={[styles.agregarHorarioTextModerno, { color: currentTheme.primary }]}>
                Agregar Nuevo Horario
              </Text>
            </TouchableOpacity>

            <ListaHorarios
              horarios={horarios}
              onEdit={editarHorario}
              onDelete={eliminarHorario}
            />
            </View>
          </View>

          <ModalHorario
            visible={mostrarModalHorario}
            onClose={() => setMostrarModalHorario(false)}
            onSave={guardarHorario}
            horarioExistente={horarioEditando}
            diaSeleccionado={diaSeleccionado}
            setDiaSeleccionado={setDiaSeleccionado}
          />

          {/* Sección: Imágenes */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="images" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Imágenes del Negocio</Text>
            </View>

            {/* Logo del emprendimiento */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="radio-button-on" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Logo del Emprendimiento</Text>
              </View>
              <TouchableOpacity
                style={[styles.imageUploadButton, { borderColor: currentTheme.border }]}
                onPress={() => seleccionarImagen("logo")}
                activeOpacity={0.8}
              >
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={32} color={currentTheme.primary} />
                    <Text style={[styles.imagePlaceholderText, { color: currentTheme.primary }]}>
                      Seleccionar logo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Imagen de fondo */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="image" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Imagen de Fondo</Text>
              </View>
              <TouchableOpacity
                style={[styles.imageUploadButton, { borderColor: currentTheme.border }]}
                onPress={() => seleccionarImagen("background")}
                activeOpacity={0.8}
              >
                {background ? (
                  <Image
                    source={{ uri: background }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={currentTheme.primary} />
                    <Text style={[styles.imagePlaceholderText, { color: currentTheme.primary }]}>
                      Seleccionar imagen de fondo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección: Categorías */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="grid" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Categorías</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="list" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Categoría Principal*</Text>
              </View>

              {/* Selector de categoría principal */}
              {cargandoCategorias ? (
                <View style={[styles.pickerWrapper, { borderColor: currentTheme.border, justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={currentTheme.primary} />
                  <Text style={[styles.cargandoText, { color: currentTheme.textSecondary }]}>
                    Cargando categorías...
                  </Text>
                </View>
              ) : (
                <View style={[styles.pickerWrapper, { borderColor: currentTheme.border }]}>
                  <Picker
                    selectedValue={categoriaSeleccionada}
                    onValueChange={(itemValue) => {
                      setCategoriaSeleccionada(itemValue);
                      setSubcategoriasSeleccionadas([]); // Resetear subcategorías al cambiar categoría
                    }}
                    style={[styles.picker, { color: currentTheme.text }]}
                  >
                    <Picker.Item label="Selecciona una categoría" value={null} />
                    {categorias.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              )}

              {/* Mostrar subcategorías solo si se ha seleccionado una categoría */}
              {categoriaSeleccionada && (
                <View style={[styles.subcategoriasContainer, { backgroundColor: currentTheme.background }]}>
                  <View style={styles.labelConIcono}>
                    <Ionicons name="checkbox" size={14} color={currentTheme.primary} />
                    <Text style={[styles.subcategoriasTitle, { color: currentTheme.text }]}>Subcategorías</Text>
                  </View>
                  <Text style={[styles.subcategoriasSubtitle, { color: currentTheme.textSecondary }]}>
                    Selecciona al menos una opción
                  </Text>

                  <View style={styles.subcategoriasGrid}>
                    {categorias
                      .find((c) => c.id === categoriaSeleccionada)
                      .subcategorias.map((subcat) => {
                        const isSelected = subcategoriasSeleccionadas.includes(
                          subcat.id
                        );
                        return (
                          <TouchableOpacity
                            key={subcat.id}
                            style={[
                              styles.subcategoriaPill,
                              { borderColor: isSelected ? currentTheme.primary : currentTheme.border },
                              isSelected && { backgroundColor: currentTheme.primary + '15' },
                            ]}
                            onPress={() => {
                              if (isSelected) {
                                setSubcategoriasSeleccionadas(
                                  subcategoriasSeleccionadas.filter(
                                    (id) => id !== subcat.id
                                  )
                                );
                              } else {
                                setSubcategoriasSeleccionadas([
                                  ...subcategoriasSeleccionadas,
                                  subcat.id,
                                ]);
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.subcategoriaText,
                                { color: isSelected ? currentTheme.primary : currentTheme.text },
                                isSelected && styles.subcategoriaTextSelected,
                              ]}
                            >
                              {subcat.nombre}
                            </Text>
                            {isSelected && (
                              <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.primary }]}>
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="white"
                                />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Botón Guardar - Mejorado */}
          <View style={{ paddingBottom: 20 }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (guardando || validandoDireccion) && styles.saveButtonDisabled
              ]}
              onPress={guardarEmprendimiento}
              disabled={guardando || validandoDireccion}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={(guardando || validandoDireccion) ? ['#95a5a6', '#7f8c8d'] : [currentTheme.primary, currentTheme.secondary]}
                style={styles.saveButtonGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {guardando ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.saveButtonText}>
                      {isEditing ? "Actualizando..." : "Creando..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                    <Text style={styles.saveButtonText}>
                      {isEditing ? "Actualizar Emprendimiento" : "Enviar a Evaluación"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {renderMapModal()}
      
      {/* Modal de Verificación por SMS */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVerificacionVisible}
        onRequestClose={() => {
          setModalVerificacionVisible(false);
          setCodigoVerificacion(['', '', '', '', '', '']);
          setCodigoEnviado(false);
        }}
      >
        <LinearGradient
          colors={[currentTheme.primary, currentTheme.secondary]}
          style={styles.modalHeaderGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={() => {
                Alert.alert(
                  "Cancelar Verificación",
                  "¿Estás seguro de que deseas cancelar? Puedes completar la verificación más tarde desde tu perfil.",
                  [
                    { text: "Continuar Verificando", style: "cancel" },
                    {
                      text: "Salir",
                      style: "destructive",
                      onPress: () => {
                        setModalVerificacionVisible(false);
                        setCodigoVerificacion(['', '', '', '', '', '']);
                        setCodigoEnviado(false);
                      }
                    }
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Verificación por SMS
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        <ScrollView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>Verificar Emprendimiento</Text>
            </View>

            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="mail" size={64} color={currentTheme.primary} style={{ marginBottom: 20 }} />
              
              <Text style={[styles.verificacionTitulo, { color: currentTheme.text }]}>
                Ingresa el código de 6 dígitos
              </Text>
              
              <Text style={[styles.verificacionSubtitulo, { color: currentTheme.textSecondary }]}>
                {codigoEnviado 
                  ? "Hemos enviado un código de verificación a tu teléfono"
                  : "Enviaremos un código de verificación a tu teléfono"}
              </Text>

              {/* Input de código de 6 dígitos */}
              <View style={styles.codigoContainer}>
                {codigoVerificacion.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (codigoInputRefs.current[index] = ref)}
                    style={[
                      styles.codigoInput, 
                      { 
                        borderColor: digit ? currentTheme.primary : currentTheme.border,
                        backgroundColor: currentTheme.background,
                        color: currentTheme.text
                      }
                    ]}
                    value={digit}
                    onChangeText={(text) => {
                      const newCodigo = [...codigoVerificacion];
                      
                      // Si se pegó un código completo de 6 dígitos
                      if (text.length === 6) {
                        const digits = text.split('').slice(0, 6);
                        setCodigoVerificacion(digits);
                        // Enfocar el último input
                        setTimeout(() => {
                          codigoInputRefs.current[5]?.focus();
                        }, 50);
                        return;
                      }
                      
                      // Solo tomar el último dígito ingresado
                      const nuevoDigito = text.slice(-1);
                      newCodigo[index] = nuevoDigito;
                      setCodigoVerificacion(newCodigo);
                      
                      // Auto-focus al siguiente input si se ingresó un dígito
                      if (nuevoDigito && index < 5) {
                        setTimeout(() => {
                          codigoInputRefs.current[index + 1]?.focus();
                        }, 50);
                      }
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      // Si presiona Backspace
                      if (nativeEvent.key === 'Backspace') {
                        if (!digit && index > 0) {
                          // Si el campo está vacío, borrar el anterior y mover foco
                          const newCodigo = [...codigoVerificacion];
                          newCodigo[index - 1] = '';
                          setCodigoVerificacion(newCodigo);
                          setTimeout(() => {
                            codigoInputRefs.current[index - 1]?.focus();
                          }, 50);
                        } else if (digit) {
                          // Si el campo tiene dígito, borrarlo (esto se hace automáticamente por el input)
                          // El cursor permanece en el mismo campo
                        }
                      }
                    }}
                    maxLength={1}
                    keyboardType="number-pad"
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {/* Botón para reenviar código */}
              {codigoEnviado && (
                <TouchableOpacity
                  style={styles.reenviarButton}
                  onPress={() => enviarCodigoVerificacion(emprendimientoParaVerificar?.id)}
                  disabled={enviandoCodigo}
                >
                  <Ionicons name="refresh" size={16} color={currentTheme.primary} />
                  <Text style={[styles.reenviarTexto, { color: currentTheme.primary }]}>
                    {enviandoCodigo ? "Reenviando..." : "Reenviar código"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Botón de verificar */}
              <TouchableOpacity
                style={[
                  styles.verificarButton,
                  { backgroundColor: currentTheme.primary },
                  verificandoCodigo && styles.verificarButtonDisabled
                ]}
                onPress={verificarCodigoIngresado}
                disabled={verificandoCodigo || codigoVerificacion.join('').length !== 6}
                activeOpacity={0.9}
              >
                {verificandoCodigo ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.verificarButtonText}>Verificando...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                    <Text style={styles.verificarButtonText}>Verificar Código</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.avisoTexto, { color: currentTheme.textSecondary }]}>
                El código es válido por 15 minutos
              </Text>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffffff",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#dadada",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#c9c9c9",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
];

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingBottom: 130, // Espacio para la barra inferior
  },
  headerGradient: {
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerBadgeWrapper: {
    alignItems: 'center',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingGradiente: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  emprendimientoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  // Estilos elegantes refinados
  cardElegante: {
    borderRadius: 22,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerElegante: {
    height: 170,
  },
  backgroundElegante: {
    width: '100%',
    height: '100%',
  },
  overlayElegante: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  logoFlotanteElegante: {
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImagenElegante: {
    width: 75,
    height: 75,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'white',
  },
  logoPlaceholderElegante: {
    width: 75,
    height: 75,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  estadoFlotante: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  estadoTextoElegante: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nombreSectionElegante: {
    gap: 6,
  },
  nombreElegante: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtituloElegante: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  borradorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  borradorTexto: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  contenidoElegante: {
    padding: 20,
  },
  descripcionEleganteContainer: {
    marginBottom: 18,
  },
  descripcionEleganteTexto: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  verMasButtonElegante: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  verMasTextoElegante: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoContainerElegante: {
    borderRadius: 18,
    padding: 18,
    gap: 16,
    marginBottom: 18,
  },
  infoRowElegante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircleElegante: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoTextoContainer: {
    flex: 1,
    gap: 4,
  },
  infoTextoContainerFlex: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabelElegante: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValorElegante: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  accionesElegantes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  botonAccionElegante: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  botonTextoElegante: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  // Estilos compactos (legacy)
  emprendimientoCardCompacta: {
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  // Estilos del header mejorado
  headerMejorado: {
    height: 160,
  },
  backgroundMejorado: {
    width: '100%',
    height: '100%',
  },
  overlayMejorado: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  topRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoMejorado: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImageMejorado: {
    width: 70,
    height: 70,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'white',
  },
  logoPlaceholderMejorado: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  badgeMejorado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeTextoMejorado: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bottomRowHeader: {
    gap: 8,
  },
  nombreMejorado: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.4,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  descripcionSobreImagen: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgesRowMejorada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  badgeGroupMejorado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerCompacto: {
    height: 120,
  },
  backgroundCompacto: {
    width: '100%',
    height: '100%',
  },
  overlayCompacto: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  headerContentCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoCompacto: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  logoImageCompacto: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'white',
  },
  logoPlaceholderCompacto: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  nombreContainer: {
    flex: 1,
    gap: 6,
  },
  nombreCompacto: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badgeCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeTextoCompacto: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  microBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardContentCompacto: {
    padding: 16,
  },
  descripcionCompacta: {
    marginBottom: 12,
  },
  textoDescripcionCompacto: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoRowCompacta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  infoItemCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoTextoCompacto: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Estilos de información mejorada
  infoSectionCompacta: {
    gap: 10,
    marginBottom: 14,
  },
  infoLineaCompleta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  infoTextoCompleto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoRowDual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoItemMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoTextoMini: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchTextoMini: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Estilos de botones mejorados
  accionesSection: {
    gap: 10,
  },
  botonesGrilla: {
    flexDirection: 'row',
    gap: 10,
  },
  botonPrimario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotonPrimario: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  botonesSecundarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
    backgroundColor: 'white',
  },
  textoBotonSecundario: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  switchCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  switchLabelCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchTextoCompacto: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsCompactas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  botonCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  textoBotonCompacto: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Estilos para el diseño premium
  emprendimientoCardPremium: {
    borderRadius: 24,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  emprendimientoCardElegante: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTopSection: {
    height: 180,
  },
  backgroundImageElegante: {
    width: '100%',
    height: '100%',
  },
  gradientOverlayElegante: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  gradientSinImagen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoFlotante: {
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoImagenElegante: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
  },
  logoPlaceholderElegante: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  headerInfoElegante: {
    gap: 10,
  },
  nombreElegante: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgeEstadoElegante: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeTextoElegante: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  descripcionSection: {
    marginBottom: 16,
  },
  descripcionCortaElegante: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  descripcionLargaElegante: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  verMasTexto: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  dividerElegante: {
    height: 1,
    marginVertical: 16,
    opacity: 0.3,
  },
  infoGrid: {
    gap: 12,
  },
  infoCardElegante: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconoCirculoElegante: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextoContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabelElegante: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValorElegante: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoComunaElegante: {
    fontSize: 13,
    fontWeight: '500',
  },
  switchSectionElegante: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchTituloElegante: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchSubtituloElegante: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  actionsGridElegante: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCardElegante: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextElegante: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomActionsElegante: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  bottomButtonElegante: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Estilos premium adicionales
  cardTopSectionPremium: {
    height: 200,
  },
  backgroundImagePremium: {
    width: '100%',
    height: '100%',
  },
  gradientOverlayPremium: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  gradientSinImagenPremium: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  headerSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoGlass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImagenPremium: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'white',
  },
  logoPlaceholderPremium: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  badgeEstadoPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  badgeTextoPremium: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  nombreSectionPremium: {
    gap: 12,
  },
  nombrePremium: {
    fontSize: 26,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  metodosBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cardContentPremium: {
    padding: 24,
  },
  descripcionSectionPremium: {
    marginBottom: 20,
  },
  sectionHeaderMicro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitleMicro: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  descripcionCortaPremium: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 10,
  },
  descripcionLargaContainer: {
    marginTop: 4,
  },
  descripcionLargaPremium: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  verMasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
    marginTop: 12,
  },
  verMasTextoPremium: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerPremium: {
    height: 1.5,
    marginVertical: 20,
    opacity: 0.2,
  },
  contactInfoSection: {
    marginBottom: 20,
  },
  infoGridPremium: {
    gap: 14,
    marginTop: 14,
  },
  infoCardPremium: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconoCirculoPremium: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoTextoContainerPremium: {
    flex: 1,
    gap: 6,
  },
  infoLabelPremium: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoValorPremium: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  comunaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginTop: 4,
  },
  comunaTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  metodosDetalle: {
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  metodosRow: {
    gap: 10,
  },
  metodosLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metodosChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  metodoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  metodoChipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchSectionPremium: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
  },
  switchGradientBg: {
    padding: 18,
  },
  switchContentPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  switchLabelContainerPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchIconCirclePremium: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTituloPremium: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  switchSubtituloPremium: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsGridPremium: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  actionCardPremium: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 10,
  },
  actionIconCirclePremium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionTextPremium: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomActionsPremium: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomButtonPremium: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  bottomButtonTextPremium: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emprendimientoCardGradiente: {
    padding: 0,
  },
  emprendimientoHeaderModerno: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoContainerModerno: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  emprendimientoLogoModerno: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'white',
  },
  emprendimientoLogoPlaceholderModerno: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: '#e9ecef',
  },
  nombreEstadoContainer: {
    flex: 1,
    gap: 8,
  },
  emprendimientoNombreModerno: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  estadoBadgeModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  estadoTextoModerno: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  backgroundImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  emprendimientoBackgroundModerno: {
    width: "100%",
    height: "100%",
  },
  backgroundOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  descripcionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  descripcionCorta: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  emprendimientoInfoModerno: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoItemModerno: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextoModerno: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  switchContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  switchInfoModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  switchTextModerno: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emprendimientoActionsModerno: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  actionButtonModerno: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonTexto: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emprendimientoActionsSecundarios: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emprendimientoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  emprendimientoLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emprendimientoLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  emprendimientoNombre: {
    fontSize: 19,
    fontWeight: "800",
    flex: 1,
    color: "#2c3e50",
    letterSpacing: 0.3,
  },
  emprendimientoBackground: {
    width: "100%",
    height: 160,
  },
  emprendimientoDescripcion: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    color: "#7f8c8d",
    fontSize: 14,
    lineHeight: 20,
  },
  emprendimientoInfo: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: '500',
    flex: 1,
  },
  emprendimientoActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    gap: 10,
    flexWrap: 'wrap',
  },
  emprendimientoActionsRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 14,
    paddingTop: 0,
    paddingBottom: 16,
    gap: 10,
  },
  actionButton: {
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  addButtonGradiente: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
  // Estilos del botón elegante para agregar
  addButtonElegante: {
    position: "absolute",
    bottom: 140,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonGradienteElegante: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Estilos del botón premium ultra-elegante
  addButtonContainer: {
    position: "absolute",
    bottom: 140,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  addButtonHalo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    opacity: 0.3,
    transform: [{ scale: 1.15 }],
  },
  addButtonPremium: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  addButtonGradientPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  addTextContainer: {
    gap: 2,
  },
  addButtonTextPremium: {
    fontSize: 17,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  addButtonSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  // Botón final compacto y elegante
  addButtonFinal: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  addButtonGradientFinal: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
  // Botón moderno con estilo equilibrado
  addButtonModerno: {
    position: "absolute",
    bottom: 140,
    right: 20,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: 'white',
  },
  addButtonGradientModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
  },
  addIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  addLabelWrapper: {
    paddingRight: 4,
  },
  addLabelText: {
    fontSize: 15,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Banner de límite alcanzado
  limiteBanner: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  limiteIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFA72620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limiteTextoContainer: {
    flex: 1,
    gap: 4,
  },
  limiteTitulo: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  limiteSubtitulo: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Botón sofisticado con detalles premium (legacy)
  addButtonSofisticado: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 72,
    height: 72,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    opacity: 0.4,
  },
  addButtonGradientSofisticado: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: 'white',
  },
  addInnerCircle: {
    position: 'absolute',
    top: 8,
  },
  addTextVertical: {
    position: 'absolute',
    bottom: 10,
  },
  addTextSofisticado: {
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addPulsingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeaderGradient: {
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    padding: 20,
  },
  seccionFormulario: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  seccionIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  labelConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inputField: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#2c3e50",
    fontWeight: '500',
  },
  charCounter: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
    marginTop: 5,
  },
  pickerWrapper: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: 54,
    width: "100%",
    color: "#2c3e50",
  },
  cargandoText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  validandoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  validandoText: {
    fontSize: 12,
    color: "#2A9D8F",
    marginLeft: 5,
  },
  imageUploadButton: {
    height: 160,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  imagePlaceholderText: {
    marginTop: 4,
    color: "#2A9D8F",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mapContainer: {
    flex: 1,
  },
  mapAddressContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 3,
  },
  mapAddressText: {
    fontSize: 16,
  },
  mapButtonsContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  direccionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  textButton: {
    marginLeft: 10,
    padding: 10,
  },
  textButtonText: {
    color: "#2A9D8F",
    fontWeight: "bold",
  },
  fullScreenMapContainer: {
    flex: 1,
  },
  fullScreenMap: {
    flex: 1,
  },
  searchBarContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 5,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  searchButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedAddressText: {
    fontSize: 16,
    marginBottom: 15,
  },
  mapActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelMapButton: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmMapButton: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  cancelMapButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmMapButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Nuevos estilos profesionales para el mapa
  proMapContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  proMapHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  proMapBackButton: {
    marginRight: 15,
  },
  proMapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  proSearchContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  proSearchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  proSearchIcon: {
    marginRight: 10,
  },
  proSearchInput: {
    flex: 1,
    height: 40,
    color: "#333",
  },
  proSearchButton: {
    backgroundColor: "#2A9D8F",
    borderRadius: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  proSearchButtonText: {
    color: "white",
    fontWeight: "600",
  },
  proMap: {
    width: "100%",
    height: "100%",
  },
  proLocationButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  proBottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  proLocationDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  proLocationText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  proActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  proCancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  proConfirmButton: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 10,
    flex: 2,
    alignItems: "center",
  },
  proDisabledButton: {
    backgroundColor: "#cccccc",
  },
  proCancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  proConfirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  proMarker: {
    alignItems: "center",
  },
  proMarkerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2A9D8F",
    borderWidth: 3,
    borderColor: "white",
  },
  proMarkerPulse: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(42, 157, 143, 0.3)",
    zIndex: -1,
    transform: [{ scale: 2 }],
  },
  // Nuevos estilos para el mapa
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  mapBackButton: {
    marginRight: 15,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    flex: 1,
  },
  mapMainContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#333",
    fontSize: 15,
  },
  clearButton: {
    padding: 5,
  },
  searchActionButton: {
    backgroundColor: "#2A9D8F",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 45,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "500",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  myLocationButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "white",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapFooter: {
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelActionButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmActionButton: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 8,
    flex: 2,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "500",
  },
  customMarker: {
    alignItems: "top",
  },
  markerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2A9D8F",
    borderWidth: 3,
    borderColor: "white",
  },
  // Estilos para modal fullscreen de horarios
  modalHorarioFullScreen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHorarioHeaderFull: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHorarioHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHorarioTitleFull: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  modalHorarioScrollContent: {
    flex: 1,
  },
  calendarioSemanalContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarioTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  calendarioSubtitulo: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  calendarioDiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarioDiaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  calendarioDiaInfo: {
    flex: 1,
  },
  calendarioDiaNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  calendarHorariosLista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarHorarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A9D8F',
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 12,
    gap: 6,
  },
  calendarHorarioTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  calendarioSinHorario: {
    fontSize: 13,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  panelAgregarHorario: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  panelTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  horasContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  horaInputGroupFull: {
    flex: 1,
  },
  horaLabelFull: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 10,
  },
  horaButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2A9D8F',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 10,
  },
  horaButtonTextFull: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  horaSeparatorFull: {
    marginTop: 30,
    alignItems: 'center',
  },
  errorContainerFull: {
    backgroundColor: '#fee',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTextModerno: {
    color: '#c0392b',
    fontSize: 13,
    fontWeight: '500',
  },
  botonAgregarHorarioFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A9D8F',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#2A9D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  botonAgregarTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // Estilos para modal secundario (overlay)
  modalSecundarioOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSecundarioContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  modalSecundarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalSecundarioTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  horasContainerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  horaInputGroupModal: {
    flex: 1,
  },
  horaLabelModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 10,
  },
  horaButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2A9D8F',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 10,
  },
  horaButtonTextModal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  horaSeparatorModal: {
    marginTop: 30,
    alignItems: 'center',
  },
  errorContainerModal: {
    backgroundColor: '#fee',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  botonesModalSecundario: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  botonCancelarModal: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  botonCancelarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6c757d',
  },
  botonGuardarModal: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A9D8F',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  botonGuardarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  checkboxSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
  },
  checkboxLabel: {
    marginRight: 20,
    color: "#555",
  },
  resizableInput: {
    minHeight: 100,
    maxHeight: 300, // Establece un máximo para que no crezca indefinidamente
    paddingTop: 15, // Mejor alineación del texto
    paddingBottom: 15,
  },
  charCounter: {
    fontSize: 12,
    color: "#777",
    fontWeight: "normal",
  },
  listaHorariosContainer: {
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  listaHorariosTitulo: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2c3e50",
  },
  horariosCompactos: {
    gap: 8,
  },
  diaHorarioRow: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  diaHorarioInfo: {
    gap: 8,
  },
  diaTextoCompacto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  horariosChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  horarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f5f3',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 16,
    gap: 8,
  },
  horarioChipTexto: {
    fontSize: 13,
    color: '#2A9D8F',
    fontWeight: '500',
  },
  horarioDeleteButton: {
    padding: 2,
  },
  sinHorariosContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  sinHorariosText: {
    color: "#7f8c8d",
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  sinHorariosSubtext: {
    color: "#95a5a6",
    fontSize: 12,
    marginTop: 4,
  },
  agregarHorarioButtonModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: "#2A9D8F",
    marginBottom: 15,
    gap: 12,
  },
  agregarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A9D8F",
    justifyContent: 'center',
    alignItems: 'center',
  },
  agregarHorarioTextModerno: {
    color: "#2A9D8F",
    fontWeight: "600",
    fontSize: 15,
  },
  subcategoriasContainer: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fff',
  },
  subcategoriasTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    color: "#2A9D8F",
    letterSpacing: 0.3,
  },
  subcategoriasSubtitle: {
    fontSize: 13,
    color: "#7f8c8d",
    marginBottom: 16,
    fontWeight: '500',
  },
  subcategoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subcategoriaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subcategoriaPillSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  subcategoriaText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: '600',
  },
  subcategoriaTextSelected: {
    color: "white",
    fontWeight: '700',
  },
  selectedIndicator: {
    marginLeft: 6,
  },
  estadoContainer: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignSelf: "flex-start",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  estadoText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  emprendimientoStatusContainer: {
    marginHorizontal: 18,
    marginBottom: 14,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  paymentPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillSelected: {
    // Los colores se aplican dinámicamente desde el componente
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: '600',
  },
  pillTextSelected: {
    color: "white",
    fontWeight: '700',
  },
  pillIcon: {
    marginLeft: 6,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  radioButtonActive: {
    borderColor: '#2A9D8F',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A9D8F',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#555',
  },
  // Estilos para el nuevo mapa mejorado
  direccionButton: {
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  direccionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  direccionButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#888",
  },
  direccionButtonTextFilled: {
    color: "#2c3e50",
  },
  validacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  validacionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "500",
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapModalHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapBottomPanel: {
    backgroundColor: "white",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationLabel: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2c3e50",
    backgroundColor: "#fff",
    marginRight: 10,
    textAlignVertical: "top",
  },
  searchButton: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A9D8F",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#ecf0f1",
    borderColor: "#bdc3c7",
  },
  mapActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelMapButton: {
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  confirmMapButton: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  cancelMapButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmMapButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Estilos para modal de verificación
  verificacionTitulo: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  verificacionSubtitulo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  codigoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  codigoInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  reenviarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  reenviarTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  verificarButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  verificarButtonDisabled: {
    opacity: 0.6,
  },
  verificarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  avisoTexto: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EmprendimientoScreen;
