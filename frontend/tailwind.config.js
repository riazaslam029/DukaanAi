/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#273456',
          600: '#3A506B',
          500: '#4E688A',
          100: '#E8ECF2',
          50: '#F4F6F9',
        },
        teal: {
          800: '#015B66',
          700: '#028090',
          600: '#00A896',
          500: '#02C39A',
          400: '#20E3B2',
          100: '#D5F7F0',
          50: '#EAFBF7',
        },
        surface: {
          base: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
          dark: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
