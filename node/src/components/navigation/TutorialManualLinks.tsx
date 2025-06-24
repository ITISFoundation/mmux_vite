import { toast } from "react-toastify";
import { getSimplifiedHost } from "../../utils/function_utils";
import StyledHyperLink from "../utils/HyperLink";

export function getTutorialLink(): React.ReactNode {
  const simplifiedHost = getSimplifiedHost()
  let link: string;
  if (simplifiedHost.includes("sim4life")) {
    link = `https://manual.${simplifiedHost}/manual/Tutorials/MetaModeling/MetaModelingTutorials.html`
  } else if (simplifiedHost.includes("osparc")) {
    link = "https://docs.sparc.science/docs/tutorial-metamodeling-hypertools#/"
  } else {
    // just for debugging, remove latter
    toast.warning("Host could not be detected - links to Tutorials & Manuals will not work")
    link = ""
  }
  return <StyledHyperLink text="Tutorials" link={link} />
}

export function getManualLink(): React.ReactNode {
  const simplifiedHost = getSimplifiedHost()
  // no specific manual for osparc, refer them to the sim4life manual as well
  const link = `https://manual.${simplifiedHost}/manual/Manual/MetaModeling/MetaModeling.html`
  return <StyledHyperLink text="Manual" link={link} />
}

