import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
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

const EmprendimientoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const usuario = route.params?.usuario ?? {};
  const [emprendimientos, setEmprendimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEmprendimiento, setCurrentEmprendimiento] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
  
  // Estados adicionales para validación con mapa
  const [region, setRegion] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [direccionValidada, setDireccionValidada] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  
  // Definición de categorías y subcategorías
  const categorias = [
    {
      id: "comida",
      nombre: "Comida Preparada",
      subcategorias: [
        { id: "sushi", nombre: "Sushi" },
        { id: "pizza", nombre: "Pizza" },
        { id: "hamburguesas", nombre: "Hamburguesas" },
        { id: "sandwiches", nombre: "Sandwiches" },
        { id: "comida_casera", nombre: "Comida Casera" },
        { id: "comida_peruana", nombre: "Comida Peruana" },
        { id: "comida_china", nombre: "Comida China" },
        { id: "comida_oriental", nombre: "Comida Oriental" },
        { id: "pasteleria", nombre: "Pastelería" },
        { id: "vegetariano", nombre: "Vegetariano/Vegano" },
        { id: "comida_rapida", nombre: "Comida Rápida" },
        { id: "mariscos", nombre: "Mariscos" },
        { id: "carnes", nombre: "Carnes" },
        { id: "otro", nombre: "Otro" },
      ],
    },
    {
      id: "servicios",
      nombre: "Servicios Locales",
      subcategorias: [
        { id: "construccion", nombre: "Construcción" },
        { id: "pintura", nombre: "Pintura" },
        { id: "gasfiteria", nombre: "Gasfitería" },
        { id: "electricidad", nombre: "Electricidad" },
        { id: "computadores", nombre: "Computadores" },
        { id: "jardineria", nombre: "Jardinería" },
        { id: "mudanzas", nombre: "Mudanzas" },
        { id: "limpieza", nombre: "Limpieza" },
        { id: "reparaciones", nombre: "Reparaciones" },
        { id: "diseño", nombre: "Diseño" },
        { id: "otro", nombre: "Otro" },
      ],
    },
    {
      id: "negocios",
      nombre: "Tiendas & Negocios",
      subcategorias: [
        { id: "almacen", nombre: "Almacén" },
        { id: "panaderia", nombre: "Panadería" },
        { id: "verduleria", nombre: "Verdulería" },
        { id: "carniceria", nombre: "Carnicería" },
        { id: "pescaderia", nombre: "Pescadería" },
        { id: "minimarket", nombre: "Minimarket" },
        { id: "licoreria", nombre: "Licorería" },
        { id: "ferreteria", nombre: "Ferretería" },
        { id: "floreria", nombre: "Florería" },
        { id: "libreria", nombre: "Librería" },
        { id: "mascotas", nombre: "Mascotas" },
        { id: "bazar", nombre: "Bazar" },
        { id: "otro", nombre: "Otro" },
      ],
    },
    {
      id: "belleza",
      nombre: "Belleza & Bienestar",
      subcategorias: [
        { id: "spa", nombre: "Spa" },
        { id: "manicure", nombre: "Manicure" },
        { id: "peluqueria", nombre: "Peluquería" },
        { id: "barberia", nombre: "Barbería" },
        { id: "estetica", nombre: "Estética" },
        { id: "maquillaje", nombre: "Maquillaje" },
        { id: "depilacion", nombre: "Depilación" },
        { id: "tatuajes", nombre: "Tatuajes" },
        { id: "masajes", nombre: "Masajes" },
        { id: "peluqueria_canina", nombre: "Peluquería Canina" },
        { id: "otro", nombre: "Otro" },
      ],
    },
  ];

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
    const [showInicioPicker, setShowInicioPicker] = useState(false);
    const [showFinPicker, setShowFinPicker] = useState(false);
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [horaFin, setHoraFin] = useState(new Date());
    const [error, setError] = useState("");

    useEffect(() => {
      if (horarioExistente) {
        const [inicioH, inicioM] = horarioExistente.inicio
          .split(":")
          .map(Number);
        const [finH, finM] = horarioExistente.fin.split(":").map(Number);

        const inicioDate = new Date();
        inicioDate.setHours(inicioH, inicioM, 0, 0);

        const finDate = new Date();
        finDate.setHours(finH, finM, 0, 0);

        setHoraInicio(inicioDate);
        setHoraFin(finDate);
      } else {
        const inicioDefault = new Date();
        inicioDefault.setHours(8, 0, 0, 0);

        const finDefault = new Date();
        finDefault.setHours(18, 0, 0, 0);

        setHoraInicio(inicioDefault);
        setHoraFin(finDefault);
      }
    }, [horarioExistente]);

    const formatHora = (date) => {
      return date.toTimeString().slice(0, 5);
    };

    const handleChangeInicio = (event, selectedDate) => {
      setShowInicioPicker(false);
      if (selectedDate) {
        setHoraInicio(selectedDate);
      }
    };

    const handleChangeFin = (event, selectedDate) => {
      setShowFinPicker(false);
      if (selectedDate) {
        setHoraFin(selectedDate);
      }
    };

    const validarHorario = () => {
      if (horaInicio >= horaFin) {
        setError("La hora de inicio debe ser anterior a la de fin");
        return false;
      }

      setError("");
      return true;
    };

    const handleSave = () => {
      if (validarHorario()) {
        onSave({
          inicio: formatHora(horaInicio),
          fin: formatHora(horaFin),
        });
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalHorarioContainer}>
          <View style={styles.modalHorarioContent}>
            <Text style={styles.modalHorarioTitle}>
              {horarioExistente ? "Editar Horario" : "Agregar Horario"}
            </Text>

            {/* Selector de día */}
            <Text style={styles.inputLabel}>Día</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={diaSeleccionado}
                onValueChange={setDiaSeleccionado}
                style={styles.picker}
              >
                {Object.keys(horariosIniciales).map((dia) => (
                  <Picker.Item key={dia} label={dia} value={dia} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Hora de Inicio</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowInicioPicker(true)}
            >
              <Text style={styles.timePickerText}>
                {formatHora(horaInicio)}
              </Text>
            </TouchableOpacity>

            {showInicioPicker && (
              <DateTimePicker
                value={horaInicio}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChangeInicio}
              />
            )}

            <Text style={styles.inputLabel}>Hora de Fin</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowFinPicker(true)}
            >
              <Text style={styles.timePickerText}>{formatHora(horaFin)}</Text>
            </TouchableOpacity>

            {showFinPicker && (
              <DateTimePicker
                value={horaFin}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChangeFin}
              />
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalHorarioButtons}>
              <TouchableOpacity
                style={styles.modalHorarioButtonCancel}
                onPress={onClose}
              >
                <Text style={styles.modalHorarioButtonText}>Cerrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalHorarioButtonSave}
                onPress={handleSave}
              >
                <Text style={styles.modalHorarioButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const ListaHorarios = ({ horarios, onEdit, onDelete }) => {
    return (
      <View style={styles.listaHorariosContainer}>
        <Text style={styles.listaHorariosTitulo}>Horarios Configurados</Text>

        {Object.entries(horarios).map(([dia, horariosDia]) => {
          if (horariosDia.length === 0) return null;

          return (
            <View key={dia} style={styles.diaHorarioContainer}>
              <Text style={styles.diaHorarioTitulo}>{dia}</Text>
              <View style={styles.horariosLista}>
                {horariosDia.map((horario, index) => (
                  <View key={`${dia}-${index}`} style={styles.horarioItem}>
                    <Text style={styles.horarioText}>
                      {horario.inicio} - {horario.fin}
                    </Text>
                    <View style={styles.horarioActions}>
                      <TouchableOpacity onPress={() => onEdit(dia, horario)}>
                        <MaterialIcons name="edit" size={18} color="#2A9D8F" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDelete(dia, horario.id)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={18}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {Object.values(horarios).every((dia) => dia.length === 0) && (
          <Text style={styles.sinHorariosText}>
            No hay horarios configurados
          </Text>
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
    nuevosHorarios[dia] = nuevosHorarios[dia].filter((h) => h.id !== id);
    setHorarios(nuevosHorarios);
  };

  const guardarHorario = ({ inicio, fin }) => {
    const dia = diaSeleccionado;
    const horariosDia = [...horarios[dia]];

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
          <Ionicons name="map" size={20} color="#2A9D8F" />
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
          <ActivityIndicator size="small" color="#2A9D8F" />
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
          colors={["#2A9D8F", "#1D7874"]}
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
                  <Ionicons name="location" size={30} color="#2A9D8F" />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.mapBottomPanel}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={18} color="#2A9D8F" />
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
                  <Ionicons name="search" size={20} color="#2A9D8F" />
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
                style={[styles.confirmMapButton, validandoDireccion && styles.disabledButton]}
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
      // Simulamos carga de datos (en una app real sería una API)
      const emprendimientosGuardados = await AsyncStorage.getItem(
        "emprendimientos"
      );
      if (emprendimientosGuardados) {
        setEmprendimientos(JSON.parse(emprendimientosGuardados));
      }
    } catch (error) {
      console.error("Error al cargar emprendimientos:", error);
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

  // Llama a esta función cuando subas imágenes exitosamente
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

    if (!result.canceled) {
      if (tipo === "logo") {
        setLogo(result.assets[0].uri);
        await guardarImagenesRespaldo(result.assets[0].uri, null);
      } else {
        setBackground(result.assets[0].uri);
        await guardarImagenesRespaldo(null, result.assets[0].uri);
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
              const nuevoEmprendimiento = {
                id: isEditing
                  ? currentEmprendimiento.id
                  : Date.now().toString(),
                nombre,
                descripcionCorta,
                descripcionLarga,
                horarios,
                comuna,
                direccion: currentAddress,
                telefono,
                logo,
                background,
                status: isEditing ? "pendiente actualización" : "pendiente",
                categoria: categoriaSeleccionada,
                subcategorias: subcategoriasSeleccionadas,
                ubicacion: selectedLocation, // Guardamos las coordenadas
                fechaCreacion: new Date().toISOString(),
                // Agrega campos necesarios para la previsualización
                estado: "Abierto", // Valor por defecto
                rating: 5, // Valor por defecto
                metodosPago: mediosPago,
                metodosEntrega: {
                  ...tiposEntrega,
                  deliveryCosto: tiposEntrega.delivery
                    ? costoDelivery
                    : "Consultar",
                },
              };

              let nuevosEmprendimientos;
              if (isEditing) {
                nuevosEmprendimientos = emprendimientos.map((emp) =>
                  emp.id === currentEmprendimiento.id
                    ? nuevoEmprendimiento
                    : emp
                );
              } else {
                nuevosEmprendimientos = [
                  ...emprendimientos,
                  nuevoEmprendimiento,
                ];
              }

              await AsyncStorage.setItem(
                "emprendimientos",
                JSON.stringify(nuevosEmprendimientos)
              );
              setEmprendimientos(nuevosEmprendimientos);
              resetForm();
              setModalVisible(false);
              Alert.alert(
                "Éxito",
                `Emprendimiento ${
                  isEditing ? "actualizado" : "creado"
                } correctamente`
              );
            } catch (error) {
              Alert.alert("Error", "No se pudo guardar el emprendimiento");
            }
          },
        },
      ]
    );
  };

  // Editar emprendimiento
  const editarEmprendimiento = (emprendimiento) => {
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
              const nuevosEmprendimientos = emprendimientos.filter(
                (emp) => emp.id !== id
              );
              await AsyncStorage.setItem(
                "emprendimientos",
                JSON.stringify(nuevosEmprendimientos)
              );
              setEmprendimientos(nuevosEmprendimientos);
              Alert.alert("Éxito", "Emprendimiento eliminado correctamente");
            } catch (error) {
              console.error("Error al eliminar emprendimiento:", error);
              Alert.alert("Error", "No se pudo eliminar el emprendimiento");
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
      const nuevosEmprendimientos = emprendimientos.map(emp => {
        if (emp.id === id) {
          return {
            ...emp,
            status: isActive ? 'activo' : 'inactivo'
          };
        }
        return emp;
      });
      
      await AsyncStorage.setItem(
        "emprendimientos",
        JSON.stringify(nuevosEmprendimientos)
      );
      setEmprendimientos(nuevosEmprendimientos);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del emprendimiento");
    }
  };

  const EmprendimientoItem = ({ item, navigation, comunas, editarEmprendimiento, eliminarEmprendimiento, actualizarEstadoEmprendimiento, previsualizarEmprendimiento }) => {
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
  
    return (
    
      <View style={styles.emprendimientoCard}>
        <View style={styles.emprendimientoHeader}>
          {item.logo ? (
            <Image
              source={{ uri: item.logo }}
              style={styles.emprendimientoLogo}
            />
          ) : (
            <View style={styles.emprendimientoLogoPlaceholder}>
              <FontAwesome name="image" size={24} color="#ccc" />
            </View>
          )}
          <Text style={styles.emprendimientoNombre}>{item.nombre}</Text>
        </View>
  
        {item.background && (
          <Image
            source={{ uri: item.background }}
            style={styles.emprendimientoBackground}
          />
        )}
  
        <Text style={styles.emprendimientoDescripcion}>
          {item.descripcionCorta}
        </Text>
        <Text style={styles.emprendimientoDescripcion}>
          {item.descripcionLarga}
        </Text>
        <View style={styles.emprendimientoInfo}>
          <View style={styles.infoItem}>
            <FontAwesome name="map-marker" size={14} color="#2A9D8F" />
            <Text style={styles.infoText}>
              {item.direccion},{" "}
              {comunas.find((c) => c.id === item.comuna)?.nombre}
            </Text>
          </View>
  
          <View style={styles.infoItem}>
            <FontAwesome name="phone" size={14} color="#2A9D8F" />
            <Text style={styles.infoText}>{item.telefono}</Text>
          </View>
        </View>
        <View style={styles.emprendimientoStatusContainer}>
          <EstadoNegocio estado={item.status || "pendiente"} />
        </View>
        <View style={styles.emprendimientoActions}>
          {/* Nuevo botón de previsualización */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => previsualizarEmprendimiento(item)}
          >
            <FontAwesome name="eye" size={20} color="#555" />
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("ProductosEmprendimiento", {
                emprendimiento: item,
              })
            }
          >
            <FontAwesome name="shopping-cart" size={20} color="#555" />
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("MisEstadisticas", { emprendimiento: item })
            }
          >
            <FontAwesome name="signal" size={20} color="#555" />
          </TouchableOpacity>
  
          {item.status === "activo" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => editarEmprendimiento(item)}
            >
              <MaterialIcons name="edit" size={20} color="#2A9D8F" />
            </TouchableOpacity>
          )}
  
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => eliminarEmprendimiento(item.id)}
          >
            <MaterialIcons name="delete" size={20} color="#e74c3c" />
          </TouchableOpacity>
               
        </View>
        <View style={styles.emprendimientoActionsRight}>
             {/* Radio button para activar/desactivar */}
             <View style={styles.switchContainer}>
        <Text style={styles.switchText}>{isActive ? 'Activo' : 'Inactivo'}</Text>
        <Switch 
          trackColor={{ false: "#767577", true: "#4CAF50" }} 
          thumbColor={isActive ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleActive}
          value={isActive}
        />
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
    />
  );

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
            if (horariosDia.length > 0) {
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

        navigation.navigate("PedidoDetalle", { producto: emprendimientoPreview });
    } catch (error) {
      console.error("Error al preparar previsualización:", error);
      Alert.alert("Error", "No se pudo cargar la previsualización");
    }
  };

  return (
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <Ionicons name="business" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Mis Emprendimientos</Text>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A9D8F" />
          </View>
        ) : emprendimientos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="building" size={60} color="#e0e0e0" />
            <Text style={styles.emptyTitle}>No tienes emprendimientos</Text>
            <Text style={styles.emptyText}>
              Registra tu primer emprendimiento para comenzar
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

        {/* Botón flotante para agregar */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal para agregar/editar emprendimiento */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <LinearGradient
          colors={["#2A9D8F", "#1D7874"]}
          style={styles.modalHeaderGradient}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? "Editar Emprendimiento" : "Nuevo Emprendimiento"}
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.modalContainer}>
          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del Emprendimiento*</Text>
            <TextInput
              style={styles.inputField}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Mi Negocio Local"
            />
          </View>

          {/* Campo Descripción Corta */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Descripción Corta* (max 50 caracteres)
            </Text>
            <TextInput
              style={styles.inputField}
              value={descripcionCorta}
              onChangeText={setDescripcionCorta}
              placeholder="Breve descripción de tu emprendimiento"
              maxLength={50}
            />
            <Text style={styles.charCounter}>
              {descripcionCorta.length}/50 caracteres
            </Text>
          </View>

          {/* Campo Descripción Larga */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Descripción Larga (max 1000 caracteres)
              <Text style={styles.charCounter}>
                {" "}
                ({descripcionLarga.length}/1000)
              </Text>
            </Text>
            <TextInput
              style={[
                styles.inputField,
                styles.resizableInput,
                { height: Math.max(100, descripcionLarga.length / 3) },
              ]}
              value={descripcionLarga}
              onChangeText={setDescripcionLarga}
              placeholder="Descripción detallada de tu emprendimiento..."
              multiline
              maxLength={1000}
              textAlignVertical="top" // Para que el texto comience desde arriba
              onContentSizeChange={(e) => {
                // Esto hará que el campo crezca con el contenido
                const { height } = e.nativeEvent.contentSize;
                // Puedes ajustar el cálculo según necesites
              }}
            />
          </View>

          {/* Campo Comuna */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comuna*</Text>
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

          {renderAddressField()}
          {/* Campo Teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono*</Text>
            <TextInput
              style={styles.inputField}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+56912345678"
              keyboardType="phone-pad"
            />
          </View>

          {/* Medios de Pago - Versión con botones estilo píldora */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Medios de Pago*</Text>
            <View style={styles.pillsContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentPill,
                  mediosPago.efectivo && styles.pillSelected,
                ]}
                onPress={() =>
                  setMediosPago({
                    ...mediosPago,
                    efectivo: !mediosPago.efectivo,
                  })
                }
              >
                <Text
                  style={[
                    styles.pillText,
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
                  mediosPago.tarjeta && styles.pillSelected,
                ]}
                onPress={() =>
                  setMediosPago({ ...mediosPago, tarjeta: !mediosPago.tarjeta })
                }
              >
                <Text
                  style={[
                    styles.pillText,
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
                  mediosPago.transferencia && styles.pillSelected,
                ]}
                onPress={() =>
                  setMediosPago({
                    ...mediosPago,
                    transferencia: !mediosPago.transferencia,
                  })
                }
              >
                <Text
                  style={[
                    styles.pillText,
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

          {/* Tipos de Entrega - Versión con botones estilo píldora */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipos de Entrega*</Text>
            <View style={styles.pillsContainer}>
              <TouchableOpacity
                style={[
                  styles.deliveryPill,
                  tiposEntrega.retiro && styles.pillSelected,
                ]}
                onPress={() =>
                  setTiposEntrega({
                    ...tiposEntrega,
                    retiro: !tiposEntrega.retiro,
                  })
                }
              >
                <Text
                  style={[
                    styles.pillText,
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
                  tiposEntrega.delivery && styles.pillSelected,
                ]}
                onPress={() =>
                  setTiposEntrega({
                    ...tiposEntrega,
                    delivery: !tiposEntrega.delivery,
                  })
                }
              >
                <Text
                  style={[
                    styles.pillText,
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

            {/* Campo para costo de delivery (solo visible si delivery está seleccionado) */}
            {tiposEntrega.delivery && (
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>
                  Costo de Delivery (opcional)
                </Text>
                <TextInput
                  style={styles.inputField}
                  value={costoDelivery}
                  onChangeText={setCostoDelivery}
                  placeholder="Ej: $1.500 o Gratis para compras sobre $10.000"
                  keyboardType="default"
                />
              </View>
            )}
          </View>

          {/* En el modal principal, reemplazar la sección de horarios con: */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Horarios*</Text>
            <TouchableOpacity
              style={styles.agregarHorarioButton}
              onPress={agregarHorario}
            >
              <Text style={styles.agregarHorarioButtonText}>
                + Agregar Horario
              </Text>
            </TouchableOpacity>

            <ListaHorarios
              horarios={horarios}
              onEdit={editarHorario}
              onDelete={eliminarHorario}
            />
          </View>

          <ModalHorario
            visible={mostrarModalHorario}
            onClose={() => setMostrarModalHorario(false)}
            onSave={guardarHorario}
            horarioExistente={horarioEditando}
            diaSeleccionado={diaSeleccionado}
            setDiaSeleccionado={setDiaSeleccionado}
          />

          {/* Logo del emprendimiento */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Logo del Emprendimiento</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={() => seleccionarImagen("logo")}
            >
              {logo ? (
                <Image source={{ uri: logo }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={24} color="#2A9D8F" />
                  <Text style={styles.imagePlaceholderText}>
                    Seleccionar logo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Imagen de fondo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Imagen de Fondo</Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={() => seleccionarImagen("background")}
            >
              {background ? (
                <Image
                  source={{ uri: background }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="image" size={24} color="#2A9D8F" />
                  <Text style={styles.imagePlaceholderText}>
                    Seleccionar imagen de fondo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sección de Categorías */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoría Principal*</Text>

            {/* Selector de categoría principal */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={categoriaSeleccionada}
                onValueChange={(itemValue) => {
                  setCategoriaSeleccionada(itemValue);
                  setSubcategoriasSeleccionadas([]); // Resetear subcategorías al cambiar categoría
                }}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona una categoría" value={null} />
                {categorias.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
                ))}
              </Picker>
            </View>

            {/* Mostrar subcategorías solo si se ha seleccionado una categoría */}
            {categoriaSeleccionada && (
              <View style={styles.subcategoriasContainer}>
                <Text style={styles.subcategoriasTitle}>Subcategorías</Text>
                <Text style={styles.subcategoriasSubtitle}>
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
                            isSelected && styles.subcategoriaPillSelected,
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
                        >
                          <Text
                            style={[
                              styles.subcategoriaText,
                              isSelected && styles.subcategoriaTextSelected,
                            ]}
                          >
                            {subcat.nombre}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedIndicator}>
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

          {/* Botón Guardar */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={guardarEmprendimiento}
            disabled={validandoDireccion}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Actualizar Emprendimiento" : "Enviar a evaluación"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {renderMapModal()}
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
  },
  emprendimientoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emprendimientoHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  emprendimientoLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  emprendimientoLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  emprendimientoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  emprendimientoBackground: {
    width: "100%",
    height: 150,
  },
  emprendimientoDescripcion: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    color: "#555",
  },
  emprendimientoInfo: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  emprendimientoActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 10, // Para separar los botones
  },
  emprendimientoActionsRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 10, // Para separar los botones
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2A9D8F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeaderGradient: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    padding: 20,
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
  charCounter: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
    marginTop: 5,
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
    height: 150,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: "#2A9D8F",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#2A9D8F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
  modalHorarioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalHorarioContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalHorarioTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2A9D8F",
  },
  modalHorarioButton: {
    padding: 10,
    borderRadius: 5,
    width: "48%",
    alignItems: "center",
  },
  horariosDiaContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
  },
  horariosDiaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2A9D8F",
  },
  horariosDiaEmpty: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: 10,
  },
  horariosList: {
    marginBottom: 10,
  },
  horarioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  horarioText: {
    fontSize: 15,
  },
  horarioActions: {
    flexDirection: "row",
    gap: 15,
  },
  addHorarioButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  addHorarioButtonText: {
    color: "#2A9D8F",
    fontWeight: "500",
  },
  horarioDisplayItem: {
    flexDirection: "row",
    marginLeft: 22,
    marginBottom: 5,
    flexWrap: "wrap",
  },
  horarioDisplayDia: {
    fontWeight: "500",
    marginRight: 5,
  },
  horarioDisplayText: {
    color: "#555",
  },
  modalHorarioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalHorarioContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHorarioTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2A9D8F",
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  timePickerText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalHorarioButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalHorarioButtonCancel: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  modalHorarioButtonSave: {
    backgroundColor: "#2A9D8F",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  modalHorarioButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
  },
  listaHorariosTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2A9D8F",
  },
  diaHorarioContainer: {
    marginBottom: 10,
  },
  diaHorarioTitulo: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
  },
  horariosLista: {
    marginLeft: 10,
  },
  horarioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  horarioText: {
    fontSize: 14,
  },
  horarioActions: {
    flexDirection: "row",
    gap: 10,
  },
  sinHorariosText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
  },
  agregarHorarioButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  agregarHorarioButtonText: {
    color: "#2A9D8F",
    fontWeight: "500",
  },
  subcategoriasContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
  },
  subcategoriasTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#2A9D8F",
  },
  subcategoriasSubtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 15,
  },
  subcategoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subcategoriaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  subcategoriaPillSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
  },
  subcategoriaText: {
    fontSize: 14,
    color: "#555",
  },
  subcategoriaTextSelected: {
    color: "white",
  },
  selectedIndicator: {
    marginLeft: 5,
  },
  estadoContainer: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: "flex-start",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  emprendimientoStatusContainer: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  paymentPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pillSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
  },
  pillText: {
    fontSize: 14,
    color: "#555",
  },
  pillTextSelected: {
    color: "white",
  },
  pillIcon: {
    marginLeft: 5,
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
});

export default EmprendimientoScreen;
