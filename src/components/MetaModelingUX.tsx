import { Card } from "@mui/material";
import Header from "./Header";
import './MetaModelingUX.css';


export default function MetaModelingUX(props) {
    return (
        <Card variant="plain">
            <Header tabTitle={props.tabTitle} headerType={props.headerType} />
            <Card
                variant="plain"
                className="content"
                raised={false}
                children={props.children}
            />
        </Card>
    );
}