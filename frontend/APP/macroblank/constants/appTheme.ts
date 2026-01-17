// Theme configuration for futuristic dark UI
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
    border: '#2A2A35',
    borderLight: '#3A3A45',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
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
};

export type Theme = typeof theme;

// Export as appTheme for compatibility
export const appTheme = theme;
