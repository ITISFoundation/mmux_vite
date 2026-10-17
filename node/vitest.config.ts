import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
  // The CodSpeed plugin is a no-op unless the run is driven by the CodSpeed
  // runner (`codspeed run` / the CodSpeed CI job), so `npm test`, `npm run
  // bench` and a plain `npx vitest bench` are unaffected.
  plugins: [react(), codspeedPlugin()],
  test: {
    setupFiles: ["./src/test/setup.ts"],
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
      exclude: ["src/osparc-api-ts-client/**", "src/test/**", "**/*.d.ts", "**/*.bench.ts"],
      // Ratchet only upward (node SPEC §V27ku). 80/80/80/80 adopted 2026-10-17
      // (§T22 sweep; measured floor St 94.9 / Br 90.2 / Fn 93.7 / Ln 95.0 — the
      // remaining headroom is the next raise's budget, ⊥ lower these numbers).
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
