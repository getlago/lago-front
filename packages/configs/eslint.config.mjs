import { fixupPluginRules } from '@eslint/compat'
import pluginJs from '@eslint/js'
import pluginImport from 'eslint-plugin-import'
import pluginJsxA11y from 'eslint-plugin-jsx-a11y'
import pluginPrettier from 'eslint-plugin-prettier/recommended'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginTailwind from 'eslint-plugin-tailwindcss'
import globals from 'globals'
import pluginTypescriptEslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['**/dist/*', '.github/**/*', '**/globals.d.ts', '**/generated/**/*', 'cypress/**/*'],
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
    },
  },

  pluginJs.configs.recommended,
  ...pluginTypescriptEslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  ...pluginTailwind.configs['flat/recommended'],

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
    plugins: {
      import: fixupPluginRules(pluginImport),
      'jsx-a11y': pluginJsxA11y,
      'react-hooks': pluginReactHooks,
    },
    languageOptions: {
      parser: pluginTypescriptEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 6,
      sourceType: 'module',
    },
    rules: {
      ...pluginJsxA11y.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      'no-alert': 'error',
      'no-console': 'error',
      eqeqeq: 'error',
      'no-else-return': 'warn',
      'no-unused-vars': 'off',
      'newline-after-var': ['warn'], // TOFIX: Deprecated rule
      'no-extra-boolean-cast': 'off',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',

      // Plugins
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'unknown', 'sibling', 'parent', 'index'],
          'newlines-between': 'always',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      // https://typescript-eslint.io/rules/no-shadow/
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      // https://typescript-eslint.io/rules/no-unused-expressions/
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowTernary: true,
          allowShortCircuit: true,
          allowTaggedTemplates: true,
        },
      ],
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  {
    files: ['**/*.{cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.js'],
    rules: {
      'import/order': 'off',
    },
  },
  pluginPrettier,
]
