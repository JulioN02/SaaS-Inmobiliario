/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
  testTimeout: 20000,
};