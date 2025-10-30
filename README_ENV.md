# Configuración de Variables de Entorno - VeciApp

## 📋 Configuración Inicial

Para usar variables de entorno en VeciApp, sigue estos pasos:

### 1. Crear archivo `.env.development`

Copia el archivo de ejemplo y renómbralo:

```bash
cp env.development.example .env.development
```

### 2. Configurar tu IP local

Edita `.env.development` y actualiza `API_BASE_URL` con tu IP local:

```env
API_BASE_URL=http://TU_IP_LOCAL:3000/api
```

**Cómo obtener tu IP local:**

- **Mac/Linux:**
  ```bash
  ifconfig | grep "inet " | grep -v 127.0.0.1
  ```

- **Windows:**
  ```bash
  ipconfig
  ```
  Busca "IPv4 Address" en la sección de tu adaptador de red activo

- **Desde Expo:**
  Cuando inicias `expo start`, verás tu IP en la terminal o en el código QR

### 3. Casos especiales

- **Android Emulator:** Usa `http://10.0.2.2:3000/api`
- **iOS Simulator:** Puedes usar `http://localhost:3000/api` o tu IP local
- **Dispositivo físico:** Siempre usa tu IP local (ej: `192.168.1.100`)

### 4. Reiniciar el servidor

Después de crear o modificar `.env.development`, reinicia Expo:

```bash
# Detén el servidor (Ctrl+C) y reinicia
npm start
# o
expo start
```

## 🔒 Seguridad

El archivo `.env.development` está en `.gitignore`, así que no se subirá a tu repositorio. 

**Importante:** No compartas tu `.env.development` con información sensible.

## 📝 Archivos relacionados

- `config/env.js` - Lee las variables de entorno
- `config/api.js` - Usa las variables para construir los endpoints
- `babel.config.js` - Configuración de Babel para cargar .env

## ✅ Verificación

Para verificar que las variables se están cargando correctamente, puedes hacer un `console.log` en `config/env.js`:

```javascript
console.log('API_BASE_URL:', process.env.API_BASE_URL);
```


