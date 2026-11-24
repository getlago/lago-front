import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'eslint/config'
import config from 'lago-configs/eslint'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tailwindConfigPath = resolve(__dirname, 'tailwind.config.ts')

export default defineConfig([
  {
    ignores: ['packages/ui/**'],
  },
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
      'src/components/dialogs/BaseDialog.tsx',
      'src/pages/__devOnly/**',
      'src/**/__tests__/**',
    ],
    rules: {
      'lago/use-design-system': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Not core `no-restricted-imports`: it would replace the lago-configs formik/dialog options.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message: 'Use the icons through lago-ui components, not lucide-react directly.',
            },
          ],
          patterns: [
            {
              group: ['@radix-ui/*'],
              message: 'Use lago-ui components (lago-ui/*), not Radix primitives directly.',
            },
          ],
        },
      ],
    },
  },
])
