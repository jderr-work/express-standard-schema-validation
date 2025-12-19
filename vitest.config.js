import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'acceptance/**/*.test.ts', 'acceptance/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/example/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**', 'example/**', 'acceptance/**', '*.config.js', '**/dist/**'],
      thresholds: {
        lines: 80,
        functions: 86,
        branches: 69,
        statements: 80,
      },
    },
    testTimeout: 5000,
    hookTimeout: 10000,
  },
});
