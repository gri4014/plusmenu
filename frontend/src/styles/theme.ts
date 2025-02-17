export const theme = {
  colors: {
    primary: '#2D3748',
    primaryDark: '#1A202C',
    background: '#FFFFFF',
    inputBg: '#F7FAFC',
    border: '#E2E8F0',
    error: '#E53E3E',
    success: '#38A169',
    warning: '#ECC94B',
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      disabled: '#A0AEC0',
      tertiary: '#718096'
    },
    hover: '#F7FAFC'
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  transitions: {
    default: '0.2s ease',
    fast: '0.1s ease',
    slow: '0.3s ease'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem'
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem'
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

export type Theme = typeof theme;
