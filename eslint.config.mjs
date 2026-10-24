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
  {
    // App code composes the design system. The folders below implement it, so they may
    // use raw elements and MUI directly.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/components/designSystem/**',
      'src/components/form/**',
      'src/components/ui/**',
      'src/components/dialogs/BaseDialog.tsx',
      'src/pages/__devOnly/**',
      'src/**/__tests__/**',
    ],
    rules: {
      'lago/use-design-system': 'error',
    },
  },
])
