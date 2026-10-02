import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'eslint/config'
import config from 'lago-configs/eslint'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tailwindConfigPath = resolve(__dirname, 'tailwind.config.ts')

export default defineConfig([
  {
    files: [
      'src/**/*.{js,ts,jsx,tsx}',
      'scripts/**/*.{js,ts,jsx,tsx}',
      'cypress/**/*.{js,ts,jsx,tsx}',
    ],
    extends: [config],
    settings: {
      tailwindcss: {
        config: tailwindConfigPath,
      },
    },
  },
])
