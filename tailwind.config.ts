import plugin from 'tailwindcss/plugin'

export const colors = {
  grey: {
    100: '#F3F4F6',
    200: '#E7EAEE',
    300: '#D9DEE7',
    400: '#C3C9D5',
    500: '#8C95A6',
    600: '#66758F',
    700: '#19212E',
  },
  blue: {
    100: '#DEECFF',
    200: '#B3D4FF',
    300: '#4C9AFF',
    400: '#2684FF',
    500: '#267DFF',
    600: '#006CFA',
    700: '#005FDB',
    800: '#0050B8',
  },
  yellow: {
    100: '#FFF7E6',
    200: '#FFF0B3',
    300: '#FFE380',
    400: '#FFC400',
    500: '#FFAB00',
    600: '#FF7E1D',
    700: '#F06700',
    800: '#CC5800',
  },
  purple: {
    100: '#EAE6FF',
    200: '#C9C1F5',
    300: '#AEA2F1',
    400: '#8272DF',
    500: '#5D48D5',
    600: '#422CC1',
    700: '#332296',
    800: '#2A1C7D',
  },
  green: {
    100: '#E3FCF4',
    200: '#ABF5DC',
    300: '#79F2CA',
    400: '#65DCB4',
    500: '#36B389',
    600: '#008559',
    700: '#006644',
    800: '#005236',
  },
  red: {
    100: '#FFEBE6',
    200: '#FFBDAD',
    300: '#FF8F73',
    400: '#FF7C5C',
    500: '#F6491E',
    600: '#DC3309',
    700: '#BA2B08',
    800: '#9D2507',
  },
  avatar: {
    orange: '#FF9351',
    brown: '#D59993',
    green: '#66DD93',
    turquoise: '#6FD8C1',
    blue: '#2FC1FE',
    indigo: '#5195FF',
    grey: '#889ABF',
    pink: '#FF9BE0',
  },
}

const config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    colors: {
      grey: {
        ...colors.grey,
        DEFAULT: colors.grey[700],
      },
      blue: {
        ...colors.blue,
        DEFAULT: colors.blue[600],
      },
      yellow: {
        ...colors.yellow,
        DEFAULT: colors.yellow[600],
      },
      purple: {
        ...colors.purple,
        DEFAULT: colors.purple[600],
      },
      green: {
        ...colors.green,
        DEFAULT: colors.green[600],
      },
      red: {
        ...colors.red,
        DEFAULT: colors.red[600],
      },
      avatar: colors.avatar,
      black: '#000000',
      white: '#FFFFFF',
    },
    boxShadow: {
      sm: '0px 2px 4px 0px rgba(25, 33, 46, 0.20)',
      md: '0px 6px 8px 0px rgba(25, 33, 46, 0.12)',
      lg: '0px 10px 16px 0px rgba(25, 33, 46, 0.10)',
      xl: '0px 16px 24px 0px rgba(25, 33, 46, 0.10)',
    },
    fontFamily: {
      sans: ['Inter, Arial , Verdana , Helvetica , sans-serif'],
    },

    extend: {
      screens: {
        md: '776px',
      },
    },
  },

  plugins: [
    plugin(function ({ addUtilities, theme }) {
      // Dividers
      addUtilities({
        '.shadow-t': {
          boxShadow: `0px 1px 0px 0px ${theme('colors.grey.300')} inset`,
        },

        '.shadow-r': {
          boxShadow: `-1px 0px 0px 0px ${theme('colors.grey.300')} inset`,
        },

        '.shadow-b': {
          boxShadow: `0px -1px 0px 0px ${theme('colors.grey.300')} inset`,
        },

        '.shadow-l': {
          boxShadow: `1px 0px 0px 0px ${theme('colors.grey.300')} inset`,
        },
      })
      // Outline ring
      addUtilities({
        '.ring': {
          outline: 'none',
          boxShadow: `0px 0px 0px 4px ${theme('colors.blue.200')}`,
          borderRadius: '4px',
        },
      })
    }),
  ],
}

export default config
