import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.js'],
    exclude: ['**/node_modules/**', '**/example/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['express-standard-schema-validation.js'],
      exclude: ['**/*.test.js', '**/node_modules/**', 'example/**', 'acceptance/**', '*.config.js'],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
    testTimeout: 5000,
    hookTimeout: 10000,
  },
});
