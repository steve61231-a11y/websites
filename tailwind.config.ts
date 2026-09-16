import type { Config } from 'tailwindcss'

/**
 * Iris Fields School design tokens.
 *
 * The three brand hues are lifted straight from the school's logo artwork:
 *   iris-500 #665EC7 · sky-500 #00AEEF · gold-400 #F1D058
 * Every other step is a tint/shade of those, so the whole UI reads as the brand
 * rather than "a dashboard with a purple button somewhere".
 */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        iris: {
          50: '#F2F1FC', 100: '#E6E4F8', 200: '#CFCBF1', 300: '#B0A9E7',
          400: '#8B82D8', 500: '#665EC7', 600: '#554CB4', 700: '#453D93',
          800: '#393376', 900: '#2F2A5E',
        },
        sky: {
          50: '#E8F8FE', 100: '#CCF1FD', 200: '#99E3FB', 300: '#5CD1F7',
          400: '#1FBEF3', 500: '#00AEEF', 600: '#0090C7', 700: '#0E739E',
          800: '#135D7F', 900: '#164C68',
        },
        gold: {
          50: '#FEFAEC', 100: '#FCF3D0', 200: '#F9E7A1', 300: '#F5DA72',
          400: '#F1D058', 500: '#E7BC2A', 600: '#C99B15', 700: '#A07613',
          800: '#845E17', 900: '#704E19',
        },
        /* Warm neutral — never a cold blue-grey, it fights the brand. */
        sand: {
          50: '#FAF9F7', 100: '#F4F2EE', 200: '#E8E5DE', 300: '#D6D1C7',
          400: '#B0A99B', 500: '#8A8276', 600: '#6B6459', 700: '#524D45',
          800: '#3A3631', 900: '#22201D',
        },
        /* Reserved status palette — never reused as a chart series colour. */
        good: { soft: '#E4F6EC', base: '#17845A', ink: '#0E5E40' },
        warn: { soft: '#FDF1DA', base: '#B0730A', ink: '#7C5108' },
        bad: { soft: '#FDECEA', base: '#C0392B', ink: '#8E2A20' },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        num: ['"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem',
        '4xl': '2rem', blob: '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(34,32,29,.04), 0 4px 16px -4px rgba(34,32,29,.08)',
        lift: '0 2px 4px rgba(34,32,29,.04), 0 12px 32px -8px rgba(34,32,29,.16)',
        press: 'inset 0 2px 6px rgba(34,32,29,.12)',
        glow: '0 8px 28px -6px rgba(102,94,199,.45)',
        'glow-sky': '0 8px 28px -6px rgba(0,174,239,.42)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(.86)', opacity: '0' },
          '60%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'draw-check': { to: { strokeDashoffset: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'float-up': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-64px) scale(.4)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in .38s cubic-bezier(.34,1.56,.64,1) both',
        'draw-check': 'draw-check .5s .12s ease-out forwards',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
} satisfies Config
