import React, { useState } from "react";
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

const HelpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentTheme } = useTheme();
  const usuario = route.params?.usuario ?? {};
  
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const categoriasAyuda = [
    {
      id: "general",
      titulo: "Información General",
      icono: "info-circle",
      color: "#3498db",
      preguntas: [
        {
          pregunta: "¿Qué es veciApp?",
          respuesta: "veciApp es una plataforma que conecta emprendedores locales con clientes de su comunidad. Permite a los usuarios descubrir productos y servicios cerca de su ubicación, realizar pedidos y contactar directamente con los negocios a través de WhatsApp."
        },
        {
          pregunta: "¿Cómo funciona la aplicación?",
          respuesta: "La app funciona como un marketplace local donde:\n\n• Los clientes pueden explorar productos y servicios por categorías\n• Realizar pedidos con carrito de compras\n• Contactar directamente con emprendedores vía WhatsApp\n• Gestionar sus direcciones de entrega\n• Ver el historial de sus pedidos\n\n• Los emprendedores pueden crear su vitrina virtual\n• Gestionar pedidos recibidos\n• Actualizar estados de pedidos\n• Acceder a estadísticas de ventas"
        },
        {
          pregunta: "¿Es gratis usar la aplicación?",
          respuesta: "Sí, veciApp es completamente gratuita para los clientes. Los emprendedores pueden usar el Plan Básico gratis o suscribirse al Plan Premium ($4.990/mes) para acceder a funcionalidades avanzadas como vitrina virtual, promoción destacada y estadísticas avanzadas."
        }
      ]
    },
    {
      id: "pedidos",
      titulo: "Pedidos y Compras",
      icono: "shopping-cart",
      color: "#e74c3c",
      preguntas: [
        {
          pregunta: "¿Cómo realizo un pedido?",
          respuesta: "Para realizar un pedido:\n\n1. Explora las categorías (Comida, Servicios, Negocios, Belleza)\n2. Selecciona un emprendimiento\n3. Agrega productos al carrito usando los botones + y -\n4. Elige el modo de entrega (Delivery o Retiro en local)\n5. Selecciona una dirección de entrega\n6. Revisa tu pedido en el carrito\n7. Confirma y envía el pedido por WhatsApp\n\nEl mensaje se enviará automáticamente con todos los detalles del pedido."
        },
        {
          pregunta: "¿Cómo funciona el carrito de compras?",
          respuesta: "El carrito te permite:\n\n• Agregar múltiples productos de diferentes categorías\n• Ajustar cantidades con los botones + y -\n• Eliminar productos completamente\n• Ver el total de tu pedido\n• Cambiar entre delivery y retiro en local\n\n⚠️ Importante: El carrito se limpia automáticamente después de enviar el pedido para evitar duplicados."
        },
        {
          pregunta: "¿Puedo modificar un pedido después de enviarlo?",
          respuesta: "Una vez enviado el pedido por WhatsApp, debes contactar directamente con el emprendedor para cualquier modificación. La aplicación no permite cambios automáticos después del envío para mantener la integridad del proceso de pedidos."
        },
        {
          pregunta: "¿Cómo veo el estado de mis pedidos?",
          respuesta: "Puedes ver tus pedidos en 'Mis Pedidos' desde tu perfil:\n\n• Pedidos Pendientes: Pedidos en proceso\n• Historial: Pedidos completados o cancelados\n\nLos estados incluyen: Pendiente, Confirmado, En Preparación, Listo, Entregado o Cancelado."
        }
      ]
    },
    {
      id: "direcciones",
      titulo: "Direcciones y Ubicación",
      icono: "map-marker",
      color: "#27ae60",
      preguntas: [
        {
          pregunta: "¿Cómo agrego una dirección de entrega?",
          respuesta: "Para agregar una dirección:\n\n1. Ve a 'Mi Perfil' → 'Mis Direcciones'\n2. Toca 'Agregar Nueva Dirección'\n3. Usa el mapa para seleccionar la ubicación exacta\n4. Escribe la dirección completa\n5. Agrega una referencia (opcional)\n6. Guarda la dirección\n\nLa aplicación validará automáticamente que la dirección existe usando Google Maps."
        },
        {
          pregunta: "¿Por qué necesito agregar una dirección?",
          respuesta: "Las direcciones son obligatorias porque:\n\n• Permiten calcular distancias para delivery\n• Ayudan a los emprendedores a ubicar tu pedido\n• Mejoran la precisión de las entregas\n• Son necesarias para el sistema de mapas\n\nSin direcciones registradas, no podrás realizar pedidos con delivery."
        },
        {
          pregunta: "¿Cómo funciona el mapa de direcciones?",
          respuesta: "El mapa te permite:\n\n• Seleccionar tu ubicación exacta tocando en el mapa\n• Buscar direcciones escribiendo la dirección\n• Validar que la dirección existe realmente\n• Ver la ubicación en tiempo real\n\nEl sistema usa Google Maps para garantizar la precisión de las ubicaciones."
        }
      ]
    },
    {
      id: "emprendedores",
      titulo: "Para Emprendedores",
      icono: "briefcase",
      color: "#f39c12",
      preguntas: [
        {
          pregunta: "¿Cómo registro mi emprendimiento?",
          respuesta: "Para registrar tu emprendimiento:\n\n1. Ve a 'Mi Perfil' → 'Mis Emprendimientos'\n2. Completa el formulario con:\n   • Información básica del negocio\n   • Categorías y subcategorías\n   • Dirección con validación en mapa\n   • Horarios de atención\n   • Métodos de pago y entrega\n   • Galería de productos\n3. Envía para revisión\n\nUna vez aprobado, aparecerá en las búsquedas de clientes."
        },
        {
          pregunta: "¿Cómo gestiono los pedidos recibidos?",
          respuesta: "En 'Pedidos Recibidos' puedes:\n\n• Ver todos los pedidos de clientes\n• Actualizar estados: Pendiente → Confirmado → En Preparación → Listo → Entregado\n• Ver información detallada del cliente\n• Contactar directamente por teléfono o WhatsApp\n• Ver la ubicación de entrega en el mapa\n• Acceder al historial de pedidos"
        },
        {
          pregunta: "¿Qué es el Plan Premium?",
          respuesta: "El Plan Premium ($4.990/mes) incluye:\n\n✅ Vitrina virtual completa\n✅ Promoción destacada en búsquedas\n✅ Estadísticas avanzadas de ventas\n✅ Soporte prioritario 24/7\n✅ Direcciones ilimitadas\n✅ Gestión de inventario\n✅ Notificaciones push personalizadas\n✅ Análisis de clientes\n✅ Herramientas de marketing\n\nEl Plan Básico es gratuito e incluye publicación básica y gestión de pedidos."
        },
        {
          pregunta: "¿Cómo veo las estadísticas de mi negocio?",
          respuesta: "En 'Mis Estadísticas' puedes ver:\n\n• Número total de pedidos\n• Ingresos generados\n• Productos más vendidos\n• Clientes más frecuentes\n• Tendencias de ventas\n• Horarios de mayor actividad\n\nLas estadísticas se actualizan en tiempo real y están disponibles para usuarios Premium."
        }
      ]
    },
    {
      id: "categorias",
      titulo: "Categorías y Productos",
      icono: "tags",
      color: "#9b59b6",
      preguntas: [
        {
          pregunta: "¿Qué categorías están disponibles?",
          respuesta: "veciApp incluye estas categorías principales:\n\n🍕 COMIDA PREPARADA\n• Sushi, Pizza, Hamburguesas\n• Comida Casera, Peruana, China\n• Pastelería, Vegetariano/Vegano\n• Mariscos, Carnes\n\n🛠 SERVICIOS LOCALES\n• Construcción, Pintura, Gasfitería\n• Electricidad, Computadores\n• Jardinería, Mudanzas, Limpieza\n• Reparaciones, Diseño\n\n🏪 TIENDAS & NEGOCIOS\n• Almacén, Panadería, Verdulería\n• Carnicería, Pescadería\n• Minimarket, Licorería, Ferretería\n\n💇 BELLEZA & BIENESTAR\n• Spa, Manicure, Peluquería\n• Barbería, Estética, Maquillaje\n• Depilación, Tatuajes, Masajes"
        },
        {
          pregunta: "¿Cómo busco productos específicos?",
          respuesta: "Puedes buscar productos de varias formas:\n\n• Usa la barra de búsqueda en la pantalla principal\n• Explora por categorías en las pantallas específicas\n• Filtra por ubicación y distancia\n• Busca por nombre del emprendimiento\n• Explora las ofertas del día\n\nLa búsqueda incluye productos, servicios y nombres de negocios."
        },
        {
          pregunta: "¿Cómo funcionan las ofertas?",
          respuesta: "Las ofertas funcionan así:\n\n• Los emprendedores pueden marcar productos como 'Oferta'\n• Aparecen destacadas con etiquetas especiales\n• Se muestran en la sección 'Ofertas del Día'\n• Incluyen descuentos, promociones 2x1, paquetes especiales\n• Los precios de oferta se muestran destacados en verde\n\nLas ofertas se actualizan regularmente para mantener el contenido fresco."
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
          pregunta: "¿Qué hacer si la app no funciona correctamente?",
          respuesta: "Si experimentas problemas:\n\n1. Verifica tu conexión a internet\n2. Cierra y vuelve a abrir la aplicación\n3. Reinicia tu dispositivo\n4. Actualiza la aplicación desde la tienda\n5. Limpia la caché de la aplicación\n\nSi el problema persiste, contacta al soporte técnico con detalles específicos del error."
        },
        {
          pregunta: "¿Cómo cambio mi foto de perfil?",
          respuesta: "Para cambiar tu foto de perfil:\n\n1. Ve a 'Mi Perfil'\n2. Toca tu foto de perfil\n3. Selecciona 'Tomar foto' o 'Elegir de galería'\n4. Ajusta la imagen si es necesario\n5. Confirma la selección\n\nLa nueva foto se guardará automáticamente y aparecerá en tu perfil."
        },
        {
          pregunta: "¿Cómo actualizo mi información personal?",
          respuesta: "Para actualizar tu información:\n\n1. Ve a 'Mi Perfil' → 'Información Personal'\n2. Modifica los campos que necesites cambiar\n3. Para cambios importantes (teléfono), se enviará un código de verificación\n4. Ingresa el código recibido por SMS\n5. Guarda los cambios\n\nLos cambios se aplicarán inmediatamente en tu perfil."
        },
        {
          pregunta: "¿Qué permisos necesita la aplicación?",
          respuesta: "veciApp necesita estos permisos:\n\n📷 CÁMARA: Para tomar fotos de productos y perfil\n📱 GALERÍA: Para seleccionar imágenes existentes\n📍 UBICACIÓN: Para mostrar direcciones en mapas\n📞 TELÉFONO: Para contactar emprendedores\n💬 WHATSAPP: Para enviar pedidos\n\nTodos los permisos se solicitan solo cuando son necesarios y puedes negarlos si lo deseas."
        }
      ]
    }
  ];

  const abrirPregunta = (categoria, pregunta) => {
    setCategoriaSeleccionada(categoria);
    setPreguntaSeleccionada(pregunta);
    setModalVisible(true);
  };

  const contactarSoporte = () => {
    Alert.alert(
      "Contactar Soporte",
      "¿Cómo te gustaría contactar con nuestro equipo de soporte?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "WhatsApp", 
          onPress: () => {
            const mensaje = "Hola, necesito ayuda con veciApp. Mi consulta es:";
            const url = `whatsapp://send?phone=+56912345678&text=${encodeURIComponent(mensaje)}`;
            Linking.openURL(url).catch(() => {
              Alert.alert("Error", "No se pudo abrir WhatsApp");
            });
          }
        },
        { 
          text: "Email", 
          onPress: () => {
            const email = "soporte@veciapp.cl";
            const subject = "Consulta veciApp";
            const body = "Hola, necesito ayuda con veciApp. Mi consulta es:";
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
      style={[styles.categoriaCard, { borderLeftColor: categoria.color, backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
      onPress={() => setCategoriaSeleccionada(categoria)}
    >
      <View style={styles.categoriaHeader}>
        <View style={[styles.categoriaIcono, { backgroundColor: categoria.color }]}>
          <FontAwesome name={categoria.icono} size={20} color="white" />
        </View>
        <View style={styles.categoriaInfo}>
          <Text style={[styles.categoriaTitulo, { color: currentTheme.text }]}>{categoria.titulo}</Text>
          <Text style={[styles.categoriaDescripcion, { color: currentTheme.textSecondary }]}>
            {categoria.preguntas.length} preguntas frecuentes
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color={currentTheme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderPreguntas = () => {
    if (!categoriaSeleccionada) return null;

    return (
      <View style={styles.preguntasContainer}>
        <View style={styles.preguntasHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCategoriaSeleccionada(null)}
          >
            <FontAwesome name="arrow-left" size={16} color={currentTheme.primary} />
            <Text style={[styles.backText, { color: currentTheme.primary }]}>Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.preguntasTitulo, { color: currentTheme.text }]}>{categoriaSeleccionada.titulo}</Text>
        </View>

        <ScrollView style={styles.preguntasList}>
          {categoriaSeleccionada.preguntas.map((pregunta, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.preguntaCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}
              onPress={() => abrirPregunta(categoriaSeleccionada, pregunta)}
            >
              <Text style={[styles.preguntaTexto, { color: currentTheme.text }]}>{pregunta.pregunta}</Text>
              <FontAwesome name="chevron-right" size={14} color={currentTheme.textSecondary} />
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
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitulo, { color: currentTheme.text }]}>{preguntaSeleccionada?.pregunta}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="times" size={20} color={currentTheme.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={[styles.respuestaTexto, { color: currentTheme.text }]}>
              {preguntaSeleccionada?.respuesta}
            </Text>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: currentTheme.border }]}>
            <TouchableOpacity
              style={[styles.contactarButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => {
                setModalVisible(false);
                contactarSoporte();
              }}
            >
              <FontAwesome name="question-circle" size={16} color="white" />
              <Text style={styles.contactarTexto}>¿Necesitas más ayuda?</Text>
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
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <FontAwesome name="question-circle" size={24} color="white" />
            <Text style={styles.tituloPrincipal}>Necesito Ayuda</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        {!categoriaSeleccionada ? (
          <>
            <View style={[styles.bienvenidaContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <Text style={[styles.bienvenidaTitulo, { color: currentTheme.text }]}>¡Hola! ¿En qué podemos ayudarte?</Text>
              <Text style={[styles.bienvenidaDescripcion, { color: currentTheme.textSecondary }]}>
                Encuentra respuestas rápidas a las preguntas más comunes sobre veciApp
              </Text>
            </View>

            <View style={styles.categoriasContainer}>
              {categoriasAyuda.map(renderCategoria)}
            </View>

            <View style={[styles.soporteContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <Text style={[styles.soporteTitulo, { color: currentTheme.text }]}>¿No encuentras lo que buscas?</Text>
              <Text style={[styles.soporteDescripcion, { color: currentTheme.textSecondary }]}>
                Nuestro equipo de soporte está aquí para ayudarte
              </Text>
              <TouchableOpacity
                style={[styles.soporteButton, { backgroundColor: currentTheme.primary }]}
                onPress={contactarSoporte}
              >
                <FontAwesome name="headphones" size={20} color="white" />
                <Text style={styles.soporteButtonTexto}>Contactar Soporte</Text>
              </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#2A9D8F",
    fontWeight: "500",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  bienvenidaContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bienvenidaTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  bienvenidaDescripcion: {
    fontSize: 16,
    color: "#7f8c8d",
    lineHeight: 22,
  },
  categoriasContainer: {
    marginBottom: 20,
  },
  categoriaCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoriaIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  categoriaInfo: {
    flex: 1,
  },
  categoriaTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoriaDescripcion: {
    fontSize: 14,
  },
  preguntasContainer: {
    flex: 1,
  },
  preguntasHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  preguntasTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
  },
  preguntasList: {
    flex: 1,
  },
  preguntaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  preguntaTexto: {
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
  },
  soporteContainer: {
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soporteTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  soporteDescripcion: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  soporteButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  soporteButtonTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 300,
    marginBottom: 20,
  },
  respuestaTexto: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 15,
  },
  contactarButton: {
    backgroundColor: "#2A9D8F",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contactarTexto: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default HelpScreen;
