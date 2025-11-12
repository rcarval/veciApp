import React from 'react';
import { View } from 'react-native';
import BottomTabBarCliente from './BottomTabBarCliente';
import BottomTabBarEmprendedor from './BottomTabBarEmprendedor';

const BottomTabBar = ({ isEmprendedor }) => {
  // Validar explícitamente el valor de isEmprendedor
  // Debe ser booleano, no null, undefined, o string
  const esEmprendedor = Boolean(isEmprendedor);
  
  try {
    // Renderizar el componente correspondiente
    if (esEmprendedor) {
      return <BottomTabBarEmprendedor />;
    } else {
      return <BottomTabBarCliente />;
    }
  } catch (error) {
    console.error('❌ Error al renderizar BottomTabBar:', error);
    // Retornar un View vacío en caso de error para no romper la app
    return <View />;
  }
};

export default BottomTabBar;