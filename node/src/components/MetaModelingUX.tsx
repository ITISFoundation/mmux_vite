import { Card, styled } from "@mui/material";
import Header from "./Header";

const MetaCard = styled(Card)`
padding: 16px;
border-radius: 16px;
`

export default function MetaModelingUX(props: MetaModelingUXProps) {
  const { children, tabTitle, headerType } = props;
    return (
        <MetaCard variant="outlined">
            <Header tabTitle={tabTitle} headerType={headerType} />
            {children}
        </MetaCard>
    );
}