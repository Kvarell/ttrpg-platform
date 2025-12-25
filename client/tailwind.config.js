/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-teal': '#164A41',
        'medium-green': '#4D774E',
        'light-green': '#9DC88D',
        'golden-orange': '#F1B24A',
        'pure-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}

