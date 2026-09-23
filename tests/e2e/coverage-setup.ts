import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default async function globalSetup() {
  await rm(join(repoRoot, "coverage", "e2e"), { recursive: true, force: true });
}
