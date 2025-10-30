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
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import productoService from "../services/productoService";

const ProductosEmprendimientoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emprendimiento } = route.params;
  const { currentTheme } = useTheme();
  
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProducto, setCurrentProducto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para el formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("principal");
  const [imagen, setImagen] = useState(null);
  const [oferta, setOferta] = useState(false);
  const [precioOferta, setPrecioOferta] = useState("");

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
      // Obtener productos del emprendimiento desde el backend
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
    if (!nombre || !descripcion || !precio) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return false;
    }

    if (isNaN(Number(precio))) {
      Alert.alert("Error", "El precio debe ser un número válido");
      return false;
    }

    if (oferta && isNaN(Number(precioOferta))) {
      Alert.alert("Error", "El precio de oferta debe ser un número válido");
      return false;
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
      const productoData = {
        nombre,
        descripcion,
        precio: Number(precio),
        categoria,
        oferta,
        precio_oferta: oferta ? Number(precioOferta) : null,
      };

      let response;
      if (isEditing) {
        // Actualizar producto existente
        response = await productoService.actualizarProducto(
          emprendimiento.id,
          currentProducto.id,
          productoData,
          imagen
        );
      } else {
        // Crear nuevo producto
        response = await productoService.crearProducto(
          emprendimiento.id,
          productoData,
          imagen
        );
      }

      if (response.ok) {
        // Recargar la lista de productos
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
    }
  };

  const editarProducto = (producto) => {
    setCurrentProducto(producto);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion);
    setPrecio(producto.precio.toString());
    setCategoria(producto.categoria);
    setImagen(producto.imagen_url);
    setOferta(producto.oferta || false);
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
                // Recargar la lista de productos
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
    setOferta(false);
    setPrecioOferta("");
    setCurrentProducto(null);
    setIsEditing(false);
  };

  const renderProducto = ({ item }) => (
    <View style={[styles.productoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
      <View style={styles.productoHeader}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.productoImagen} />
        ) : (
          <View style={[styles.productoImagenPlaceholder, { backgroundColor: currentTheme.background }]}>
            <FontAwesome name="image" size={24} color={currentTheme.textSecondary} />
          </View>
        )}
        <View style={styles.productoInfo}>
          <Text style={[styles.productoNombre, { color: currentTheme.text }]}>{item.nombre}</Text>
          <Text style={[styles.productoDescripcion, { color: currentTheme.textSecondary }]} numberOfLines={2}>
            {item.descripcion}
          </Text>
          <View style={styles.productoPrecioContainer}>
            {item.oferta ? (
              <>
                <Text style={[styles.productoPrecioOferta, { color: "#FF5252" }]}>
                  ${item.precio_oferta.toLocaleString("es-CL")}
                </Text>
                <Text style={[styles.productoPrecioOriginal, { color: currentTheme.textSecondary }]}>
                  ${item.precio.toLocaleString("es-CL")}
                </Text>
              </>
            ) : (
              <Text style={[styles.productoPrecio, { color: currentTheme.primary }]}>
                ${item.precio.toLocaleString("es-CL")}
              </Text>
            )}
          </View>
          <View style={styles.productoCategoria}>
            <FontAwesome
              name={
                categoriasProducto.find(c => c.id === item.categoria)?.icon ||
                "tag"
              }
              size={14}
              color={currentTheme.primary}
            />
            <Text style={[styles.productoCategoriaTexto, { color: currentTheme.textSecondary }]}>
              {categoriasProducto.find(c => c.id === item.categoria)?.nombre}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.productoActions, { borderTopColor: currentTheme.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: currentTheme.background }]}
          onPress={() => editarProducto(item)}
        >
          <MaterialIcons name="edit" size={20} color={currentTheme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: currentTheme.background }]}
          onPress={() => eliminarProducto(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.tituloPrincipal}>Productos de {emprendimiento.nombre}</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="shopping-cart" size={60} color={currentTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No hay productos registrados</Text>
            <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
              Agrega productos para mostrarlos en tu vitrina virtual
            </Text>
          </View>
        ) : (
          <FlatList
            data={productos}
            renderItem={renderProducto}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Botón flotante para agregar */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
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
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Nombre del Producto*</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Pizza Familiar"
            />
          </View>

          {/* Campo Descripción */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Descripción*</Text>
            <TextInput
              style={[styles.inputField, styles.textArea, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe tu producto..."
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Campo Precio */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Precio*</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={precio}
              onChangeText={setPrecio}
              placeholder="Ej: 9990"
              keyboardType="numeric"
            />
          </View>

          {/* Checkbox Oferta */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setOferta(!oferta)}
            >
              <View style={[styles.checkbox, oferta && [styles.checkboxSelected, { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]]}>
                {oferta && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: currentTheme.text }]}>¿Es una oferta?</Text>
            </TouchableOpacity>

            {oferta && (
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Precio de Oferta*</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border, color: currentTheme.text }]}
                  value={precioOferta}
                  onChangeText={setPrecioOferta}
                  placeholder="Ej: 7990"
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Campo Categoría */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Categoría*</Text>
            <View style={styles.categoriasContainer}>
              {categoriasProducto.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoriaButton,
                    { borderColor: currentTheme.primary },
                    categoria === cat.id && [styles.categoriaSelected, { backgroundColor: currentTheme.primary }],
                  ]}
                  onPress={() => setCategoria(cat.id)}
                >
                  <FontAwesome
                    name={cat.icon}
                    size={16}
                    color={categoria === cat.id ? "white" : currentTheme.primary}
                  />
                  <Text
                    style={[
                      styles.categoriaText,
                      { color: categoria === cat.id ? "white" : currentTheme.primary },
                      categoria === cat.id && styles.categoriaTextSelected,
                    ]}
                  >
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Imagen del producto */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
              Imagen del Producto{!isEditing && "*"}
            </Text>
            <TouchableOpacity
              style={[styles.imageUploadButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.cardBackground }]}
              onPress={seleccionarImagen}
            >
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.imagePreview} />
              ) : currentProducto?.imagen_url ? (
                <Image
                  source={{ uri: currentProducto.imagen_url }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <FontAwesome name="camera" size={24} color={currentTheme.primary} />
                  <Text style={[styles.imagePlaceholderText, { color: currentTheme.primary }]}>
                    Seleccionar imagen
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: currentTheme.primary }]}
            onPress={guardarProducto}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Actualizar Producto" : "Agregar Producto"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
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
    justifyContent: "space-between",
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    flex: 1,
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
    paddingBottom: 180, // Espacio para el botón flotante
  },
  productoCard: {
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
  productoHeader: {
    flexDirection: "row",
    padding: 15,
  },
  productoImagen: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  productoImagenPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productoDescripcion: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  productoPrecioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  productoPrecio: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  productoPrecioOferta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5252",
    marginRight: 10,
  },
  productoPrecioOriginal: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  productoCategoria: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  productoCategoriaTexto: {
    fontSize: 12,
    color: "#555",
    marginLeft: 5,
  },
  productoActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  addButton: {
    position: "absolute",
    bottom: 160, // Aumentado para evitar el menú inferior
    right: 30,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  checkboxSelected: {
    backgroundColor: "#2A9D8F",
    borderColor: "#2A9D8F",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#555",
  },
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  categoriaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A9D8F",
    marginRight: 10,
    marginBottom: 10,
  },
  categoriaSelected: {
    backgroundColor: "#2A9D8F",
  },
  categoriaText: {
    fontSize: 14,
    color: "#2A9D8F",
    marginLeft: 8,
  },
  categoriaTextSelected: {
    color: "white",
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
});

export default ProductosEmprendimientoScreen;