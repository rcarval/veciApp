import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBar from './BottomTabBar';

const AppWithBottomBar = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [isEmprendedor, setIsEmprendedor] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        const sesionActiva = await AsyncStorage.getItem('sesionActiva');
        
        if (usuarioGuardado && sesionActiva === 'true') {
          const usuarioData = JSON.parse(usuarioGuardado);
          setUsuario(usuarioData);
          setIsEmprendedor(
            usuarioData?.tipo_usuario === "emprendedor" || 
            usuarioData?.tipo_usuario === "admin"
          );
          setShowBottomBar(true);
        } else {
          setShowBottomBar(false);
        }
      } catch (error) {
        console.log('Error al cargar usuario en AppWithBottomBar:', error);
        setShowBottomBar(false);
      }
    };
    
    cargarUsuario();
    
    // Escuchar cambios en AsyncStorage
    const interval = setInterval(cargarUsuario, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showBottomBar && (
        <View style={styles.bottomBarContainer}>
          <BottomTabBar isEmprendedor={isEmprendedor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default AppWithBottomBar;
