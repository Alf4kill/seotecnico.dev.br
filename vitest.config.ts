import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests for /lib utilities (CLAUDE.md §8). DOM globals (window,
// localStorage, document) come from the jsdom environment.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
