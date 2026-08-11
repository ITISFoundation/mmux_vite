import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // The current Vitest suite is a jsdom/unit-component suite. Real browser
    // coverage runs through the Playwright e2e suite.
    environment: "jsdom", // Use jsdom for testing React components
    // Browser mode can be restored here when scoped *.browser.test.tsx tests
    // are added; do not enable it for the existing Node/jsdom test suite.
    // browser: {
    //   enabled: false,
    //   provider: playwright(),
    //   // https://vitest.dev/guide/browser/playwright
    //   instances: [{ browser: "chromium" }],
    // },
  },
});
