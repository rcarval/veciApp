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
  
  // Perfil
  ACTUALIZAR_PERFIL: `${API_BASE_URL}/auth/perfil`,
  
  // Direcciones
  DIRECCIONES: `${API_BASE_URL}/direcciones`,
  DIRECCION_BY_ID: (id) => `${API_BASE_URL}/direcciones/${id}`,
  
  // Suscripciones
  SUSCRIBIRSE_PREMIUM: `${API_BASE_URL}/auth/suscripcion/premium`,
  CANCELAR_SUSCRIPCION: `${API_BASE_URL}/auth/suscripcion/cancelar`,
  
  // Avatar
  SUBIR_AVATAR: `${API_BASE_URL}/auth/avatar`,
  
  // Emprendimientos
  EMPRENDIMIENTOS: `${API_BASE_URL}/emprendimientos`,
  EMPRENDIMIENTO_BY_ID: (id) => `${API_BASE_URL}/emprendimientos/${id}`,
  SUBIR_LOGO_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/emprendimientos/${id}/logo`,
  SUBIR_BACKGROUND_EMPRENDIMIENTO: (id) => `${API_BASE_URL}/emprendimientos/${id}/background`,
};

export default API_BASE_URL;

