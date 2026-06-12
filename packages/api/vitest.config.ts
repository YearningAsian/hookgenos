import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Each test file gets its own module registry so vi.mock isolation works correctly
    isolate: true,
  },
});
