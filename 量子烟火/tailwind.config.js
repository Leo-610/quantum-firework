/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark:    '#050a18',
          darker:  '#020710',
          blue:    '#0ff0fc',
          purple:  '#7b2fff',
          pink:    '#ff2d78',
          gold:    '#f5a623',
          green:   '#00ff88',
        },
        ember: {
          dark:    '#1a0a00',
          orange:  '#ff6b35',
          amber:   '#f5a623',
          red:     '#ff2d2d',
          warm:    '#fff3e0',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Noto Sans SC', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'ember-rise': 'ember-rise 4s ease-out infinite',
        'world-flip': 'world-flip 0.8s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
          '100%': { transform: 'translateY(-200px) scale(0)', opacity: 0 },
        },
        'world-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
