// jest.config.js
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if we add a setup file later
  moduleNameMapper: {
    // Handle CSS imports (if any in components/pages being tested)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases (if configured in jsconfig.json or tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1', // Added for app directory
  },
  transform: {
    // Use babel-jest to transpile tests with Babel
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};
