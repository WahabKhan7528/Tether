/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ethereal: {
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-dim': 'rgb(var(--color-surface-dim) / <alpha-value>)',
          outline: 'rgb(var(--color-outline) / <alpha-value>)',
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-container': 'rgb(var(--color-primary-container) / <alpha-value>)',
          tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
          error: 'rgb(var(--color-error) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0px 8px 40px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '24px',
        'full': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
