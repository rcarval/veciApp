import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Temas predefinidos
export const themes = {
  default: {
    name: 'Clásico',
    primary: '#2A9D8F',
    secondary: '#1D7874',
    background: '#FAFAF9',
    cardBackground: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    shadow: '#000000',
    icon: 'leaf-outline'
  },
  ocean: {
    name: 'Océano',
    primary: '#2196F3',
    secondary: '#1976D2',
    background: '#F0F8FF',
    cardBackground: '#FFFFFF',
    text: '#1A237E',
    textSecondary: '#3F51B5',
    border: '#BBDEFB',
    shadow: '#1976D2',
    icon: 'water-outline'
  },
  sunset: {
    name: 'Atardecer',
    primary: '#FF6B35',
    secondary: '#E55A4E',
    background: '#FFF8F0',
    cardBackground: '#FFFFFF',
    text: '#8B4513',
    textSecondary: '#CD853F',
    border: '#FFE4B5',
    shadow: '#E55A4E',
    icon: 'sunny-outline'
  },
  forest: {
    name: 'Bosque',
    primary: '#4CAF50',
    secondary: '#388E3C',
    background: '#F1F8E9',
    cardBackground: '#FFFFFF',
    text: '#1B5E20',
    textSecondary: '#2E7D32',
    border: '#C8E6C9',
    shadow: '#388E3C',
    icon: 'leaf-outline'
  },
  royal: {
    name: 'Real',
    primary: '#9C27B0',
    secondary: '#7B1FA2',
    background: '#FCE4EC',
    cardBackground: '#FFFFFF',
    text: '#4A148C',
    textSecondary: '#6A1B9A',
    border: '#E1BEE7',
    shadow: '#7B1FA2',
    icon: 'diamond-outline'
  },
  minimal: {
    name: 'Minimal',
    primary: '#E91E63',
    secondary: '#C2185B',
    background: '#FAFAF9',
    cardBackground: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    shadow: '#000000',
    icon: 'heart-outline'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(themes.default);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const lastThemeChangeRef = useRef(0);

  // Cargar tema guardado al inicializar
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedThemeName = await AsyncStorage.getItem('selectedTheme');
      if (savedThemeName && themes[savedThemeName]) {
        setCurrentTheme(themes[savedThemeName]);
      }
    } catch (error) {
      console.error('Error al cargar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (themeName) => {
    // Debounce: Prevenir cambios muy rápidos (mínimo 500ms entre cambios)
    const now = Date.now();
    const timeSinceLastChange = now - lastThemeChangeRef.current;
    const DEBOUNCE_DELAY = 500; // 500ms de espera mínima
    
    if (timeSinceLastChange < DEBOUNCE_DELAY || isChangingTheme) {
      return; // Ignorar si es muy rápido o ya está cambiando
    }

    if (themes[themeName]) {
      setIsChangingTheme(true);
      lastThemeChangeRef.current = now;
      
      // Pequeño delay para suavizar la transición
      await new Promise(resolve => setTimeout(resolve, 150));
      
      setCurrentTheme(themes[themeName]);
      
      try {
        await AsyncStorage.setItem('selectedTheme', themeName);
      } catch (error) {
        console.error('Error al guardar tema:', error);
      } finally {
        setIsChangingTheme(false);
      }
    }
  };

  const getNextTheme = () => {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(currentTheme.name === themes.default.name ? 'default' : 
      Object.keys(themes).find(key => themes[key].name === currentTheme.name));
    const nextIndex = (currentIndex + 1) % themeNames.length;
    return themeNames[nextIndex];
  };

  const value = {
    currentTheme,
    changeTheme,
    getNextTheme,
    isLoading,
    isChangingTheme,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};
