/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lcm: {
          dark: '#0f172a',
          primary: '#1e3a8a', // Royal Blue khas LCM
          light: '#2563eb',
          subtle: '#eff6ff',
          surface: '#F8FAFC',
          border: '#e2e8f0',
          accent: '#F59E0B' // Gold/Amber accent
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(30, 58, 138, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(30, 58, 138, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
