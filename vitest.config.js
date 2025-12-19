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
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    testTimeout: 5000,
    hookTimeout: 10000,
  },
});
