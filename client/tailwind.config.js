/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
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
          DEFAULT: '#fafaf9',
          card: '#ffffff',
          muted: '#f5f5f4',
        },
        ink: {
          DEFAULT: '#1c1917',
          muted: '#57534e',
          faint: '#a8a29e',
        },
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(28, 25, 23, 0.08)',
        card: '0 1px 3px rgba(28, 25, 23, 0.06), 0 8px 24px -8px rgba(28, 25, 23, 0.1)',
      },
    },
  },
  plugins: [],
};
