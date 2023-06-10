/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '320px',
      },
      colors: {
        background: '#2e2e2e',
        'primary-foreground': '#404040',
        'secondary-foreground': '#27272a',
        'primary-accent': '#27272a',
        'secondary-accent': '#71717a',
        text: '#ffffff',
        primary: '#40a9ff',
        secondary: '#6b7680',
      },
    },
  },
}
