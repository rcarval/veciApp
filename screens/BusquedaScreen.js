import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BusquedaScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [resultados, setResultados] = useState([]);

  // Datos de ejemplo (simulando tu base de datos)
  const emprendimientos = [
    {
        id: 1,
        nombre: "Pizzeria Donatelo",
        descripcion: "Pizzas de masa madre",
        descripcionLarga:
          "Deliciosas pizzas con masa madre, hechas con mucho amor y amasada por la abuela de brazos musculosos.",
        imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2hdQeNVlyu20ReOpJcNwdgW0ER5hwxnauQ&s",
        logo: require("../assets/donatelo.png"),
        estado: "Abierto",
        telefono: "+56994908047",
        direccion: "Manuel Rodríguez 885, Isla de Maipo",
        metodosEntrega: { delivery: true, retiro: true },
        metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
        rating: 4.8,
        galeria: [
          {
            imagen: require("../assets/pizza-margarita.jpg"),
            descripcion: "Pizza Margarita clásica con ingredientes frescos",
            precio: 8990,
            categoria: "principal"
          },
          {
            imagen: require("../assets/Pepperoni-pizza.webp"),
            descripcion: "Pizza Pepperoni con doble porción de pepperoni",
            precio: 9990,
            categoria: "principal"
          },
          {
            imagen: require("../assets/pizza-iberica.webp"),
            descripcion: "Pizza Iberica con carne de cerdo y verduras",
            precio: 9990,
            categoria: "principal"
          },
          {
            imagen: require("../assets/pizza-cuatro-quesos.jpg"),
            descripcion: "Pizza cuatro quesos con extra queso",
            precio: 9990,
            categoria: "principal"
          },
          {
            imagen: require("../assets/pizzaOferta.jpg"),
            descripcion: "Pizzas a elección 2 x 1",
            precio: 12990,
            categoria: "oferta"
          },
          {
            imagen: require("../assets/bebidas.jpg"),
            descripcion: "Bebidas en Lata",
            precio: 1990,
            categoria: "secundario"
          },
        ]
      },
      {
        id: 2,
        nombre: "Pelucan",
        descripcion: "Estilismo profesional para perros.",
        descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
        imagen: require("../assets/pelucan.webp"),
        logo: require("../assets/pelucan_logo.png"),
        estado: "Cerrado",
        telefono: "+56994908047",
        direccion: "Vista Hermosa 319, Isla de Maipo",
        metodosEntrega: { delivery: true, retiro: true },
        metodosPago: { tarjeta: true, efectivo: true, transferencia: true },
        rating: 4.6,
      },
      {
        id: 3,
        nombre: "Grill Burger",
        descripcion: "Ricas hamburguesas caseras.",
        descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
        imagen: require("../assets/burger.webp"),
        logo: require("../assets/grillburger_logo.jpg"),
        estado: "Abierto",
        telefono: "+56994908047",
        direccion: "Balmaceda 1458, Talagante",
        metodosEntrega: { delivery: false, retiro: true },
        metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
        rating: 3.9,
      },
      {
        id: 4,
        nombre: "Carniceria Los Chinitos",
        descripcion: "Expertos en Carnes.",
        descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
        imagen: require("../assets/carniceria.webp"),
        logo: require("../assets/loschinitos_logo.jpg"),
        estado: "Abierto",
        telefono: "+56994908047",
        direccion: "El Zorzal Nte. 608, Isla de Maipo",
        metodosEntrega: { delivery: true, retiro: true },
        metodosPago: { tarjeta: true, efectivo: true, transferencia: false },
        rating: 2.4
      },
      {
        id: 5,
        nombre: "Maestro José",
        descripcion: "Reparación y Construcción.",
        descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
        imagen: require("../assets/construccion.jpg"),
        logo: require("../assets/maestrojose_logo.jpeg"),
        estado: "Cierra Pronto",
        telefono: "+56994908047",
        direccion: "San Antonio de Naltagua 5198, Isla de Maipo",
        metodosEntrega: { delivery: true, retiro: false },
        metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
        rating: 3.4,
      },
      {
        id: 6,
        nombre: "Gasfiter Experto",
        descripcion: "Reparación de Cañerías.",
        descripcionLarga: "Descripción detallada con toda la información sobre los productos y servicios ofrecidos...",
        imagen: require("../assets/gasfiter.jpg"),
        logo: require("../assets/gasfiter_logo.jpeg"),
        estado: "Abierto",
        telefono: "+56994908047",
        direccion: "Balmaceda 1458, Talagante",
        metodosEntrega: { delivery: false, retiro: true },
        metodosPago: { tarjeta: false, efectivo: true, transferencia: true },
        rating: 4.1,
      }
    // Agrega más emprendimientos según sea necesario
  ];

  const productos = [
    {
      id: 101,
      nombre: "Pizza Margarita",
      descripcion: "Pizza clásica con ingredientes frescos",
      categoria: "comida",
      precio: 8990,
      emprendimiento: "Pizzeria Donatelo",
      imagen: require("../assets/pizza-margarita.jpg")
    },
    {
        id: 102,
        nombre: "Carniceria Los Chinitos",
        categoria: "comida",
        imagen: require("../assets/huachalomo.webp"),
        descripcion: "Huachalomo Categoría V 1 KG",
        precio: 9990,
        categoria: "principal"
    },
    {
        id: 103,
        nombre: "Pizzeria Donatelo",
        imagen: require("../assets/Pepperoni-pizza.webp"),
        descripcion: "Pizza Pepperoni con doble porción de pepperoni",
        precio: 9990,
        categoria: "principal"
      },
      {
        id: 104,
        nombre: "Pizzeria Donatelo",
        imagen: require("../assets/pizza-iberica.webp"),
        descripcion: "Pizza Iberica con carne de cerdo y verduras",
        precio: 9990,
        categoria: "principal"
      },
      {
        id: 105,
        nombre: "Pizzeria Donatelo",
        imagen: require("../assets/pizza-cuatro-quesos.jpg"),
        descripcion: "Pizza cuatro quesos con extra queso",
        precio: 9990,
        categoria: "principal"
      },
      {
        id: 106,
        nombre: "Pizzeria Donatelo",
        imagen: require("../assets/pizzaOferta.jpg"),
        descripcion: "Pizzas a elección 2 x 1",
        precio: 12990,
        categoria: "oferta"
      },
      {
        id: 107,
        nombre: "Pizzeria Donatelo",
        imagen: require("../assets/bebidas.jpg"),
        descripcion: "Bebidas en Lata",
        precio: 1990,
        categoria: "secundario"
      }
    // Agrega más productos según sea necesario
  ];

  useEffect(() => {
    if (searchText.length > 2) {
      const resultadosFiltrados = [
        ...emprendimientos.filter(item => 
          item.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
          item.descripcion.toLowerCase().includes(searchText.toLowerCase())
        ),
        ...productos.filter(item => 
          item.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
          item.descripcion.toLowerCase().includes(searchText.toLowerCase())
        )
      ];
      setResultados(resultadosFiltrados);
    } else {
      setResultados([]);
    }
  }, [searchText]);

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
        <FontAwesome name="search" size={20} color="#666" />
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
              onPress={() => navigation.navigate("PedidoDetalle", { producto: item })}
            >
              <Image 
                source={item.logo || item.imagen || item.galeria?.[0]?.imagen} 
                style={styles.resultImage}
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.nombre}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.descripcion}
                </Text>
                {item.precio && (
                  <Text style={styles.resultPrice}>
                    ${item.precio.toLocaleString("es-CL")}
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