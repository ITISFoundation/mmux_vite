import { Card } from "@mui/material";
import Header from "./Header";
import { getManualLink, getTutorialLink } from "./TutorialManualLinks";

export default function MetaModelingUX(props: MetaModelingUXProps) {
  const { children, tabTitle, infoText, ExtendedInfoText, headerType } = props;

  return (
    <Card variant="outlined">
      <Header
        tabTitle={tabTitle}
        infoText={infoText}
        ExtendedInfoText={ExtendedInfoText}
        headerType={headerType}
        helpContents={
          <>
            For more information, please see the {getTutorialLink()}
            and the {getManualLink()}
          </>
        }
      />
      {children}
    </Card>
  );
}
