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
