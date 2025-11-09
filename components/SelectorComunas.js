import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Componente reutilizable para seleccionar comunas desde la base de datos
 * Soporta búsqueda y es escalable para 50+ comunas
 * 
 * Props:
 * - visible: boolean - Mostrar/ocultar el modal
 * - onClose: function - Callback al cerrar el modal
 * - onSelect: function(comuna) - Callback al seleccionar una comuna
 * - title: string - Título del modal
 * - multiSelect: boolean - Permitir selección múltiple (default: false)
 * - selectedIds: array - IDs de comunas pre-seleccionadas (para multiselect)
 * - theme: object - Tema actual de la app
 */
const SelectorComunas = ({
  visible,
  onClose,
  onSelect,
  title = 'Seleccionar Comuna',
  multiSelect = false,
  selectedIds = [],
  theme = null
}) => {
  const [comunas, setComunas] = useState([]);
  const [comunasFiltradas, setComunasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  // Theme por defecto si no se proporciona
  const currentTheme = theme || {
    primary: '#2A9D8F',
    secondary: '#1D7874',
    background: '#FAFAF9',
    cardBackground: '#FFFFFF',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    border: '#e0e0e0',
  };

  // Cargar comunas y resetear estados cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (comunas.length === 0) {
        cargarComunas();
      }
      // Resetear búsqueda y selección al abrir
      setBusqueda('');
      setSeleccionados(selectedIds || []);
    }
  }, [visible]);

  const cargarComunas = async () => {
    try {
      setCargando(true);
      const response = await fetch(API_ENDPOINTS.COMUNAS);
      const data = await response.json();
      
      if (data.comunas && Array.isArray(data.comunas)) {
        // Ordenar alfabéticamente
        const comunasOrdenadas = data.comunas.sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
        setComunas(comunasOrdenadas);
        setComunasFiltradas(comunasOrdenadas);
        console.log('✅ Comunas cargadas:', comunasOrdenadas.length);
      }
    } catch (error) {
      console.error('❌ Error al cargar comunas:', error);
      setComunas([]);
      setComunasFiltradas([]);
    } finally {
      setCargando(false);
    }
  };

  // Filtrar comunas según búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setComunasFiltradas(comunas);
    } else {
      const filtradas = comunas.filter(comuna =>
        comuna.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (comuna.region && comuna.region.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setComunasFiltradas(filtradas);
    }
  }, [busqueda, comunas]);

  const handleSeleccionar = (comuna) => {
    if (multiSelect) {
      // Selección múltiple
      const yaSeleccionado = seleccionados.includes(comuna.nombre);
      let nuevosSeleccionados;
      
      if (yaSeleccionado) {
        nuevosSeleccionados = seleccionados.filter(id => id !== comuna.nombre);
      } else {
        nuevosSeleccionados = [...seleccionados, comuna.nombre];
      }
      
      setSeleccionados(nuevosSeleccionados);
    } else {
      // Selección simple
      onSelect(comuna);
      onClose();
    }
  };

  const handleConfirmarMultiple = () => {
    if (multiSelect) {
      onSelect(seleccionados);
      onClose();
    }
  };

  const renderComuna = ({ item }) => {
    const isSelected = multiSelect ? seleccionados.includes(item.nombre) : false;

    return (
      <TouchableOpacity
        style={[
          styles.comunaItem,
          { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border },
          isSelected && { 
            borderColor: currentTheme.primary, 
            borderWidth: 2, 
            backgroundColor: currentTheme.primary + '10',
            shadowColor: currentTheme.primary,
            shadowOpacity: 0.2,
          }
        ]}
        onPress={() => handleSeleccionar(item)}
        activeOpacity={0.7}
      >
        <View style={styles.comunaInfo}>
          <Text style={[styles.comunaNombre, { color: isSelected ? currentTheme.primary : currentTheme.text }]}>
            {item.nombre}
          </Text>
          {item.region && (
            <Text style={[styles.comunaRegion, { color: currentTheme.textSecondary }]}>
              {item.region}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={[styles.checkCircle, { backgroundColor: currentTheme.primary }]}>
            <Ionicons name="checkmark" size={18} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
          {/* Header con gradiente */}
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIconWrapper}>
                <Ionicons name="location" size={28} color="white" />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>
                  {multiSelect ? 'Selecciona una o más comunas' : 'Selecciona una comuna'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Barra de búsqueda */}
          <View style={[styles.searchContainer, { borderBottomColor: currentTheme.border }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
              <Ionicons name="search" size={20} color={currentTheme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: currentTheme.text }]}
                placeholder="Buscar comuna o región..."
                placeholderTextColor={currentTheme.textSecondary}
                value={busqueda}
                onChangeText={setBusqueda}
                autoCapitalize="words"
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda('')}>
                  <Ionicons name="close-circle" size={20} color={currentTheme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            {multiSelect && seleccionados.length > 0 && (
              <View style={[styles.seleccionadosInfo, { backgroundColor: currentTheme.primary + '15' }]}>
                <Ionicons name="checkmark-circle" size={16} color={currentTheme.primary} />
                <Text style={[styles.seleccionadosTexto, { color: currentTheme.primary }]}>
                  {seleccionados.length} {seleccionados.length === 1 ? 'comuna seleccionada' : 'comunas seleccionadas'}
                </Text>
              </View>
            )}
          </View>

          {/* Lista de comunas */}
          {cargando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
                Cargando comunas...
              </Text>
            </View>
          ) : comunasFiltradas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={currentTheme.textSecondary} />
              <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                No se encontraron comunas
              </Text>
            </View>
          ) : (
            <FlatList
              data={comunasFiltradas}
              renderItem={renderComuna}
              keyExtractor={(item) => item.id.toString()}
              style={styles.lista}
              contentContainerStyle={styles.listaContent}
              showsVerticalScrollIndicator={true}
            />
          )}

          {/* Botón de confirmar (solo para multiselect) */}
          {multiSelect && (
            <View style={[styles.footer, { borderTopColor: currentTheme.border }]}>
              <TouchableOpacity
                style={[
                  styles.confirmarButton,
                  seleccionados.length === 0 && styles.confirmarButtonDisabled
                ]}
                onPress={handleConfirmarMultiple}
                disabled={seleccionados.length === 0}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={seleccionados.length === 0 ? ['#bdc3c7', '#95a5a6'] : [currentTheme.primary, currentTheme.secondary]}
                  style={styles.confirmarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.confirmarTexto}>
                    Confirmar {seleccionados.length > 0 && `(${seleccionados.length})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '75%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  seleccionadosInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  seleccionadosTexto: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  comunaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  comunaInfo: {
    flex: 1,
  },
  comunaNombre: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  comunaRegion: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  confirmarButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  confirmarButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmarTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default SelectorComunas;

