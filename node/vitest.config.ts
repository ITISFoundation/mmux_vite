import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
  // The CodSpeed plugin is a no-op unless the run is driven by the CodSpeed
  // runner (`npm run bench:codspeed` / the CodSpeed CI job), so `npm test` and
  // a plain `npx vitest bench` are unaffected.
  plugins: [react(), codspeedPlugin()],
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
    coverage: {
      provider: "v8",
      reporter: ["text", "cobertura"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/osparc-api-ts-client/**", "**/*.d.ts"],
    },
  },
});
