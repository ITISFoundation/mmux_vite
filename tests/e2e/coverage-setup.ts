import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";

// Playwright loads global setup through its CommonJS loader.
const repoRoot = resolve(__dirname, "../..");

export default async function globalSetup() {
  await rm(join(repoRoot, "coverage", "e2e"), { recursive: true, force: true });
}
