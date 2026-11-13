import { fileURLToPath } from 'node:url'

/** @type {import('jest').Config} */
const config = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { rootMode: 'upward' }],
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{ts,tsx}'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.cjs',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/stories/**',
    '!src/styles/**',
    '!src/**/__tests__/**',
  ],
  coverageReporters: [
    'text-summary',
    ['lcovonly', { projectRoot: fileURLToPath(new URL('../..', import.meta.url)) }],
  ],
}

export default config
