import React, { useState, useEffect, useCallback } from "react";
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
import { useTheme } from "../context/ThemeContext";
import { API_ENDPOINTS } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MisEstadisticasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emprendimiento } = route.params;
  const { width } = useWindowDimensions();
  const { currentTheme } = useTheme();

  // Estados
  const [periodo, setPeriodo] = useState("año");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [labels, setLabels] = useState([]);
  const [visualizaciones, setVisualizaciones] = useState([]);
  const [contactos, setContactos] = useState([]);
  
  // Estados para datos dinámicos
  const [datosPedidos, setDatosPedidos] = useState({});
  const [datosCalificaciones, setDatosCalificaciones] = useState({
    calificacionGeneral: 0,
    totalVotantes: 0,
    criterios: {
      precio: { promedio: 0},
      calidad: { promedio: 0},
      servicio: { promedio: 0},
      tiempoEntrega: { promedio: 0}
    }
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);

  // Función para cargar estadísticas del backend
  const cargarEstadisticas = useCallback(async () => {
    try {
      setCargandoEstadisticas(true);
      console.log('📊 Cargando estadísticas del emprendimiento:', emprendimiento.id);
      
      const token = await AsyncStorage.getItem('token');
      const url = API_ENDPOINTS.ESTADISTICAS_EMPRENDIMIENTO(emprendimiento.id);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('✅ Estadísticas cargadas:', data);
      
      if (response.ok && data.estadisticas) {
        const { calificaciones, pedidos, visualizaciones, pedidos_grafico } = data.estadisticas;
        
        console.log('📊 Visualizaciones recibidas:', visualizaciones);
        console.log('📊 Pedidos gráfico recibidos:', pedidos_grafico);
        
        // Actualizar calificaciones
        setDatosCalificaciones({
          calificacionGeneral: calificaciones.calificacion_promedio || 0,
          totalVotantes: calificaciones.total_calificaciones || 0,
          criterios: {
            precio: { promedio: calificaciones.precio_promedio || 0 },
            calidad: { promedio: calificaciones.calidad_promedio || 0 },
            servicio: { promedio: calificaciones.servicio_promedio || 0 },
            tiempoEntrega: { promedio: calificaciones.tiempo_entrega_promedio || 0 }
          }
        });
        
        // Actualizar datos de pedidos según el período actual
        const pedidosPorPeriodo = {
          totalPedidos: pedidos.total || 0,
          montoTotal: pedidos.monto_total || 0,
          promedioPedido: pedidos.promedio_pedido || 0,
          pedidosPeriodo: pedidos.por_periodo[periodo].pedidos || 0,
          montoPeriodo: pedidos.por_periodo[periodo].monto || 0
        };
        
        setDatosPedidos(pedidosPorPeriodo);
        
        // Actualizar arrays de visualizaciones y pedidos para el gráfico
        const visualizacionesArray = visualizaciones[periodo] || [];
        const pedidosArray = pedidos_grafico[periodo] || [];
        
        console.log(`📊 Visualizaciones para período ${periodo}:`, visualizacionesArray);
        console.log(`📊 Pedidos para período ${periodo}:`, pedidosArray);
        
        // Actualizar los estados con los datos del backend (pueden estar vacíos si no hay datos)
        setVisualizaciones(visualizacionesArray);
        setContactos(pedidosArray);
        
        console.log('✅ Datos de pedidos y calificaciones actualizados');
      }
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
    } finally {
      setCargandoEstadisticas(false);
    }
  }, [emprendimiento.id, periodo]);

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

  // Efecto para cargar estadísticas al montar el componente
  useEffect(() => {
    if (emprendimiento?.id) {
      cargarEstadisticas();
    }
  }, [emprendimiento?.id, cargarEstadisticas]);

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
            
            // Calcular agrupación: 30 días divididos en 5 puntos = 6 días por punto
            const agrupacion = 6; // Fijo: 6 días por punto
            
            nuevosLabels = Array.from({ length: puntosDeseados }, (_, i) => {
              const fechaInicio = new Date();
              fechaInicio.setDate(hoy.getDate() - diasAMostrar + 1 + (i * agrupacion));
              
              const fechaFin = new Date(fechaInicio);
              fechaFin.setDate(fechaInicio.getDate() + agrupacion - 1);
              
              // Formato "3-8 Mar"
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
    
    // Cargar datos reales desde el backend
    if (emprendimiento?.id) {
      cargarEstadisticas();
    }
  }, [periodo, emprendimiento?.id, cargarEstadisticas]);

  // Configuración segura del gráfico
  const chartConfig = {
    backgroundColor: currentTheme.primary,
    backgroundGradientFrom: currentTheme.primary,
    backgroundGradientTo: currentTheme.secondary,
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
    legend: ["Visualizaciones", "Pedidos"],
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

  // Función para formatear montos
  const formatearMonto = (monto) => {
    return `$${monto.toLocaleString('es-CL')}`;
  };

  // Función para renderizar estrellas
  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionRedondeada = Math.round(calificacion * 2) / 2; // Redondear a 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(calificacionRedondeada)) {
        // Estrella completa
        estrellas.push(
          <FontAwesome key={i} name="star" size={16} color="#FFD700" />
        );
      } else if (i - 0.5 <= calificacionRedondeada && calificacionRedondeada < i) {
        // Media estrella
        estrellas.push(
          <FontAwesome key={i} name="star-half-o" size={16} color="#FFD700" />
        );
      } else {
        // Estrella vacía
        estrellas.push(
          <FontAwesome key={i} name="star-o" size={16} color="#DDD" />
        );
      }
    }
    
    return estrellas;
  };

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={[currentTheme.primary, currentTheme.secondary]}
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
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Selector de período */}
        <View style={styles.periodoContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>Periodo de análisis</Text>
          <View style={styles.periodoButtons}>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "año" && [styles.periodoButtonActive, { backgroundColor: currentTheme.primary }]]}
              onPress={() => setPeriodo("año")}
            >
              <Text style={[styles.periodoButtonText, periodo === "año" && styles.periodoButtonTextActive, { color: periodo === "año" ? "white" : currentTheme.text }]}>Año</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "mes" && [styles.periodoButtonActive, { backgroundColor: currentTheme.primary }]]}
              onPress={() => setPeriodo("mes")}
            >
              <Text style={[styles.periodoButtonText, periodo === "mes" && styles.periodoButtonTextActive, { color: periodo === "mes" ? "white" : currentTheme.text }]}>Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "semana" && [styles.periodoButtonActive, { backgroundColor: currentTheme.primary }]]}
              onPress={() => setPeriodo("semana")}
            >
              <Text style={[styles.periodoButtonText, periodo === "semana" && styles.periodoButtonTextActive, { color: periodo === "semana" ? "white" : currentTheme.text }]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodoButton, periodo === "dia" && [styles.periodoButtonActive, { backgroundColor: currentTheme.primary }]]}
              onPress={() => setPeriodo("dia")}
            >
              <Text style={[styles.periodoButtonText, periodo === "dia" && styles.periodoButtonTextActive, { color: periodo === "dia" ? "white" : currentTheme.text }]}>Día</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.rangoFechas, { color: currentTheme.textSecondary }]}>
            {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
          </Text>
        </View>

        {/* Gráfico */}
        <View style={[styles.chartContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>Evolución de interacciones</Text>
          {visualizaciones.length > 0 && contactos.length > 0 && (
            <>
              {(() => {
                try {
                  return (
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
                  );
                } catch (error) {
                  console.log("Error en gráfico:", error);
                  return (
                    <View style={additionalStyles.simpleChart}>
                      <Text style={additionalStyles.chartTitle}>Gráfico no disponible</Text>
                      <Text style={additionalStyles.chartSubtitle}>Datos: {visualizaciones.reduce((a, b) => a + b, 0)} visualizaciones</Text>
                      <View style={additionalStyles.statsGrid}>
                        <View style={additionalStyles.statItem}>
                          <Text style={additionalStyles.statNumber}>{visualizaciones.reduce((a, b) => a + b, 0)}</Text>
                          <Text style={additionalStyles.statLabel}>Visualizaciones</Text>
                        </View>
                        <View style={additionalStyles.statItem}>
                          <Text style={additionalStyles.statNumber}>{contactos.reduce((a, b) => a + b, 0)}</Text>
                          <Text style={additionalStyles.statLabel}>Pedidos</Text>
                        </View>
                      </View>
                    </View>
                  );
                }
              })()}
            </>
          )}
        </View>

        {/* Resumen de estadísticas */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>Resumen</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: currentTheme.primary }]}>
              <Text style={styles.statValue}>{totalVisualizaciones}</Text>
              <Text style={styles.statLabel}>Visualizaciones</Text>
              <FontAwesome name="eye" size={20} color="rgba(255,255,255,0.7)" style={styles.statIcon} />
            </View>
            <View style={[styles.statCard, { backgroundColor: "#F4A261" }]}>
              <Text style={styles.statValue}>{totalContactos}</Text>
              <Text style={styles.statLabel}>Pedidos</Text>
              <FontAwesome name="shopping-cart" size={20} color="rgba(255,255,255,0.7)" style={styles.statIcon} />
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

        {/* Sección de Pedidos */}
        <View style={styles.pedidosContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>💰 Información de Pedidos</Text>
          <View style={styles.pedidosGrid}>
            <View style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="shopping-cart" size={24} color={currentTheme.primary} style={styles.pedidoIcon} />
              <Text style={[styles.pedidoValue, { color: currentTheme.primary }]}>{datosPedidos.totalPedidos || 0}</Text>
              <Text style={[styles.pedidoLabel, { color: currentTheme.textSecondary }]}>Total Pedidos</Text>
            </View>
            <View style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="dollar" size={24} color="#F4A261" style={styles.pedidoIcon} />
              <Text style={[styles.pedidoValue, { color: currentTheme.primary }]}>{formatearMonto(datosPedidos.montoTotal || 0)}</Text>
              <Text style={[styles.pedidoLabel, { color: currentTheme.textSecondary }]}>Monto Total</Text>
            </View>
          </View>
          <View style={styles.pedidosGrid}>
            <View style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="calculator" size={24} color="#E76F51" style={styles.pedidoIcon} />
              <Text style={[styles.pedidoValue, { color: currentTheme.primary }]}>{formatearMonto(datosPedidos.promedioPedido || 0)}</Text>
              <Text style={[styles.pedidoLabel, { color: currentTheme.textSecondary }]}>Promedio por Pedido</Text>
            </View>
            <View style={[styles.pedidoCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="calendar" size={24} color="#9C27B0" style={styles.pedidoIcon} />
              <Text style={[styles.pedidoValue, { color: currentTheme.primary }]}>{datosPedidos.pedidosPeriodo || 0}</Text>
              <Text style={[styles.pedidoLabel, { color: currentTheme.textSecondary }]}>
                Pedidos este {periodo === 'año' ? 'Año' : periodo === 'mes' ? 'Mes' : periodo === 'semana' ? 'Semana' : 'Día'}
              </Text>
            </View>
          </View>
          <View style={styles.pedidosGrid}>
            <View style={[styles.pedidoCard, { flex: 1, backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="line-chart" size={24} color="#4CAF50" style={styles.pedidoIcon} />
              <Text style={[styles.pedidoValue, { color: currentTheme.primary }]}>{formatearMonto(datosPedidos.montoPeriodo || 0)}</Text>
              <Text style={[styles.pedidoLabel, { color: currentTheme.textSecondary }]}>
                Monto del {periodo === 'año' ? 'Año' : periodo === 'mes' ? 'Mes' : periodo === 'semana' ? 'Semana' : 'Día'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de Calificaciones */}
        <View style={styles.calificacionesContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>⭐ Calificaciones de Clientes</Text>
          
          {/* Calificación General */}
          <View style={[styles.calificacionGeneralCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            <View style={styles.calificacionGeneralHeader}>
              <Text style={[styles.calificacionGeneralTitulo, { color: currentTheme.text }]}>Calificación General</Text>
              <Text style={[styles.calificacionGeneralVotantes, { color: currentTheme.textSecondary }]}>({datosCalificaciones.totalVotantes} votos)</Text>
            </View>
            <View style={styles.calificacionGeneralContent}>
              <View style={styles.estrellasContainer}>
                {renderEstrellas(datosCalificaciones.calificacionGeneral)}
              </View>
              <Text style={[styles.calificacionGeneralNumero, { color: currentTheme.primary }]}>
                {datosCalificaciones.calificacionGeneral.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Criterios Individuales */}
          <View style={[styles.criteriosContainer, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
            <Text style={[styles.criteriosTitulo, { color: currentTheme.text }]}>Calificación por Criterios</Text>
            
            <View style={styles.criterioItem}>
              <View style={styles.criterioInfo}>
                <Text style={[styles.criterioLabel, { color: currentTheme.text }]}>💰 Precio</Text>
              </View>
              <View style={styles.criterioCalificacion}>
                <View style={styles.estrellasContainer}>
                  {renderEstrellas(datosCalificaciones.criterios.precio.promedio)}
                </View>
                <Text style={[styles.criterioNumero, { color: currentTheme.primary }]}>
                  {datosCalificaciones.criterios.precio.promedio.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.criterioItem}>
              <View style={styles.criterioInfo}>
                <Text style={[styles.criterioLabel, { color: currentTheme.text }]}>⭐ Calidad</Text>
              </View>
              <View style={styles.criterioCalificacion}>
                <View style={styles.estrellasContainer}>
                  {renderEstrellas(datosCalificaciones.criterios.calidad.promedio)}
                </View>
                <Text style={[styles.criterioNumero, { color: currentTheme.primary }]}>
                  {datosCalificaciones.criterios.calidad.promedio.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.criterioItem}>
              <View style={styles.criterioInfo}>
                <Text style={[styles.criterioLabel, { color: currentTheme.text }]}>👥 Servicio al Cliente</Text>
              </View>
              <View style={styles.criterioCalificacion}>
                <View style={styles.estrellasContainer}>
                  {renderEstrellas(datosCalificaciones.criterios.servicio.promedio)}
                </View>
                <Text style={[styles.criterioNumero, { color: currentTheme.primary }]}>
                  {datosCalificaciones.criterios.servicio.promedio.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.criterioItem}>
              <View style={styles.criterioInfo}>
                <Text style={[styles.criterioLabel, { color: currentTheme.text }]}>⏰ Tiempo de Entrega</Text>
              </View>
              <View style={styles.criterioCalificacion}>
                <View style={styles.estrellasContainer}>
                  {renderEstrellas(datosCalificaciones.criterios.tiempoEntrega.promedio)}
                </View>
                <Text style={[styles.criterioNumero, { color: currentTheme.primary }]}>
                  {datosCalificaciones.criterios.tiempoEntrega.promedio.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Consejos basados en estadísticas */}
        <View style={styles.tipsContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.primary }]}>Consejos para mejorar</Text>
          
          {/* Consejos basados en tasa de conversión */}
          {parseFloat(tasaConversion) < 5 ? (
            <View style={[styles.tipCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="exclamation-circle" size={20} color="#E76F51" style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                Tu tasa de conversión es baja. Considera mejorar la descripción de tu emprendimiento o agregar más fotos atractivas.
              </Text>
            </View>
          ) : (
            <View style={[styles.tipCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="check-circle" size={20} color={currentTheme.primary} style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                ¡Buen trabajo! Tu tasa de conversión es saludable. Sigue así o prueba pequeñas mejoras para aumentar aún más.
              </Text>
            </View>
          )}
          
          {/* Consejos basados en horarios */}
          {periodo === "dia" && visualizaciones.slice(6, 8).some(v => v > 0) && (
            <View style={[styles.tipCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
              <FontAwesome name="lightbulb-o" size={20} color="#F4A261" style={styles.tipIcon} />
              <Text style={[styles.tipText, { color: currentTheme.text }]}>
                Tienes visitas en horario nocturno. Considera extender tu horario de atención si es posible.
              </Text>
            </View>
          )}

          {/* Consejos inteligentes basados en calificaciones */}
          {(() => {
            const calGeneral = datosCalificaciones.calificacionGeneral;
            const criterios = datosCalificaciones.criterios;
            
            // Encontrar el criterio más bajo y más alto
            const criteriosArray = Object.entries(criterios);
            const criterioMasBajo = criteriosArray.reduce((min, [key, value]) => 
              value.promedio < min.promedio ? { key, ...value } : min, 
              { promedio: 5, key: '' }
            );
            const criterioMasAlto = criteriosArray.reduce((max, [key, value]) => 
              value.promedio > max.promedio ? { key, ...value } : max, 
              { promedio: 0, key: '' }
            );
            
            const consejos = [];
            
            // Rango 1-2: Muy malo
            if (calGeneral >= 1 && calGeneral < 2.5) {
              consejos.push({
                icon: "exclamation-triangle",
                color: "#E76F51",
                text: `Tu calificación general es muy baja (${calGeneral.toFixed(1)}/5). Necesitas una revisión completa de todos los aspectos de tu negocio. Enfócate especialmente en ${criterioMasBajo.key === 'precio' ? 'precios más competitivos' : criterioMasBajo.key === 'calidad' ? 'mejorar la calidad de tus productos/servicios' : criterioMasBajo.key === 'servicio' ? 'mejorar la atención al cliente' : 'optimizar los tiempos de entrega'}.`
              });
            }
            
            // Rango 2.5-3.5: Malo
            else if (calGeneral >= 2.5 && calGeneral < 3.5) {
              consejos.push({
                icon: "warning",
                color: "#F4A261",
                text: `Tu calificación general necesita mejoras (${calGeneral.toFixed(1)}/5). Trabaja en mejorar la experiencia general del cliente. Tu punto más débil es ${criterioMasBajo.key === 'precio' ? 'el precio' : criterioMasBajo.key === 'calidad' ? 'la calidad' : criterioMasBajo.key === 'servicio' ? 'el servicio al cliente' : 'el tiempo de entrega'}.`
              });
            }
            
            // Rango 3.5-4.0: Regular
            else if (calGeneral >= 3.5 && calGeneral < 4.0) {
              consejos.push({
                icon: "info-circle",
                color: "#2A9D8F",
                text: `Tienes una calificación decente (${calGeneral.toFixed(1)}/5). Estás en el camino correcto, pero hay espacio para mejorar. Enfócate en ${criterioMasBajo.key === 'precio' ? 'comunicar mejor el valor de tus productos' : criterioMasBajo.key === 'calidad' ? 'mantener la consistencia en la calidad' : criterioMasBajo.key === 'servicio' ? 'ser más proactivo en la atención' : 'optimizar tus procesos de entrega'}.`
              });
            }
            
            // Rango 4.0-4.3: Bueno
            else if (calGeneral >= 4.0 && calGeneral < 4.3) {
              consejos.push({
                icon: "thumbs-up",
                color: "#2A9D8F",
                text: `Tienes buenas calificaciones (${calGeneral.toFixed(1)}/5). Sigue manteniendo la calidad y considera pequeñas mejoras para llegar al siguiente nivel.`
              });
            }
            
            // Rango 4.3-4.7: Muy bueno
            else if (calGeneral >= 4.3 && calGeneral < 4.7) {
              consejos.push({
                icon: "star",
                color: "#4CAF50",
                text: `¡Excelente trabajo! Tu calificación es muy buena (${calGeneral.toFixed(1)}/5). Mantén este nivel y considera usar tus fortalezas en marketing.`
              });
              
              // Destacar fortaleza específica si es notablemente alta
              if (criterioMasAlto.promedio >= 4.5 && criterioMasAlto.promedio > calGeneral + 0.3) {
                consejos.push({
                  icon: "trophy",
                  color: "#FFD700",
                  text: `Tu punto fuerte es ${criterioMasAlto.key === 'precio' ? 'los precios competitivos' : criterioMasAlto.key === 'calidad' ? 'la calidad excepcional' : criterioMasAlto.key === 'servicio' ? 'el servicio al cliente' : 'la puntualidad en entregas'} (${criterioMasAlto.promedio.toFixed(1)}/5). Úsalo como diferenciador.`
                });
              }
            }
            
            // Rango 4.7-5.0: Excepcional
            else if (calGeneral >= 4.7) {
              consejos.push({
                icon: "star",
                color: "#FFD700",
                text: `¡Felicitaciones! Tienes calificaciones excepcionales (${calGeneral.toFixed(1)}/5). Eres un ejemplo a seguir. Considera pedir a tus clientes satisfechos que te recomienden.`
              });
            }
            
            // Destacar debilidad específica si es notablemente baja
            if (criterioMasBajo.promedio < calGeneral - 0.5 && criterioMasBajo.promedio < 4.0) {
              consejos.push({
                icon: "exclamation-circle",
                color: "#E76F51",
                text: `Atención especial: Tu ${criterioMasBajo.key === 'precio' ? 'precio' : criterioMasBajo.key === 'calidad' ? 'calidad' : criterioMasBajo.key === 'servicio' ? 'servicio al cliente' : 'tiempo de entrega'} está por debajo del promedio (${criterioMasBajo.promedio.toFixed(1)}/5). Enfócate en mejorar este aspecto específico.`
              });
            }
            
            return consejos.map((consejo, index) => (
              <View key={index} style={[styles.tipCard, { backgroundColor: currentTheme.cardBackground, shadowColor: currentTheme.shadow }]}>
                <FontAwesome name={consejo.icon} size={20} color={consejo.color} style={styles.tipIcon} />
                <Text style={[styles.tipText, { color: currentTheme.text }]}>{consejo.text}</Text>
              </View>
            ));
          })()}
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
    paddingBottom: 130, // Espacio para la barra inferior
  },
  scrollContent: {
    paddingBottom: 150, // Espacio para la barra inferior + margen extra
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
    backgroundColor: "#f0f0f0", // Fondo por defecto, se sobrescribe con el tema cuando está activo
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
  // Estilos para la sección de pedidos
  pedidosContainer: {
    marginBottom: 20,
  },
  pedidosGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  pedidoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoIcon: {
    marginBottom: 8,
  },
  pedidoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A9D8F",
    marginBottom: 4,
  },
  pedidoLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  // Estilos para la sección de calificaciones
  calificacionesContainer: {
    marginBottom: 20,
  },
  calificacionGeneralCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calificacionGeneralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  calificacionGeneralTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  calificacionGeneralVotantes: {
    fontSize: 14,
    color: "#666",
  },
  calificacionGeneralContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  estrellasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  calificacionGeneralNumero: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  criteriosContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriosTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  criterioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Se mantiene para consistencia visual
  },
  criterioInfo: {
    flex: 1,
  },
  criterioLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  criterioVotantes: {
    fontSize: 12,
    color: "#666",
  },
  criterioCalificacion: {
    flexDirection: "row",
    alignItems: "center",
  },
  criterioNumero: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A9D8F",
    marginLeft: 8,
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

// Estilos adicionales para gráfico simplificado
const additionalStyles = StyleSheet.create({
  simpleChart: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A9D8F",
    marginBottom: 5,
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A9D8F",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
});

export default MisEstadisticasScreen;