import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const BottomTabBarCliente = () => {
  const navigation = useNavigation();

  // Función para obtener el color del icono (todos blancos por ahora)
  const getIconColor = () => {
    return "white";
  };

  return (
    <LinearGradient colors={['#2A9D8F', '#1D7874']} style={styles.tabBar}>
      {/* Inicio */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="home" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Inicio</Text>
      </TouchableOpacity>

      {/* Ofertas */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Ofertas')}
      >
        <Ionicons name="pricetag" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Ofertas</Text>
      </TouchableOpacity>

      {/* Favoritos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Favoritos')}
      >
        <Ionicons name="heart" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Favoritos</Text>
      </TouchableOpacity>

      {/* Perfil */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Perfil')}
      >
        <Ionicons name="person" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Perfil</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: "white",
  },
});

export default BottomTabBarCliente;
