import { Card, styled } from "@mui/material";
import Header from "./Header";

const MetaCard = styled(Card)`
background-color: #07161d;
padding: 16px;
border-radius: 16px;
`

export default function MetaModelingUX(props: MetaModelingUXProps) {
  const { children, tabTitle, headerType } = props;
    return (
        <Card variant="outlined" sx={{ border: 'none' }}>
            <Header tabTitle={tabTitle} headerType={headerType} />
            <MetaCard>{children}</MetaCard>
        </Card>
    );
}