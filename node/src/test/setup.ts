import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import { clearSessionResponseCacheForTests } from "../api/sessionResponseCache";

let consoleError: ReturnType<typeof vi.spyOn>;
let unhandledRejections: unknown[];
let handleUnhandledRejection: (reason: unknown) => void;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  unhandledRejections = [];
  handleUnhandledRejection = (reason: unknown) => {
    unhandledRejections.push(reason);
  };
  process.on("unhandledRejection", handleUnhandledRejection);
});

afterEach(() => {
  // Unmounting cancels pending MUI transition timers that would otherwise fire after jsdom teardown.
  cleanup();
  // The session response cache is module-scope app state: never let one test's
  // cached (or in-flight) fetch leak into the next test in the same file.
  clearSessionResponseCacheForTests();
  try {
    expect(consoleError).not.toHaveBeenCalled();
    expect(unhandledRejections).toEqual([]);
  } finally {
    process.off("unhandledRejection", handleUnhandledRejection);
    vi.restoreAllMocks();
  }
});
