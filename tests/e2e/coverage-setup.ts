import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const repoRoot = resolve(__dirname, "../..");

export default async function globalSetup() {
  await rm(join(repoRoot, "coverage", "e2e"), { recursive: true, force: true });
}
