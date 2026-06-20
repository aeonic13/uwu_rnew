/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'md': '28rem',
      },
      colors: {
        brand: {
          50:  '#fff4ec',
          100: '#ffe4cc',
          200: '#ffc999',
          300: '#ffad66',
          400: '#fd8533',
          500: '#fc6a03',
          600: '#e05d00',
          700: '#b84d00',
          800: '#903d00',
          900: '#703000',
        },
      },
    },
  },
  plugins: [],
}
