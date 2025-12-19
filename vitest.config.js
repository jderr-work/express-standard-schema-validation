import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'acceptance/**/*.test.ts', 'acceptance/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/example/**', '**/dist/**'],
    coverage: {
      provider: 'instanbul',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**', 'example/**', 'acceptance/**', '*.config.js', '**/dist/**'],
      thresholds: {
        lines: 78,
        functions: 85,
        branches: 68,
        statements: 79,
      },
    },
    testTimeout: 5000,
    hookTimeout: 10000,
  },
});
