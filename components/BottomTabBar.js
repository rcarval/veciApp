import React from 'react';
import BottomTabBarCliente from './BottomTabBarCliente';
import BottomTabBarEmprendedor from './BottomTabBarEmprendedor';

const BottomTabBar = ({ isEmprendedor }) => {
  return isEmprendedor ? 
    <BottomTabBarEmprendedor /> : 
    <BottomTabBarCliente />;
};

export default BottomTabBar;