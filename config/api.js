// =====================================================
// VeciApp - Configuración de API
// =====================================================

import env from './env';

// URL base del backend (se carga desde .env.development o .env.production)
const API_BASE_URL = env.API_BASE_URL;

// Endpoints de la API
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/registro`,
  PERFIL: `${API_BASE_URL}/auth/perfil`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  VERIFICAR_TOKEN: `${API_BASE_URL}/auth/verificar`,
  
  // Recuperación de contraseña
  RECUPERAR_PASSWORD: `${API_BASE_URL}/auth/recuperar-password`,
  VERIFICAR_CODIGO: `${API_BASE_URL}/auth/verificar-codigo`,
  CAMBIAR_PASSWORD: `${API_BASE_URL}/auth/cambiar-password`,
  
  // Comunas
  COMUNAS: `${API_BASE_URL}/comunas`,
  COMUNA_BY_ID: (id) => `${API_BASE_URL}/comunas/${id}`,
  
  // Categorías
  CATEGORIAS: `${API_BASE_URL}/categorias`,
  CATEGORIA_BY_CODIGO: (codigo) => `${API_BASE_URL}/categorias/${codigo}`,
  
  // Perfil
  ACTUALIZAR_PERFIL: `${API_BASE_URL}/auth/perfil`,
  
  // Direcciones
  DIRECCIONES: `${API_BASE_URL}/direcciones`,
  DIRECCION_BY_ID: (id) => `${API_BASE_URL}/direcciones/${id}`,
  
  // Suscripciones
  SUSCRIBIRSE_PREMIUM: `${API_BASE_URL}/auth/suscripcion/premium`,
  CANCELAR_SUSCRIPCION: `${API_BASE_URL}/auth/suscripcion/cancelar`,
  
  // Avatar
  SUBIR_AVATAR: `${API_BASE_URL}/auth/subir-avatar`,
  
  // Emprendimientos
  EMPRENDIMIENTOS: `${API_BASE_URL}/emprendimientos`,
  MIS_EMPRENDIMIENTOS: `${API_BASE_URL}/emprendimientos/mis-emprendimientos`,
  EMPRENDIMIENTO_BY_ID: (id) => `${API_BASE_URL}/emprendimientos/${id}`,
  SUBIR_LOGO_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/emprendimientos/${id}/logo`,
  SUBIR_BACKGROUND_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/emprendimientos/${id}/background`,
  ENVIAR_CODIGO_VERIFICACION: (id) => `${API_BASE_URL}/emprendimientos/${id}/enviar-codigo`,
  VERIFICAR_CODIGO_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/emprendimientos/${id}/verificar-codigo`,
  
  // Vendedores
  CREAR_VENDEDOR: (emprendimientoId) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/vendedor`,
  OBTENER_VENDEDOR: (emprendimientoId) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/vendedor`,
  ELIMINAR_VENDEDOR: (emprendimientoId) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/vendedor`,
  
  // Productos
  PRODUCTOS: (emprendimientoId) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/productos`,
  MIS_PRODUCTOS: (emprendimientoId) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/mis-productos`,
  PRODUCTO_BY_ID: (emprendimientoId, id) => `${API_BASE_URL}/emprendimientos/${emprendimientoId}/productos/${id}`,
  OFERTAS: `${API_BASE_URL}/ofertas`,
  
  // Búsqueda
  BUSCAR: `${API_BASE_URL}/busqueda`,
  
  // Favoritos
  FAVORITOS: `${API_BASE_URL}/favoritos`,
  AGREGAR_FAVORITO: `${API_BASE_URL}/favoritos`,
  ELIMINAR_FAVORITO: (emprendimientoId) => `${API_BASE_URL}/favoritos/${emprendimientoId}`,
  VERIFICAR_FAVORITO: (emprendimientoId) => `${API_BASE_URL}/favoritos/check/${emprendimientoId}`,
  
  // Pedidos
  MIS_PEDIDOS: `${API_BASE_URL}/pedidos`,
  PEDIDOS_RECIBIDOS: `${API_BASE_URL}/pedidos/recibidos`,
  PEDIDO_BY_ID: (id) => `${API_BASE_URL}/pedidos/${id}`,
  CREAR_PEDIDO: `${API_BASE_URL}/pedidos`,
  CONFIRMAR_PEDIDO: (id) => `${API_BASE_URL}/pedidos/${id}/confirmar`,
  CAMBIAR_ESTADO_PEDIDO: (id) => `${API_BASE_URL}/pedidos/${id}/estado`,
  CONFIRMAR_RECHAZO: (id) => `${API_BASE_URL}/pedidos/${id}/confirmar-rechazo`,
  CONFIRMAR_CANCELACION: (id) => `${API_BASE_URL}/pedidos/${id}/confirmar-cancelacion`,
  CONFIRMAR_ENTREGA: (id) => `${API_BASE_URL}/pedidos/${id}/confirmar-entrega`,
  CALIFICAR_CLIENTE: (id) => `${API_BASE_URL}/pedidos/${id}/calificar-cliente`,
  CALIFICACION_CLIENTE: (clienteId) => `${API_BASE_URL}/pedidos/cliente/${clienteId}/calificacion`,
  CALIFICAR_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/pedidos/${id}/calificar-emprendimiento`,
  CALIFICACION_EMPRENDIMIENTO: (emprendimientoId) => `${API_BASE_URL}/pedidos/emprendimiento/${emprendimientoId}/calificacion`,
  
  // Estadísticas
  ESTADISTICAS_EMPRENDIMIENTO: (emprendimientoId) => `${API_BASE_URL}/estadisticas/${emprendimientoId}`,
  REGISTRAR_VISUALIZACION: (emprendimientoId) => `${API_BASE_URL}/estadisticas/${emprendimientoId}/registrar-visualizacion`,
};

export default API_BASE_URL;

