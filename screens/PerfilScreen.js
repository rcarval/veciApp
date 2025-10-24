import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image 
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

const PerfilScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const usuario = route.params?.usuario ?? {};

  const opciones = [
    { nombre: "Información Personal", icono: "user-circle", screen: "InformacionPersonal" },
    { nombre: "Mis Direcciones", icono: "map-pin", screen: "DireccionScreen" },
    { nombre: "Mis Emprendimientos", icono: "briefcase", screen: "Emprendimiento", mostrar: usuario.tipo_usuario === "emprendedor" || usuario.tipo_usuario === "admin" },
    { nombre: "Solicitudes", icono: "list-alt", screen: "VitrinaScreen", mostrar: usuario.tipo_usuario === "admin" },
    { nombre: "Mi Plan", icono: "star", screen: "PlanScreen" },
    { nombre: "Necesito Ayuda", icono: "question-circle", screen: "HelpScreen" },
  ].filter(op => op.mostrar !== false);

  return (
    <View style={styles.containerMaster}>
      
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
        <Ionicons name="person" size={24} color="white" />
          <Text style={styles.tituloPrincipal}>Mi Perfil</Text>
        </View>
      </LinearGradient>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {/* Tarjeta de perfil */}
        <View style={styles.perfilCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../assets/favicon.png')} 
              style={styles.avatarImage}
            />
            <Text style={styles.nombreUsuario}>{usuario.nombre}</Text>
            <Text style={styles.tipoUsuario}>{usuario.tipo_usuario === "emprendedor" ? "Emprendedor" : "Cliente"}</Text>
            <Text style={styles.tipoPlan}>{usuario.plan_id?"Plan Premium":"Plan Básico"}</Text>
          </View>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.accesosContainer}>
          <Text style={styles.seccionTitulo}>Accesos Rápidos</Text>
          <View style={styles.opcionesGrid}>
            {opciones.map((opcion) => (
              <TouchableOpacity 
                key={opcion.nombre} 
                style={styles.opcionCard}
                onPress={() => navigation.navigate(opcion.screen)}
              >
                <View style={styles.opcionIconoContainer}>
                  <FontAwesome name={opcion.icono} size={24} color="#2A9D8F" />
                </View>
                <Text style={styles.opcionTexto}>{opcion.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Barra de navegación inferior */}
      <LinearGradient  colors={['#2A9D8F', '#1D7874']} style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Home')}
        >
          <Ionicons name="home" size={24} color="white" />
          <Text style={styles.tabText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Ofertas')}
        >
          <Ionicons name="pricetag" size={24} color="white" />
          <Text style={styles.tabText}>Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.replace('Favoritos')}
        >
          <Ionicons name="heart" size={24} color="white" />
          <Text style={styles.tabText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
        >
          <Ionicons name="person" size={24} color="#0b5b52" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </LinearGradient>
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
  scrollContainer: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginLeft: 10, // Añade este margen para separar del ícono
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  perfilCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2A9D8F',
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  tipoUsuario: {
    fontSize: 16,
    color: '#2A9D8F',
    fontWeight: '600',
    marginTop: 5,
  },
  tipoPlan: {
    fontSize: 16,
    color: 'black',
    fontWeight: '600',
    marginTop: 5,
  },
  formContainer: {
    marginTop: 10,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A9D8F',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputFieldDisabled: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#777',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  botonGuardar: {
    backgroundColor: '#2A9D8F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  botonGuardarTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accesosContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  opcionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  opcionCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  opcionIconoContainer: {
    backgroundColor: '#e8f4f3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  opcionTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "100%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopColor: "#e1e1e1",
    backgroundColor: "#2A9D8F",
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
});

export default PerfilScreen;