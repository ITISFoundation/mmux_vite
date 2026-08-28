import React from "react";
import StyledHyperLink from "../utils/HyperLink";

// Canonical documentation URLs (ZMT GitHub Pages). These are single,
// host-independent URLs — the docs are no longer served from a per-host
// `manual.<host>` subdomain (#450). TODO: replace placeholders with the real
// ZMT GitHub Pages URLs.
export const manualDocsUrl = "https://zurichmedtech.github.io/model-intelligence/manual/hypertool-creation/";
export const tutorialDocsUrl = "https://zurichmedtech.github.io/model-intelligence/tutorials/overview/";

export function getManualLinkUrl(): string {
  return manualDocsUrl;
}

export function getTutorialLinkUrl(): string {
  return tutorialDocsUrl;
}

export function getTutorialLink(): React.ReactNode {
  return <StyledHyperLink text="Tutorials" link={getTutorialLinkUrl()} />;
}

export function getManualLink(): React.ReactNode {
  return <StyledHyperLink text="Manual" link={getManualLinkUrl()} />;
}

type HelpType = "MMHeaderHelp" | "FunctionsHelp";

export function HelpContents({ type }: { type: HelpType }) {
  if (type === "MMHeaderHelp") {
    return (
      <>
        For more information, please see the {getTutorialLink()}
        and the {getManualLink()}
      </>
    );
  }
  if (type === "FunctionsHelp") {
    return (
      <>
        You have no Functions registered. Please check the {getTutorialLink()}
        for guidance on how to create your first Function!
      </>
    );
  }
  return null;
}
