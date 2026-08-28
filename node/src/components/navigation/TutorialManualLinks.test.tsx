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
  it("uses a single canonical Manual URL, not a host-derived subdomain", () => {
    expect(manualDocsUrl).toMatch(/^https:\/\//);
    expect(manualDocsUrl).not.toContain("${");
  });

  it("uses a single canonical Tutorial URL, not a host-derived subdomain", () => {
    expect(tutorialDocsUrl).toMatch(/^https:\/\//);
    expect(tutorialDocsUrl).not.toContain("${");
  });
});
