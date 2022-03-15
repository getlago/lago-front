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
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/__mocks__/fileMock.js',
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
    APP_ENV: true,
    IS_PROD_ENV: true,
    API_URL: true,
    APP_VERSION: true,
  },
}
