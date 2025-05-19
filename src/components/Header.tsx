import { Card, Typography } from "@mui/material";
import './Header.css';


function Header(props) {
    return (
        <Card className={props.headerType} sx={{marginBottom:"0px"}}>
            <Typography variant="h5" component="div">
                {props.tabTitle}
            </Typography>
        </Card>
    );
};

export default Header;