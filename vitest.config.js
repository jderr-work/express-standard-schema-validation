import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'acceptance/**/*.test.ts', 'acceptance/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/example/**', '**/dist/**'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/node_modules/**', 'example/**', 'acceptance/**', '*.config.js', '**/dist/**'],
    },
    testTimeout: 5000,
    hookTimeout: 10000,
  },
});
