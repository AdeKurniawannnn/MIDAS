/** @type {import('jest').Config} */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Simple integration test configuration
const integrationJestConfig = {
  displayName: 'Integration Tests',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/test-utils/integration-setup.ts'
  ],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testMatch: [
    '<rootDir>/src/**/*.integration.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__integration-tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/app/api/**/__tests__/**/*.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/__tests__/(.*)$': '<rootDir>/src/__tests__/$1',
  },
  collectCoverageFrom: [
    'src/app/api/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/components/features/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/types/**',
    '!src/lib/constants/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/integration',
  testTimeout: 15000,
  maxWorkers: 1,
  clearMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(integrationJestConfig)