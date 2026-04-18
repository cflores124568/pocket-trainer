import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: '#007AFF',         // Main action color
    secondary: '#FF9500',       // Secondary action color
    background: '#FFFFFF',      // Primary background
    backgroundSecondary: '#F2F2F7', // Secondary background (e.g., inputs)
    text: '#000000',            // Primary text
    textSecondary: '#8A8A8F',   // Secondary text (e.g., labels)
    gray: '#808080',            // General gray
    lightGray: '#D3D3D3',       // Disabled states
    darkGray: '#444444',        // Darker gray (e.g., placeholder)
    border: '#DDDDDD',          // Borders
    error: '#FF3B30',           // Error states
    success: '#4CD964',         // Success states
    warning: '#FFCC00',         // Warning states
    white: '#FFFFFF',           // White
    black: '#000000',           // Black
    cardBackground: '#ffffff',
    accent: '#4CAF50', 
    // Added from styles.ts
    secondaryBackground: '#F5F5F5', // Video container background, chips
    pause: '#FF5722',           // Pause button color
    play: '#4CD064'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  fonts: {
    regular: 'System',
    bold: 'System',
    // Optional: Add more weights if your app uses them
    medium: 'System',           // For '500' weight (e.g., chipText, relatedName)
    sizes: {
      xs: 10,
      sm: 12,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      // Added for specific cases
      title: 22,               // For ExerciseDetailScreen title
      largeValue: 20,          // For recommendedValue
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    // Added for chip radius
    chip: 16,
  },
  shadows: {
    sm: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.23,
          shadowRadius: 2.62,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    md: {
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius: 4.65,
        },
        android: {
          elevation: 8,
        },
      }),
    },
  },
  // Optional: Add sizes for common UI elements
  sizes: {
    buttonHeight: 50,           // For buttons, inputs
    gifHeight: 220,            // For ExerciseDetailScreen GIF
    videoHeight: 220,          // For YouTube video
    chipHeight: 32,            // For chip vertical padding + content
  },
};