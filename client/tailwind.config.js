/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#FFF0E6',
          100: '#FFD9BF',
          200: '#FFB380',
          500: '#FF6600',
          600: '#FF6600',
          700: '#E55A00',
          900: '#7c2d12',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        surface: {
          DEFAULT: '#F8F7F5',
          card: '#ffffff',
          muted: '#F8F7F5',
        },
        ink: {
          DEFAULT: '#1A1714',
          muted: '#7A756F',
          faint: '#B5B0AB',
        },
        warm: {
          50: '#F8F7F5',
          100: '#F1F0EE',
          200: '#E8E4DF',
          300: '#D6D0C9',
          500: '#7A756F',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(26, 23, 20, 0.08)',
        card: '0 1px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
