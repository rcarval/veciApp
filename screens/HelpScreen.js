import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
  Alert,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";

const HelpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const { usuario: usuarioFromContext, getTipoUsuarioEfectivo } = useUser();
  const usuario = route.params?.usuario || usuarioFromContext || {};
  
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Detectar tipo de usuario
  const tipoUsuario = getTipoUsuarioEfectivo ? getTipoUsuarioEfectivo() : (usuario?.tipo_usuario || 'cliente');
  const esEmprendedor = tipoUsuario === 'emprendedor';

  // Contenido dinámico según tipo de usuario
  const categoriasAyuda = useMemo(() => {
    if (esEmprendedor) {
      return [
        {
          id: "general",
          titulo: "Información General",
          icono: "info-circle",
          color: "#3498db",
          preguntas: [
            {
              pregunta: "¿Qué es veciApp para emprendedores?",
              respuesta: "veciApp es tu plataforma digital para promocionar tu emprendimiento local y conectar con clientes de tu comunidad. Crea tu vitrina virtual, gestiona pedidos en tiempo real, accede a estadísticas avanzadas y haz crecer tu negocio de forma profesional."
            },
            {
              pregunta: "¿Cómo funciona la aplicación para emprendedores?",
              respuesta: "Como emprendedor en veciApp puedes:\n\n✅ Crear y gestionar hasta 3 emprendimientos (Plan Premium)\n✅ Publicar hasta 30 productos con categorías\n✅ Recibir pedidos en tiempo real\n✅ Gestionar estados de pedidos\n✅ Ver estadísticas avanzadas de ventas\n✅ Analizar tiempos de entrega y cumplimiento\n✅ Agregar un vendedor para ayudarte\n✅ Contactar directamente con clientes"
            },
            {
              pregunta: "Planes y precios",
              respuesta: "📦 PLAN BÁSICO (GRATIS):\n• 1 emprendimiento\n• Publicación básica\n• Gestión de pedidos\n• Contacto directo con clientes\n\n💎 PLAN PREMIUM ($4.990/mes):\n• Hasta 3 emprendimientos\n• Vitrina virtual con 30 productos\n• 1 vendedor por emprendimiento\n• Mayor visibilidad en la app\n• Estadísticas avanzadas con IA\n• Análisis de tiempos de entrega\n• Soporte prioritario 24/7"
            }
          ]
        },
        {
          id: "emprendimientos",
          titulo: "Mis Emprendimientos",
          icono: "briefcase",
          color: "#f39c12",
          preguntas: [
            {
              pregunta: "¿Cómo registro mi emprendimiento?",
              respuesta: "PASO A PASO COMPLETO:\n\n1️⃣ Ve a 'Mis Emprendimientos'\n2️⃣ Toca 'Crear Emprendimiento'\n\n3️⃣ INFORMACIÓN BÁSICA:\n   • Nombre del negocio\n   • Descripción detallada\n   • Categoría y subcategoría\n   • Foto de perfil del negocio\n\n4️⃣ UBICACIÓN:\n   • Toca en el mapa tu ubicación EXACTA\n   • Escribe la dirección completa\n   • Valida que la dirección exista\n\n5️⃣ HORARIOS DE ATENCIÓN:\n   • Selecciona días que atiendes\n   • Hora de apertura y cierre\n   • Puedes tener horarios diferentes por día\n\n6️⃣ MEDIOS DE PAGO:\n   • Efectivo, Transferencia, Tarjeta\n   • RedCompra, MercadoPago, etc.\n\n7️⃣ TIPOS DE ENTREGA:\n   • Delivery (con o sin costo)\n   • Retiro en local\n\n8️⃣ GALERÍA DE IMÁGENES:\n   • Hasta 6 fotos de tus productos/local\n   • Usa fotos de buena calidad\n\n9️⃣ VERIFICACIÓN SMS:\n   • Recibes código de 6 dígitos\n   • Ingresas el código\n   • Confirmas creación\n\n🔟 REVISIÓN:\n   • Tu emprendimiento pasa a 'Pendiente'\n   • El equipo lo revisa en 24-48 horas\n   • Recibes notificación cuando esté aprobado"
            },
            {
              pregunta: "¿Qué pasa cuando modifico mi emprendimiento?",
              respuesta: "SISTEMA DE BORRADORES INTELIGENTE:\n\nCuando editas un emprendimiento ACTIVO:\n• Se crea automáticamente una COPIA (borrador)\n• El borrador queda en estado 'Verificación'\n• Tu emprendimiento ORIGINAL sigue 100% funcional\n• Los clientes siguen viendo y comprando\n• Las ventas NO se interrumpen NUNCA\n\nPROCESO DE ACTUALIZACIÓN:\n1️⃣ Editas información\n2️⃣ Recibes código SMS (6 dígitos)\n3️⃣ Verificas con el código\n4️⃣ Borrador pasa a 'Pendiente'\n5️⃣ Tras aprobación, el borrador REEMPLAZA al original\n6️⃣ El original se elimina automáticamente\n\n⚠️ IMPORTANTE:\n• Si cancelas el borrador, se elimina permanentemente\n• El original no se afecta\n• Solo puedes tener 1 borrador a la vez por emprendimiento"
            },
            {
              pregunta: "Estados de un emprendimiento",
              respuesta: "📊 CICLO DE VIDA COMPLETO:\n\n🔵 VERIFICACIÓN:\n• Emprendimiento recién creado/editado\n• Esperando código SMS de 6 dígitos\n• Tienes opción 'Completar Verificación'\n• Si no verificas, queda en este estado\n\n🟡 PENDIENTE:\n• Ya verificaste con SMS\n• En revisión por el equipo veciApp\n• Validamos datos, imágenes, información\n• Proceso toma 24-48 horas\n\n🟢 ACTIVO:\n• ¡Aprobado y visible para clientes!\n• Aparece en búsquedas y categorías\n• Recibes pedidos normalmente\n• Puedes desactivarlo cuando quieras\n\n🔴 INACTIVO:\n• Oculto temporalmente\n• TÚ lo desactivaste desde la app\n• No aparece para clientes\n• Puedes reactivarlo cuando quieras\n• Los productos también se desactivan\n\n⚫ RECHAZADO:\n• No cumple con políticas de veciApp\n• Recibes el motivo del rechazo\n• Puedes corregir y volver a enviar\n\n📝 BORRADOR (Bandera especial):\n• Aparece cuando editas un emprendimiento activo\n• Badge 'CAMBIOS PENDIENTES'\n• No reemplaza al original hasta aprobarse"
            }
          ]
        },
        {
          id: "productos",
          titulo: "Vitrina de Productos",
          icono: "cube",
          color: "#9b59b6",
          preguntas: [
            {
              pregunta: "¿Cómo agrego productos?",
              respuesta: "CREAR PRODUCTOS:\n\n1️⃣ Entra a 'Productos' desde tu emprendimiento\n2️⃣ Toca el botón '+' flotante\n3️⃣ Completa:\n   📸 Foto del producto\n   📝 Nombre y descripción\n   💰 Precio (o 'Precio a Cotizar')\n   🏷️ Categoría: Principal, Secundario u Oferta\n   ⚡ Estado: Activo/Inactivo\n\n💡 TIP: Usa fotos de buena calidad y descripciones detalladas para vender más."
            },
            {
              pregunta: "Categorías de productos",
              respuesta: "🏷️ CATEGORÍAS DISPONIBLES:\n\n⭐ PRINCIPAL:\n• Tus productos estrella\n• Mayor visibilidad en tu vitrina\n• Aparecen primero al cliente\n\n📦 SECUNDARIO:\n• Productos complementarios\n• Menor rotación\n• Se muestran después de principales\n\n🎁 OFERTA:\n• Promociones y descuentos\n• Al seleccionar esta categoría:\n  ✓ Aparece campo 'Precio de Oferta'\n  ✓ Se muestra precio normal tachado\n  ✓ Badge destacado '¡OFERTA!'\n  ✓ Cálculo automático de % descuento\n• IMPORTANTE: El precio de oferta debe ser menor al precio normal\n\n💰 PRECIO A COTIZAR:\n• Checkbox especial disponible\n• Para servicios/productos personalizados\n• El precio varía según cliente/trabajo\n• Al activarlo:\n  ✓ Campos de precio se ocultan\n  ✓ Precio se guarda como $0\n  ✓ Categoría cambia automáticamente a 'Principal'\n  ✓ Cliente ve 'Precio a Cotizar' en vez de monto\n\n⚠️ IMPORTANTE:\nNo puedes tener 'Oferta' y 'Precio a Cotizar' al mismo tiempo. Si activas uno, el otro se desactiva automáticamente."
            },
            {
              pregunta: "Límites de productos",
              respuesta: "📊 LÍMITES POR PLAN:\n\n🆓 PLAN BÁSICO:\n• 0 productos en vitrina virtual\n• Solo 1 emprendimiento\n• Pedidos por contacto directo\n• Sin estadísticas avanzadas\n\n💎 PLAN PREMIUM:\n• Hasta 30 productos POR emprendimiento\n• Hasta 3 emprendimientos (90 productos en total)\n• Productos con todas las categorías\n• Estadísticas avanzadas de cada producto\n\n🔄 ¿QUÉ PASA AL VENCER PREMIUM?\n\nCuando tu Plan Premium expira:\n• TODOS tus productos pasan a INACTIVOS\n• NO se eliminan de la base de datos\n• Dejan de aparecer para clientes\n• Se guardan con toda su información\n\nCuando renuevas Premium:\n• Puedes REACTIVAR tus productos\n• Con un switch desde la tarjeta\n• Información intacta (fotos, precios, descripciones)\n• Vuelven a aparecer para clientes\n\n💡 TIP: Antes que expire, descarga las imágenes de tus productos por si acaso."
            }
          ]
        },
        {
          id: "pedidos",
          titulo: "Gestión de Pedidos",
          icono: "shopping-cart",
          color: "#e74c3c",
          preguntas: [
            {
              pregunta: "¿Cómo gestiono los pedidos recibidos?",
              respuesta: "FLUJO DE PEDIDOS:\n\n1️⃣ PENDIENTE → Pedido recién recibido\n   • Revisa detalles del pedido\n   • Confirma disponibilidad\n   • Indica tiempo de entrega (15-120 min)\n\n2️⃣ CONFIRMADO → Pedido aceptado\n   • Cliente recibe notificación\n   • Comienza preparación\n\n3️⃣ EN PREPARACIÓN → Cocinando/preparando\n\n4️⃣ LISTO → Producto terminado\n   • Listo para entrega/retiro\n\n5️⃣ ENTREGADO → Completado\n   • Calificas al cliente\n   • Se registra en estadísticas"
            },
            {
              pregunta: "¿Puedo rechazar un pedido?",
              respuesta: "SÍ, PUEDES RECHAZAR:\n\nMotivos comunes:\n❌ Producto agotado\n❌ Fuera del área de cobertura\n❌ Horario cerrado\n❌ Problema con método de pago\n❌ Cliente no responde\n❌ Dirección incorrecta\n\n⚠️ IMPORTANTE:\nLos rechazos afectan tus estadísticas y visibilidad. Úsalos solo cuando sea necesario. Revisa el análisis de rechazos en 'Mis Estadísticas' para mejorar."
            },
            {
              pregunta: "Pedidos cancelados por cliente",
              respuesta: "CANCELACIONES:\n\nCuando un cliente cancela:\n• Recibes notificación con el motivo\n• El pedido pasa a pestaña 'Cancelados'\n• Debes CONFIRMAR la cancelación\n• Tras confirmar, pasa al historial\n\n💡 Los pedidos cancelados NO afectan negativamente tus estadísticas (a diferencia de los rechazos)."
            }
          ]
        },
        {
          id: "estadisticas",
          titulo: "Estadísticas Avanzadas",
          icono: "bar-chart",
          color: "#27ae60",
          preguntas: [
            {
              pregunta: "¿Qué estadísticas puedo ver?",
              respuesta: "📊 DASHBOARD COMPLETO (Solo Premium):\n\n📈 RENDIMIENTO GENERAL:\n• Total de pedidos del período\n• Pedidos entregados, rechazados, cancelados\n• Tasa de éxito (% entregados vs total)\n• Tasa de rechazo\n• Ingresos totales generados\n• Ticket promedio por pedido\n\n⏱️ ANÁLISIS DE TIEMPOS:\n• Tiempo Comprometido Promedio (lo que prometes)\n• Tiempo Real Promedio (lo que tardas realmente)\n• Diferencia Promedio (adelanto/retraso)\n• % Cumplimiento de tiempos\n• Alertas si te tardas más de lo prometido\n• Recomendaciones para mejorar\n\n🏆 PRODUCTOS TOP 10:\n• Nombre del producto\n• Cantidad vendida\n• Ingresos generados\n• Número de pedidos\n\n📦 PRODUCTOS POR CATEGORÍA:\n• Principal, Secundario, Ofertas\n• Pedidos, unidades vendidas, ingresos\n\n❌ ANÁLISIS DE RECHAZOS:\n• Top 5 motivos de rechazo\n• Cantidad y porcentaje de cada motivo\n• Barras de progreso visuales\n\n🕐 HORARIOS PICO:\n• Top 5 horas con más pedidos\n• Pedidos e ingresos por hora\n• Identifica tu mejor horario\n\n📅 DÍAS MÁS ACTIVOS:\n• Análisis por día de la semana\n• Lunes a Domingo\n• Pedidos e ingresos por día\n\n👥 ANÁLISIS DE CLIENTES:\n• Clientes únicos\n• Clientes recurrentes (más de 1 pedido)\n• Tasa de retención (%)\n\n👁️ CONVERSIÓN:\n• Total de visualizaciones\n• Tasa de conversión (visitas → pedidos)\n\n📊 FILTROS:\n• Año, Mes, Semana, Día\n• Cambia el período con un toque"
            },
            {
              pregunta: "Insights y recomendaciones con IA",
              respuesta: "🤖 INTELIGENCIA ARTIFICIAL:\n\nEl sistema analiza TUS datos y genera automáticamente:\n\n💡 INSIGHTS (4 TIPOS):\n\n🚨 ALERTAS (Rojas):\n• Tasa de éxito < 70%\n• Tasa de rechazo > 15%\n• Cumplimiento de tiempos < 80%\n• Te tardas más de lo prometido\n\n⚠️ ADVERTENCIAS (Naranjas):\n• Baja conversión de visitas\n• Pocos productos en vitrina\n• Problemas de rendimiento moderados\n\nℹ️ INFO (Azules):\n• Datos informativos\n• Tendencias detectadas\n• Oportunidades identificadas\n\n✅ ÉXITOS (Verdes):\n• Tasa de éxito ≥ 90%\n• Cumplimiento perfecto de tiempos\n• Buena conversión (>10%)\n• Felicitaciones por buen desempeño\n\n📋 RECOMENDACIONES INTELIGENTES:\n\nBasadas en insights:\n• 'Revisa los motivos de rechazo y trabaja en mejorarlos'\n• 'Considera aumentar el tiempo de entrega comprometido'\n• 'Agrega más productos para aumentar oportunidades'\n• 'Promociona productos durante las XX:00 hrs' (tu horario pico)\n• 'Mejora fotos y descripciones para aumentar conversión'\n\n✨ Ejemplos reales:\n• Si rechazas mucho: analiza el motivo principal\n• Si te tardas +15min promedio: aumenta tiempos\n• Si tienes <5 productos: agrega más variedad\n• Si conversión <5%: mejora presentación"
            },
            {
              pregunta: "¿Cómo mejorar mi desempeño?",
              respuesta: "🎯 MEJORES PRÁCTICAS:\n\n⏰ TIEMPOS:\n• Sé realista con tiempos prometidos\n• Es mejor sobreestimar que llegar tarde\n• Cumplir >90% = excelente reputación\n\n📸 PRODUCTOS:\n• Fotos de alta calidad\n• Descripciones completas\n• Precios claros\n\n💬 COMUNICACIÓN:\n• Responde rápido por WhatsApp\n• Mantén actualizado el estado\n• Sé amable con los clientes\n\n📊 REVISA ESTADÍSTICAS:\n• Al menos 1 vez por semana\n• Identifica patrones\n• Aplica recomendaciones"
            }
          ]
        },
        {
          id: "vendedor",
          titulo: "Gestión de Vendedor",
          icono: "user-plus",
          color: "#e67e22",
          preguntas: [
            {
              pregunta: "¿Qué es un vendedor?",
              respuesta: "👤 VENDEDOR (Solo Premium):\n\nEs una persona de confianza que te ayuda a gestionar pedidos de UN emprendimiento.\n\n✅ Puede:\n• Ver pedidos recibidos\n• Cambiar estados de pedidos\n• Contactar clientes\n• Ver información de entregas\n\n❌ NO puede:\n• Crear/editar productos\n• Ver estadísticas\n• Modificar datos del emprendimiento\n• Acceder a otros emprendimientos tuyos\n\n🔒 Límite: 1 vendedor por emprendimiento"
            },
            {
              pregunta: "¿Cómo agrego un vendedor?",
              respuesta: "PASO A PASO COMPLETO:\n\n1️⃣ REQUISITOS PREVIOS:\n   • Debes tener Plan Premium activo\n   • El emprendimiento debe estar Activo\n   • El email del vendedor NO debe estar registrado en veciApp\n\n2️⃣ CREAR VENDEDOR:\n   • Ve a 'Mis Emprendimientos'\n   • Selecciona el emprendimiento\n   • Toca 'Vendedor'\n   • Toca 'Crear Vendedor'\n\n3️⃣ COMPLETA EL FORMULARIO:\n   📝 Nombre completo\n   📧 Email (será su usuario)\n   🔒 Contraseña inicial\n   🔒 Confirmar contraseña\n\n4️⃣ VALIDACIONES AUTOMÁTICAS:\n   ✓ Email válido y único\n   ✓ Contraseña mínimo 6 caracteres\n   ✓ Contraseñas coinciden\n   ✓ Email no registrado por otro usuario\n\n5️⃣ ACTIVACIÓN POR EMAIL:\n   • Se crea cuenta con estado 'Pendiente Activación'\n   • Vendedor recibe email HTML BONITO con:\n     - Logo de veciApp\n     - Nombre del emprendimiento\n     - Link de activación único\n     - Válido por 24 horas\n   • Email se envía automáticamente\n\n6️⃣ EL VENDEDOR ACTIVA:\n   • Hace clic en el link del email\n   • Se abre página de confirmación\n   • Cuenta pasa a estado 'Activo'\n   • Email de verificación marcado como ✓\n   • Recibe email de confirmación\n   • Ya puede iniciar sesión en la app\n\n⚠️ SI NO ACTIVA EN 24 HORAS:\n• El link expira\n• Debes eliminarlo y crear uno nuevo\n\n💡 TIP: Asegúrate que el vendedor revise su spam/correo no deseado."
            },
            {
              pregunta: "¿Cómo elimino un vendedor?",
              respuesta: "ELIMINAR VENDEDOR:\n\n1️⃣ Ve a 'Vendedor' en tu emprendimiento\n2️⃣ Toca 'Eliminar Vendedor'\n3️⃣ Confirma la acción\n\n🔴 IMPORTANTE:\n• Se elimina inmediatamente\n• Pierde acceso a todos los pedidos\n• Su cuenta de usuario se desactiva\n• Si necesitas otro vendedor, debes crear uno nuevo\n• No se pueden recuperar vendedores eliminados"
            }
          ]
        },
        {
          id: "tecnico",
          titulo: "Soporte Técnico",
          icono: "cog",
          color: "#34495e",
          preguntas: [
            {
              pregunta: "Problemas técnicos comunes",
              respuesta: "🔧 SOLUCIONES RÁPIDAS:\n\n1️⃣ La app no carga:\n   • Verifica tu internet\n   • Cierra y abre la app\n   • Reinicia tu dispositivo\n\n2️⃣ No recibo pedidos:\n   • Revisa que emprendimiento esté ACTIVO\n   • Verifica que tengas productos activos\n   • Comprueba horarios de atención\n\n3️⃣ No puedo subir fotos:\n   • Da permisos de cámara/galería\n   • Verifica espacio en dispositivo\n   • Usa imágenes <5MB\n\n4️⃣ Estadísticas no actualizan:\n   • Espera algunos minutos\n   • Desliza para refrescar\n   • Cierra sesión y vuelve a entrar"
            },
            {
              pregunta: "¿Cómo contacto soporte?",
              respuesta: "📞 CANALES DE SOPORTE:\n\n💎 PLAN PREMIUM:\n• Soporte prioritario 24/7\n• WhatsApp: +569 1234 5678\n• Email: premium@veciapp.cl\n• Respuesta: 2-4 horas\n\n🆓 PLAN BÁSICO:\n• Email: soporte@veciapp.cl\n• Horario: Lun-Vie 9:00-18:00\n• Respuesta: 24-48 horas\n\nIncluye en tu consulta:\n✓ Descripción del problema\n✓ Capturas de pantalla\n✓ Versión de la app\n✓ Modelo de celular"
            },
            {
              pregunta: "Permisos de la aplicación",
              respuesta: "🔐 PERMISOS NECESARIOS:\n\n📷 CÁMARA:\n• Fotos de productos\n• Foto de perfil\n• Galería del emprendimiento\n\n📸 GALERÍA:\n• Seleccionar imágenes existentes\n\n📍 UBICACIÓN:\n• Mapa de direcciones\n• Validación de entregas\n\n📞 TELÉFONO:\n• Llamar a clientes\n\n💬 WHATSAPP:\n• Contacto directo\n\n🔔 NOTIFICACIONES:\n• Nuevos pedidos\n• Cambios de estado\n• Alertas importantes"
            }
          ]
        }
      ];
    } else {
      // Categorías para CLIENTES
      return [
        {
          id: "general",
          titulo: "Información General",
          icono: "info-circle",
          color: "#3498db",
          preguntas: [
            {
              pregunta: "¿Qué es veciApp?",
              respuesta: "veciApp es tu marketplace local que conecta a clientes con emprendedores de tu comunidad. Descubre productos y servicios cerca de ti, realiza pedidos fácilmente y apoya el comercio local desde tu celular."
            },
            {
              pregunta: "¿Cómo funciona la aplicación?",
              respuesta: "FUNCIONALIDADES PRINCIPALES:\n\n🔍 EXPLORAR:\n• Navega por categorías\n• Busca productos específicos\n• Filtra por distancia\n• Descubre ofertas\n\n🛒 COMPRAR:\n• Agrega productos al carrito\n• Elige delivery o retiro\n• Envía pedido por WhatsApp\n\n📍 GESTIONAR:\n• Guarda múltiples direcciones\n• Rastrea tus pedidos\n• Consulta tu historial\n\n⭐ CALIFICAR:\n• Opina sobre productos\n• Ayuda a otros clientes"
            },
            {
              pregunta: "¿Es gratis usar veciApp?",
              respuesta: "✅ TOTALMENTE GRATIS:\n\n• Sin costo de registro\n• Sin mensualidades\n• Sin cargos ocultos\n• Sin comisiones\n\n💰 Solo pagas directamente al emprendedor por los productos que compres.\n\n📲 Descarga, explora y compra sin límites."
            }
          ]
        },
        {
          id: "pedidos",
          titulo: "Realizar Pedidos",
          icono: "shopping-cart",
          color: "#e74c3c",
          preguntas: [
            {
              pregunta: "¿Cómo hago un pedido?",
              respuesta: "PASO A PASO:\n\n1️⃣ EXPLORA:\n   • Busca por categoría o nombre\n   • Selecciona un emprendimiento\n\n2️⃣ AGREGA AL CARRITO:\n   • Toca '+' en productos\n   • Ajusta cantidades\n\n3️⃣ CONFIGURA ENTREGA:\n   • Delivery o Retiro en local\n   • Selecciona dirección\n\n4️⃣ REVISA TU CARRITO:\n   • Verifica productos y total\n   • Agrega observaciones\n\n5️⃣ ENVÍA POR WHATSAPP:\n   • El mensaje se crea automáticamente\n   • Envía al emprendedor\n   • Coordina pago y entrega\n\n✅ ¡Listo! El emprendedor confirmará tu pedido."
            },
            {
              pregunta: "El carrito de compras",
              respuesta: "🛒 CARACTERÍSTICAS:\n\n✅ Agrega productos ilimitados\n✅ Ajusta cantidades fácilmente\n✅ Elimina productos sin problemas\n✅ Ve el total en tiempo real\n✅ Cambia entre delivery/retiro\n✅ Guarda observaciones\n\n⚠️ IMPORTANTE:\n• El carrito se limpia AUTOMÁTICAMENTE después de enviar\n• Esto evita pedidos duplicados\n• Si quieres el mismo pedido, agrégalo nuevamente"
            },
            {
              pregunta: "Estados de mi pedido",
              respuesta: "📦 SEGUIMIENTO DE PEDIDOS:\n\n🟡 PENDIENTE:\nEmprendedor revisando tu pedido\n\n🔵 CONFIRMADO:\nPedido aceptado, en cola de preparación\n\n🟣 EN PREPARACIÓN:\nCocinando/preparando tu pedido\n\n🟢 LISTO:\nProducto terminado, listo para entrega\n\n✅ ENTREGADO:\nPedido completado\n• Puedes calificar tu experiencia\n\n❌ RECHAZADO:\nNo pudo ser procesado\n• Verás el motivo del emprendedor\n\n🔴 CANCELADO:\nTú cancelaste el pedido"
            },
            {
              pregunta: "¿Puedo modificar un pedido enviado?",
              respuesta: "MODIFICACIONES:\n\n❌ No desde la app\n✅ Contacta al emprendedor directamente:\n   • Por WhatsApp (mismo chat del pedido)\n   • Por teléfono\n\n💡 TIPS:\n• Hazlo lo antes posible\n• Si está 'En Preparación' puede ser tarde\n• Sé claro con los cambios\n\n🔄 Si el cambio es grande, mejor:\n1. Cancela el pedido original\n2. Haz un nuevo pedido correcto"
            }
          ]
        },
        {
          id: "direcciones",
          titulo: "Mis Direcciones",
          icono: "map-marker",
          color: "#27ae60",
          preguntas: [
            {
              pregunta: "¿Cómo agrego una dirección?",
              respuesta: "AGREGAR DIRECCIÓN:\n\n1️⃣ Ve a 'Mi Perfil' → 'Mis Direcciones'\n\n2️⃣ Toca '+ Agregar Dirección'\n\n3️⃣ USA EL MAPA:\n   • Toca en tu ubicación exacta\n   • Arrastra el marcador si es necesario\n\n4️⃣ COMPLETA:\n   • Dirección completa\n   • Depto/Casa/Oficina\n   • Referencia (opcional)\n\n5️⃣ VALIDA Y GUARDA:\n   • La app verifica con Google Maps\n   • Guarda tu dirección\n\n✅ Ya puedes usarla para pedidos"
            },
            {
              pregunta: "¿Por qué necesito una dirección?",
              respuesta: "📍 IMPORTANCIA DE LAS DIRECCIONES:\n\n✅ PARA TI:\n• Pedidos más rápidos\n• No repetir datos\n• Múltiples direcciones (casa, trabajo)\n• Precisión en entregas\n\n✅ PARA EMPRENDEDORES:\n• Calcular distancia de delivery\n• Planificar rutas\n• Confirmar cobertura\n• Ver ubicación en mapa\n\n⚠️ SIN DIRECCIÓN:\n• No podrás pedir delivery\n• Solo retiro en local disponible"
            },
            {
              pregunta: "Gestionar mis direcciones",
              respuesta: "🏠 ADMINISTRACIÓN:\n\n📝 EDITAR:\n• Toca la dirección\n• Modifica lo que necesites\n• Guarda cambios\n\n🗑️ ELIMINAR:\n• Desliza la dirección a la izquierda\n• Confirma eliminación\n• No se puede recuperar\n\n⭐ PRINCIPAL:\n• Marca una como principal\n• Se selecciona automáticamente\n• Puedes cambiarla cuando quieras\n\n🔢 LÍMITE:\n• Direcciones ilimitadas\n• Organízalas como prefieras"
            }
          ]
        },
        {
          id: "categorias",
          titulo: "Categorías y Búsqueda",
          icono: "tags",
          color: "#9b59b6",
          preguntas: [
            {
              pregunta: "Categorías disponibles",
              respuesta: "🏪 EXPLORA POR CATEGORÍA:\n\n🍕 COMIDA PREPARADA:\n• Sushi, Pizza, Hamburguesas\n• Comida Casera, Peruana, China\n• Pastelería, Vegetariano\n• Mariscos, Carnes, Postres\n\n🛠️ SERVICIOS LOCALES:\n• Construcción, Pintura\n• Gasfitería, Electricidad\n• Jardinería, Limpieza\n• Reparaciones, Diseño\n\n🏬 TIENDAS & NEGOCIOS:\n• Almacén, Panadería\n• Verdulería, Carnicería\n• Minimarket, Ferretería\n\n💅 BELLEZA & BIENESTAR:\n• Spa, Manicure, Peluquería\n• Barbería, Estética\n• Masajes, Tatuajes"
            },
            {
              pregunta: "¿Cómo buscar productos?",
              respuesta: "🔍 OPCIONES DE BÚSQUEDA:\n\n1️⃣ BARRA DE BÚSQUEDA:\n   • Nombre del producto\n   • Nombre del emprendimiento\n   • Palabra clave\n\n2️⃣ POR CATEGORÍA:\n   • Navega las 4 categorías principales\n   • Filtra por subcategoría\n\n3️⃣ POR UBICACIÓN:\n   • Ordena por distancia\n   • Filtra por radio (1km, 5km, 10km)\n\n4️⃣ OFERTAS DEL DÍA:\n   • Sección especial\n   • Solo promociones\n\n💡 COMBINA FILTROS:\nCategoría + Ubicación + Búsqueda"
            },
            {
              pregunta: "¿Qué son las ofertas?",
              respuesta: "🎁 OFERTAS ESPECIALES:\n\n✨ CARACTERÍSTICAS:\n• Descuentos reales\n• Precio tachado + precio oferta\n• Badge destacado '¡OFERTA!'\n• Actualización diaria\n\n📍 DÓNDE ENCONTRARLAS:\n• Sección 'Ofertas del Día'\n• Badge en listados normales\n• Destacadas en búsquedas\n\n💰 TIPOS DE OFERTAS:\n• Descuentos porcentuales\n• 2x1, 3x2\n• Combos especiales\n• Promociones temporales\n\n⏰ Aprovechain antes que terminen!"
            }
          ]
        },
        {
          id: "cuenta",
          titulo: "Mi Cuenta",
          icono: "user",
          color: "#f39c12",
          preguntas: [
            {
              pregunta: "Actualizar mi información",
              respuesta: "⚙️ CONFIGURACIÓN DE PERFIL:\n\n📸 FOTO DE PERFIL:\n1. Toca tu foto actual\n2. Cámara o Galería\n3. Se guarda automáticamente\n\n📝 DATOS PERSONALES:\n1. 'Mi Perfil' → 'Información'\n2. Edita lo necesario\n3. Guarda cambios\n\n📧 CAMBIO DE EMAIL:\n• Requiere verificación\n• Código por email\n• Actualización inmediata\n\n📱 CAMBIO DE TELÉFONO:\n• Requiere código SMS\n• Verificación obligatoria\n• Para seguridad de tu cuenta"
            },
            {
              pregunta: "Seguridad y privacidad",
              respuesta: "🔒 TU SEGURIDAD ES NUESTRA PRIORIDAD:\n\n🔐 CONTRASEÑA SEGURA:\n• Mínimo 6 caracteres obligatorios\n• Combina letras y números\n• Cámbiala regularmente\n• Nunca la compartas\n• Se guarda encriptada\n\n📧 VERIFICACIÓN DE EMAIL (OBLIGATORIA):\n\nAl registrarte:\n1. Completas tus datos\n2. Recibes email HTML bonito con:\n   - Logo de veciApp\n   - Link de verificación único\n   - Válido por 48 horas\n3. Haces clic en el link\n4. Tu cuenta se activa\n5. Recibes confirmación\n\n⚠️ HASTA QUE NO VERIFIQUES:\n• NO puedes iniciar sesión\n• La app bloquea el acceso\n• Ves mensaje: 'Verifica tu email'\n\n📱 VERIFICACIÓN SMS (Emprendedores):\n• Al crear/editar emprendimientos\n• Código de 6 dígitos\n• Válido por 10 minutos\n• Protege contra cambios no autorizados\n\n🚫 PRIVACIDAD DE TUS DATOS:\n• NO compartimos con terceros\n• Solo emprendedores ven:\n  - Tu dirección de entrega (del pedido)\n  - Tu teléfono (para coordinar)\n• Tu email está protegido\n• Cumplimos GDPR y normativas chilenas\n\n🔄 RECUPERACIÓN DE CONTRASEÑA:\n• Código de 6 dígitos por email\n• Válido por 5 minutos\n• Email HTML bonito\n• Proceso seguro y rápido"
            },
            {
              pregunta: "¿Olvidé mi contraseña?",
              respuesta: "🔑 RECUPERAR CONTRASEÑA:\n\n1️⃣ PANTALLA DE LOGIN:\n   • Toca '¿Olvidaste tu contraseña?'\n\n2️⃣ INGRESA TU EMAIL:\n   • El registrado en tu cuenta\n\n3️⃣ REVISA TU CORREO:\n   • Código de 6 dígitos\n   • Válido por 5 minutos\n\n4️⃣ INGRESA CÓDIGO:\n   • Escribe el código recibido\n\n5️⃣ NUEVA CONTRASEÑA:\n   • Crea una nueva\n   • Confírmala\n   • ¡Listo!\n\n⚠️ Si no te llega:\n• Revisa spam\n• Verifica que el email sea correcto\n• Espera 1 minuto y solicita otro"
            }
          ]
        },
        {
          id: "tecnico",
          titulo: "Soporte Técnico",
          icono: "cog",
          color: "#34495e",
          preguntas: [
            {
              pregunta: "Problemas comunes",
              respuesta: "🔧 SOLUCIONES RÁPIDAS:\n\n📱 APP NO ABRE:\n1. Verifica internet\n2. Cierra app completamente\n3. Reinicia celular\n4. Actualiza desde la tienda\n\n🛒 CARRITO NO FUNCIONA:\n1. Refresca la pantalla\n2. Cierra sesión y vuelve a entrar\n3. Limpia caché de la app\n\n📍 MAPA NO CARGA:\n1. Activa ubicación\n2. Da permisos de ubicación\n3. Revisa conexión a internet\n\n💬 NO ABRE WHATSAPP:\n1. Verifica que esté instalado\n2. Actualiza WhatsApp\n3. Da permisos necesarios"
            },
            {
              pregunta: "Contactar soporte",
              respuesta: "📞 ¿NECESITAS AYUDA?\n\n💬 WHATSAPP:\n+569 1234 5678\n• Lun-Vie: 9:00-18:00\n• Respuesta rápida\n\n📧 EMAIL:\nsoporte@veciapp.cl\n• 24/7\n• Respuesta en 24-48 hrs\n\n📝 QUÉ INCLUIR:\n✓ Descripción del problema\n✓ Capturas de pantalla\n✓ Modelo de celular\n✓ Versión de la app\n\n💡 Mientras más detalles, mejor podemos ayudarte."
            },
            {
              pregunta: "Permisos necesarios",
              respuesta: "🔐 PERMISOS DE LA APP:\n\n📷 CÁMARA:\n• Foto de perfil\n• Opcional\n\n🖼️ GALERÍA:\n• Seleccionar imágenes\n• Opcional\n\n📍 UBICACIÓN:\n• Mapa de direcciones\n• Validar entregas\n• Recomendado\n\n📞 TELÉFONO:\n• Llamar a emprendedores\n• Opcional\n\n💬 WHATSAPP:\n• Enviar pedidos\n• Necesario para comprar\n\n🔔 NOTIFICACIONES:\n• Estado de pedidos\n• Ofertas especiales\n• Recomendado\n\n✋ Puedes revocar permisos cuando quieras desde Ajustes de tu celular."
            }
          ]
        }
      ];
    }
  }, [esEmprendedor]);

  const abrirPregunta = (categoria, pregunta) => {
    setCategoriaSeleccionada(categoria);
    setPreguntaSeleccionada(pregunta);
    setModalVisible(true);
  };

  const contactarSoporte = () => {
    Alert.alert(
      "Contactar Soporte",
      "¿Cómo te gustaría contactar con nuestro equipo?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "WhatsApp", 
          onPress: () => {
            const mensaje = esEmprendedor 
              ? "Hola, soy emprendedor y necesito ayuda con veciApp. Mi consulta es:"
              : "Hola, necesito ayuda con veciApp. Mi consulta es:";
            const url = `whatsapp://send?phone=+56912345678&text=${encodeURIComponent(mensaje)}`;
            Linking.openURL(url).catch(() => {
              Alert.alert("Error", "No se pudo abrir WhatsApp");
            });
          }
        },
        { 
          text: "Email", 
          onPress: () => {
            const email = esEmprendedor ? "premium@veciapp.cl" : "soporte@veciapp.cl";
            const subject = `Consulta veciApp - ${esEmprendedor ? 'Emprendedor' : 'Cliente'}`;
            const body = esEmprendedor
              ? "Hola, soy emprendedor y necesito ayuda con veciApp.\n\nMi consulta es:"
              : "Hola, necesito ayuda con veciApp.\n\nMi consulta es:";
            const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            Linking.openURL(url).catch(() => {
              Alert.alert("Error", "No se pudo abrir el cliente de email");
            });
          }
        }
      ]
    );
  };

  const renderCategoria = (categoria) => (
    <TouchableOpacity
      key={categoria.id}
      style={[styles.categoriaCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
      onPress={() => setCategoriaSeleccionada(categoria)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[categoria.color + '15', 'transparent']}
        style={styles.categoriaGradient}
      >
        <View style={styles.categoriaContent}>
          <View style={[styles.categoriaIconContainer, { backgroundColor: categoria.color }]}>
            <FontAwesome name={categoria.icono} size={24} color="white" />
          </View>
          <View style={styles.categoriaInfo}>
            <Text style={[styles.categoriaTitulo, { color: currentTheme.text }]}>
              {categoria.titulo}
            </Text>
            <View style={styles.categoriaMeta}>
              <View style={[styles.preguntasBadge, { backgroundColor: categoria.color + '20' }]}>
                <Ionicons name="help-circle" size={14} color={categoria.color} />
                <Text style={[styles.preguntasCount, { color: categoria.color }]}>
                  {categoria.preguntas.length} preguntas
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={currentTheme.textSecondary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPreguntas = () => {
    if (!categoriaSeleccionada) return null;

    return (
      <View style={styles.preguntasContainer}>
        <TouchableOpacity
          style={[styles.backButtonModerno, { backgroundColor: currentTheme.cardBackground }]}
          onPress={() => setCategoriaSeleccionada(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={currentTheme.primary} />
          <Text style={[styles.backTextModerno, { color: currentTheme.primary }]}>
            Volver
          </Text>
        </TouchableOpacity>

        <View style={[styles.categoriaSelectedHeader, { backgroundColor: categoriaSeleccionada.color + '15' }]}>
          <View style={[styles.categoriaSelectedIcon, { backgroundColor: categoriaSeleccionada.color }]}>
            <FontAwesome name={categoriaSeleccionada.icono} size={28} color="white" />
          </View>
          <Text style={[styles.categoriaSelectedTitulo, { color: currentTheme.text }]}>
            {categoriaSeleccionada.titulo}
          </Text>
        </View>

        <ScrollView 
          style={styles.preguntasList}
          showsVerticalScrollIndicator={false}
        >
          {categoriaSeleccionada.preguntas.map((pregunta, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.preguntaCardModerno, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
              onPress={() => abrirPregunta(categoriaSeleccionada, pregunta)}
              activeOpacity={0.7}
            >
              <View style={[styles.preguntaNumero, { backgroundColor: categoriaSeleccionada.color + '20' }]}>
                <Text style={[styles.preguntaNumeroTexto, { color: categoriaSeleccionada.color }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.preguntaTextoModerno, { color: currentTheme.text }]}>
                {pregunta.pregunta}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderModalRespuesta = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
          <LinearGradient
            colors={[categoriaSeleccionada?.color || currentTheme.primary, categoriaSeleccionada?.color + 'dd' || currentTheme.secondary]}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconWrapper}>
                <FontAwesome name={categoriaSeleccionada?.icono || "question-circle"} size={24} color="white" />
              </View>
              <Text style={styles.modalTitulo} numberOfLines={2}>
                {preguntaSeleccionada?.pregunta}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={32} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.respuestaTexto, { color: currentTheme.text }]}>
              {preguntaSeleccionada?.respuesta}
            </Text>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: currentTheme.border }]}>
            <TouchableOpacity
              style={styles.contactarButton}
              onPress={() => {
                setModalVisible(false);
                contactarSoporte();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[currentTheme.primary, currentTheme.secondary]}
                style={styles.contactarGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="headset" size={20} color="white" />
                <Text style={styles.contactarTexto}>¿Necesitas más ayuda?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="help-circle" size={28} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Centro de</Text>
            <Text style={styles.tituloPrincipal}>Ayuda</Text>
          </View>
          <View style={[styles.userTypeBadge, { backgroundColor: esEmprendedor ? '#f39c12' : '#3498db' }]}>
            <Ionicons 
              name={esEmprendedor ? "briefcase" : "person"} 
              size={14} 
              color="white" 
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {!categoriaSeleccionada ? (
          <>
            <View style={[styles.bienvenidaContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <View style={styles.bienvenidaHeader}>
                <View style={[styles.bienvenidaIcon, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Ionicons name="hand-right" size={32} color={currentTheme.primary} />
                </View>
                <View style={styles.bienvenidaTextos}>
                  <Text style={[styles.bienvenidaTitulo, { color: currentTheme.text }]}>
                    ¡Hola{esEmprendedor ? ' Emprendedor' : ''}! 👋
                  </Text>
                  <Text style={[styles.bienvenidaDescripcion, { color: currentTheme.textSecondary }]}>
                    {esEmprendedor 
                      ? 'Encuentra respuestas para gestionar tu negocio exitosamente'
                      : 'Encuentra respuestas rápidas a tus preguntas sobre veciApp'
                    }
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.categoriasContainer}>
              <View style={styles.seccionHeader}>
                <Ionicons name="list" size={20} color={currentTheme.primary} />
                <Text style={[styles.seccionTitulo, { color: currentTheme.text }]}>
                  Temas de Ayuda
                </Text>
              </View>
              {categoriasAyuda.map(renderCategoria)}
            </View>

            <View style={[styles.soporteContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <LinearGradient
                colors={[currentTheme.primary + '10', 'transparent']}
                style={styles.soporteGradient}
              >
                <View style={[styles.soporteIcon, { backgroundColor: currentTheme.primary }]}>
                  <Ionicons name="chatbubbles" size={28} color="white" />
                </View>
                <Text style={[styles.soporteTitulo, { color: currentTheme.text }]}>
                  ¿No encuentras lo que buscas?
                </Text>
                <Text style={[styles.soporteDescripcion, { color: currentTheme.textSecondary }]}>
                  {esEmprendedor
                    ? 'Nuestro equipo de soporte prioritario está listo para ayudarte'
                    : 'Estamos aquí para ayudarte en lo que necesites'
                  }
                </Text>
                <TouchableOpacity
                  style={styles.soporteButton}
                  onPress={contactarSoporte}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[currentTheme.primary, currentTheme.secondary]}
                    style={styles.soporteButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="headset" size={22} color="white" />
                    <Text style={styles.soporteButtonTexto}>Contactar Soporte</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </>
        ) : (
          renderPreguntas()
        )}
      </ScrollView>

      {renderModalRespuesta()}
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  userTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 130,
  },
  bienvenidaContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  bienvenidaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bienvenidaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bienvenidaTextos: {
    flex: 1,
  },
  bienvenidaTitulo: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  bienvenidaDescripcion: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoriasContainer: {
    marginBottom: 24,
  },
  categoriaCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  categoriaGradient: {
    padding: 18,
  },
  categoriaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  categoriaIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriaInfo: {
    flex: 1,
    gap: 6,
  },
  categoriaTitulo: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoriaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preguntasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  preguntasCount: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  preguntasContainer: {
    flex: 1,
  },
  backButtonModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backTextModerno: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  categoriaSelectedHeader: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  categoriaSelectedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoriaSelectedTitulo: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  preguntasList: {
    flex: 1,
  },
  preguntaCardModerno: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  preguntaNumero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preguntaNumeroTexto: {
    fontSize: 15,
    fontWeight: '800',
  },
  preguntaTextoModerno: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  soporteContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  soporteGradient: {
    padding: 24,
    alignItems: 'center',
  },
  soporteIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  soporteTitulo: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  soporteDescripcion: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  soporteButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  soporteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 10,
  },
  soporteButtonTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    maxHeight: 420,
    padding: 20,
  },
  respuestaTexto: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  modalFooter: {
    borderTopWidth: 1,
    padding: 20,
  },
  contactarButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  contactarGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  contactarTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default HelpScreen;
