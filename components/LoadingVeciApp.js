import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

/**
 * Componente de loading animado con el logo de VeciApp
 * @param {Object} props
 * @param {number} props.size - Tamaño del logo (default: 100)
 * @param {string} props.color - Color del tinte del logo (default: 'white')
 */
const LoadingVeciApp = ({ size = 100, color = 'white' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(1)).current;
  const wave2 = useRef(new Animated.Value(1)).current;
  const wave3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de escala suave (breathing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de brillo (glow effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 1)
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave1, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 2) - con delay
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(wave2, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ondas expansivas (wave 3) - con más delay
    Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(wave3, {
          toValue: 2,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const wave1Opacity = wave1.interpolate({
    inputRange: [1, 2],
    outputRange: [0.6, 0],
  });

  const wave2Opacity = wave2.interpolate({
    inputRange: [1, 2],
    outputRange: [0.5, 0],
  });

  const wave3Opacity = wave3.interpolate({
    inputRange: [1, 2],
    outputRange: [0.4, 0],
  });

  const waveSize = size * 1.8;

  return (
    <View style={styles.container}>
      {/* Ondas expansivas concéntricas */}
      <Animated.View
        style={[
          styles.wave,
          {
            width: waveSize,
            height: waveSize,
            borderRadius: waveSize / 2,
            transform: [{ scale: wave1 }],
            opacity: wave1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            width: waveSize,
            height: waveSize,
            borderRadius: waveSize / 2,
            transform: [{ scale: wave2 }],
            opacity: wave2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            width: waveSize,
            height: waveSize,
            borderRadius: waveSize / 2,
            transform: [{ scale: wave3 }],
            opacity: wave3Opacity,
          },
        ]}
      />

      {/* Círculo de brillo (glow) */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            opacity: glowOpacity,
          },
        ]}
      />
      
      {/* Logo con breathing suave */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image 
          source={require("../assets/welcome.png")} 
          style={{ width: size, height: size }}
          contentFit="contain"
          tintColor={color}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default LoadingVeciApp;

