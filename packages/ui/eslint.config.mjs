import { defineConfig } from 'eslint/config'
import config from 'lago-configs/eslint'

export default defineConfig([
  { ignores: ['storybook-static/**'] },
  config,
  {
    settings: {
      tailwindcss: {
        config: `${import.meta.dirname}/tailwind.config.ts`,
      },
      'import/resolver': {
        node: { extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx'] },
      },
    },
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~', '~/*'],
              message:
                'lago-ui cannot import from the app. Use relative imports inside the package.',
            },
          ],
        },
      ],
      'import/no-relative-packages': 'error',
    },
  },
  {
    files: ['.storybook/main.ts'],
    rules: {
      'import/order': 'off',
    },
  },
])
