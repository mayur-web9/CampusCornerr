/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f0',
          100: '#ffe0dd',
          200: '#ffc5bf',
          300: '#ff9d95',
          400: '#ff6b60',
          500: '#f83b2f',
          600: '#e52117',
          700: '#c1180e',
          800: '#9f1810',
          900: '#841a13',
          950: '#490804',
        },
        brand: {
          red: '#E53E3E',
          orange: '#F97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateY(-10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};
