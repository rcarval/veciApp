/**
 * Helper para crear estilos dinámicos basados en el tema actual
 * Facilita la aplicación de temas a componentes
 */

export const createThemeStyles = (theme) => ({
  // Colores principales
  primary: theme.primary,
  secondary: theme.secondary,
  background: theme.background,
  cardBackground: theme.cardBackground,
  text: theme.text,
  textSecondary: theme.textSecondary,
  border: theme.border,
  shadow: theme.shadow,

  // Estilos de contenedores comunes
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Estilos de tarjetas
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 15,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },

  // Estilos de headers con gradiente
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  // Estilos de texto
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  bodyText: {
    fontSize: 14,
    color: theme.text,
  },

  // Estilos de botones
  primaryButton: {
    backgroundColor: theme.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: theme.cardBackground,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  secondaryButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Estilos de inputs
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.cardBackground,
    color: theme.text,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 5,
    fontWeight: '500',
  },

  // Estilos de iconos
  iconContainer: {
    backgroundColor: theme.primary + '20',
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

