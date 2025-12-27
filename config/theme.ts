// Centralized Theme Configuration
// Update colors, spacing, and other theme values here for app-wide changes

export const theme = {
  // Gradients
  gradients: {
    background: 'from-slate-50 to-white dark:from-slate-950 dark:to-slate-900',
    primary: 'from-red-600 to-orange-500',
    primaryHover: 'from-red-700 to-orange-600',
    success: 'from-green-500 to-emerald-500',
  },
  
  // Colors
  colors: {
    primary: {
      light: '#dc2626', // red-600
      dark: '#ea580c', // orange-500
    },
    text: {
      light: '#1e293b', // slate-900
      dark: '#f1f5f9', // slate-100
    },
    background: {
      light: '#f8fafc', // slate-50
      dark: '#0f172a', // slate-950
    },
  },

  // Spacing
  spacing: {
    containerPadding: 'px-4 sm:px-6',
    containerMaxWidth: 'max-w-6xl',
    pageBottomPadding: 'pb-20',
  },

  // Shadow
  shadows: {
    card: 'shadow-lg',
    hover: 'hover:shadow-xl',
  },

  // Radius
  radius: {
    card: 'rounded-2xl',
    button: 'rounded-xl',
    badge: 'rounded-full',
  },

  // Transitions
  transitions: {
    default: 'transition-all duration-300',
    smooth: 'transition-all duration-500',
  },
};

export type Theme = typeof theme;
