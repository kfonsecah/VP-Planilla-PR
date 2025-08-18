/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],  theme: {
    extend: {      fontFamily: {
        // Fuentes personalizadas Verde Gestión
        'titulo': ['VerdeFont', 'Inter', 'sans-serif'], // Para "Verde Gestión"
        'general': ['PraderaFont', 'Inter', 'sans-serif'], // Para todo lo demás
        // Mantener compatibilidad
        'sans': ['PraderaFont', 'Inter', 'sans-serif'], // Por defecto
        'inter': ['Inter', 'sans-serif'], // Fallback específico
      },
      colors: {
        // Colores personalizados del sistema Verde Gestión
        'verde-primary': '#4A5D3A',
        'verde-secondary': '#6B7556',
        'verde-bg': '#E7DCC1',
        'verde-card': '#FCF1D5',
        'verde-accent': '#D5CDB3',
      }
    },
  },
  plugins: [],
}
