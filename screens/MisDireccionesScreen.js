import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const MisDireccionesScreen = () => {
  const navigation = useNavigation();
  const { direcciones, cargarDirecciones, invalidarDirecciones } = useUser();
  const { currentTheme } = useTheme();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [direccionCompleta, setDireccionCompleta] = useState("");
  const [referencia, setReferencia] = useState("");
  const [esPrincipal, setEsPrincipal] = useState(false);
  
  // Estados para validación con mapa
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [validandoDireccion, setValidandoDireccion] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [region, setRegion] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [direccionValidada, setDireccionValidada] = useState(null);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  const comunas = [
    { id: "1", nombre: "Isla de Maipo" },
    { id: "2", nombre: "Talagante" },
    { id: "3", nombre: "El Monte" },
    { id: "4", nombre: "Peñaflor" },
    { id: "5", nombre: "Melipilla" },
  ];

  // Cargar direcciones al iniciar (usando contexto con cache)
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        await cargarDirecciones(false); // Usar cache si es válido
      } catch (error) {
        console.error("Error al cargar direcciones:", error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Recargar cuando se regrese a la pantalla (solo si es necesario)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        setCargando(true);
        await cargarDirecciones(false); // Solo recargará si el cache expiró
      } catch (error) {
        console.error("Error al recargar direcciones:", error);
      } finally {
        setCargando(false);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const guardarDireccion = async () => {
    if (!nombre.trim() || !direccionCompleta.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Error", "No hay sesión activa. Por favor inicia sesión.");
        navigation.navigate("Login");
        return;
      }

      // Preparar datos para el backend
      const datosDireccion = {
        nombre: nombre.trim(),
        direccion: direccionCompleta.trim(),
        referencia: referencia.trim() || null,
        es_principal: esPrincipal,
        latitud: direccionValidada?.coordenadas?.lat || selectedLocation?.latitude || null,
        longitud: direccionValidada?.coordenadas?.lng || selectedLocation?.longitude || null,
      };
      
      console.log('📤 Enviando datos al backend:', JSON.stringify(datosDireccion, null, 2));

      let response;
      
      if (direccionEditando) {
        // Actualizar dirección existente
        response = await fetch(API_ENDPOINTS.DIRECCION_BY_ID(direccionEditando.id), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(datosDireccion),
        });
      } else {
        // Crear nueva dirección
        response = await fetch(API_ENDPOINTS.DIRECCIONES, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(datosDireccion),
        });
      }

      const data = await response.json();
      console.log('📥 Respuesta del backend:', JSON.stringify(data, null, 2));

      if (response.ok && data.ok) {
        console.log('✅ Dirección guardada, recargando lista...');
        // Invalidar cache y recargar direcciones
        invalidarDirecciones();
        const direccionesActualizadas = await cargarDirecciones(true); // Forzar recarga para obtener datos actualizados
        console.log('📋 Direcciones actualizadas:', direccionesActualizadas?.map(d => ({ id: d.id, nombre: d.nombre, esPrincipal: d.esPrincipal })));
        
        // Limpiar formulario
        limpiarFormulario();
        
        Alert.alert(
          "Éxito", 
          data.mensaje || (direccionEditando ? "Dirección actualizada correctamente" : "Dirección guardada correctamente")
        );
      } else {
        Alert.alert("Error", data.mensaje || data.error || "No se pudo guardar la dirección");
      }
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarDireccion = (direccion) => {
    setDireccionEditando(direccion);
    setNombre(direccion.nombre);
    setDireccionCompleta(direccion.direccion);
    setReferencia(direccion.referencia || "");
    setEsPrincipal(direccion.esPrincipal || false);
    
    // Restaurar coordenadas si existen
    if (direccion.coordenadas) {
      setSelectedLocation({
        latitude: direccion.coordenadas.lat || direccion.coordenadas.latitude,
        longitude: direccion.coordenadas.lng || direccion.coordenadas.longitude,
      });
      setDireccionValidada({
        coordenadas: direccion.coordenadas
      });
    }
    
    setMostrarFormulario(true);
  };

  const eliminarDireccion = (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
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

              console.log('🗑️ Eliminando dirección ID:', id);
              const response = await fetch(API_ENDPOINTS.DIRECCION_BY_ID(id), {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              });

              const data = await response.json();
              console.log('📥 Respuesta DELETE:', JSON.stringify(data, null, 2));

              if (response.ok && data.ok) {
                console.log('✅ Dirección eliminada, recargando lista...');
                // Invalidar cache y recargar direcciones
                invalidarDirecciones();
                await cargarDirecciones(true); // Forzar recarga
                Alert.alert("Éxito", data.mensaje || "Dirección eliminada correctamente");
              } else {
                Alert.alert("Error", data.mensaje || data.error || "No se pudo eliminar la dirección");
              }
            } catch (error) {
              console.error('Error al eliminar dirección:', error);
              Alert.alert(
                "Error de conexión",
                "No se pudo conectar al servidor. Verifica tu conexión a internet y que el backend esté corriendo."
              );
            } finally {
              setCargando(false);
            }
          }
        }
      ]
    );
  };

  const limpiarFormulario = () => {
    setDireccionEditando(null);
    setNombre("");
    setDireccionCompleta("");
    setReferencia("");
    setEsPrincipal(false);
    setMostrarFormulario(false);
    setDireccionValidada(null);
  };

  // Función para abrir el mapa
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

  // Función para manejar el press en el mapa
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

  // Función para confirmar la ubicación del mapa
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
        setDireccionCompleta(validationResult.direccion);
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

  // Función para buscar dirección y mover el mapa
  const buscarDireccion = async (direccion) => {
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

  // Función para validar dirección con Google Maps
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

  const renderDireccion = ({ item }) => (
    <View style={[styles.direccionCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
      <View style={styles.direccionHeader}>
        <View style={styles.direccionInfo}>
          <Text style={[styles.direccionNombre, { color: currentTheme.text }]}>{item.nombre}</Text>
          {item.esPrincipal && (
            <View style={[styles.principalBadge, { backgroundColor: currentTheme.primary }]}>
              <Text style={styles.principalText}>Principal</Text>
            </View>
          )}
        </View>
        <View style={styles.direccionActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => editarDireccion(item)}
          >
            <Ionicons name="pencil" size={20} color={currentTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => eliminarDireccion(item.id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.direccionDetalles}>
        <Text style={[styles.direccionTexto, { color: currentTheme.text }]}>
          {item.direccion}
        </Text>
        {item.referencia && (
          <Text style={[styles.referenciaTexto, { color: currentTheme.textSecondary }]}>
            Referencia: {item.referencia}
          </Text>
        )}
      </View>
    </View>
  );

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
            <Ionicons name="location" size={24} color="white" />
            <Text style={styles.tituloPrincipal}>Mis Direcciones</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>Cargando direcciones...</Text>
          </View>
        ) : direcciones.length > 0 ? (
          <FlatList
            data={direcciones}
            renderItem={renderDireccion}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.direccionesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No tienes direcciones guardadas</Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>
              Agrega tu primera dirección para recibir pedidos
            </Text>
          </View>
        )}

        {!mostrarFormulario && (
          <TouchableOpacity 
            style={[styles.agregarButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => setMostrarFormulario(true)}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.agregarButtonText}>
              {direcciones.length > 0 ? "Agregar nueva dirección" : "Agregar mi primera dirección"}
            </Text>
          </TouchableOpacity>
        )}

        {mostrarFormulario && (
          <View style={[styles.formularioContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            <View style={styles.formularioHeader}>
              <Text style={[styles.formularioTitle, { color: currentTheme.text }]}>
                {direccionEditando ? "Editar Dirección" : "Nueva Dirección"}
              </Text>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={limpiarFormulario}
              >
                <Ionicons name="close" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            <View style={styles.formulario}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre de la dirección *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej: Casa, Trabajo, etc."
                  placeholderTextColor={currentTheme.textSecondary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Dirección completa *</Text>
                <TouchableOpacity
                  style={[styles.direccionButton, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}
                  onPress={openMapPicker}
                >
                  <View style={styles.direccionButtonContent}>
                    <Ionicons name="map" size={20} color={currentTheme.primary} />
                    <Text style={[styles.direccionButtonText, { color: direccionCompleta ? currentTheme.text : currentTheme.textSecondary }]}>
                      {direccionCompleta || "Selecciona en el mapa"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={currentTheme.textSecondary} />
                  </View>
                </TouchableOpacity>
                {direccionValidada && (
                  <View style={styles.validacionContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                    <Text style={[styles.validacionText, { color: "#27ae60" }]}>Dirección validada</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Referencia (opcional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                  value={referencia}
                  onChangeText={setReferencia}
                  placeholder="Ej: Frente al supermercado"
                  placeholderTextColor={currentTheme.textSecondary}
                  autoCapitalize="words"
                />
              </View>

              <TouchableOpacity 
                style={[styles.checkboxContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }, esPrincipal && [styles.checkboxSelected, { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '20' }]]}
                onPress={() => setEsPrincipal(!esPrincipal)}
              >
                <Ionicons 
                  name={esPrincipal ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={esPrincipal ? currentTheme.primary : currentTheme.textSecondary} 
                />
                <Text style={[styles.checkboxText, { color: currentTheme.text }]}>Marcar como dirección principal</Text>
              </TouchableOpacity>

              <View style={styles.formularioActions}>
                <TouchableOpacity 
                  style={[styles.cancelarButton, { borderColor: currentTheme.border }]}
                  onPress={limpiarFormulario}
                >
                  <Text style={[styles.cancelarButtonText, { color: "#e74c3c" }]}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.guardarButton, { backgroundColor: currentTheme.primary }, guardando && styles.guardarButtonDisabled]}
                  onPress={guardarDireccion}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.guardarButtonText}>
                      {direccionEditando ? "Actualizar" : "Guardar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Modal del mapa */}
        <Modal
          visible={mapModalVisible}
          animationType="slide"
          transparent={false}
        >
          <View style={styles.mapModalContainer}>
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

              <View style={[styles.mapBottomPanel, { backgroundColor: currentTheme.cardBackground, borderTopColor: currentTheme.border }]}>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={18} color={currentTheme.primary} />
                  <Text style={[styles.locationLabel, { color: currentTheme.text }]}>Dirección:</Text>
                </View>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.addressInput, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                    value={currentAddress}
                    onChangeText={setCurrentAddress}
                    placeholder="Escribe una dirección o selecciona en el mapa"
                    placeholderTextColor={currentTheme.textSecondary}
                    multiline={true}
                    numberOfLines={2}
                  />
                  <TouchableOpacity
                    style={[styles.searchButton, { backgroundColor: currentTheme.background, borderColor: currentTheme.primary }, buscandoDireccion && styles.searchButtonDisabled]}
                    onPress={() => buscarDireccion(currentAddress)}
                    disabled={buscandoDireccion}
                  >
                    {buscandoDireccion ? (
                      <Ionicons name="hourglass" size={20} color={currentTheme.textSecondary} />
                    ) : (
                      <Ionicons name="search" size={20} color={currentTheme.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.mapActions}>
                  <TouchableOpacity
                    style={[styles.cancelMapButton, { backgroundColor: currentTheme.background }]}
                    onPress={() => setMapModalVisible(false)}
                  >
                    <Text style={[styles.cancelMapButtonText, { color: currentTheme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.confirmMapButton, { backgroundColor: currentTheme.primary }, validandoDireccion && styles.disabledButton]}
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
      </ScrollView>
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
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 150, // Espacio para el botón flotante y menú inferior
  },
  direccionesList: {
    marginBottom: 20,
  },
  direccionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  direccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  direccionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  direccionNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginRight: 10,
  },
  principalBadge: {
    backgroundColor: "#2A9D8F",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  principalText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  direccionActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  direccionDetalles: {
    marginTop: 4,
  },
  direccionTexto: {
    fontSize: 16,
    color: "#34495e",
    marginBottom: 4,
  },
  comunaTexto: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  referenciaTexto: {
    fontSize: 14,
    color: "#95a5a6",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7f8c8d",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#95a5a6",
    textAlign: "center",
    lineHeight: 22,
  },
  agregarButton: {
    backgroundColor: "#2A9D8F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  agregarButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  formularioContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formularioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formularioTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  cancelButton: {
    padding: 4,
  },
  formulario: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#bdc3c7",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  picker: {
    height: 50,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bdc3c7",
    backgroundColor: "#f8f9fa",
  },
  checkboxSelected: {
    borderColor: "#2A9D8F",
    backgroundColor: "#e8f6f3",
  },
  checkboxText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 12,
  },
  formularioActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelarButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e74c3c",
    marginRight: 10,
    alignItems: "center",
  },
  cancelarButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "bold",
  },
  guardarButton: {
    flex: 1,
    backgroundColor: "#2A9D8F",
    padding: 16,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  guardarButtonDisabled: {
    backgroundColor: "#95a5a6",
    opacity: 0.6,
  },
  guardarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
  // Estilos para validación con mapa
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
  // Estilos para el modal del mapa
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
  mapBackButton: {
    marginRight: 15,
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

export default MisDireccionesScreen;

