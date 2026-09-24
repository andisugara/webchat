/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sita: {
          50: '#eefdf5',
          100: '#d7fae7',
          200: '#b2f3d2',
          300: '#7be8b4',
          400: '#3cd490',
          500: '#017143', // Primary SITA Badung Emerald Green
          600: '#015f38',
          700: '#014d2e',
          800: '#033d26',
          900: '#033321',
          950: '#011c12',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
