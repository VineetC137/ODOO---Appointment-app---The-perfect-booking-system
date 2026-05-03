/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#f5faf8',
        'surface-dim': '#d6dbd9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f5f2',
        'surface-container': '#eaefed',
        'surface-container-high': '#e4e9e7',
        'on-surface': '#171d1c',
        'on-surface-variant': '#3d4947',
        outline: '#6d7a77',
        'outline-variant': '#bcc9c6',
        primary: {
          DEFAULT: '#00685f',
          50: '#e6f4f3',
          100: '#b3deda',
          200: '#80c8c1',
          300: '#4db2a8',
          400: '#1a9c8f',
          500: '#00685f',
          600: '#005a52',
          700: '#004d46',
          800: '#003f39',
          900: '#00201d',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        'level-1': '0px 1px 3px rgba(0,0,0,0.05)',
        'level-2': '0px 10px 15px -3px rgba(0,0,0,0.08)',
        'level-3': '0px 20px 25px -5px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
