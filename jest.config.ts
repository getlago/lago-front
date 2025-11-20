import type { Config } from 'jest'

export default {
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src'],

  automock: false,

  // Jest transformations -- using babel-jest for both TS and JS files
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.cjs',
  },

  transformIgnorePatterns: [
    // Ignore node_modules except lago-design-system (internal dependency)
    '/node_modules[\\\\/](?!lago-design-system)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/types.{ts,tsx}',
    '!src/**/fixtures.ts',
    '!src/core/constants/*.{ts,tsx}',
    '!src/generated/*.{ts,tsx}',
    '!src/styles/**',
    '!src/pages/__devOnly/*.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov'],
  collectCoverage: false, // set to true to collect coverage
  coverageThreshold: {
    global: {},
    'src/hooks/ui/useShortcuts.tsx': {
      statements: 90,
    },
  },

  testEnvironment: 'jsdom',

  // Load setup files before test execution
  setupFilesAfterEnv: ['./jest-setup.ts'],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{ts,tsx}'],

  modulePaths: [],

  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    'ace-builds': '<rootDir>/node_modules/ace-builds',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.cjs',
    '^lago-design-system$': '<rootDir>/packages/design-system/dist/index.js',
  },

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  globals: {
    APP_ENV: 'production',
    API_URL: 'http://localhost:3000',
    DOMAIN: 'localhost',
    APP_VERSION: '1.0.0',
    IS_REACT_ACT_ENVIRONMENT: true,
    LAGO_OAUTH_PROXY_URL: 'https://proxy.lago.dev',
    LAGO_DISABLE_SIGNUP: 'false',
    NANGO_PUBLIC_KEY: '',
    SENTRY_DSN: 'https://sentry.io/',
    LAGO_DISABLE_PDF_GENERATION: 'false',
  },
} satisfies Config
