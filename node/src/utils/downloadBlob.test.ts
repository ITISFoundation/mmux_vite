import { describe, it, expect, vi, afterEach } from "vitest";
import { triggerBlobDownload } from "./downloadBlob";

describe("triggerBlobDownload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an object URL, clicks a temporary anchor with the given filename, then revokes the URL", () => {
    // jsdom does not implement URL.createObjectURL/revokeObjectURL, so define them directly.
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const createElementSpy = vi.spyOn(document, "createElement");

    const blob = new Blob(["csv content"]);
    triggerBlobDownload(blob, "uq_propagation_y.csv");

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    const anchor = createElementSpy.mock.results[0].value as HTMLAnchorElement;
    expect(anchor.href).toBe("blob:mock-url");
    expect(anchor.download).toBe("uq_propagation_y.csv");
    expect(appendChildSpy).toHaveBeenCalledWith(anchor);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(anchor);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
