/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bungee', 'cursive'],
        body: ['Nunito', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        neon: {
          pink: '#FF2D78',
          cyan: '#00F5FF',
          yellow: '#FFE600',
          green: '#39FF14',
          purple: '#BF5AF2',
        },
        dark: {
          900: '#0A0A0F',
          800: '#12121A',
          700: '#1A1A26',
          600: '#22223A',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'slide-up': 'slideUp 0.4s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseNeon: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        pop: {
          from: { transform: 'scale(0.5)', opacity: 0 },
          to: { transform: 'scale(1)', opacity: 1 },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
