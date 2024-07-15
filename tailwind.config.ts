import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import typography from '@tailwindcss/typography'
 
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
 
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px'
      }
    },
    extend: {
      colors: {
        berry: {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#009845', // Main color
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
          '950': '#052e16'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace'
        ]
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            code: {
              position: 'relative',
              borderRadius: theme('borderRadius.md')
            }
          }
        }
      })
    }
  },
 
  plugins: [
    typography,
    plugin(function ({ addVariant, matchUtilities, theme }) {
      addVariant('hocus', ['&:hover', '&:focus'])
      // Square utility
      matchUtilities(
        {
          square: (value) => ({
            width: value,
            height: value
          })
        },
        { values: theme('spacing') }
      )
    })
  ]
} satisfies Config