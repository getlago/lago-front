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

  collectCoverageFrom: ['src/hooks/**/*.{ts,tsx}'],
  coverageReporters: ['text', 'lcov'],
  collectCoverage: true,
  coverageThreshold: {
    'src/hooks/ui/useShortcuts.tsx': {
      statements: 90,
    },
  },

  testEnvironment: 'jsdom',

  // Runs special logic, such as cleaning up components
  // when using React Testing Library and adds special
  // extended assertions to Jest
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],

  modulePaths: [],

  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
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
