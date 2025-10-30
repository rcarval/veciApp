import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

const UserContext = createContext();

// TTL en milisegundos (5 minutos = 300000ms)
const CACHE_TTL = 5 * 60 * 1000;

export const UserProvider = ({ children }) => {
  console.log('🏗️ UserProvider: COMPONENTE RENDERIZADO');
  
  const [usuario, setUsuario] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [direccionesLastFetch, setDireccionesLastFetch] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para limpiar todo el cache
  const limpiarCacheCompleto = useCallback(async () => {
    try {
      console.log('🧹 UserContext: Limpiando cache completo');
      setUsuario(null);
      setDirecciones([]);
      setLastFetch(null);
      setDireccionesLastFetch(null);
      
      await AsyncStorage.multiRemove([
        'cachedUsuario',
        'usuarioCacheTime',
        'cachedDirecciones',
        'direccionesCacheTime',
        'direccionSeleccionada',
        'usuario' // También limpiar el usuario del AsyncStorage
      ]);
      
      // Limpiar también el estado de dirección seleccionada
      setDireccionSeleccionada(null);
      
      console.log('✅ UserContext: Cache limpiado completamente');
    } catch (error) {
      console.error('❌ UserContext: Error al limpiar cache:', error);
    }
  }, []);

  // Función para cargar cache - debe estar definida antes del useEffect
  const cargarUsuarioFromCache = async () => {
    try {
      const cachedUsuario = await AsyncStorage.getItem('cachedUsuario');
      const cachedTimestamp = await AsyncStorage.getItem('usuarioCacheTime');
      
      if (cachedUsuario && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const ahora = Date.now();
        
        // Si el cache es reciente (< 5 minutos), usar cache
        if (ahora - timestamp < CACHE_TTL) {
          setUsuario(JSON.parse(cachedUsuario));
          setLastFetch(timestamp);
        }
      }

      // Cargar direcciones del cache también
      const cachedDirecciones = await AsyncStorage.getItem('cachedDirecciones');
      const direccionesTimestamp = await AsyncStorage.getItem('direccionesCacheTime');
      
      if (cachedDirecciones && direccionesTimestamp) {
        const timestamp = parseInt(direccionesTimestamp);
        const ahora = Date.now();
        
        if (ahora - timestamp < CACHE_TTL) {
          setDirecciones(JSON.parse(cachedDirecciones));
          setDireccionesLastFetch(timestamp);
        }
      }
      
      // Cargar dirección seleccionada del cache
      const cachedDireccionSeleccionada = await AsyncStorage.getItem('direccionSeleccionada');
      if (cachedDireccionSeleccionada) {
        setDireccionSeleccionada(cachedDireccionSeleccionada);
      }
    } catch (error) {
      console.error('Error al cargar cache:', error);
    }
  };

  // Inicializar el Provider
  useEffect(() => {
    console.log('✅ UserProvider: useEffect ejecutándose - montando Provider');
    cargarUsuarioFromCache().then(() => {
      setIsInitialized(true);
      console.log('✅ UserProvider: Inicialización completa');
    });
  }, []);

  const cargarUsuario = useCallback(async (forceRefresh = false) => {
    console.log('🔄 UserContext: cargarUsuario llamado', { forceRefresh, usuarioExiste: !!usuario, lastFetch });
    
    // Si no es forzado y tenemos datos recientes, no recargar
    if (!forceRefresh && usuario && lastFetch) {
      const ahora = Date.now();
      if (ahora - lastFetch < CACHE_TTL) {
        console.log('🔄 UserContext: Usando cache, no recargando');
        return usuario;
      }
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        console.log('🔄 UserContext: No hay token, estableciendo usuario null');
        setUsuario(null);
        return null;
      }

      console.log('🔄 UserContext: Haciendo petición a:', API_ENDPOINTS.PERFIL);
      console.log('🔄 UserContext: Token:', token ? `${token.substring(0, 20)}...` : 'NULL');
      
      const response = await fetch(API_ENDPOINTS.PERFIL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log('🔄 UserContext: Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();

      console.log('🔄 UserContext: Respuesta del backend:', {
        ok: response.ok,
        status: response.status,
        tieneDatos: !!data,
        mensaje: data.mensaje || data.error || 'Sin mensaje'
      });

      if (response.ok) {
        console.log('✅ UserContext: Usuario cargado exitosamente:', data.id ? `ID ${data.id}` : 'SIN ID');
        
        // Verificar si es un usuario diferente al actual
        if (usuario && usuario.id !== data.id) {
          console.log('🔄 UserContext: Usuario diferente detectado, limpiando cache');
          await limpiarCacheCompleto();
        }
        
        setUsuario(data);
        setLastFetch(Date.now());
        
        // Guardar en cache
        await AsyncStorage.setItem('cachedUsuario', JSON.stringify(data));
        await AsyncStorage.setItem('usuarioCacheTime', Date.now().toString());
        
        // También actualizar AsyncStorage para compatibilidad
        await AsyncStorage.setItem("usuario", JSON.stringify({
          ...data,
          estado_cuenta: data.estado,
        }));

        return data;
      } else {
        console.error('❌ UserContext: Error en respuesta:', data);
        throw new Error(data.mensaje || data.error || "Error al cargar usuario");
      }
    } catch (error) {
      console.error("❌ UserContext: Error al cargar usuario:", error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [usuario, lastFetch, limpiarCacheCompleto]);

  const cargarDirecciones = async (forceRefresh = false) => {
    // Si no es forzado y tenemos datos recientes, no recargar
    if (!forceRefresh && direcciones.length > 0 && direccionesLastFetch) {
      const ahora = Date.now();
      if (ahora - direccionesLastFetch < CACHE_TTL) {
        return direcciones;
      }
    }

    try {
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        setDirecciones([]);
        return [];
      }

      const response = await fetch(API_ENDPOINTS.DIRECCIONES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // Mapear datos del backend al formato esperado por la app
        const direccionesMapeadas = data.direcciones.map(dir => ({
          id: dir.id.toString(),
          nombre: dir.nombre,
          direccion: dir.direccion,
          referencia: dir.referencia || "",
          esPrincipal: dir.es_principal || false,
          coordenadas: dir.latitud && dir.longitud 
            ? { lat: dir.latitud, lng: dir.longitud }
            : null,
          fechaCreacion: dir.created_at
        }));
        
        setDirecciones(direccionesMapeadas);
        setDireccionesLastFetch(Date.now());
        
        // Guardar en cache
        await AsyncStorage.setItem('cachedDirecciones', JSON.stringify(direccionesMapeadas));
        await AsyncStorage.setItem('direccionesCacheTime', Date.now().toString());

        return direccionesMapeadas;
      } else {
        setDirecciones([]);
        return [];
      }
    } catch (error) {
      console.error("Error al cargar direcciones:", error);
      return direcciones; // Retornar datos existentes si hay error
    }
  };

  // Invalidar cache de usuario (usar después de actualizar plan, perfil, etc)
  const invalidarUsuario = () => {
    setLastFetch(null);
    AsyncStorage.removeItem('usuarioCacheTime');
    AsyncStorage.removeItem('cachedUsuario');
  };

  // Invalidar cache de direcciones (usar después de crear/editar/eliminar dirección)
  const invalidarDirecciones = () => {
    setDireccionesLastFetch(null);
    AsyncStorage.removeItem('direccionesCacheTime');
    AsyncStorage.removeItem('cachedDirecciones');
  };

  // Actualizar usuario localmente (sin recargar desde backend)
  const actualizarUsuarioLocal = (nuevosDatos) => {
    setUsuario(nuevosDatos);
    AsyncStorage.setItem('cachedUsuario', JSON.stringify(nuevosDatos));
    AsyncStorage.setItem('usuarioCacheTime', Date.now().toString());
    AsyncStorage.setItem("usuario", JSON.stringify({
      ...nuevosDatos,
      estado_cuenta: nuevosDatos.estado,
    }));
  };

  // Actualizar direcciones localmente
  const actualizarDireccionesLocal = (nuevasDirecciones) => {
    setDirecciones(nuevasDirecciones);
    AsyncStorage.setItem('cachedDirecciones', JSON.stringify(nuevasDirecciones));
    AsyncStorage.setItem('direccionesCacheTime', Date.now().toString());
  };

  // Función para establecer la dirección seleccionada y guardarla en cache
  const establecerDireccionSeleccionada = useCallback(async (direccionId) => {
    setDireccionSeleccionada(direccionId);
    await AsyncStorage.setItem('direccionSeleccionada', direccionId || '');
  }, []);

  // Crear el objeto value - sin useMemo por ahora para simplificar
  const value = {
    _isRealContext: true, // Marca única para identificar el contexto real
    usuario,
    direcciones,
    direccionSeleccionada,
    loading,
    cargarUsuario,
    cargarDirecciones,
    invalidarUsuario,
    invalidarDirecciones,
    actualizarUsuarioLocal,
    actualizarDireccionesLocal,
    establecerDireccionSeleccionada,
    limpiarCacheCompleto,
    isInitialized,
  };


  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  
  // Si hay contexto y tiene la marca del contexto real, retornarlo
  if (context && context._isRealContext === true) {
    return context;
  }
  
  // Si no hay contexto real, usar fallback
  if (!context) {
    // Solo mostrar warning una vez para no saturar los logs
    if (!useUser._warningShown) {
      console.warn('⚠️ useUser llamado fuera de UserProvider, usando valores por defecto. Verifica que UserProvider envuelva la app.');
      useUser._warningShown = true;
    }
    return {
      usuario: null,
      direcciones: [],
      direccionSeleccionada: null,
      loading: false,
      establecerDireccionSeleccionada: async () => {},
      cargarUsuario: async (forceRefresh = false) => {
        console.log('⚠️ useUser fallback: cargarUsuario llamado (fuera de UserProvider)');
        // Intentar cargar desde AsyncStorage como fallback
        try {
          const usuarioCache = await AsyncStorage.getItem('cachedUsuario');
          if (usuarioCache) {
            console.log('⚠️ useUser fallback: Usuario cargado desde cache');
            return JSON.parse(usuarioCache);
          }
        } catch (error) {
          console.error('Error al cargar usuario desde cache:', error);
        }
        console.log('⚠️ useUser fallback: No hay usuario en cache');
        return null;
      },
      cargarDirecciones: async (forceRefresh = false) => {
        console.log('⚠️ useUser fallback: cargarDirecciones llamado (fuera de UserProvider)');
        // Intentar cargar desde AsyncStorage como fallback
        try {
          const direccionesCache = await AsyncStorage.getItem('cachedDirecciones');
          if (direccionesCache) {
            return JSON.parse(direccionesCache);
          }
        } catch (error) {
          console.error('Error al cargar direcciones desde cache:', error);
        }
        return [];
      },
      invalidarUsuario: () => {},
      invalidarDirecciones: () => {},
      actualizarUsuarioLocal: () => {},
      actualizarDireccionesLocal: () => {},
    };
  }
  
  // Si llegamos aquí, es un contexto inválido (no debería pasar)
  console.warn('⚠️ useUser: Contexto no reconocido, retornando fallback');
  return {
    usuario: null,
    direcciones: [],
    direccionSeleccionada: null,
    loading: false,
    establecerDireccionSeleccionada: async () => {},
    cargarUsuario: async () => null,
    cargarDirecciones: async () => [],
    invalidarUsuario: () => {},
    invalidarDirecciones: () => {},
    actualizarUsuarioLocal: () => {},
    actualizarDireccionesLocal: () => {},
  };
};

