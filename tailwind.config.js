/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,services,src}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0D47A1',
        'brand-secondary': '#1976D2',
        'background-dark': '#121212',
        'surface-dark': '#1E1E1E',
        'on-surface-dark': '#E0E0E0',
        'on-surface-dark-secondary': '#BDBDBD',
      }
    },
  },
  plugins: [],
}
