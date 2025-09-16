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
  const simplifiedHost = getSimplifiedHost();
  const check = checkSimplifiedHost();
  let link: string | undefined;
  if (check === "sim4life") {
    link = `https://manual.${simplifiedHost}/manual/Tutorials/MetaModeling/MetaModelingTutorials.html`;
  } else if (check === "osparc") {
    link = "https://docs.sparc.science/docs/tutorial-metamodeling-hypertools#/";
  } else {
    return <StyledHyperLink text="Tutorials" link={undefined} />;
  }
  return <StyledHyperLink text="Tutorials" link={link} />;
}

export function getManualLink(): React.ReactNode {
  const check = checkSimplifiedHost();
  const simplifiedHost = getSimplifiedHost();
  if (check === "unknown") {
    return <StyledHyperLink text="Manual" link={undefined} />;
  }
  // no specific manual for osparc, refer them to the sim4life manual as well
  const link = `https://manual.${simplifiedHost}/manual/Manual/MetaModeling/MetaModeling.html`;
  return <StyledHyperLink text="Manual" link={link} />;
}

type HelpType = "MMHeaderHelp" | "FunctionsHelp";

export function HelpContents({ type }: { type: HelpType }) {
  const [hostType, setHostType] = useState<HostType | undefined>(undefined);
  const dismiss = (id: Id) => toast.dismiss({ containerId: id });

  useEffect(() => {
    if (hostType === undefined) return;
    const isActive = toast.isActive("HostLinkWarning");
    if (hostType === "unknown" && isActive === false) {
      toast("Host could not be detected - links to Tutorials & Manuals will not work", {
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        closeButton: true,
        type: "warning",
        toastId: "HostLinkWarning",
      });
    }
    if (hostType !== "unknown" && isActive === true) {
      dismiss("HostLinkWarning");
    }
  }, [hostType]);

  useEffect(() => {
    setHostType(checkSimplifiedHost());
  }, []);

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
