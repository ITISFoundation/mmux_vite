import { Card } from "@mui/material";
import Header from "./Header";


export default function MetaModelingUX(props) {
    return (
        <Card variant="plain">
            <Header tabTitle={props.tabTitle} headerType={props.headerType} />
            <Card variant="plain" sx={{margin:"15px"} } raised={false} children={props.children}/>
        </Card>
    );
}