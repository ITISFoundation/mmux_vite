import { Typography, styled } from "@mui/material";

const HeaderContainer = styled('div')`
  text-align: left;
  margin-bottom: 16px;
`;

function Header(props: HeaderProps) {
  const { tabTitle } = props;
    return (
        <HeaderContainer>
            <Typography variant="h5" component="h1" fontWeight={200} fontFamily={'inherit'}>
                {tabTitle}
            </Typography>
        </HeaderContainer>
    );
};

export default Header;