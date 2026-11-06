import { Config } from 'tailwindcss/types/config'

import { v2TailwindColors } from './src/styles/tailwindColors'

const preset: Partial<Config> = {
  presets: [],
  theme: {
    extend: {
      boxShadow: {
        'v2-interactive': 'var(--v2-shadow-interactive)',
        'v2-floating': 'var(--v2-shadow-floating)',
        'v2-dialog': 'var(--v2-shadow-dialog)',
      },
      // @ts-expect-error Tailwind's `RecursiveKeyValuePair` omits the function colors `v2TailwindColors` returns.
      colors: v2TailwindColors,
    },
  },
}

export default preset
