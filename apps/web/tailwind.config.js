/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        card: '#ffffff',
        'card-hover': '#f1f5f9',
        border: '#e2e8f0',
        sies: {
          navy: '#06111f',
          dark: '#0a192f',
          blue: '#004b87',
          light: '#0066b3',
          border: '#e2e8f0',
          surface: '#f8fafc',
        },
        sun: {
          orange: '#f37021',
          amber: '#ff7a00',
          gold: '#f59e0b',
          yellow: '#fbbf24',
          dark: '#d9580d',
          light: '#fff7ed',
        },
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f37021',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [],
};
