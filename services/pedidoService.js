import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

class PedidoService {
  /**
   * Obtiene el token de autenticación desde AsyncStorage
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      return token;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw error;
    }
  }

  /**
   * Obtiene los pedidos del cliente
   */
  async obtenerPedidos() {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.MIS_PEDIDOS;
      
      console.log('[Pedidos] GET', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedidos] GET status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedidos] GET body:', data);
        throw new Error(data.mensaje || 'Error al obtener pedidos');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerPedidos:', error);
      throw error;
    }
  }

  /**
   * Obtiene los pedidos recibidos del emprendedor
   */
  async obtenerPedidosRecibidos() {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.PEDIDOS_RECIBIDOS;
      
      console.log('[Pedidos] GET', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedidos] GET status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedidos] GET body:', data);
        throw new Error(data.mensaje || 'Error al obtener pedidos');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerPedidosRecibidos:', error);
      throw error;
    }
  }

  /**
   * Obtiene el detalle de un pedido específico
   */
  async obtenerPedido(id) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.PEDIDO_BY_ID(id);
      
      console.log('[Pedido] GET', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedido] GET status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] GET body:', data);
        throw new Error(data.mensaje || 'Error al obtener pedido');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerPedido:', error);
      throw error;
    }
  }

  /**
   * Confirma un pedido con tiempo de entrega
   */
  async confirmarPedido(id, tiempoEntregaMinutos) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CONFIRMAR_PEDIDO(id);
      
      console.log('[Pedido] PATCH CONFIRMAR', url);
      console.log('[Pedido] Body:', { tiempo_entrega_minutos: tiempoEntregaMinutos });
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tiempo_entrega_minutos: tiempoEntregaMinutos,
        }),
      });

      const data = await response.json();
      console.log('[Pedido] PATCH CONFIRMAR status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] PATCH CONFIRMAR body:', data);
        throw new Error(data.mensaje || 'Error al confirmar pedido');
      }

      return data;
    } catch (error) {
      console.error('Error en confirmarPedido:', error);
      throw error;
    }
  }

  /**
   * Cambia el estado de un pedido
   */
  async cambiarEstadoPedido(id, estado, motivoRechazo = null) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CAMBIAR_ESTADO_PEDIDO(id);
      
      console.log('[Pedido] PATCH ESTADO', url);
      console.log('[Pedido] Body:', { estado, motivo_rechazo: motivoRechazo });
      
      const body = { estado };
      if (motivoRechazo) {
        body.motivo_rechazo = motivoRechazo;
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('[Pedido] PATCH ESTADO status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] PATCH ESTADO body:', data);
        throw new Error(data.mensaje || 'Error al cambiar estado del pedido');
      }

      return data;
    } catch (error) {
      console.error('Error en cambiarEstadoPedido:', error);
      throw error;
    }
  }

  /**
   * Confirma que el cliente vio el rechazo
   */
  async confirmarRechazo(id) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CONFIRMAR_RECHAZO(id);
      
      console.log('[Pedido] PATCH CONFIRMAR RECHAZO', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedido] PATCH CONFIRMAR RECHAZO status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] PATCH CONFIRMAR RECHAZO body:', data);
        throw new Error(data.mensaje || 'Error al confirmar el rechazo');
      }

      return data;
    } catch (error) {
      console.error('Error en confirmarRechazo:', error);
      throw error;
    }
  }

  /**
   * Confirma que el emprendedor aceptó la cancelación del pedido
   */
  async confirmarCancelacion(id) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CONFIRMAR_CANCELACION(id);
      
      console.log('[Pedido] PATCH CONFIRMAR CANCELACION', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedido] PATCH CONFIRMAR CANCELACION status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] PATCH CONFIRMAR CANCELACION body:', data);
        throw new Error(data.mensaje || 'Error al confirmar la cancelación');
      }

      return data;
    } catch (error) {
      console.error('Error en confirmarCancelacion:', error);
      throw error;
    }
  }

  /**
   * Confirma que el cliente recibió el pedido
   */
  async confirmarEntrega(id) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CONFIRMAR_ENTREGA(id);
      
      console.log('[Pedido] PATCH CONFIRMAR ENTREGA', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedido] PATCH CONFIRMAR ENTREGA status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] PATCH CONFIRMAR ENTREGA body:', data);
        throw new Error(data.mensaje || 'Error al confirmar la entrega');
      }

      return data;
    } catch (error) {
      console.error('Error en confirmarEntrega:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo pedido
   */
  async crearPedido(pedidoData) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CREAR_PEDIDO;
      
      console.log('[Pedido] POST', url);
      console.log('[Pedido] Body:', JSON.stringify(pedidoData, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pedidoData),
      });

      const data = await response.json();
      console.log('[Pedido] POST status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] POST body:', data);
        throw new Error(data.mensaje || 'Error al crear pedido');
      }

      return data;
    } catch (error) {
      console.error('Error en crearPedido:', error);
      throw error;
    }
  }

  /**
   * Califica a un cliente (por el emprendedor)
   */
  async calificarCliente(pedidoId, calificaciones) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CALIFICAR_CLIENTE(pedidoId);
      
      console.log('[Pedido] POST CALIFICAR CLIENTE', url);
      console.log('[Pedido] Body:', calificaciones);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(calificaciones),
      });

      const data = await response.json();
      console.log('[Pedido] POST CALIFICAR CLIENTE status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] POST CALIFICAR CLIENTE body:', data);
        throw new Error(data.mensaje || 'Error al calificar cliente');
      }

      return data;
    } catch (error) {
      console.error('Error en calificarCliente:', error);
      throw error;
    }
  }

  /**
   * Obtiene la calificación promedio de un cliente
   */
  async obtenerCalificacionCliente(clienteId) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CALIFICACION_CLIENTE(clienteId);
      
      console.log('[Pedido] GET CALIFICACION CLIENTE', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Pedido] GET CALIFICACION CLIENTE status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] GET CALIFICACION CLIENTE body:', data);
        throw new Error(data.mensaje || 'Error al obtener calificación del cliente');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerCalificacionCliente:', error);
      throw error;
    }
  }

  /**
   * Califica a un emprendimiento (por el cliente)
   */
  async calificarEmprendimiento(pedidoId, calificaciones) {
    try {
      const token = await this.getAuthToken();
      const url = API_ENDPOINTS.CALIFICAR_EMPRENDIMIENTO(pedidoId);
      
      console.log('[Pedido] POST CALIFICAR EMPRENDIMIENTO', url);
      console.log('[Pedido] Body:', calificaciones);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(calificaciones),
      });

      const data = await response.json();
      console.log('[Pedido] POST CALIFICAR EMPRENDIMIENTO status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] POST CALIFICAR EMPRENDIMIENTO body:', data);
        throw new Error(data.mensaje || 'Error al calificar el emprendimiento');
      }

      return data;
    } catch (error) {
      console.error('Error en calificarEmprendimiento:', error);
      throw error;
    }
  }

  /**
   * Obtiene la calificación promedio de un emprendimiento
   */
  async obtenerCalificacionEmprendimiento(emprendimientoId) {
    try {
      const url = API_ENDPOINTS.CALIFICACION_EMPRENDIMIENTO(emprendimientoId);
      
      console.log('[Pedido] GET CALIFICACION EMPRENDIMIENTO', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('[Pedido] GET CALIFICACION EMPRENDIMIENTO status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        console.log('[Pedido] GET CALIFICACION EMPRENDIMIENTO body:', data);
        throw new Error(data.mensaje || 'Error al obtener calificación del emprendimiento');
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerCalificacionEmprendimiento:', error);
      throw error;
    }
  }
}

const pedidoService = new PedidoService();
export default pedidoService;

