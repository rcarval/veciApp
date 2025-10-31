// =====================================================
// VeciApp - Configuración de Variables de Entorno
// =====================================================

// Nota: Las variables se cargan a través de babel-plugin-inline-dotenv
// El archivo .env.development se carga automáticamente en desarrollo

// URL base del backend API
// Se carga desde .env.development o .env.production según el entorno
const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.18.100:3000/api';

// URL del servidor WebSocket (sin /api)
const WS_URL = (process.env.API_BASE_URL || 'http://192.168.18.100:3000').replace('/api', '');

// Validar que la URL esté configurada
if (!API_BASE_URL) {
  console.warn('⚠️ API_BASE_URL no está configurada. Usando valor por defecto.');
}

export default {
  API_BASE_URL,
  WS_URL,
};


