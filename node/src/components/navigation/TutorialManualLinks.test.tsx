import { describe, expect, it } from "vitest";
import { manualDocsUrl, tutorialDocsUrl } from "./TutorialManualLinks";

describe("TutorialManualLinks", () => {
  it("uses the canonical ZMT Manual URL", () => {
    expect(manualDocsUrl).toBe("https://zurichmedtech.github.io/model-intelligence/manual/hypertool-creation/");
  });

  it("uses the canonical ZMT Tutorial URL", () => {
    expect(tutorialDocsUrl).toBe("https://zurichmedtech.github.io/model-intelligence/tutorials/overview/");
  });
});
