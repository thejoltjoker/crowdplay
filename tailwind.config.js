import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [typography, daisyui],
  daisyui: {
    themes: [
      'light',
      {
        beacon: {
          'primary': '#249BD8',
          'secondary': '#FF6842',
          'accent': '#FFBA54',
          'neutral': '#111623',
          'base-100': '#F7F3F0',
          'info': '#BB97EE',
          'success': '#9ED06C',
          'warning': '#F89960',
          'error': '#FB617E',
        },
      },
    ],
  },
}
