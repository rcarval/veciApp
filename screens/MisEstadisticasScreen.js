import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";

const MisEstadisticasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emprendimiento } = route.params;
  const { width } = useWindowDimensions();

  // Estados
  const [periodo, setPeriodo] = useState("año");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [labels, setLabels] = useState([]);
  const [visualizaciones, setVisualizaciones] = useState([0]);
  const [contactos, setContactos] = useState([0]);

  // Función para generar datos de prueba seguros
  const generarDatos = (labels, periodo) => {
    let baseVisualizaciones, baseContactos;
    
    switch(periodo) {
      case "dia":
        baseVisualizaciones = 10;
        baseContactos = 2;
        break;
      case "semana":
        baseVisualizaciones = 30;
        baseContactos = 6;
        break;
      case "mes":
        baseVisualizaciones = 20;
        baseContactos = 4;
        break;
      case "año":
      default:
        baseVisualizaciones = 50;
        baseContactos = 10;
    }
    
    const visualizaciones = labels.map((_, i) => 
      Math.max(0, Math.floor(baseVisualizaciones * (1 + Math.sin(i * 0.5)) + Math.floor(Math.random() * (baseVisualizaciones/2)))
    ));
    
    const contactos = labels.map((_, i) => 
      Math.max(0, Math.floor(baseContactos * (1 + Math.sin(i * 0.3)) + Math.floor(Math.random() * (baseContactos/2)))
    ));
    
    return { visualizaciones, contactos };
  };

  // Efecto para calcular las fechas y datos
  useEffect(() => {
    const hoy = new Date();
    let nuevosLabels = [];
    
    switch (periodo) {
      case "año":
        nuevosLabels = Array.from({ length: 12 }, (_, i) => {
          const fecha = new Date();
          fecha.setMonth(hoy.getMonth() - (11 - i));
          return fecha.toLocaleString('default', { month: 'short' });
        });
        setFechaInicio(new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate()));
        break;
        
        case "mes":
            const diasAMostrar = 30; // Últimos 30 días
            const puntosDeseados = 5; // Puntos óptimos para el gráfico
            
            // Calcular agrupación dinámica
            const agrupacion = Math.ceil(diasAMostrar / puntosDeseados); // Cada 2-3 días
            
            nuevosLabels = Array.from({ length: Math.ceil(diasAMostrar / agrupacion) }, (_, i) => {
              const fechaInicio = new Date();
              fechaInicio.setDate(hoy.getDate() - diasAMostrar + 1 + (i * agrupacion));
              
              const fechaFin = new Date(fechaInicio);
              fechaFin.setDate(fechaInicio.getDate() + agrupacion - 1);
              
              // Formato "3-5 Mar" o "28 Feb-2 Mar"
              return `${fechaInicio.getDate()} ${fechaInicio.toLocaleString('default', {month: 'short'})}`;
            });
            
            setFechaInicio(new Date(hoy.getTime() - (diasAMostrar * 24 * 60 * 60 * 1000)));
            break;
        
      case "semana":
        nuevosLabels = Array.from({ length: 7 }, (_, i) => {
          const fecha = new Date();
          fecha.setDate(hoy.getDate() - (6 - i));
          return fecha.toLocaleString('default', { weekday: 'short' });
        });
        setFechaInicio(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6));
        break;
        
      case "dia":
        nuevosLabels = Array.from({ length: 8 }, (_, i) => {
          const hora = hoy.getHours() - (7 - i) * 3;
          return `${hora > 0 ? hora : 24 + hora}:00`;
        });
        setFechaInicio(new Date(hoy.getTime() - (24 * 60 * 60 * 1000)));
        break;
    }

    setFechaFin(hoy);
    setLabels(nuevosLabels);
    
    const { visualizaciones, contactos } = generarDatos(nuevosLabels, periodo);
    setVisualizaciones(visualizaciones);
    setContactos(contactos);
  }, [periodo]);

  // Configuración segura del gráfico
  const chartConfig = {
    backgroundColor: "#2A9D8F",
    backgroundGradientFrom: "#2A9D8F",
    backgroundGradientTo: "#1D7874",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fff",
    },
    formatYLabel: (value) => {
      const num = Number(value);
      return isNaN(num) ? "0" : Math.round(num).toString();
    },
    formatXLabel: (value) => value || "",
  };

  // Datos para el gráfico
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: visualizaciones,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: contactos,
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Visualizaciones", "Contactos WhatsApp"],
  };

  // Resumen de estadísticas
  const totalVisualizaciones = visualizaciones.reduce((a, b) => a + b, 0) || 0;
  const totalContactos = contactos.reduce((a, b) => a + b, 0) || 0;
  const tasaConversion = totalContactos > 0 ? 
    ((totalContactos / totalVisualizaciones) * 100).toFixed(1) : 
    "0.0";

  // Formatear rango de fechas
  const formatearFecha = (fecha) => {
    try {
      return fecha.toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: periodo === "año" ? 'numeric' : undefined
      });
    } catch {
      return "";
    }
  };

  return (
    <View style={styles.containerMaster}>
      <LinearGradient
        colors={["#2A9D8F", "#1D7874"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.tituloPrincipal}>Estadísticas de {emprendimiento.nombre}</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Selector de período */}
        <View style={styles.periodoContainer}>
          <Text style={styles.sectionTitle}>Periodo de análisis</Text>
          <View style={styles.periodoButtons}>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "año" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("año")}
            >
              <Text style={[styles.periodoButtonText, periodo === "año" && styles.periodoButtonTextActive]}>Año</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "mes" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("mes")}
            >
              <Text style={[styles.periodoButtonText, periodo === "mes" && styles.periodoButtonTextActive]}>Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "semana" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("semana")}
            >
              <Text style={[styles.periodoButtonText, periodo === "semana" && styles.periodoButtonTextActive]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "dia" && styles.periodoButtonActive]}
              onPress={() => setPeriodo("dia")}
            >
              <Text style={[styles.periodoButtonText, periodo === "dia" && styles.periodoButtonTextActive]}>Día</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.rangoFechas}>
            {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
          </Text>
        </View>

        {/* Gráfico */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Evolución de interacciones</Text>
          {visualizaciones.length > 0 && contactos.length > 0 && (
            <LineChart
              data={chartData}
              width={width - 70}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withVerticalLines={periodo !== "dia"}
              withHorizontalLines={true}
              segments={4}
              fromZero
            />
          )}
        </View>

        {/* Resumen de estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: "#2A9D8F" }]}>
              <Text style={styles.statValue}>{totalVisualizaciones}</Text>
              <Text style={styles.statLabel}>Visualizaciones</Text>
              <FontAwesome name="eye" size={20} color="rgba(255,255,255,0.7)" style={styles.statIcon} />
            </View>
            <View style={[styles.statCard, { backgroundColor: "#F4A261" }]}>
              <Text style={styles.statValue}>{totalContactos}</Text>
              <Text style={styles.statLabel}>Contactos WhatsApp</Text>
              <FontAwesome name="whatsapp" size={20} color="rgba(255,255,255,0.7)" style={styles.statIcon} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: "#E76F51", flex: 1 }]}>
              <Text style={styles.statValue}>{tasaConversion}%</Text>
              <Text style={styles.statLabel}>Tasa de conversión</Text>
              <FontAwesome name="percent" size={20} color="rgba(255,255,255,0.7)" style={styles.statIcon} />
            </View>
          </View>
        </View>

        {/* Consejos basados en estadísticas */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Consejos para mejorar</Text>
          {parseFloat(tasaConversion) < 5 ? (
            <View style={styles.tipCard}>
              <FontAwesome name="exclamation-circle" size={20} color="#E76F51" style={styles.tipIcon} />
              <Text style={styles.tipText}>
                Tu tasa de conversión es baja. Considera mejorar la descripción de tu emprendimiento o agregar más fotos atractivas.
              </Text>
            </View>
          ) : (
            <View style={styles.tipCard}>
              <FontAwesome name="check-circle" size={20} color="#2A9D8F" style={styles.tipIcon} />
              <Text style={styles.tipText}>
                ¡Buen trabajo! Tu tasa de conversión es saludable. Sigue así o prueba pequeñas mejoras para aumentar aún más.
              </Text>
            </View>
          )}
          
          {periodo === "dia" && visualizaciones.slice(6, 8).some(v => v > 0) && (
            <View style={styles.tipCard}>
              <FontAwesome name="lightbulb-o" size={20} color="#F4A261" style={styles.tipIcon} />
              <Text style={styles.tipText}>
                Tienes visitas en horario nocturno. Considera extender tu horario de atención si es posible.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tituloPrincipal: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2A9D8F",
    marginBottom: 15,
  },
  periodoContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  periodoButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  periodoButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  periodoButtonActive: {
    backgroundColor: "#2A9D8F",
  },
  periodoButtonText: {
    color: "#555",
    fontWeight: "500",
  },
  periodoButtonTextActive: {
    color: "white",
  },
  rangoFechas: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  chartContainer: {
    marginVertical: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 8,
    marginTop: 10,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  statIcon: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tipCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  tipIcon: {
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    color: "#555",
  },
});

/**
 * 
 {
  "emprendimiento_id": "12345",
  "ultima_actualizacion": "2023-12-15T10:30:00Z",
  "datos": {
    "año": {
      "fecha_inicio": "2022-12-01",
      "fecha_fin": "2023-11-30",
      "labels": ["Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov"],
      "visualizaciones": [120, 150, 140, 160, 180, 170, 190, 200, 210, 200, 220, 230],
      "contactos": [30, 35, 32, 38, 40, 38, 42, 45, 48, 45, 50, 52]
    },
    "mes": {
      "fecha_inicio": "2023-11-01",
      "fecha_fin": "2023-11-30",
      "labels": ["1", "5", "10", "15", "20", "25", "30"],
      "visualizaciones": [45, 60, 55, 70, 65, 80, 75],
      "contactos": [10, 15, 12, 18, 16, 20, 19]
    },
    "semana": {
      "fecha_inicio": "2023-11-23",
      "fecha_fin": "2023-11-29",
      "labels": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      "visualizaciones": [30, 35, 32, 40, 45, 38, 28],
      "contactos": [8, 9, 7, 10, 12, 9, 6]
    },
    "dia": {
      "fecha_inicio": "2023-11-30T00:00:00",
      "fecha_fin": "2023-11-30T23:59:59",
      "labels": ["8:00", "11:00", "14:00", "17:00", "20:00", "23:00"],
      "visualizaciones": [15, 25, 20, 30, 35, 18],
      "contactos": [3, 5, 4, 7, 8, 4]
    }
  },
  "totales": {
    "año": {
      "visualizaciones": 2150,
      "contactos": 465,
      "tasa_conversion": 21.6
    },
    "mes": {
      "visualizaciones": 450,
      "contactos": 110,
      "tasa_conversion": 24.4
    },
    "semana": {
      "visualizaciones": 248,
      "contactos": 61,
      "tasa_conversion": 24.6
    },
    "dia": {
      "visualizaciones": 133,
      "contactos": 31,
      "tasa_conversion": 23.3
    }
  }
}

const MisEstadisticasScreen = () => {
  // ... otros estados ...
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar todos los datos al entrar a la pantalla
  useEffect(() => {
    const cargarDatosCompletos = async () => {
      try {
        setCargando(true);
        const response = await fetch(`https://tuservicio.com/api/estadisticas/${emprendimiento.id}/completo`);
        const data = await response.json();
        setDatosCompletos(data);
        
        // Inicializar con datos del año
        setLabels(data.datos.año.labels);
        setVisualizaciones(data.datos.año.visualizaciones);
        setContactos(data.datos.año.contactos);
        setFechaInicio(new Date(data.datos.año.fecha_inicio));
        setFechaFin(new Date(data.datos.año.fecha_fin));
        
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        // Manejo de errores
      } finally {
        setCargando(false);
      }
    };

    cargarDatosCompletos();
  }, [emprendimiento.id]);

  // Manejar cambio de período
  const handleCambioPeriodo = (nuevoPeriodo) => {
    if (!datosCompletos) return;
    
    setPeriodo(nuevoPeriodo);
    setLabels(datosCompletos.datos[nuevoPeriodo].labels);
    setVisualizaciones(datosCompletos.datos[nuevoPeriodo].visualizaciones);
    setContactos(datosCompletos.datos[nuevoPeriodo].contactos);
    setFechaInicio(new Date(datosCompletos.datos[nuevoPeriodo].fecha_inicio));
    setFechaFin(new Date(datosCompletos.datos[nuevoPeriodo].fecha_fin));
  };

  // Obtener totales según el período actual
  const totalVisualizaciones = datosCompletos?.totales[periodo]?.visualizaciones || 0;
  const totalContactos = datosCompletos?.totales[periodo]?.contactos || 0;
  const tasaConversion = datosCompletos?.totales[periodo]?.tasa_conversion || "0.0";

  // Render condicional mientras carga
  if (cargando) {
    return (
      <View style={styles.cargandoContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.cargandoTexto}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!datosCompletos) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTexto}>No se pudieron cargar los datos</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.botonError}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ... resto del render igual pero usando handleCambioPeriodo en los botones ...

 */

export default MisEstadisticasScreen;