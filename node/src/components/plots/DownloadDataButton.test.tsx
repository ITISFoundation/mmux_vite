import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DownloadDataButton } from "./DownloadDataButton";
import { captureBlobDownloads } from "../../test/downloadCapture";

const response = { predictions: { x1: { x: [0, 1], yHat: [1, 2], stdHat: [0.1, 0.1] } } };

function wrapper(container: HTMLElement) {
  return container.querySelector('[mmux-testid="download-test-data-btn"]');
}

describe("DownloadDataButton (T30ln(b) replay, fork issue #79)", () => {
  afterEach(() => {
    // same restore shape as downloadBlob.test.ts; per-file isolation resets the
    // direct URL.createObjectURL assignments from captureBlobDownloads
    vi.restoreAllMocks();
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
  ])("renders nothing while the plot holds no response (%s)", (_label, data) => {
    const { container } = render(<DownloadDataButton data={data} filename="plot.json" testId="download-test-data-btn" />);
    expect(wrapper(container)).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("carries its mmux-testid and an accessible name", () => {
    render(<DownloadDataButton data={response} filename="plot.json" testId="download-test-data-btn" />);
    expect(document.querySelector('[mmux-testid="download-test-data-btn"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download plot data" })).toBeInTheDocument();
  });

  it("click exports the data verbatim (pretty JSON) under the given filename", async () => {
    const downloads = captureBlobDownloads();
    render(<DownloadDataButton data={response} filename="curves1d-y-vs-x1.json" testId="download-test-data-btn" />);

    fireEvent.click(screen.getByRole("button", { name: "Download plot data" }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe("curves1d-y-vs-x1.json");
    const text = await downloads[0].text();
    // verbatim: the file is exactly the payload, human-readable, no transform
    expect(text).toBe(JSON.stringify(response, null, 2));
    expect(JSON.parse(text)).toEqual(response);
  });
});
