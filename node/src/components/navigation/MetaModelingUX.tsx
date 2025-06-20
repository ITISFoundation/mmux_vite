import { Card } from "@mui/material";
import Header from "./Header";
import StyledHyperLink from "../HyperLink";

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
            For more information, please see the
            <StyledHyperLink
              text="Tutorial"
              link="https://github.com/.../main/Tutorial.md"
            />
            and the
            <StyledHyperLink
              text="Manual"
              link="https://github.com/.../main/Manual.md"
            />
          </>
        }
      />
      {children}
    </Card>
  );
}
