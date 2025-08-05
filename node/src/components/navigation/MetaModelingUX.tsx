import { Card } from "@mui/material";
import Header from "./Header";
import { HelpContents } from "./TutorialManualLinks";

export default function MetaModelingUX(props: MetaModelingUXProps) {
  const { children, tabTitle, infoText, ExtendedInfoText, headerType } = props;

  return (
    <Card variant="outlined">
      <Header
        tabTitle={tabTitle}
        infoText={infoText}
        ExtendedInfoText={ExtendedInfoText}
        headerType={headerType}
        helpContents={<HelpContents type="MMHeaderHelp" />}
      />
      {children}
    </Card>
  );
}
