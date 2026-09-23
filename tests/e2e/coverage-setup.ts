import { rm } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = join(__dirname, "../..");

export default async function globalSetup() {
  await rm(join(repoRoot, "coverage", "e2e"), { recursive: true, force: true });
}
