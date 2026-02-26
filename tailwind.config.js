/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './web/**/*.{html,js}',
    './web/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#0f141f',
          panel: 'rgba(23, 26, 33, 0.88)',
          border: 'rgba(132, 158, 210, 0.42)',
          'border-hover': 'rgba(121, 176, 255, 0.6)',
          text: '#dde8ff',
          'text-dim': '#b0bfd8',
          accent: {
            DEFAULT: '#79b0ff',
            hover: '#8fc0ff',
            glow: 'rgba(121, 176, 255, 0.3)',
          },
          danger: '#e86a7c',
          success: '#78d17a',
          warning: '#f5a623',
        },
        wood: '#d4a574',
        ore: '#a8b5c4',
        berry: '#c06c84',
        food: '#f4a261',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'bounce-subtle': 'bounceSubtle 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['dark'],
  },
};
