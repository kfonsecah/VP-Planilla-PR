/**
 * Configuración centralizada de la aplicación
 */

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'VP-Planillas',
  version: '1.0.0',
  description: 'Sistema de gestión de planillas y empleados'
} as const;

// URLs de la API (para cuando se integre el backend)
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  endpoints: {
    employees: '/employees',
    attendance: '/attendance',
    positions: '/positions',
    auth: '/auth'
  }
} as const;

// Configuración de la UI
export const UI_CONFIG = {
  colors: {
    primary: '#3B4D36',
    secondary: '#6F7153',
    background: '#E7DCC1',
    surface: '#F9F1DC',
    border: '#D2B48C'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
} as const;
