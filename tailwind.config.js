/** @type {import('tailwindcss').Config} */
// Color/radius/easing values mirror src/components/ui/tokens.ts — keep in sync.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'monospace'],
      },
      colors: {
        bg: '#0a0a0a',
        surface: {
          1: '#141414',
          2: '#1a1a1a',
          3: '#202020',
        },
        hairline: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.05)',
          strong: 'rgba(255,255,255,0.12)',
        },
        ink: {
          DEFAULT: '#f5f5f4',
          2: '#a1a1aa',
          3: '#71717a',
          4: '#52525b',
        },
        positive: '#34d399',
        negative: '#f87171',
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
        field: '12px',
        sheet: '28px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'out-quart': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'backdrop-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-rise': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) both',
        'backdrop-in': 'backdrop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-rise': 'fade-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
