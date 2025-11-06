import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { API_ENDPOINTS } from '../config/api';

const IngresarTelefonoScreen = ({ navigation, route }) => {
  const { currentTheme } = useTheme();
  const { actualizarUsuario } = useUser();
  const { onComplete } = route.params || {};
  
  const [paso, setPaso] = useState(1); // 1: ingresar teléfono, 2: verificar código
  const [telefono, setTelefono] = useState('');
  const [codigoVerificacion, setCodigoVerificacion] = useState(['', '', '', '', '', '']);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [verificacionCompletada, setVerificacionCompletada] = useState(false);
  
  const codigoInputRefs = useRef([]);

  // Bloquear navegación hacia atrás (pantalla obligatoria)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Si la verificación ya fue completada, permitir salir
      if (verificacionCompletada) {
        return;
      }
      
      // Permitir navegación si es un reset hacia Login (cerrar sesión)
      const isLogout = e.data.action?.type === 'RESET' && 
                       e.data.action?.payload?.routes?.[0]?.name === 'Login';
      
      if (isLogout) {
        console.log('🚪 Detectado cierre de sesión, permitiendo navegación');
        return; // Permitir cerrar sesión
      }
      
      // Prevenir que se cierre la pantalla si aún no se ha verificado
      e.preventDefault();
      
      Alert.alert(
        '📱 Verificación Obligatoria',
        'Debes verificar tu número de teléfono para poder realizar pedidos. Es un paso necesario para coordinar entregas.',
        [{ text: 'Entendido', style: 'default' }]
      );
    });

    return unsubscribe;
  }, [navigation, verificacionCompletada]);

  // Bloquear botón de atrás en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Si la verificación ya fue completada, permitir salir
      if (verificacionCompletada) {
        return false; // Permitir acción por defecto (volver)
      }
      
      Alert.alert(
        '📱 Verificación Obligatoria',
        'Debes verificar tu número de teléfono para poder realizar pedidos. Es un paso necesario para coordinar entregas.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return true; // Prevenir acción por defecto
    });

    return () => backHandler.remove();
  }, [verificacionCompletada]);

  // Validar formato de teléfono chileno
  const validarTelefono = (tel) => {
    const telefonoLimpio = tel.replace(/\s/g, '');
    const regex = /^(\+?56)?9\d{8}$/;
    return regex.test(telefonoLimpio);
  };

  // Formatear teléfono para mostrar
  const formatearTelefono = (tel) => {
    const limpio = tel.replace(/\D/g, '');
    if (limpio.length <= 1) return limpio;
    if (limpio.length <= 5) return `${limpio.slice(0, 1)} ${limpio.slice(1)}`;
    return `${limpio.slice(0, 1)} ${limpio.slice(1, 5)} ${limpio.slice(5, 9)}`;
  };

  const handleTelefonoChange = (text) => {
    const numeros = text.replace(/\D/g, '');
    if (numeros.length <= 9) {
      setTelefono(formatearTelefono(numeros));
    }
  };

  const enviarCodigoVerificacion = async () => {
    if (!validarTelefono(telefono)) {
      Alert.alert(
        'Teléfono Inválido',
        'Por favor ingresa un número de teléfono chileno válido (ej: 9 1234 5678)',
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      setEnviandoCodigo(true);
      const token = await AsyncStorage.getItem('token');
      
      const telefonoFormateado = telefono.replace(/\s/g, '');
      const telefonoCompleto = telefonoFormateado.startsWith('+56') 
        ? telefonoFormateado 
        : `+56${telefonoFormateado}`;

      console.log('📱 Enviando código SMS a:', telefonoCompleto);

      const response = await fetch(API_ENDPOINTS.ENVIAR_CODIGO_TELEFONO, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefono: telefonoCompleto })
      });

      const data = await response.json();

      if (data.ok) {
        console.log('✅ Código SMS enviado exitosamente');
        setCodigoEnviado(true);
        setPaso(2);
        Alert.alert(
          '📱 Código Enviado',
          'Hemos enviado un código de verificación de 6 dígitos a tu teléfono.',
          [{ text: 'Entendido' }]
        );
        // Auto-focus en el primer input
        setTimeout(() => {
          codigoInputRefs.current[0]?.focus();
        }, 500);
      } else {
        throw new Error(data.error || 'Error al enviar código');
      }
    } catch (error) {
      console.error('❌ Error al enviar código:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const verificarCodigoIngresado = async () => {
    const codigoCompleto = codigoVerificacion.join('');
    
    if (codigoCompleto.length !== 6) {
      Alert.alert('Código Incompleto', 'Por favor ingresa los 6 dígitos del código.');
      return;
    }

    try {
      setVerificandoCodigo(true);
      const token = await AsyncStorage.getItem('token');
      
      const telefonoFormateado = telefono.replace(/\s/g, '');
      const telefonoCompleto = telefonoFormateado.startsWith('+56') 
        ? telefonoFormateado 
        : `+56${telefonoFormateado}`;

      console.log('🔍 Verificando código SMS:', codigoCompleto);

      const response = await fetch(API_ENDPOINTS.VERIFICAR_CODIGO_TELEFONO, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          telefono: telefonoCompleto,
          codigo: codigoCompleto 
        })
      });

      const data = await response.json();

      if (data.ok) {
        console.log('✅ Teléfono verificado exitosamente');
        
        // Actualizar el usuario en AsyncStorage (ambos lugares)
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado);
          usuario.telefono = telefonoCompleto;
          
          // Guardar en AsyncStorage (key 'usuario')
          await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
          console.log('✅ Usuario actualizado en AsyncStorage (usuario):', usuario);
          
          // También actualizar en cachedUsuario si existe
          await AsyncStorage.setItem('cachedUsuario', JSON.stringify(usuario));
          console.log('✅ Usuario actualizado en AsyncStorage (cachedUsuario)');
          
          // Actualizar contexto de usuario inmediatamente
          if (actualizarUsuario) {
            actualizarUsuario(usuario);
            console.log('✅ Contexto de usuario actualizado');
          }
        }

        // Marcar verificación como completada ANTES de navegar
        setVerificacionCompletada(true);
        
        Alert.alert(
          '✅ Teléfono Verificado',
          'Tu número de teléfono ha sido verificado exitosamente.',
          [{ 
            text: 'Continuar',
            onPress: () => {
              if (onComplete) {
                onComplete();
              }
              // Ahora sí puede navegar hacia atrás porque verificacionCompletada = true
              navigation.goBack();
            }
          }]
        );
      } else {
        throw new Error(data.error || 'Código incorrecto');
      }
    } catch (error) {
      console.error('❌ Error al verificar código:', error);
      Alert.alert('Error', error.message || 'Código incorrecto. Inténtalo de nuevo.');
      // Limpiar inputs
      setCodigoVerificacion(['', '', '', '', '', '']);
      codigoInputRefs.current[0]?.focus();
    } finally {
      setVerificandoCodigo(false);
    }
  };

  // Manejar cambio en los inputs de código
  const handleCodigoChange = (index, value) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const nuevosCodigos = [...codigoVerificacion];
    nuevosCodigos[index] = value;
    setCodigoVerificacion(nuevosCodigos);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      codigoInputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar backspace
  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !codigoVerificacion[index] && index > 0) {
      codigoInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={[currentTheme.background, currentTheme.background, currentTheme.primary + '20']}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[currentTheme.primary, currentTheme.secondary]}
              style={styles.iconoHeaderWrapper}
            >
              <Ionicons name="call" size={40} color="white" />
            </LinearGradient>
            <Text style={[styles.titulo, { color: currentTheme.text }]}>
              {paso === 1 ? 'Verificación de Teléfono' : 'Código de Verificación'}
            </Text>
            <Text style={[styles.subtitulo, { color: currentTheme.textSecondary }]}>
              {paso === 1 
                ? 'Necesitamos tu número para coordinar la entrega de tus pedidos' 
                : 'Ingresa el código que enviamos a tu teléfono'}
            </Text>
          </View>

          {/* Paso 1: Ingresar Teléfono */}
          {paso === 1 && (
            <View style={[styles.formCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="call-outline" size={18} color={currentTheme.primary} />
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                    Número de Teléfono
                  </Text>
                </View>
                <View style={[styles.inputWrapper, { borderColor: currentTheme.border }]}>
                  <Text style={[styles.prefijo, { color: currentTheme.textSecondary }]}>+56</Text>
                  <TextInput
                    style={[styles.input, { color: currentTheme.text }]}
                    placeholder="9 1234 5678"
                    placeholderTextColor={currentTheme.textSecondary}
                    value={telefono}
                    onChangeText={handleTelefonoChange}
                    keyboardType="phone-pad"
                    maxLength={12}
                  />
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: currentTheme.primary + '10', borderLeftColor: currentTheme.primary }]}>
                <Ionicons name="shield-checkmark" size={18} color={currentTheme.primary} />
                <Text style={[styles.infoTexto, { color: currentTheme.primary }]}>
                  Tu número será verificado mediante SMS. Solo se usará para coordinar entregas.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.botonPrincipal, enviandoCodigo && styles.botonDisabled]}
                onPress={enviarCodigoVerificacion}
                disabled={enviandoCodigo}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {enviandoCodigo ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" />
                      <Text style={styles.botonTexto}>Enviar Código SMS</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Paso 2: Verificar Código */}
          {paso === 2 && (
            <View style={[styles.formCard, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={[styles.telefonoMostrado, { backgroundColor: currentTheme.background }]}>
                <Ionicons name="call" size={16} color={currentTheme.primary} />
                <Text style={[styles.telefonoMostradoTexto, { color: currentTheme.text }]}>
                  +56 {telefono}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setPaso(1);
                    setCodigoEnviado(false);
                    setCodigoVerificacion(['', '', '', '', '', '']);
                  }}
                >
                  <Text style={[styles.cambiarTelefono, { color: currentTheme.primary }]}>
                    Cambiar
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.codigoLabel, { color: currentTheme.text }]}>
                Código de 6 dígitos
              </Text>

              {/* Inputs de código */}
              <View style={styles.codigoContainer}>
                {codigoVerificacion.map((digito, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (codigoInputRefs.current[index] = ref)}
                    style={[
                      styles.codigoInput,
                      {
                        backgroundColor: currentTheme.background,
                        borderColor: digito ? currentTheme.primary : currentTheme.border,
                        color: currentTheme.text
                      }
                    ]}
                    value={digito}
                    onChangeText={(value) => handleCodigoChange(index, value)}
                    onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.botonPrincipal, verificandoCodigo && styles.botonDisabled]}
                onPress={verificarCodigoIngresado}
                disabled={verificandoCodigo}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[currentTheme.primary, currentTheme.secondary]}
                  style={styles.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {verificandoCodigo ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.botonTexto}>Verificar Teléfono</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reenviarCodigo}
                onPress={enviarCodigoVerificacion}
                disabled={enviandoCodigo}
              >
                <Ionicons name="refresh" size={16} color={currentTheme.primary} />
                <Text style={[styles.reenviarTexto, { color: currentTheme.primary }]}>
                  Reenviar código
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Información adicional */}
          <View style={[styles.avisoImportante, { backgroundColor: '#fff3cd', borderLeftColor: '#f39c12' }]}>
            <Ionicons name="alert-circle" size={20} color="#f39c12" />
            <Text style={styles.avisoTexto}>
              Necesitas verificar tu teléfono para poder realizar pedidos y recibir notificaciones.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconoHeaderWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  prefijo: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
    borderLeftWidth: 3,
  },
  infoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  botonPrincipal: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  botonDisabled: {
    opacity: 0.6,
  },
  botonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  botonTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Paso 2 - Verificación
  telefonoMostrado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  telefonoMostradoTexto: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  cambiarTelefono: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  codigoLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  codigoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  codigoInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  reenviarCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    padding: 12,
  },
  reenviarTexto: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  avisoImportante: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 3,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    fontWeight: '600',
  },
});

export default IngresarTelefonoScreen;

