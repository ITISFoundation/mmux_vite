import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
  preview: {
    port: 8888,
    strictPort: true,
  },
  server: {
    port: 8888,
    strictPort: true,
    host: true,
    origin: "http://0.0.0.0:8888",
  },
  test: defineVitestConfig({
    globals: true,
    environment: 'jsdom',
    testTimeout: 20000, // 20 seconds
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'c8', // Use c8 for coverage
      reporter: ['text', 'html'], // Generate text and HTML reports
      reportsDirectory: './coverage', // Directory for coverage reports
    },
  })
});
