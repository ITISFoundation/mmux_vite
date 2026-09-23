import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect, vi } from "vitest";

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
  try {
    expect(consoleError).not.toHaveBeenCalled();
    expect(unhandledRejections).toEqual([]);
  } finally {
    process.off("unhandledRejection", handleUnhandledRejection);
    vi.restoreAllMocks();
  }
});
