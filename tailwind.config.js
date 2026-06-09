/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#1a1a1e',
        panel: '#232328',
        'panel-light': '#2c2c33',
        border: '#3a3a42',
        accent: '#6d5efc',
        'accent-hover': '#5d4ee8',
      },
    },
  },
  plugins: [],
}
