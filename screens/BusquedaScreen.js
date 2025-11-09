import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import { API_ENDPOINTS } from "../config/api";
import { useUser } from "../context/UserContext";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

const BusquedaScreen = () => {
  const navigation = useNavigation();
  const { usuario, modoVista } = useUser();
  const toast = useToast();
  const [searchText, setSearchText] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Función para buscar en el backend
  const buscarEnBackend = async (termino) => {
    if (!termino || termino.trim().length < 3) {
      setResultados([]);
      return;
    }

    try {
      setCargando(true);
      console.log('🔍 Buscando:', termino);
      
      const response = await fetch(`${API_ENDPOINTS.BUSCAR}?q=${encodeURIComponent(termino)}`);
      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ Resultados:', data.emprendimientos?.length || 0, 'emprendimientos,', data.productos?.length || 0, 'productos');
        
        // Combinar emprendimientos y productos en un solo array
        const todosLosResultados = [];
        
        // Mapear emprendimientos
        if (data.emprendimientos) {
          data.emprendimientos.forEach(emp => {
            todosLosResultados.push({
              id: `emp_${emp.id}`,
              tipo: 'emprendimiento',
              nombre: emp.nombre,
              descripcion: emp.descripcion_corta || emp.descripcion_larga || '',
              imagen: emp.background_url,
              logo: emp.logo_url,
              estado: emp.estado_calculado || emp.estado,
              emprendimientoData: emp, // Guardar objeto completo con nombre diferente
            });
          });
        }
        
        // Mapear productos
        if (data.productos) {
          data.productos.forEach(prod => {
            todosLosResultados.push({
              id: `prod_${prod.id}`,
              tipo: 'producto',
              nombre: prod.nombre,
              descripcion: prod.descripcion || '',
              precio: prod.precio,
              imagen: prod.imagen_url,
              emprendimiento: prod.emprendimiento_nombre,
              producto: prod,
            });
          });
        }
        
        setResultados(todosLosResultados);
      } else {
        console.log('⚠️ Error en búsqueda:', data.error);
        setResultados([]);
      }
    } catch (error) {
      console.error('❌ Error al buscar:', error);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      buscarEnBackend(searchText);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(debounce);
  }, [searchText]);

  // Función para navegar al detalle
  const navegarADetalle = (item) => {
    // Determinar el usuario_id dependiendo del tipo de resultado
    const usuarioIdEmprendimiento = item.tipo === 'emprendimiento' 
      ? item.emprendimientoData.usuario_id 
      : item.producto.emprendimiento_usuario_id;

    // Verificar si es propio emprendimiento
    const esPropioEmprendimiento = usuarioIdEmprendimiento === usuario?.id;
    const tipoEfectivo = modoVista === 'cliente' ? 'cliente' : usuario?.tipo_usuario;
    const mostrarAdvertencia = esPropioEmprendimiento && tipoEfectivo === 'cliente';

    if (mostrarAdvertencia) {
      toast.warning("No puedes realizar pedidos en tus propios emprendimientos. Vuelve a tu vista de emprendedor", 4000);
      return;
    }

    if (item.tipo === 'emprendimiento') {
      // Para emprendimientos, necesitamos mapear los datos al formato esperado
      const producto = {
        id: item.emprendimientoData.id,
        usuario_id: item.emprendimientoData.usuario_id, // ✅ AGREGAR usuario_id
        nombre: item.emprendimientoData.nombre,
        descripcion: item.emprendimientoData.descripcion_corta || item.emprendimientoData.descripcion_larga || '',
        descripcionLarga: item.emprendimientoData.descripcion_larga || '',
        imagen: item.emprendimientoData.background_url ? { uri: item.emprendimientoData.background_url } : require('../assets/icon.png'),
        logo: item.emprendimientoData.logo_url ? { uri: item.emprendimientoData.logo_url } : require('../assets/icon.png'),
        estado: item.emprendimientoData.estado_calculado || item.emprendimientoData.estado,
        telefono: item.emprendimientoData.telefono,
        direccion: item.emprendimientoData.direccion,
        metodosEntrega: item.emprendimientoData.tipos_entrega || { delivery: true, retiro: true },
        metodosPago: item.emprendimientoData.medios_pago || { tarjeta: true, efectivo: true, transferencia: false },
        rating: 4.5,
        horarios: item.emprendimientoData.horarios,
        galeria: [],
      };
      
      // Si está cerrado, abrir en modo preview
      const isPreview = producto.estado === 'Cerrado' || item.emprendimientoData.estado_calculado === 'cerrado';
      navigation.navigate("PedidoDetalle", { producto, isPreview });
    } else {
      // Para productos, también necesitamos mapear
      const producto = {
        id: item.producto.emprendimiento_id,
        usuario_id: item.producto.emprendimiento_usuario_id, // ✅ AGREGAR usuario_id del emprendimiento
        nombre: item.producto.emprendimiento_nombre,
        descripcion: item.producto.emprendimiento_descripcion || '',
        descripcionLarga: item.producto.emprendimiento_descripcion || '',
        imagen: item.producto.emprendimiento_background ? { uri: item.producto.emprendimiento_background } : require('../assets/icon.png'),
        logo: item.producto.emprendimiento_logo ? { uri: item.producto.emprendimiento_logo } : require('../assets/icon.png'),
        estado: item.producto.estado_calculado || 'Abierto',
        telefono: item.producto.emprendimiento_telefono,
        direccion: item.producto.emprendimiento_direccion,
        metodosEntrega: { delivery: true, retiro: true },
        metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
        rating: 4.5,
        horarios: item.producto.horarios || {},
        galeria: item.producto.imagen_url ? [{
          id: item.producto.id,
          imagen: { uri: item.producto.imagen_url },
          nombre: item.producto.nombre,
          descripcion: item.producto.descripcion,
          precio: parseFloat(item.producto.precio),
          categoria: item.producto.categoria,
        }] : [],
      };
      
      // Si está cerrado, abrir en modo preview
      const isPreview = producto.estado === 'Cerrado' || item.producto.estado_calculado === 'cerrado';
      navigation.navigate("PedidoDetalle", { producto, isPreview });
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos, emprendimientos..."
          placeholderTextColor="#999"
          autoFocus={true}
          value={searchText}
          onChangeText={setSearchText}
        />
        {cargando ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <FontAwesome name="search" size={20} color="#666" />
        )}
      </View>

      {/* Resultados de búsqueda */}
      <ScrollView style={styles.resultsContainer}>
        {searchText.length < 3 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="search" size={50} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              Escribe al menos 3 caracteres para buscar
            </Text>
          </View>
        ) : cargando ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#2A9D8F" />
            <Text style={styles.emptyText}>Buscando...</Text>
          </View>
        ) : resultados.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="times-circle" size={50} color="#e0e0e0" />
            <Text style={styles.emptyText}>
              No encontramos resultados para "{searchText}"
            </Text>
          </View>
        ) : (
          resultados.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.resultItem}
              onPress={() => navegarADetalle(item)}
            >
              <ExpoImage 
                source={
                  item.logo && typeof item.logo === 'string' 
                    ? { uri: item.logo } 
                    : item.imagen && typeof item.imagen === 'string'
                    ? { uri: item.imagen }
                    : require('../assets/icon.png')
                }
                style={styles.resultImage}
                contentFit="cover"
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.nombre}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.descripcion}
                </Text>
                {item.precio && (
                  <Text style={styles.resultPrice}>
                    ${parseFloat(item.precio).toLocaleString("es-CL")}
                  </Text>
                )}
                {item.emprendimiento && (
                  <Text style={styles.resultStore}>{item.emprendimiento}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      <Toast
        visible={toast.toastConfig.visible}
        message={toast.toastConfig.message}
        type={toast.toastConfig.type}
        duration={toast.toastConfig.duration}
        onHide={toast.hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingTop: 50,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
  resultItem: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  resultDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  resultStore: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
});

export default BusquedaScreen;
