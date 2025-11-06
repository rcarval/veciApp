import React, { createContext, useContext, useState, useCallback } from 'react';

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
  const [carritoActivo, setCarritoActivo] = useState(false);
  const [cantidadItems, setCantidadItems] = useState(0);
  const [navegacionPendiente, setNavegacionPendiente] = useState(null);

  const activarCarrito = useCallback((cantidad) => {
    setCarritoActivo(cantidad > 0);
    setCantidadItems(cantidad);
  }, []);

  const limpiarCarrito = useCallback(() => {
    setCarritoActivo(false);
    setCantidadItems(0);
  }, []);

  const intentarNavegar = useCallback((callback) => {
    if (carritoActivo) {
      setNavegacionPendiente(callback);
      return false; // No permitir navegación
    }
    return true; // Permitir navegación
  }, [carritoActivo]);

  const ejecutarNavegacionPendiente = useCallback(() => {
    if (navegacionPendiente) {
      navegacionPendiente();
      setNavegacionPendiente(null);
    }
  }, [navegacionPendiente]);

  const cancelarNavegacionPendiente = useCallback(() => {
    setNavegacionPendiente(null);
  }, []);

  return (
    <CarritoContext.Provider
      value={{
        carritoActivo,
        cantidadItems,
        activarCarrito,
        limpiarCarrito,
        intentarNavegar,
        navegacionPendiente,
        ejecutarNavegacionPendiente,
        cancelarNavegacionPendiente,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};

