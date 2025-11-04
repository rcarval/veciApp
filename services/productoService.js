import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ProductoService {
  /**
   * Obtener el token de autenticación
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error al obtener token:', error);
      return null;
    }
  }

  /**
   * Obtener todos los productos de un emprendimiento
   * @param {number} emprendimientoId - ID del emprendimiento
   * @returns {Promise<Object>} Respuesta de la API
   */
  async obtenerProductos(emprendimientoId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const url = API_ENDPOINTS.MIS_PRODUCTOS(emprendimientoId);
      console.log('[Productos] GET', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Productos] GET status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Productos] GET body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al obtener productos');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerProductos:', error);
      throw error;
    }
  }

  /**
   * Obtener un producto específico
   * @param {number} emprendimientoId - ID del emprendimiento
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} Respuesta de la API
   */
  async obtenerProducto(emprendimientoId, productoId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const url = API_ENDPOINTS.PRODUCTO_BY_ID(emprendimientoId, productoId);
      console.log('[Producto] GET', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Producto] GET status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Producto] GET body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al obtener producto');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerProducto:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo producto
   * @param {number} emprendimientoId - ID del emprendimiento
   * @param {Object} productoData - Datos del producto
   * @param {File} imagen - Archivo de imagen (opcional)
   * @returns {Promise<Object>} Respuesta de la API
   */
  async crearProducto(emprendimientoId, productoData, imagen = null) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const formData = new FormData();
      
      // Agregar datos del producto
      formData.append('nombre', productoData.nombre);
      formData.append('descripcion', productoData.descripcion);
      formData.append('precio', productoData.precio.toString());
      formData.append('categoria', productoData.categoria || 'principal');
      formData.append('oferta', productoData.oferta ? 'true' : 'false');
      formData.append('precio_a_cotizar', productoData.precio_a_cotizar ? 'true' : 'false');
      
      if (productoData.precio_oferta) {
        formData.append('precio_oferta', productoData.precio_oferta.toString());
      }

      // Agregar imagen si existe y es ruta local
      if (imagen) {
        let img = imagen;
        if (typeof imagen === 'string') {
          img = { uri: imagen };
        }
        if (img.uri && (img.uri.startsWith('file://') || img.uri.startsWith('content://'))) {
          formData.append('imagen', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.fileName || `producto_${Date.now()}.jpg`,
          });
        }
      }

      const url = API_ENDPOINTS.PRODUCTOS(emprendimientoId);
      console.log('[Productos] POST', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[Productos] POST status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Productos] POST body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear producto');
      }

      return data;
    } catch (error) {
      console.error('Error en crearProducto:', error);
      throw error;
    }
  }

  /**
   * Actualizar un producto existente
   * @param {number} emprendimientoId - ID del emprendimiento
   * @param {number} productoId - ID del producto
   * @param {Object} productoData - Datos actualizados del producto
   * @param {File} imagen - Archivo de imagen (opcional)
   * @returns {Promise<Object>} Respuesta de la API
   */
  async actualizarProducto(emprendimientoId, productoId, productoData, imagen = null) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const formData = new FormData();
      
      // Agregar datos del producto
      if (productoData.nombre) formData.append('nombre', productoData.nombre);
      if (productoData.descripcion) formData.append('descripcion', productoData.descripcion);
      if (productoData.precio !== undefined) formData.append('precio', productoData.precio.toString());
      if (productoData.categoria) formData.append('categoria', productoData.categoria);
      if (productoData.oferta !== undefined) formData.append('oferta', productoData.oferta ? 'true' : 'false');
      if (productoData.precio_a_cotizar !== undefined) formData.append('precio_a_cotizar', productoData.precio_a_cotizar ? 'true' : 'false');
      if (productoData.activo !== undefined) formData.append('activo', productoData.activo ? 'true' : 'false');
      
      if (productoData.precio_oferta) {
        formData.append('precio_oferta', productoData.precio_oferta.toString());
      }

      // Agregar imagen si existe y es ruta local
      if (imagen) {
        let img = imagen;
        if (typeof imagen === 'string') {
          img = { uri: imagen };
        }
        if (img.uri && (img.uri.startsWith('file://') || img.uri.startsWith('content://'))) {
          formData.append('imagen', {
            uri: img.uri,
            type: img.type || 'image/jpeg',
            name: img.fileName || `producto_${Date.now()}.jpg`,
          });
        }
      }

      const url = API_ENDPOINTS.PRODUCTO_BY_ID(emprendimientoId, productoId);
      console.log('[Producto] PUT', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[Producto] PUT status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Producto] PUT body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al actualizar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en actualizarProducto:', error);
      throw error;
    }
  }

  /**
   * Toggle estado activo/inactivo de un producto
   * @param {number} emprendimientoId - ID del emprendimiento
   * @param {number} productoId - ID del producto
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>} Respuesta de la API
   */
  async toggleProducto(emprendimientoId, productoId, activo) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const url = API_ENDPOINTS.PRODUCTO_BY_ID(emprendimientoId, productoId);
      console.log('[Producto] PATCH (toggle)', url, { activo });
      
      const formData = new FormData();
      formData.append('activo', activo ? 'true' : 'false');

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[Producto] PATCH status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Producto] PATCH body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al cambiar estado del producto');
      }

      return data;
    } catch (error) {
      console.error('Error en toggleProducto:', error);
      throw error;
    }
  }

  /**
   * Eliminar un producto
   * @param {number} emprendimientoId - ID del emprendimiento
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} Respuesta de la API
   */
  async eliminarProducto(emprendimientoId, productoId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const url = API_ENDPOINTS.PRODUCTO_BY_ID(emprendimientoId, productoId);
      console.log('[Producto] DELETE', url);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Producto] DELETE status:', response.status, 'ok:', response.ok);
      if (!response.ok) {
        console.log('[Producto] DELETE body:', data);
      }

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al eliminar producto');
      }

      return data;
    } catch (error) {
      console.error('Error en eliminarProducto:', error);
      throw error;
    }
  }
}

export default new ProductoService();
