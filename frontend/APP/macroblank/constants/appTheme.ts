// Theme configuration for futuristic dark UI with Liquid Glass effect
export const theme = {
  colors: {
    // Primary brand colors - Silver/White theme
    primary: '#E8E8EC',
    primaryDim: 'rgba(232, 232, 236, 0.15)',
    primaryGlow: 'rgba(232, 232, 236, 0.3)',
    
    // Background layers
    background: '#050508',
    surface: '#0A0A0F',
    surfaceLight: '#12121A',
    card: '#15151F',
    cardHover: '#1A1A25',
    
    // Liquid Glass colors
    glass: 'rgba(255, 255, 255, 0.03)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'rgba(255, 255, 255, 0.15)',
    glassShadow: 'rgba(0, 0, 0, 0.4)',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A0A0B0',
    textMuted: '#6A6A7A',
    
    // Status colors
    success: '#4ADE80',
    successDim: 'rgba(74, 222, 128, 0.15)',
    danger: '#FF4757',
    dangerDim: 'rgba(255, 71, 87, 0.15)',
    warning: '#FFB800',
    warningDim: 'rgba(255, 184, 0, 0.15)',
    info: '#60A5FA',
    infoDim: 'rgba(96, 165, 250, 0.15)',
    
    // Accent colors
    purple: '#8B5CF6',
    purpleDim: 'rgba(139, 92, 246, 0.15)',
    blue: '#3B82F6',
    blueDim: 'rgba(59, 130, 246, 0.15)',
    orange: '#F97316',
    orangeDim: 'rgba(249, 115, 22, 0.15)',
    pink: '#EC4899',
    pinkDim: 'rgba(236, 72, 153, 0.15)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.12)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  // Glass effect presets
  glass: {
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
    },
    cardHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    surface: {
      backgroundColor: 'rgba(10, 10, 20, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    blur: 20,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    }),
  },
};

export type Theme = typeof theme;

// Export as appTheme for compatibility
export const appTheme = theme;
