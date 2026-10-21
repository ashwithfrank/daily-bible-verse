/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', '"Noto Serif"', '"Nirmala UI"', 'serif'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Nirmala UI"', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
