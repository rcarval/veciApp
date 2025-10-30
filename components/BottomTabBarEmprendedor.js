import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const BottomTabBarEmprendedor = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const styles = BottomTabBarEmprendedorStyles(currentTheme);

  // Función para obtener el color del icono (todos blancos por ahora)
  const getIconColor = () => {
    return "white";
  };

  return (
    <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={styles.tabBar}>
      {/* Inicio */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="home" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Inicio</Text>
      </TouchableOpacity>

      {/* Pedidos Recibidos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('PedidosRecibidos')}
      >
        <Ionicons name="cart" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Pedidos</Text>
      </TouchableOpacity>

      {/* Mis Emprendimientos */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Emprendimiento')}
      >
        <Ionicons name="briefcase" size={24} color={getIconColor()} />
        <Text style={styles.tabText}>Mi Negocio</Text>
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

const BottomTabBarEmprendedorStyles = (theme) => StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 120,
    width: "100%",
    marginBottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopColor: theme.border,
    backgroundColor: theme.primary,
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

export default BottomTabBarEmprendedor;
