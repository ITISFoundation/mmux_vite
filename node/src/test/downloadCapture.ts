import { vi } from "vitest";

export type CapturedDownload = { filename: string; text: () => Promise<string> };

/**
 * Download harness for jsdom. jsdom implements neither URL.createObjectURL nor
 * anchor download navigation, so the Blob + filename that
 * `utils/downloadBlob.ts::triggerBlobDownload` hands to the browser are only
 * observable once these globals are mocked: the Blob is captured from the
 * createObjectURL call and the anchor's `download` name at click time.
 */
export function captureBlobDownloads(): CapturedDownload[] {
  const downloads: CapturedDownload[] = [];
  // jsdom lacks these URL members entirely, so assign (spyOn has nothing to wrap).
  URL.createObjectURL = vi.fn((blob: Blob) => {
    downloads.push({ filename: "<unnamed>", text: () => blob.text() });
    return `blob:mock-${downloads.length}`;
  }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    const last = downloads[downloads.length - 1];
    if (last) {
      last.filename = this.download;
    }
  });
  return downloads;
}
