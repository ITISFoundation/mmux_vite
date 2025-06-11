import { Card, styled } from "@mui/material";
import Header from "./Header";

const MetaCard = styled(Card)`
padding: 16px;
border-radius: 16px;
`

export default function MetaModelingUX(props: MetaModelingUXProps) {
  const { children, tabTitle, infoText, ExtendedInfoText, headerType } = props;
    return (
        <MetaCard variant="outlined">
            <Header tabTitle={tabTitle} infoText={infoText} ExtendedInfoText={ExtendedInfoText} headerType={headerType} />
            {children}
        </MetaCard>
    );
}