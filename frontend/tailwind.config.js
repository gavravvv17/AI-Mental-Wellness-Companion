/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wellness: {
          50: '#f0f5ff',
          100: '#e1ebff',
          200: '#cce0ff',
          300: '#aaccff',
          400: '#7db3ff',
          500: '#4a90e2', // calming soft blue
          600: '#357abd',
          700: '#2c669e',
          800: '#23527e',
          900: '#1b3f62',
        },
        sage: {
          50: '#f3f7f4',
          100: '#e2ece4',
          200: '#c7dacb',
          300: '#a1c0a8',
          400: '#759e7e',
          500: '#527e5b', // soothing sage green
          600: '#3e6346',
          700: '#33503a',
          800: '#2b4131',
          900: '#24372a',
        },
        lavender: {
          50: '#f7f6fd',
          100: '#f0eefc',
          200: '#e3dffa',
          300: '#cecaf6',
          400: '#b1a7ef',
          500: '#8c7ae6', // relaxation lavender
          600: '#7661d9',
          700: '#644ec2',
          800: '#5441a3',
          900: '#463785',
        },
        darkBg: {
          pure: '#0b0f19',
          card: '#161f30',
          border: '#243249',
          input: '#1a263c'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
