/**
 * Shared button styling utilities for consistent button appearance
 * Provides modern polish with shadows, highlights, and transitions
 */

export interface ButtonStyleOptions {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  active?: boolean;
  fullWidth?: boolean;
}

export interface ButtonStyles {
  base: React.CSSProperties;
  hover: React.CSSProperties;
  active: React.CSSProperties;
  disabled: React.CSSProperties;
}

/**
 * Color palette for button variants
 */
const BUTTON_COLORS = {
  primary: {
    bg: '#007bff',
    bgHover: '#0056b3',
    bgActive: '#004085',
    text: '#ffffff',
    shadow: 'rgba(0, 123, 255, 0.3)',
  },
  secondary: {
    bg: '#6c757d',
    bgHover: '#545b62',
    bgActive: '#3e444a',
    text: '#ffffff',
    shadow: 'rgba(108, 117, 125, 0.3)',
  },
  success: {
    bg: '#28a745',
    bgHover: '#1e7e34',
    bgActive: '#155724',
    text: '#ffffff',
    shadow: 'rgba(40, 167, 69, 0.3)',
  },
  danger: {
    bg: '#dc3545',
    bgHover: '#c82333',
    bgActive: '#bd2130',
    text: '#ffffff',
    shadow: 'rgba(220, 53, 69, 0.3)',
  },
  warning: {
    bg: '#ffc107',
    bgHover: '#e0a800',
    bgActive: '#d39e00',
    text: '#212529',
    shadow: 'rgba(255, 193, 7, 0.3)',
  },
  info: {
    bg: '#17a2b8',
    bgHover: '#138496',
    bgActive: '#117a8b',
    text: '#ffffff',
    shadow: 'rgba(23, 162, 184, 0.3)',
  },
} as const;

/**
 * Size configurations for buttons
 */
const BUTTON_SIZES = {
  small: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '6px',
    minHeight: '32px',
    minWidth: '60px',
  },
  medium: {
    padding: '8px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    minHeight: '40px',
    minWidth: '80px',
  },
  large: {
    padding: '12px 20px',
    fontSize: '16px',
    borderRadius: '10px',
    minHeight: '48px',
    minWidth: '100px',
  },
} as const;

/**
 * Generate polished button styles
 */
export function getButtonStyles(options: ButtonStyleOptions = {}): ButtonStyles {
  const {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    active = false,
    fullWidth = false,
  } = options;

  const colors = BUTTON_COLORS[variant];
  const sizing = BUTTON_SIZES[size];

  const baseStyles: React.CSSProperties = {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxSizing: 'border-box',
    
    // Size
    padding: sizing.padding,
    minHeight: sizing.minHeight,
    minWidth: sizing.minWidth,
    width: fullWidth ? '100%' : 'auto',
    
    // Typography
    fontSize: sizing.fontSize,
    fontWeight: '500',
    fontFamily: 'inherit',
    textAlign: 'center',
    textDecoration: 'none',
    lineHeight: '1.5',
    
    // Appearance
    backgroundColor: colors.bg,
    color: colors.text,
    border: 'none',
    borderRadius: sizing.borderRadius,
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    
    // Modern polish effects
    boxShadow: disabled
      ? 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
      : `
        0 2px 4px rgba(0, 0, 0, 0.1),
        0 1px 2px ${colors.shadow},
        inset 0 1px 0 rgba(255, 255, 255, 0.15)
      `,
    
    // Gradient background for depth
    backgroundImage: disabled
      ? 'none'
      : `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.1) 0%, 
          rgba(255, 255, 255, 0.05) 50%, 
          rgba(0, 0, 0, 0.1) 100%)`,
    
    // Smooth transitions
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Active state modifier
    ...(active && !disabled && {
      backgroundColor: colors.bgActive,
      transform: 'translateY(1px)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.2),
        inset 0 1px 3px rgba(0, 0, 0, 0.2)
      `,
    }),
    
    // Disabled state
    ...(disabled && {
      backgroundColor: '#e9ecef',
      color: '#6c757d',
      opacity: 0.6,
    }),
  };

  const hoverStyles: React.CSSProperties = disabled
    ? {}
    : {
        backgroundColor: colors.bgHover,
        transform: 'translateY(-1px)',
        boxShadow: `
          0 4px 8px rgba(0, 0, 0, 0.15),
          0 2px 4px ${colors.shadow},
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `,
        backgroundImage: `linear-gradient(135deg, 
          rgba(255, 255, 255, 0.15) 0%, 
          rgba(255, 255, 255, 0.08) 50%, 
          rgba(0, 0, 0, 0.05) 100%)`,
      };

  const activeStyles: React.CSSProperties = disabled
    ? {}
    : {
        backgroundColor: colors.bgActive,
        transform: 'translateY(1px)',
        boxShadow: `
          0 1px 2px rgba(0, 0, 0, 0.2),
          inset 0 1px 3px rgba(0, 0, 0, 0.2)
        `,
        backgroundImage: 'none',
      };

  const disabledStyles: React.CSSProperties = {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6,
    transform: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  };

  return {
    base: baseStyles,
    hover: hoverStyles,
    active: activeStyles,
    disabled: disabledStyles,
  };
}

/**
 * Get CSS class string for Tailwind-based buttons
 */
export function getButtonClasses(options: ButtonStyleOptions = {}): string {
  const {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    active = false,
    fullWidth = false,
  } = options;

  const baseClasses = [
    // Layout
    'inline-flex items-center justify-center gap-1.5',
    'box-border font-medium text-center leading-relaxed',
    'border-0 outline-none cursor-pointer',
    
    // Transitions
    'transition-all duration-200 ease-out',
    
    // Size variants
    size === 'small' && 'px-3 py-1.5 text-xs rounded-md min-h-8 min-w-15',
    size === 'medium' && 'px-4 py-2 text-sm rounded-lg min-h-10 min-w-20',
    size === 'large' && 'px-5 py-3 text-base rounded-xl min-h-12 min-w-24',
    
    // Width
    fullWidth && 'w-full',
    
    // Shadows and effects
    !disabled && 'shadow-lg hover:shadow-xl active:shadow-md',
    !disabled && 'hover:-translate-y-0.5 active:translate-y-0.5',
    
    // Color variants
    variant === 'primary' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white',
      !disabled && 'hover:bg-blue-700 active:bg-blue-800',
      !disabled && 'shadow-blue-200 hover:shadow-blue-300',
    ],
    variant === 'secondary' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-gray-600 text-white',
      !disabled && 'hover:bg-gray-700 active:bg-gray-800',
      !disabled && 'shadow-gray-200 hover:shadow-gray-300',
    ],
    variant === 'success' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-green-600 text-white',
      !disabled && 'hover:bg-green-700 active:bg-green-800',
      !disabled && 'shadow-green-200 hover:shadow-green-300',
    ],
    variant === 'danger' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-red-600 text-white',
      !disabled && 'hover:bg-red-700 active:bg-red-800',
      !disabled && 'shadow-red-200 hover:shadow-red-300',
    ],
    variant === 'warning' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-yellow-500 text-gray-900',
      !disabled && 'hover:bg-yellow-600 active:bg-yellow-700',
      !disabled && 'shadow-yellow-200 hover:shadow-yellow-300',
    ],
    variant === 'info' && [
      disabled ? 'bg-gray-300 text-gray-500' : 'bg-cyan-600 text-white',
      !disabled && 'hover:bg-cyan-700 active:bg-cyan-800',
      !disabled && 'shadow-cyan-200 hover:shadow-cyan-300',
    ],
    
    // Active state
    active && !disabled && 'translate-y-0.5 shadow-md',
    
    // Disabled state
    disabled && 'opacity-60 cursor-not-allowed',
  ];

  return baseClasses.filter(Boolean).flat().join(' ');
}

/**
 * Generate inline styles for React components
 */
export function getInlineButtonStyle(
  options: ButtonStyleOptions = {},
  state: 'normal' | 'hover' | 'active' | 'disabled' = 'normal'
): React.CSSProperties {
  const styles = getButtonStyles(options);
  
  switch (state) {
    case 'hover':
      return { ...styles.base, ...styles.hover };
    case 'active':
      return { ...styles.base, ...styles.active };
    case 'disabled':
      return { ...styles.base, ...styles.disabled };
    default:
      return styles.base;
  }
}