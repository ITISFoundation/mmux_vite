import React, { useEffect, useState } from "react";
import { toast, Id } from "react-toastify";
import { getSimplifiedHost } from "../../utils/function_utils";
import StyledHyperLink from "../utils/HyperLink";

type HostType = "sim4life" | "osparc" | "unknown";

const checkSimplifiedHost = (): HostType => {
  const simplifiedHost = getSimplifiedHost();
  const s4l = simplifiedHost.includes("sim4life");
  const osparc = simplifiedHost.includes("osparc");
  if (s4l) return "sim4life";
  if (osparc) return "osparc";
  return "unknown";
};

export function getTutorialLink(): React.ReactNode | undefined {
  const simplifiedHost = checkSimplifiedHost();
  let link: string | undefined;
  if (simplifiedHost === "sim4life") {
    link = `https://manual.${simplifiedHost}/manual/Tutorials/MetaModeling/MetaModelingTutorials.html`;
  } else if (simplifiedHost === "osparc") {
    link = "https://docs.sparc.science/docs/tutorial-metamodeling-hypertools#/";
  } else {
    link = undefined;
  }
  if (link === undefined) {
    return undefined;
  }
  return <StyledHyperLink text="Tutorials" link={link} />;
}

export function getManualLink(): React.ReactNode {
  const simplifiedHost = getSimplifiedHost();
  // no specific manual for osparc, refer them to the sim4life manual as well
  const link = `https://manual.${simplifiedHost}/manual/Manual/MetaModeling/MetaModeling.html`;
  return <StyledHyperLink text="Manual" link={link} />;
}

type HelpType = "MMHeaderHelp" | "FunctionsHelp";

export const HelpContents = ({ type }: { type: HelpType }) => {
  const [tutorialLink, setTutorialLink] = useState(getTutorialLink());
  const [manualLink, setManualLink] = useState(getManualLink());

  const dismiss = (id: Id) => toast.dismiss({ containerId: id });

  useEffect(() => {
    const isActive = toast.isActive("HostLinkWarning");
    if (tutorialLink === undefined && isActive === false) {
      toast(
        "Host could not be detected - links to Tutorials & Manuals will not work",
        {
          autoClose: false,
          closeOnClick: false,
          pauseOnHover: false,
          draggable: false,
          closeButton: false,
          type: "warning",
          toastId: "HostLinkWarning"
        }
      );
    }
    if (tutorialLink !== undefined && isActive === true) {
      dismiss("HostLinkWarning");
    }
  }, [tutorialLink, manualLink]);

  // use a useEffect to fetch the links every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTutorialLink(getTutorialLink());
      setManualLink(getManualLink());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (type === "MMHeaderHelp") {
    return (
      <>
        For more information, please see the {tutorialLink}
        and the {manualLink}
      </>
    );
  }
  if (type === "FunctionsHelp") {
    return (
      <>
        You have no Functions registered. Please check the {tutorialLink}
        for guidance on how to create your first Function!
      </>
    );
  }
  return null;
};
