import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/dist/**']
    },
    setupFiles: ['./tests/setup.js'],
    // 全局超时
    testTimeout: 10000,
    // 钩子超时
    hookTimeout: 10000
  }
});