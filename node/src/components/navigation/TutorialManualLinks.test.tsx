import { describe, expect, it } from "vitest";
import { manualDocsUrl, tutorialDocsUrl } from "./TutorialManualLinks";

/**
 * Regression guard for GitHub issue #450: the Manual/Tutorial links used to be
 * built from the detected host (`https://manual.${host}/...`), which 404'd for
 * osparc hosts (manual.osparc-staging.io does not exist). The docs now live on
 * ZMT GitHub Pages, so both links must be a single canonical URL that is NOT
 * derived from the host.
 */
describe("TutorialManualLinks (issue #450)", () => {
  it("uses the canonical ZMT GitHub Pages Manual URL, not a host-derived subdomain", () => {
    expect(manualDocsUrl).toBe("https://zurichmedtech.github.io/model-intelligence/manual/hypertool-creation/");
    expect(manualDocsUrl).not.toContain("${");
  });

  it("uses the canonical ZMT GitHub Pages Tutorial URL, not a host-derived subdomain", () => {
    expect(tutorialDocsUrl).toBe("https://zurichmedtech.github.io/model-intelligence/tutorials/overview/");
    expect(tutorialDocsUrl).not.toContain("${");
  });
});
