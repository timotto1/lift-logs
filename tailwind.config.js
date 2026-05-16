/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        display: ['ui-serif', '"New York"', 'Georgia', 'serif'],
        mono: ['ui-monospace', '"SF Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
