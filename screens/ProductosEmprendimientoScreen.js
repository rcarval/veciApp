import React, { useState, useEffect } from "react";
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
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import productoService from "../services/productoService";

const ProductosEmprendimientoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emprendimiento } = route.params;
  const { currentTheme } = useTheme();
  const { usuario } = useUser();
  
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProducto, setCurrentProducto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Lógica de planes - Plan Premium permite hasta 30 productos por emprendimiento
  const tienePlanPremium = usuario?.plan_id == 2;
  const vigenciaActiva = usuario?.vigencia_hasta && new Date(usuario.vigencia_hasta) > new Date();
  const esPremium = tienePlanPremium && vigenciaActiva;
  const limiteProductos = esPremium ? 30 : 0;
  const puedeAgregarMas = productos.length < limiteProductos;

  // Función helper para formatear precios sin decimales y con punto como separador de miles
  const formatearPrecio = (precio) => {
    return Math.round(precio || 0).toLocaleString("es-CL", { 
      useGrouping: true, 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).replace(/,/g, '.');
  };

  // Función helper para calcular porcentaje de descuento correctamente
  const calcularDescuento = (precioNormal, precioOferta) => {
    if (!precioNormal || !precioOferta || precioOferta >= precioNormal) return 0;
    return Math.round(((precioNormal - precioOferta) / precioNormal) * 100);
  };

  // Estados para el formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("principal");
  const [imagen, setImagen] = useState(null);
  const [precioOferta, setPrecioOferta] = useState("");
  const [precioACotizar, setPrecioACotizar] = useState(false);

  // Categorías disponibles para productos
  const categoriasProducto = [
    { id: "principal", nombre: "Principal", icon: "star" },
    { id: "oferta", nombre: "Oferta", icon: "tag" },
    { id: "secundario", nombre: "Secundario", icon: "plus-circle" },
  ];

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await productoService.obtenerProductos(emprendimiento.id);
      if (response.ok) {
        setProductos(response.productos || []);
      } else {
        setProductos([]);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      Alert.alert("Error", "No se pudieron cargar los productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstadoProducto = async (productoId, nuevoEstado) => {
    try {
      // Actualizar localmente de inmediato para mejor UX
      setProductos(prevProductos =>
        prevProductos.map(p =>
          p.id === productoId ? { ...p, activo: nuevoEstado } : p
        )
      );

      const response = await productoService.toggleProducto(
        emprendimiento.id,
        productoId,
        nuevoEstado
      );

      if (!response.ok) {
        // Revertir si falla
        setProductos(prevProductos =>
          prevProductos.map(p =>
            p.id === productoId ? { ...p, activo: !nuevoEstado } : p
          )
        );
        Alert.alert("Error", response.mensaje || "No se pudo cambiar el estado del producto");
      }
    } catch (error) {
      console.error("Error al toggle producto:", error);
      // Revertir cambio
      setProductos(prevProductos =>
        prevProductos.map(p =>
          p.id === productoId ? { ...p, activo: !nuevoEstado } : p
        )
      );
      Alert.alert("Error", "No se pudo cambiar el estado del producto");
    }
  };

  const seleccionarImagen = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagen(result.assets[0].uri);
    }
  };

  const validarFormulario = () => {
    if (!nombre || !descripcion) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return false;
    }

    // Validar precio solo si no es "a cotizar"
    if (!precioACotizar) {
      if (!precio) {
        Alert.alert("Error", "Por favor ingresa el precio o marca 'Precio a cotizar'");
        return false;
      }
      if (isNaN(Number(precio))) {
        Alert.alert("Error", "El precio debe ser un número válido");
        return false;
      }

      // Validar precio de oferta si la categoría es 'oferta'
      if (categoria === 'oferta') {
        if (!precioOferta) {
          Alert.alert("Error", "Por favor ingresa el precio de oferta");
          return false;
        }
        if (isNaN(Number(precioOferta))) {
          Alert.alert("Error", "El precio de oferta debe ser un número válido");
          return false;
        }
        if (Number(precioOferta) >= Number(precio)) {
          Alert.alert("Error", "El precio de oferta debe ser menor al precio normal");
          return false;
        }
      }
    }

    if (!imagen && !isEditing) {
      Alert.alert("Error", "Por favor selecciona una imagen para el producto");
      return false;
    }

    return true;
  };

  const guardarProducto = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      const esOferta = categoria === 'oferta';
      const productoData = {
        nombre,
        descripcion,
        precio: precioACotizar ? 0 : Number(precio),
        precio_a_cotizar: precioACotizar,
        categoria,
        oferta: esOferta && !precioACotizar, // No puede ser oferta si es a cotizar
        precio_oferta: (esOferta && !precioACotizar) ? Number(precioOferta) : null,
      };

      let response;
      if (isEditing) {
        response = await productoService.actualizarProducto(
          emprendimiento.id,
          currentProducto.id,
          productoData,
          imagen
        );
      } else {
        response = await productoService.crearProducto(
          emprendimiento.id,
          productoData,
          imagen
        );
      }

      if (response.ok) {
        await cargarProductos();
        resetForm();
        setModalVisible(false);
        Alert.alert(
          "Éxito",
          `Producto ${isEditing ? "actualizado" : "agregado"} correctamente`
        );
      } else {
        Alert.alert("Error", response.mensaje || "No se pudo guardar el producto");
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el producto");
    } finally {
      setGuardando(false);
    }
  };

  const editarProducto = (producto) => {
    setCurrentProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecioACotizar(producto.precio_a_cotizar || false);
    setPrecio(producto.precio_a_cotizar ? "" : producto.precio.toString());
    setCategoria(producto.categoria);
    setImagen(producto.imagen_url);
    setPrecioOferta(producto.precio_oferta?.toString() || "");
    setIsEditing(true);
    setModalVisible(true);
  };

  const eliminarProducto = (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await productoService.eliminarProducto(emprendimiento.id, id);
              
              if (response.ok) {
                await cargarProductos();
                Alert.alert("Éxito", "Producto eliminado correctamente");
              } else {
                Alert.alert("Error", response.mensaje || "No se pudo eliminar el producto");
              }
            } catch (error) {
              console.error("Error al eliminar producto:", error);
              Alert.alert("Error", error.message || "No se pudo eliminar el producto");
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoria("principal");
    setImagen(null);
    setPrecioOferta("");
    setPrecioACotizar(false);
    setCurrentProducto(null);
    setIsEditing(false);
  };

  const renderProducto = ({ item }) => (
    <View style={[styles.productoCardCompacta, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
      {/* Imagen del producto con overlay e información */}
      <View style={styles.imagenContainerCompacta}>
        {item.imagen_url ? (
          <ImageBackground
            source={{ uri: item.imagen_url }}
            style={styles.productoImagenCompacta}
            imageStyle={{ borderRadius: 18 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
              style={styles.imagenOverlayCompacta}
            >
              {/* Badges superiores */}
              <View style={styles.topBadgesRow}>
                {/* Categoría */}
                <View style={[styles.categoriaCompactaBadge, { backgroundColor: currentTheme.primary }]}>
                  <FontAwesome
                    name={categoriasProducto.find(c => c.id === item.categoria)?.icon || "tag"}
                    size={12}
                    color="white"
                  />
                </View>
                
                {/* Estado */}
                <View style={[styles.estadoCompactaBadge, { backgroundColor: item.activo ? '#4CAF50' : '#95a5a6' }]}>
                  <Ionicons name={item.activo ? 'flash' : 'flash-off'} size={12} color="white" />
                </View>
              </View>

              {/* Información sobre la imagen */}
              <View style={styles.infoSobreImagen}>
                {/* Nombre del producto */}
                <Text style={styles.nombreSobreImagen} numberOfLines={2}>
                  {item.nombre}
                </Text>
                
                {/* Precio */}
                <View style={styles.precioSobreImagen}>
                  {item.precio_a_cotizar ? (
                    <View style={styles.cotizarBadge}>
                      <Ionicons name="chatbubbles" size={16} color="white" />
                      <Text style={styles.cotizarTexto}>Cotizar</Text>
                    </View>
                  ) : item.oferta ? (
                    <View style={styles.precioOfertaRow}>
                      <View style={styles.ofertaCompactaBadge}>
                        <Ionicons name="pricetag" size={14} color="white" />
                        <Text style={styles.ofertaCompactaTexto}>
                          -{calcularDescuento(item.precio, item.precio_oferta)}%
                        </Text>
                      </View>
                      <Text style={styles.precioOfertaBlanco}>
                        ${formatearPrecio(item.precio_oferta)}
                      </Text>
                      <Text style={styles.precioOriginalBlanco}>
                        ${formatearPrecio(item.precio)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.precioNormalBlanco}>
                      ${formatearPrecio(item.precio)}
                    </Text>
                  )}
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={[styles.imagenPlaceholderCompacta, { backgroundColor: currentTheme.background }]}>
            <LinearGradient
              colors={[currentTheme.primary + '20', currentTheme.secondary + '20']}
              style={styles.placeholderGradientCompacta}
            >
              <Ionicons name="image-outline" size={40} color={currentTheme.primary} />
              <Text style={[styles.nombreSobreImagen, { color: currentTheme.text }]} numberOfLines={2}>
                {item.nombre}
              </Text>
              {item.precio_a_cotizar ? (
                <View style={[styles.cotizarBadge, { backgroundColor: currentTheme.primary }]}>
                  <Ionicons name="chatbubbles" size={14} color="white" />
                  <Text style={[styles.cotizarTexto, { fontSize: 14 }]}>Cotizar</Text>
                </View>
              ) : (
                <Text style={[styles.precioNormalBlanco, { color: currentTheme.primary }]}>
                  ${formatearPrecio(item.precio)}
                </Text>
              )}
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Footer compacto con descripción, switch y acciones */}
      <View style={styles.footerCompacto}>
        {/* Descripción breve */}
        <Text style={[styles.descripcionCompacta, { color: currentTheme.textSecondary }]} numberOfLines={2}>
          {item.descripcion}
        </Text>

        {/* Switch y acciones en una fila */}
        <View style={styles.accionesRowCompacta}>
          {/* Switch inline */}
          <View style={styles.switchInlineCompacto}>
            <Ionicons
              name={item.activo ? 'eye' : 'eye-off'}
              size={18}
              color={item.activo ? currentTheme.primary : '#9CA3AF'}
            />
            <Switch
              value={item.activo}
              onValueChange={(value) => toggleEstadoProducto(item.id, value)}
              trackColor={{ false: '#E5E7EB', true: currentTheme.primary + '60' }}
              thumbColor={item.activo ? currentTheme.primary : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
              style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
          </View>

          {/* Botones de acción solo íconos */}
          <View style={styles.botonesIconosCompactos}>
            <TouchableOpacity
              style={styles.iconoAccionElegante}
              onPress={() => editarProducto(item)}
              activeOpacity={0.6}
            >
              <Ionicons name="create-outline" size={22} color={currentTheme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconoAccionElegante}
              onPress={() => eliminarProducto(item.id)}
              activeOpacity={0.6}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      {/* Header moderno */}
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradientModerno}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButtonModerno}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleWrapper}>
            <View style={styles.iconoBadge}>
              <Ionicons name="cube" size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.headerTextos}>
              <Text style={styles.headerSubtitulo}>Productos de</Text>
              <Text style={styles.headerTitulo} numberOfLines={1}>
                {emprendimiento.nombre}
              </Text>
            </View>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumero}>{productos.length}/{limiteProductos}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumero}>
              {productos.filter(p => p.activo).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumero}>
              {productos.filter(p => p.oferta).length}
            </Text>
            <Text style={styles.statLabel}>Ofertas</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.textSecondary }]}>
              Cargando productos...
            </Text>
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: currentTheme.primary + '10' }]}>
              <Ionicons name="cube-outline" size={60} color={currentTheme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>
              No hay productos registrados
            </Text>
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              Agrega productos para mostrarlos en tu vitrina virtual
            </Text>
          </View>
        ) : (
          <FlatList
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Botón flotante moderno - Solo si puede agregar más */}
        {puedeAgregarMas && (
          <TouchableOpacity
            style={[styles.addButtonModerno, { shadowColor: currentTheme.primary }]}
            onPress={() => {
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
        
        {/* Banner de límite alcanzado */}
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
                {esPremium 
                  ? `Has alcanzado el máximo de ${limiteProductos} productos para este emprendimiento` 
                  : 'Actualiza a Premium para agregar productos (hasta 30 por emprendimiento)'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal para agregar/editar producto */}
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
              onPress={() => setModalVisible(false)}
              style={styles.modalBackButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>

        <ScrollView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          {/* Sección: Imagen del producto */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="image" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                Imagen del Producto
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.imageUploadButtonModerno, { borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
              onPress={seleccionarImagen}
              activeOpacity={0.8}
            >
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.imagePreviewModerno} />
              ) : currentProducto?.imagen_url ? (
                <Image source={{ uri: currentProducto.imagen_url }} style={styles.imagePreviewModerno} />
              ) : (
                <View style={styles.imagePlaceholderModerno}>
                  <Ionicons name="camera" size={40} color={currentTheme.primary} />
                  <Text style={[styles.imagePlaceholderText, { color: currentTheme.primary }]}>
                    Toca para seleccionar imagen
                  </Text>
                  <Text style={[styles.imagePlaceholderSubtext, { color: currentTheme.textSecondary }]}>
                    {!isEditing && "(Obligatorio)"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sección: Información Básica */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="information-circle" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                Información Básica
              </Text>
            </View>

            {/* Campo Nombre */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="pricetag" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre del Producto*</Text>
              </View>
              <TextInput
                style={[styles.inputField, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Pizza Familiar"
                placeholderTextColor={currentTheme.textSecondary}
              />
            </View>

            {/* Campo Descripción */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="document-text" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Descripción*</Text>
              </View>
              <TextInput
                style={[styles.inputField, styles.textArea, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Describe tu producto..."
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Sección: Precio y Categoría */}
          <View style={[styles.seccionFormulario, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.seccionHeader}>
              <View style={[styles.seccionIcono, { backgroundColor: currentTheme.primary }]}>
                <Ionicons name="cash" size={20} color="white" />
              </View>
              <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                Precio y Categoría
              </Text>
            </View>

            {/* Campo Categoría */}
            <View style={styles.inputGroup}>
              <View style={styles.labelConIcono}>
                <Ionicons name="grid" size={14} color={currentTheme.primary} />
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Categoría*</Text>
              </View>
              <View style={styles.categoriasContainerModerno}>
              {categoriasProducto.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                      styles.categoriaButtonModerno,
                    { borderColor: currentTheme.primary },
                      categoria === cat.id && [styles.categoriaSelectedModerno, { backgroundColor: currentTheme.primary }],
                  ]}
                    onPress={() => {
                      setCategoria(cat.id);
                      // Si cambia de Oferta a otra categoría, limpiar precio de oferta
                      if (cat.id !== 'oferta') {
                        setPrecioOferta("");
                      }
                      // Si selecciona Oferta y está activo "Precio a cotizar", desactivarlo
                      if (cat.id === 'oferta' && precioACotizar) {
                        setPrecioACotizar(false);
                      }
                    }}
                    activeOpacity={0.7}
                >
                    <FontAwesome
                      name={cat.icon}
                      size={16}
                      color={categoria === cat.id ? "white" : currentTheme.primary}
                    />
                    <Text
                      style={[
                        styles.categoriaTextModerno,
                        { color: categoria === cat.id ? "white" : currentTheme.primary },
                      ]}
                    >
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {categoria === 'oferta' && (
                <View style={[styles.infoBoxOferta, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}>
                  <Ionicons name="information-circle" size={16} color="#FF9800" />
                  <Text style={[styles.infoBoxTexto, { color: '#E65100' }]}>
                    Los productos en oferta se destacan con un badge especial
                  </Text>
                </View>
              )}
            </View>

            {/* Toggle para Precio a Cotizar */}
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.checkboxContainerModerno}
                onPress={() => {
                  setPrecioACotizar(!precioACotizar);
                  if (!precioACotizar) {
                    // Si activa "a cotizar", limpiar precios y cambiar a categoría principal
                    setPrecio("");
                    setPrecioOferta("");
                    if (categoria === 'oferta') {
                      setCategoria('principal');
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkboxModerno,
                  { borderColor: currentTheme.primary },
                  precioACotizar && { backgroundColor: currentTheme.primary }
                ]}>
                  {precioACotizar && <Ionicons name="checkmark" size={18} color="white" />}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <Text style={[styles.checkboxLabelModerno, { color: currentTheme.text }]}>
                    Precio a cotizar
                  </Text>
                  <Text style={[styles.checkboxSubtext, { color: currentTheme.textSecondary }]}>
                    El cliente debe consultar el precio
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Campo Precio Normal - Solo si NO es a cotizar */}
            {!precioACotizar && (
              <View style={styles.inputGroup}>
                <View style={styles.labelConIcono}>
                  <Ionicons name="cash-outline" size={14} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                    {categoria === 'oferta' ? 'Precio Normal*' : 'Precio*'}
                  </Text>
                </View>
                <TextInput
                  style={[styles.inputField, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
                  value={precio}
                  onChangeText={setPrecio}
                  placeholder="Ej: 9990"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Campo Precio de Oferta - Solo si categoría es 'oferta' Y NO es a cotizar */}
            {categoria === 'oferta' && !precioACotizar && (
              <View style={styles.inputGroup}>
                <View style={styles.labelConIcono}>
                  <Ionicons name="trending-down" size={14} color="#EF4444" />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                    Precio de Oferta*
                  </Text>
                </View>
                <TextInput
                  style={[styles.inputField, { backgroundColor: currentTheme.background, borderColor: currentTheme.border, color: currentTheme.text }]}
                  value={precioOferta}
                  onChangeText={setPrecioOferta}
                  placeholder="Ej: 7990 (debe ser menor al precio normal)"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Botón Guardar */}
          <View style={{ paddingBottom: 60 }}>
            <TouchableOpacity
              style={[
                styles.saveButtonModerno,
                guardando && styles.saveButtonDisabled
              ]}
              onPress={guardarProducto}
              disabled={guardando}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={guardando ? ['#95a5a6', '#7f8c8d'] : [currentTheme.primary, currentTheme.secondary]}
                style={styles.saveButtonGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {guardando ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.saveButtonText}>
                      {isEditing ? "Actualizando..." : "Guardando..."}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                    <Text style={styles.saveButtonText}>
                      {isEditing ? "Actualizar Producto" : "Agregar Producto"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
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
  // Header moderno
  headerGradientModerno: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumero: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  // Loading y Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  // Lista
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  // Tarjetas compactas y elegantes
  productoCardCompacta: {
    borderRadius: 18,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  imagenContainerCompacta: {
    height: 180,
    width: "100%",
  },
  productoImagenCompacta: {
    width: "100%",
    height: "100%",
  },
  imagenOverlayCompacta: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  imagenPlaceholderCompacta: {
    width: "100%",
    height: "100%",
  },
  placeholderGradientCompacta: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoriaCompactaBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  estadoCompactaBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoSobreImagen: {
    gap: 8,
  },
  nombreSobreImagen: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.3,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  precioSobreImagen: {
    marginTop: 4,
  },
  precioOfertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  ofertaCompactaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ofertaCompactaTexto: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  precioOfertaBlanco: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  precioOriginalBlanco: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    textDecorationLine: "line-through",
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  precioNormalBlanco: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  footerCompacto: {
    padding: 16,
    gap: 12,
  },
  descripcionCompacta: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  accionesRowCompacta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInlineCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botonesIconosCompactos: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconoAccionElegante: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  // Botón flotante moderno con estilo equilibrado
  addButtonModerno: {
    position: "absolute",
    bottom: 160,
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
  // Modal
  modalHeaderGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  // Secciones del formulario
  seccionFormulario: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  seccionIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelConIcono: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  inputField: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  // Checkbox moderno
  checkboxContainerModerno: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  checkboxModerno: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabelModerno: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  checkboxSubtext: {
    fontSize: 13,
  },
  // Categorías
  categoriasContainerModerno: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoriaButtonModerno: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  categoriaSelectedModerno: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriaTextModerno: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Imagen upload
  imageUploadButtonModerno: {
    height: 200,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewModerno: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholderModerno: {
    alignItems: "center",
    padding: 20,
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  imagePlaceholderSubtext: {
    marginTop: 4,
    fontSize: 13,
  },
  // Botón guardar
  saveButtonModerno: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradiente: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  // Banner de límite alcanzado
  limiteBanner: {
    position: 'absolute',
    bottom: 160,
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
  // Info box para oferta
  infoBoxOferta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 12,
  },
  infoBoxTexto: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  // Estilos para checkbox moderno
  checkboxContainerModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  checkboxModerno: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTextContainer: {
    flex: 1,
    gap: 4,
  },
  checkboxLabelModerno: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  checkboxSubtext: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  // Badge para "Cotizar"
  cotizarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cotizarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ProductosEmprendimientoScreen;
