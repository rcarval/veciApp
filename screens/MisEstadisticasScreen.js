import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { API_ENDPOINTS } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingVeciApp from "../components/LoadingVeciApp";

const MisEstadisticasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emprendimiento } = route.params;
  const { currentTheme } = useTheme();

  // Estados
  const [periodo, setPeriodo] = useState("mes");
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);

  // Función para cargar estadísticas avanzadas
  const cargarEstadisticas = useCallback(async () => {
    try {
      setCargando(true);
      console.log('📊 Cargando estadísticas avanzadas:', emprendimiento.id, periodo);
      
      const token = await AsyncStorage.getItem('token');
      const url = API_ENDPOINTS.ESTADISTICAS_AVANZADAS(emprendimiento.id, periodo);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('✅ Estadísticas avanzadas cargadas:', data);
      
      if (response.ok && data.estadisticas) {
        setEstadisticas(data.estadisticas);
        setInsights(data.insights || []);
        setRecomendaciones(data.recomendaciones || []);
      }
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
    } finally {
      setCargando(false);
    }
  }, [emprendimiento.id, periodo]);

  // Cargar estadísticas cuando cambia el período
  useEffect(() => {
    if (emprendimiento?.id) {
      cargarEstadisticas();
    }
  }, [emprendimiento?.id, periodo, cargarEstadisticas]);

  // Función para formatear montos
  const formatearMonto = (monto) => {
    if (!monto) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL', { useGrouping: true }).replace(/,/g, '.')}`;
  };

  // Obtener ícono según tipo de insight
  const getInsightIcon = (tipo) => {
    switch (tipo) {
      case 'alerta': return 'warning';
      case 'advertencia': return 'alert-circle';
      case 'info': return 'information-circle';
      case 'exito': return 'checkmark-circle';
      default: return 'bulb';
    }
  };

  // Obtener color según tipo de insight
  const getInsightColor = (tipo) => {
    switch (tipo) {
      case 'alerta': return '#e74c3c';
      case 'advertencia': return '#f39c12';
      case 'info': return '#3498db';
      case 'exito': return '#27ae60';
      default: return '#2A9D8F';
    }
  };

  if (cargando) {
    return (
      <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
        <LinearGradient
          colors={['#2A9D8F', '#1a7a6e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
              <View style={styles.headerIconContainer}>
                <Ionicons name="stats-chart" size={28} color="white" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.tituloPrincipal}>Estadísticas</Text>
                <Text style={styles.subtituloPrincipal} numberOfLines={1}>
                  {emprendimiento.nombre}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <LoadingVeciApp size={120} color={currentTheme.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.textSecondary, marginTop: 30 }]}>
            Analizando datos...
          </Text>
        </View>
      </View>
    );
  }

  if (!estadisticas) {
    return (
      <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
        <LinearGradient
          colors={['#2A9D8F', '#1a7a6e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
              <View style={styles.headerIconContainer}>
                <Ionicons name="stats-chart" size={28} color="white" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.tituloPrincipal}>Estadísticas</Text>
                <Text style={styles.subtituloPrincipal} numberOfLines={1}>
                  {emprendimiento.nombre}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={cargarEstadisticas}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { rendimiento, productos, rechazos, horarios_pico, clientes, visualizaciones } = estadisticas;

  return (
    <View style={[styles.containerMaster, { backgroundColor: currentTheme.background }]}>
      {/* Header Moderno */}
      <LinearGradient
        colors={['#2A9D8F', '#1a7a6e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <View style={styles.headerIconContainer}>
              <Ionicons name="stats-chart" size={28} color="white" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.tituloPrincipal}>Estadísticas</Text>
              <Text style={styles.subtituloPrincipal} numberOfLines={1}>
                {emprendimiento.nombre}
              </Text>
            </View>
          </View>
        </View>

        {/* Selector de Período */}
        <View style={styles.periodoContainer}>
          {['dia', 'semana', 'mes', 'año'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodoButton,
                periodo === p && styles.periodoButtonActive
              ]}
              onPress={() => setPeriodo(p)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.periodoButtonText,
                periodo === p && styles.periodoButtonTextActive
              ]}>
                {p === 'dia' ? 'Día' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : 'Año'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs Principales */}
        <View style={styles.kpisContainer}>
          <View style={styles.kpiRow}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.kpiCard, { flex: 1.2 }]}
            >
              <Ionicons name="cart" size={24} color="white" style={styles.kpiIcon} />
              <Text style={styles.kpiValue}>{rendimiento.total_pedidos}</Text>
              <Text style={styles.kpiLabel}>Pedidos</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#f39c12', '#e67e22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.kpiCard, { flex: 1 }]}
            >
              <Ionicons name="cash" size={24} color="white" style={styles.kpiIcon} />
              <Text style={styles.kpiValue}>{formatearMonto(rendimiento.ingresos_totales)}</Text>
              <Text style={styles.kpiLabel}>Ingresos</Text>
            </LinearGradient>
          </View>

          <View style={styles.kpiRow}>
            <LinearGradient
              colors={rendimiento.tasa_exito >= 85 ? ['#27ae60', '#229954'] : ['#e74c3c', '#c0392b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.kpiCard, { flex: 1 }]}
            >
              <Ionicons 
                name={rendimiento.tasa_exito >= 85 ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color="white" 
                style={styles.kpiIcon} 
              />
              <Text style={styles.kpiValue}>{rendimiento.tasa_exito}%</Text>
              <Text style={styles.kpiLabel}>Éxito</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#3498db', '#2980b9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.kpiCard, { flex: 1 }]}
            >
              <Ionicons name="people" size={24} color="white" style={styles.kpiIcon} />
              <Text style={styles.kpiValue}>{clientes.clientes_unicos}</Text>
              <Text style={styles.kpiLabel}>Clientes</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#9b59b6', '#8e44ad']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.kpiCard, { flex: 1 }]}
            >
              <Ionicons name="eye" size={24} color="white" style={styles.kpiIcon} />
              <Text style={styles.kpiValue}>{visualizaciones.total_periodo}</Text>
              <Text style={styles.kpiLabel}>Visitas</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Insights Automáticos */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color="#2A9D8F" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Análisis Automático
              </Text>
            </View>

            {insights.map((insight, index) => (
              <View 
                key={index} 
                style={[
                  styles.insightCard,
                  { 
                    backgroundColor: currentTheme.cardBackground,
                    borderLeftColor: getInsightColor(insight.tipo)
                  }
                ]}
              >
                <View style={[
                  styles.insightIconContainer,
                  { backgroundColor: getInsightColor(insight.tipo) + '20' }
                ]}>
                  <Ionicons 
                    name={getInsightIcon(insight.tipo)} 
                    size={20} 
                    color={getInsightColor(insight.tipo)} 
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitulo, { color: currentTheme.text }]}>
                    {insight.titulo}
                  </Text>
                  <Text style={[styles.insightDescripcion, { color: currentTheme.textSecondary }]}>
                    {insight.descripcion}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recomendaciones */}
        {recomendaciones.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="rocket" size={20} color="#2A9D8F" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Recomendaciones
              </Text>
            </View>

            {recomendaciones.map((rec, index) => (
              <View 
                key={index} 
                style={[styles.recomendacionCard, { backgroundColor: currentTheme.cardBackground }]}
              >
                <View style={styles.recomendacionIcono}>
                  <Ionicons name="checkmark" size={16} color="#2A9D8F" />
                </View>
                <Text style={[styles.recomendacionTexto, { color: currentTheme.text }]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Estadísticas Detalladas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={20} color="#2A9D8F" />
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Rendimiento Detallado
            </Text>
          </View>

          <View style={styles.detailGrid}>
            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#27ae60' + '20' }]}>
                <Ionicons name="checkmark-done" size={20} color="#27ae60" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {rendimiento.pedidos_entregados}
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                Entregados
              </Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#e74c3c' + '20' }]}>
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {rendimiento.pedidos_rechazados}
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                Rechazados
              </Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#95a5a6' + '20' }]}>
                <Ionicons name="ban" size={20} color="#95a5a6" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {rendimiento.pedidos_cancelados}
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                Cancelados
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#f39c12' + '20' }]}>
                <Ionicons name="calculator" size={20} color="#f39c12" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {formatearMonto(rendimiento.ticket_promedio)}
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                Ticket Promedio
              </Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#3498db' + '20' }]}>
                <Ionicons name="time" size={20} color="#3498db" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {Math.round(rendimiento.tiempo_entrega_promedio || 0)}'
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                Tiempo Entrega
              </Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.detailIconContainer, { backgroundColor: '#9b59b6' + '20' }]}>
                <Ionicons name="speedometer" size={20} color="#9b59b6" />
              </View>
              <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                {rendimiento.cumplimiento_tiempo}%
              </Text>
              <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                A Tiempo
              </Text>
            </View>
          </View>
        </View>

        {/* Análisis de Tiempos de Entrega */}
        {rendimiento.cumplimiento_tiempo > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="timer" size={20} color="#3498db" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Análisis de Tiempos de Entrega
              </Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
                <View style={[styles.detailIconContainer, { backgroundColor: '#3498db' + '20' }]}>
                  <Ionicons name="hourglass" size={20} color="#3498db" />
                </View>
                <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                  {Math.round(rendimiento.tiempo_comprometido_promedio || 0)}'
                </Text>
                <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                  Tiempo Prometido
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
                <View style={[styles.detailIconContainer, { backgroundColor: rendimiento.diferencia_tiempo_promedio <= 0 ? '#27ae60' + '20' : '#e74c3c' + '20' }]}>
                  <Ionicons name="stopwatch" size={20} color={rendimiento.diferencia_tiempo_promedio <= 0 ? '#27ae60' : '#e74c3c'} />
                </View>
                <Text style={[styles.detailValue, { color: currentTheme.text }]}>
                  {Math.round(rendimiento.tiempo_real_promedio || 0)}'
                </Text>
                <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                  Tiempo Real
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: currentTheme.cardBackground }]}>
                <View style={[styles.detailIconContainer, { backgroundColor: rendimiento.diferencia_tiempo_promedio <= 0 ? '#27ae60' + '20' : '#e74c3c' + '20' }]}>
                  <Ionicons 
                    name={rendimiento.diferencia_tiempo_promedio <= 0 ? "arrow-down" : "arrow-up"} 
                    size={20} 
                    color={rendimiento.diferencia_tiempo_promedio <= 0 ? '#27ae60' : '#e74c3c'} 
                  />
                </View>
                <Text style={[styles.detailValue, { color: rendimiento.diferencia_tiempo_promedio <= 0 ? '#27ae60' : '#e74c3c' }]}>
                  {rendimiento.diferencia_tiempo_promedio > 0 ? '+' : ''}{Math.round(rendimiento.diferencia_tiempo_promedio || 0)}'
                </Text>
                <Text style={[styles.detailLabel, { color: currentTheme.textSecondary }]}>
                  Diferencia
                </Text>
              </View>
            </View>

            {rendimiento.diferencia_tiempo_promedio > 0 && (
              <View style={[styles.infoBox, { backgroundColor: '#e74c3c' + '15', borderLeftColor: '#e74c3c' }]}>
                <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                <Text style={[styles.infoBoxText, { color: '#c0392b' }]}>
                  En promedio te estás tardando {Math.round(Math.abs(rendimiento.diferencia_tiempo_promedio))} minutos más de lo prometido. Considera aumentar el tiempo de entrega comprometido.
                </Text>
              </View>
            )}
            {rendimiento.diferencia_tiempo_promedio <= 0 && (
              <View style={[styles.infoBox, { backgroundColor: '#27ae60' + '15', borderLeftColor: '#27ae60' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
                <Text style={[styles.infoBoxText, { color: '#229954' }]}>
                  ¡Excelente! Estás cumpliendo o superando los tiempos prometidos. {rendimiento.cumplimiento_tiempo}% de entregas a tiempo.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Productos Top */}
        {productos.top_vendidos && productos.top_vendidos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#2A9D8F" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Productos Más Vendidos
              </Text>
            </View>

            {productos.top_vendidos.slice(0, 5).map((producto, index) => (
              <View 
                key={index}
                style={[styles.productoCard, { backgroundColor: currentTheme.cardBackground }]}
              >
                <View style={styles.productoRank}>
                  <LinearGradient
                    colors={index === 0 ? ['#f39c12', '#e67e22'] : index === 1 ? ['#95a5a6', '#7f8c8d'] : ['#cd7f32', '#b36b28']}
                    style={styles.rankBadge}
                  >
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </LinearGradient>
                </View>
                <View style={styles.productoInfo}>
                  <Text style={[styles.productoNombre, { color: currentTheme.text }]} numberOfLines={1}>
                    {producto.nombre}
                  </Text>
                  <View style={styles.productoStats}>
                    <Text style={[styles.productoStat, { color: currentTheme.textSecondary }]}>
                      {producto.cantidad_vendida} vendidos
                    </Text>
                    <Text style={[styles.productoStat, { color: '#2A9D8F', fontWeight: '700' }]}>
                      {formatearMonto(producto.ingresos)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Motivos de Rechazo */}
        {rechazos.top_motivos && rechazos.top_motivos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color="#e74c3c" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Motivos de Rechazo
              </Text>
            </View>

            {rechazos.top_motivos.map((motivo, index) => (
              <View 
                key={index}
                style={[styles.motivoCard, { backgroundColor: currentTheme.cardBackground }]}
              >
                <View style={styles.motivoHeader}>
                  <Text style={[styles.motivoTexto, { color: currentTheme.text }]} numberOfLines={2}>
                    {motivo.motivo}
                  </Text>
                  <Text style={styles.motivoPorcentaje}>
                    {motivo.porcentaje}%
                  </Text>
                </View>
                <View style={styles.motivoBarraContainer}>
                  <View 
                    style={[
                      styles.motivoBarra,
                      { width: `${motivo.porcentaje}%` }
                    ]}
                  />
                </View>
                <Text style={[styles.motivoCantidad, { color: currentTheme.textSecondary }]}>
                  {motivo.cantidad} {motivo.cantidad === 1 ? 'pedido' : 'pedidos'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Horarios Pico */}
        {horarios_pico && horarios_pico.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#2A9D8F" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Horarios con Más Pedidos
              </Text>
            </View>

            {horarios_pico.slice(0, 3).map((horario, index) => (
              <View 
                key={index}
                style={[styles.horarioCard, { backgroundColor: currentTheme.cardBackground }]}
              >
                <View style={styles.horarioInfo}>
                  <Ionicons name="time-outline" size={22} color="#2A9D8F" />
                  <Text style={[styles.horarioHora, { color: currentTheme.text }]}>
                    {horario.hora}:00 hrs
                  </Text>
                </View>
                <View style={styles.horarioStats}>
                  <View style={styles.horarioStat}>
                    <Ionicons name="cart-outline" size={14} color={currentTheme.textSecondary} />
                    <Text style={[styles.horarioStatTexto, { color: currentTheme.textSecondary }]}>
                      {horario.pedidos} pedidos
                    </Text>
                  </View>
                  <Text style={[styles.horarioMonto, { color: '#2A9D8F' }]}>
                    {formatearMonto(horario.ingresos)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Clientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle" size={20} color="#2A9D8F" />
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Análisis de Clientes
            </Text>
          </View>

          <View style={[styles.clientesCard, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.clienteRow}>
              <View style={styles.clienteInfo}>
                <Ionicons name="person" size={18} color="#3498db" />
                <Text style={[styles.clienteLabel, { color: currentTheme.text }]}>
                  Clientes únicos
                </Text>
              </View>
              <Text style={[styles.clienteValue, { color: '#3498db' }]}>
                {clientes.clientes_unicos}
              </Text>
            </View>

            <View style={styles.clienteRow}>
              <View style={styles.clienteInfo}>
                <Ionicons name="repeat" size={18} color="#27ae60" />
                <Text style={[styles.clienteLabel, { color: currentTheme.text }]}>
                  Clientes recurrentes
                </Text>
              </View>
              <Text style={[styles.clienteValue, { color: '#27ae60' }]}>
                {clientes.clientes_recurrentes}
              </Text>
            </View>

            <View style={styles.clienteRow}>
              <View style={styles.clienteInfo}>
                <Ionicons name="heart" size={18} color="#e74c3c" />
                <Text style={[styles.clienteLabel, { color: currentTheme.text }]}>
                  Tasa de fidelización
                </Text>
              </View>
              <Text style={[styles.clienteValue, { color: '#e74c3c' }]}>
                {clientes.tasa_recurrencia}%
              </Text>
            </View>
          </View>
        </View>

        {/* Conversión */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color="#2A9D8F" />
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Conversión
            </Text>
          </View>

          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.conversionCard}
          >
            <Text style={styles.conversionLabel}>
              {visualizaciones.total_periodo} visitas
            </Text>
            <Ionicons name="arrow-down" size={24} color="rgba(255,255,255,0.7)" />
            <Text style={styles.conversionTasa}>
              {visualizaciones.tasa_conversion}%
            </Text>
            <Ionicons name="arrow-down" size={24} color="rgba(255,255,255,0.7)" />
            <Text style={styles.conversionLabel}>
              {rendimiento.total_pedidos} pedidos
            </Text>
          </LinearGradient>
        </View>

        {/* Productos por Categoría */}
        {productos.por_categoria && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color="#2A9D8F" />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                Productos por Categoría
              </Text>
            </View>

            <View style={[styles.categoriasContainer, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={styles.categoriaItem}>
                <View style={styles.categoriaInfo}>
                  <View style={[styles.categoriaBadge, { backgroundColor: '#667eea' + '20' }]}>
                    <Ionicons name="star" size={16} color="#667eea" />
                  </View>
                  <Text style={[styles.categoriaLabel, { color: currentTheme.text }]}>
                    Principal
                  </Text>
                </View>
                <Text style={[styles.categoriaValue, { color: '#667eea' }]}>
                  {productos.por_categoria.principal}
                </Text>
              </View>

              <View style={styles.categoriaItem}>
                <View style={styles.categoriaInfo}>
                  <View style={[styles.categoriaBadge, { backgroundColor: '#3498db' + '20' }]}>
                    <Ionicons name="cube" size={16} color="#3498db" />
                  </View>
                  <Text style={[styles.categoriaLabel, { color: currentTheme.text }]}>
                    Secundario
                  </Text>
                </View>
                <Text style={[styles.categoriaValue, { color: '#3498db' }]}>
                  {productos.por_categoria.secundario}
                </Text>
              </View>

              <View style={styles.categoriaItem}>
                <View style={styles.categoriaInfo}>
                  <View style={[styles.categoriaBadge, { backgroundColor: '#f39c12' + '20' }]}>
                    <Ionicons name="pricetag" size={16} color="#f39c12" />
                  </View>
                  <Text style={[styles.categoriaLabel, { color: currentTheme.text }]}>
                    Oferta
                  </Text>
                </View>
                <Text style={[styles.categoriaValue, { color: '#f39c12' }]}>
                  {productos.por_categoria.oferta}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerMaster: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  subtituloPrincipal: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    fontWeight: "500",
  },
  // Selector de período
  periodoContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  periodoButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  periodoButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  periodoButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  periodoButtonTextActive: {
    color: "white",
    fontWeight: "800",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#2A9D8F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 15,
    marginBottom: 25,
  },
  retryButton: {
    backgroundColor: "#2A9D8F",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150,
  },
  // Secciones
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2c3e50",
  },
  // KPIs
  kpisContainer: {
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  kpiIcon: {
    marginBottom: 6,
    opacity: 0.9,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  // Insights
  insightCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 3,
  },
  insightDescripcion: {
    fontSize: 12,
    color: "#7f8c8d",
    lineHeight: 17,
  },
  // Recomendaciones
  recomendacionCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  recomendacionIcono: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A9D8F' + '20',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  recomendacionTexto: {
    fontSize: 13,
    color: "#2c3e50",
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  // Detalles
  detailGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  detailCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    textAlign: "center",
    fontWeight: "500",
  },
  // Productos
  productoCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  productoRank: {
    marginRight: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  productoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productoStat: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  // Motivos de rechazo
  motivoCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  motivoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  motivoTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  motivoPorcentaje: {
    fontSize: 14,
    fontWeight: "800",
    color: "#e74c3c",
  },
  motivoBarraContainer: {
    height: 6,
    backgroundColor: "#ecf0f1",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  motivoBarra: {
    height: "100%",
    backgroundColor: "#e74c3c",
    borderRadius: 3,
  },
  motivoCantidad: {
    fontSize: 11,
    color: "#95a5a6",
  },
  // Horarios
  horarioCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  horarioInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  horarioHora: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  horarioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horarioStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  horarioStatTexto: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  horarioMonto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2A9D8F",
  },
  // Clientes
  clientesCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  clienteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  clienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clienteLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2c3e50",
  },
  clienteValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  // Conversión
  conversionCard: {
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  conversionLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  conversionTasa: {
    fontSize: 36,
    fontWeight: "900",
    color: "white",
    marginVertical: 8,
  },
  // Categorías
  categoriasContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  categoriaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoriaBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  categoriaValue: {
    fontSize: 16,
    fontWeight: "800",
  },
});

export default MisEstadisticasScreen;
