module.exports = {
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src'],

  automock: false,

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },

  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/types.{ts,tsx}',
    '!src/core/constants/*.{ts,tsx}',
    '!src/generated/*.{ts,tsx}',
    '!src/styles/**',
    '!src/pages/__devOnly/*.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov'],
  collectCoverage: false, // set to true to collect coverage
  coverageThreshold: {
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
  },

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    APP_ENV: 'production',
    API_URL: 'http://localhost:3000',
    APP_VERSION: '1.0.0',
    IS_REACT_ACT_ENVIRONMENT: true,
    LAGO_OAUTH_PROXY_URL: 'https://proxy.lago.dev',
    LAGO_DISABLE_SIGNUP: 'false',
    SENTRY_DSN: 'https://sentry.io/',
  },
}
