/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  screens: {
    'sm': '400px',
    'md': '700px',
    'xl': '1280px',
    '2xl': '1536px',
  }
}

