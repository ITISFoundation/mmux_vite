import React from "react";
import StyledHyperLink from "../utils/HyperLink";

export const manualDocsUrl = "https://zurichmedtech.github.io/model-intelligence/manual/hypertool-creation/";
export const tutorialDocsUrl = "https://zurichmedtech.github.io/model-intelligence/tutorials/overview/";

export function getTutorialLink(): React.ReactNode {
  return <StyledHyperLink text="Tutorials" link={tutorialDocsUrl} />;
}

export function getManualLink(): React.ReactNode {
  return <StyledHyperLink text="Manual" link={manualDocsUrl} />;
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
