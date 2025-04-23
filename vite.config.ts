import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig as defineVitestConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: defineVitestConfig({
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  }),
});
